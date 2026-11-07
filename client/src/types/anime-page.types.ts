import {
  AnimeFormat,
  AnimeSeason,
  AnimeSort,
  MediaStatus,
} from "@/types/anilist";

export interface AnimePageFilters {
  query: string;
  format: AnimeFormat | "All";
  year: number | "All";
  season: AnimeSeason | "All";
  status: MediaStatus | "All";
  sort: AnimeSort;
  page: number;
}

export const DEFAULT_FILTERS: AnimePageFilters = {
  query: "",
  format: "All",
  year: "All",
  season: "All",
  status: "All",
  sort: "POPULARITY_DESC",
  page: 1,
};

export const SORT_OPTIONS: Array<{ value: AnimeSort; label: string }> = [
  { value: "POPULARITY_DESC", label: "Most popular" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "SCORE_DESC", label: "Highest rated" },
  { value: "START_DATE_DESC", label: "Newest releases" },
  { value: "TITLE_ROMAJI", label: "Title A-Z" },
];

export const FORMAT_OPTIONS: Array<{ value: AnimeFormat | "All"; label: string }> = [
  { value: "All", label: "All formats" },
  { value: "TV", label: "TV" },
  { value: "TV_SHORT", label: "TV short" },
  { value: "MOVIE", label: "Movie" },
  { value: "OVA", label: "OVA" },
  { value: "ONA", label: "ONA" },
  { value: "SPECIAL", label: "Special" },
  { value: "MUSIC", label: "Music" },
];

export const STATUS_OPTIONS: Array<{ value: MediaStatus | "All"; label: string }> = [
  { value: "All", label: "Any status" },
  { value: "RELEASING", label: "Currently airing" },
  { value: "FINISHED", label: "Finished" },
  { value: "NOT_YET_RELEASED", label: "Upcoming" },
  { value: "HIATUS", label: "On hiatus" },
];

export const SEASONS: Array<{ value: AnimeSeason | "All"; label: string }> = [
  { value: "All", label: "All seasons" },
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];
