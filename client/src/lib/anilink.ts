import {
  AnilinkServiceOptions,
  AniListGraphQLResponse,
  ANIME_FORMATS,
  AnimeRelationEdge,
  AugmentedAnimeMedia,
  FuzzyDateInput,
  PageInfo,
  PaginatedRecentEpisodes,
  RawMediaWithRelations,
  RecentEpisode,
  SyntheticAiringScheduleNode,
} from "@/types/anilink";
import {
  MEDIA_BY_MAL_ID_QUERY,
  PREQUEL_MINIMAL_QUERY,
  RECENTLY_AIRED,
} from "./utils";
import axios from "axios";

const ANILIST_GRAPHQL_ENDPOINT = "https://graphql.anilist.co";

export class AnilinkService {
  private readonly endpoint: string;
  private readonly fetchFn: typeof fetch;

  constructor(options?: AnilinkServiceOptions) {
    this.endpoint = options?.endpoint ?? ANILIST_GRAPHQL_ENDPOINT;
    // Uses global fetch in browsers, Node 18+, Edge runtimes, or custom injected fetch
    this.fetchFn = options?.fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Universal GraphQL executor safe for both Browser and Node.js
   */
  private async executeQuery<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T | null> {
    const response = await this.fetchFn(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      const text = await response.text();
      throw new Error(`AniList GraphQL error (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
      data?: { Media?: T };
      errors?: Array<{ message: string; status?: number }>;
    };

    if (payload.errors && payload.errors.length > 0) {
      const isNotFound = payload.errors.some(
        (err) => err.status === 404 || /not found/i.test(err.message),
      );
      if (isNotFound) return null;
      throw new Error(payload.errors.map((e) => e.message).join(", "));
    }

    return payload.data?.Media ?? null;
  }

  /**
   * Fetches anime metadata by MyAnimeList ID with:
   * - Strict Anime-only relations (Manga/Novels filtered out)
   * - Relation node IDs presented as MyAnimeList IDs (`idMal`)
   * - Calculated TV season number
   */
  async getAnimeByMalId(
    malId: number | string,
  ): Promise<AugmentedAnimeMedia | null> {
    const numericMalId =
      typeof malId === "string" ? parseInt(malId, 10) : malId;
    if (isNaN(numericMalId)) {
      throw new Error(`Invalid malId: ${malId}`);
    }

    const rawMedia = await this.executeQuery<RawMediaWithRelations>(
      MEDIA_BY_MAL_ID_QUERY,
      { idMal: numericMalId },
    );
    if (!rawMedia) return null;

    // Filter non-anime relations and map node fields
    const animeEdges: AnimeRelationEdge[] = (rawMedia.relations?.edges ?? [])
      .filter(
        (edge) =>
          edge.node?.type === "ANIME" && ANIME_FORMATS.has(edge.node?.format),
      )
      .map((edge) => ({
        id: edge.id,
        relationType: edge.relationType,
        node: {
          idMal: edge.node.idMal,
          format: edge.node.format,
          type: "ANIME",
          title: edge.node.title,
        },
      }));

    // Traverse prequel relations to determine TV season number
    const seasonNumber = await this.calculateSeasonNumber(rawMedia);

    const schedule =
      rawMedia.airingSchedule.nodes.length === 0 &&
      rawMedia.status === "FINISHED"
      ? this.constructAiringSchedule(rawMedia.episodes, rawMedia.startDate, rawMedia.endDate)
        : rawMedia.airingSchedule.nodes;

    return {
      ...rawMedia,
      airingSchedule: {nodes: schedule},
      seasonNumber,
      relations: {
        edges: animeEdges,
      },
    };
  }

  private async calculateSeasonNumber(
    initialMedia: RawMediaWithRelations,
  ): Promise<number> {
    if (initialMedia.format !== "TV") {
      return 1;
    }

    let currentRelations = initialMedia.relations?.edges ?? [];
    let tvSeasonCount = 1;
    const visitedIds = new Set<number>([initialMedia.id]);

    while (true) {
      const prequelEdge = currentRelations.find(
        (edge) =>
          edge.relationType === "PREQUEL" && edge.node?.type === "ANIME",
      );

      if (!prequelEdge || !prequelEdge.node) {
        break;
      }

      const nextId = prequelEdge.node.id;
      if (visitedIds.has(nextId)) {
        break; // Guard against recursive loops
      }
      visitedIds.add(nextId);

      // Only increment for TV broadcast releases
      if (prequelEdge.node.format === "TV") {
        tvSeasonCount += 1;
      }

      const parentNode = await this.executeQuery<{
        id: number;
        format: string;
        relations: {
          edges: Array<{
            relationType: string;
            node: { id: number; idMal: number; type: string; format: string };
          }>;
        };
      }>(PREQUEL_MINIMAL_QUERY, { id: nextId });

      if (!parentNode) break;
      currentRelations = (parentNode.relations?.edges ?? []) as any;
    }

    // Title heuristic fallback if graph link is missing or flat
    if (tvSeasonCount === 1) {
      const parsedSeason = this.extractSeasonFromTitle(
        initialMedia.title.english || initialMedia.title.romaji || "",
      );
      if (parsedSeason && parsedSeason > 1) {
        return parsedSeason;
      }
    }

    return tvSeasonCount;
  }

  private constructAiringSchedule(
    episodes: number | null | undefined,
    startDate: FuzzyDateInput | Date | string | null | undefined,
    endDate?: FuzzyDateInput | Date | string | null | undefined,
  ): SyntheticAiringScheduleNode[] {
    if (!episodes || episodes <= 0) return [];

    const parseToMs = (
      val: FuzzyDateInput | Date | string | null | undefined,
    ): number | null => {
      if (!val) return null;
      if (val instanceof Date)
        return isNaN(val.getTime()) ? null : val.getTime();
      if (typeof val === "string") {
        const ms = new Date(val).getTime();
        return isNaN(ms) ? null : ms;
      }
      if (typeof val === "object" && val.year) {
        const date = new Date(
          Date.UTC(val.year, (val.month ?? 1) - 1, val.day ?? 1),
        );
        return isNaN(date.getTime()) ? null : date.getTime();
      }
      return null;
    };

    const startMs = parseToMs(startDate);
    if (startMs === null) return [];

    const endMs = parseToMs(endDate);
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const nowInSeconds = Math.floor(Date.now() / 1000);

    const stepMs =
      episodes > 1 && endMs !== null && endMs > startMs
        ? (endMs - startMs) / (episodes - 1)
        : ONE_WEEK_MS;

    return Array.from({ length: episodes }, (_, index) => {
      const episodeNumber = index + 1;
      const airDateMs = Math.round(startMs + index * stepMs);
      const airingAt = Math.floor(airDateMs / 1000);

      return {
        id: episodeNumber,
        episode: episodeNumber,
        airingAt,
        timeUntilAiring: airingAt - nowInSeconds,
      };
    });
  }

  private extractSeasonFromTitle(title: string): number | null {
    const seasonMatch =
      title.match(/(?:season\s*|s)(\d+)/i) ||
      title.match(/(\d+)(?:st|nd|rd|th)\s+season/i);
    if (seasonMatch) return parseInt(seasonMatch[1], 10);

    const romanMatch = title.match(/\b(II|III|IV|V|VI)\b$/i);
    if (romanMatch) {
      const romanMap: Record<string, number> = {
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
      };
      return romanMap[romanMatch[1].toUpperCase()] ?? null;
    }

    return null;
  }
}

export const anilinkService = new AnilinkService();

export async function getRecentlyReleasedEpisodes(
  page: number = 1,
  perPage: number = 20,
): Promise<PaginatedRecentEpisodes> {
  const currentTimestampInSeconds = Math.floor(Date.now() / 1000);

  const query = RECENTLY_AIRED;

  const { data } = await axios.post<AniListGraphQLResponse>(
    ANILIST_GRAPHQL_ENDPOINT,
    {
      query,
      variables: {
        airingAt_lesser: currentTimestampInSeconds,
        page,
        perPage,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors.map((e) => e.message).join(", "));
  }

  const pageInfo: PageInfo = data.data?.Page?.pageInfo ?? {
    total: 0,
    perPage,
    currentPage: page,
    lastPage: 1,
    hasNextPage: false,
  };

  const rawEpisodes = data.data?.Page?.airingSchedules ?? [];

  const episodes = rawEpisodes.filter(
    (item): item is RecentEpisode => typeof item.media?.idMal === "number",
  );

  return {
    pageInfo,
    data: episodes,
  };
}
