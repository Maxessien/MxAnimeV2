export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page?: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanResponse<T> {
  data: T;
}

export interface JikanPaginatedResponse<T> {
  data: T[];
  pagination: JikanPagination;
}

// ==========================================
// CORE ENTITY TYPES
// ==========================================

export type AnimeType = 'tv' | 'movie' | 'ova' | 'special' | 'ona' | 'music' | 'cm' | 'pv' | 'tv_special';
export type AnimeStatus = 'Finished Airing' | 'Currently Airing' | 'Not yet aired';
export type AnimeRating = 'g' | 'pg' | 'pg13' | 'r17' | 'r' | 'rx';
export type AnimeSeason = 'summer' | 'spring' | 'fall' | 'winter';

export interface AnimeImageVariant {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface AnimeImages {
  jpg: AnimeImageVariant;
  webp: AnimeImageVariant;
}

export interface AnimeTitle {
  type: string;
  title: string;
}

export interface MalSubItem {
  mal_id: number;
  type: string;
  name: string;
  url: string;
}

export interface Anime {
  mal_id: number;
  url: string;
  images: AnimeImages;
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
  };
  approved: boolean;
  titles: AnimeTitle[];
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  title_synonyms: string[];
  type: AnimeType | null;
  source: string | null;
  episodes: number | null;
  status: AnimeStatus;
  airing: boolean;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: { day: number | null; month: number | null; year: number | null };
      to: { day: number | null; month: number | null; year: number | null };
    };
    string: string;
  };
  duration: string;
  rating: AnimeRating | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  synopsis: string | null;
  background: string | null;
  season: AnimeSeason | null;
  year: number | null;
  broadcast: {
    day: string | null;
    time: string | null;
    timezone: string | null;
    string: string | null;
  };
  producers: MalSubItem[];
  licensors: MalSubItem[];
  studios: MalSubItem[];
  genres: MalSubItem[];
  explicit_genres: MalSubItem[];
  themes: MalSubItem[];
  demographics: MalSubItem[];
}

export interface AnimeFull extends Anime {
  relations: Array<{
    relation: string;
    entry: MalSubItem[];
  }>;
  theme: {
    openings: string[];
    endings: string[];
  };
  external: Array<{
    name: string;
    url: string;
  }>;
  streaming: Array<{
    name: string;
    url: string;
  }>;
}

export interface AnimeCharacter {
  character: {
    mal_id: number;
    url: string;
    images: {
      jpg: { image_url: string; small_image_url: string };
      webp: { image_url: string; small_image_url: string };
    };
    name: string;
  };
  role: 'Main' | 'Supporting';
  favorites: number;
  voice_actors: Array<{
    person: {
      mal_id: number;
      url: string;
      images: { jpg: { image_url: string } };
      name: string;
    };
    language: string;
  }>;
}

export interface AnimeEpisode {
  mal_id: number;
  url: string | null;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired: string | null;
  filler: boolean;
  recap: boolean;
  forum_url: string | null;
}

export interface Genre {
  mal_id: number;
  name: string;
  url: string;
  count: number;
}

// ==========================================
// API FILTER PARAMETER TYPES
// ==========================================

export type TopAnimeFilter = 'airing' | 'upcoming' | 'bypopularity' | 'favorite';
export type ScheduleFilter = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'other' | 'unknown';
export type AnimeOrderBy = 'mal_id' | 'title' | 'type' | 'rating' | 'start_date' | 'end_date' | 'episodes' | 'score' | 'scored_by' | 'rank' | 'popularity' | 'members' | 'favorites';
