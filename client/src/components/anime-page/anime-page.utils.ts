import {
  AnimeFormat,
  AnimeSeason,
  AnimeSort,
  MediaStatus,
} from "@/types/anilist";
import {
  DEFAULT_FILTERS,
  FORMAT_OPTIONS,
  SEASONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  AnimePageFilters,
} from "./anime-page.types";

const isValue = <T extends string>(
  value: string | null,
  options: readonly { value: T; label: string }[],
): value is T => options.some((option) => option.value === value);

export function filtersFromSearch(search: string): AnimePageFilters {
  const params = new URLSearchParams(search);
  const yearValue = Number(params.get("year"));

  return {
    query: params.get("q") || DEFAULT_FILTERS.query,
    format: isValue(params.get("format"), FORMAT_OPTIONS)
      ? (params.get("format") as AnimeFormat | "All")
      : DEFAULT_FILTERS.format,
    year: Number.isInteger(yearValue) && yearValue >= 1940 ? yearValue : "All",
    season: isValue(params.get("season"), SEASONS)
      ? (params.get("season") as AnimeSeason | "All")
      : DEFAULT_FILTERS.season,
    status: isValue(params.get("status"), STATUS_OPTIONS)
      ? (params.get("status") as MediaStatus | "All")
      : DEFAULT_FILTERS.status,
    sort: isValue(params.get("sort"), SORT_OPTIONS)
      ? (params.get("sort") as AnimeSort)
      : DEFAULT_FILTERS.sort,
    page: Math.max(1, Number(params.get("page")) || 1),
  };
}

export function filtersToSearch(filters: AnimePageFilters): string {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.format !== "All") params.set("format", filters.format);
  if (filters.year !== "All") params.set("year", String(filters.year));
  if (filters.season !== "All") params.set("season", filters.season);
  if (filters.status !== "All") params.set("status", filters.status);
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params.toString();
}

export function yearsForFilter(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index);
}
