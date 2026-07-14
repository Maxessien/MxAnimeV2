// Reusable localization types for localized text fields
export interface LocalizedTitles {
  "x-jat"?: string;
  uk?: string;
  ja?: string;
  en?: string;
  ru?: string;
  ko?: string;
  th?: string;
  "zh-Hant"?: string;
  "zh-Hans"?: string;
  de?: string;
  fr?: string;
  [key: string]: string | undefined; // Fallback for other languages
}

// Represents an individual episode (supports both regular episodes and specials)
export interface Episode {
  episode: string;
  anidbEid: number;
  length: number;
  airdate: string;
  title: LocalizedTitles;
  
  // Fields below are present in main episodes but missing or optional in specials
  tvdbShowId?: number;
  tvdbId?: number;
  seasonNumber?: number;
  episodeNumber?: number;
  absoluteEpisodeNumber?: number;
  airDate?: string;
  airDateUtc?: string;
  runtime?: number;
  overview?: string;
  image?: string;
  rating?: string;
  summary?: string;
  finaleType?: string;
}

// Map of episodes where keys are string representations (e.g., "1", "S1")
export interface EpisodesMap {
  [episodeKey: string]: Episode;
}

// Media image configurations
export interface ImageAsset {
  coverType: "Banner" | "Poster" | "Fanart" | "Clearlogo" | string;
  url: string;
}

// IDs mapping to external databases and tracking platforms
export interface ThirdPartyMappings {
  animeplanet_id: string | null;
  kitsu_id: number | null;
  mal_id: number | null;
  type: string;
  anilist_id: number | null;
  anisearch_id: number | null;
  anidb_id: number | null;
  notifymoe_id: string | null;
  livechart_id: number | null;
  thetvdb_id: number | null;
  imdb_id: string | null;
  themoviedb_id: string | null;
}

// The root data structure of your JSON payload
export interface AniZipMetadata {
  titles: LocalizedTitles;
  episodes: EpisodesMap;
  episodeCount: number;
  specialCount: number;
  images: ImageAsset[];
  mappings: ThirdPartyMappings;
}