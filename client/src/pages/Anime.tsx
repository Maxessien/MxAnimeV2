import { useQuery } from "@tanstack/react-query";
import { Compass, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { getAnimeList } from "@/lib/anilist";
import { AnimeFilters } from "@/components/anime-page/AnimeFilters";
import { AnimeGrid } from "@/components/anime-page/AnimeGrid";
import { AnimePagination } from "@/components/anime-page/AnimePagination";
import {
  AnimePageFilters,
  DEFAULT_FILTERS,
} from "@/components/anime-page/anime-page.types";
import {
  filtersFromSearch,
  filtersToSearch,
} from "@/components/anime-page/anime-page.utils";

export default function Anime() {
  const [location, setLocation] = useLocation();
  const [filters, setFilters] = useState<AnimePageFilters>(() =>
    filtersFromSearch(window.location.search),
  );
  const [query, setQuery] = useState(filters.query);
  const firstRender = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(filters.query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [filters.query]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const search = filtersToSearch({ ...filters, query });
    const nextLocation = search ? `/anime?${search}` : "/anime";
    if (location !== nextLocation) setLocation(nextLocation, { replace: true });
  }, [filters, query, location, setLocation]);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [
      "anime-list",
      filters.page,
      filters.format,
      filters.year,
      filters.season,
      filters.sort,
      filters.status,
      query,
    ],
    queryFn: () =>
      getAnimeList(
        filters.page,
        filters.format,
        filters.year,
        filters.season,
        [filters.sort],
        filters.status,
        query,
        30,
      ),
    staleTime: 10 * 60 * 1000,
  });

  const handleChange = (changes: Partial<AnimePageFilters>) => {
    setFilters((current) => ({ ...current, ...changes }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  const heading = useMemo(() => {
    if (query) return `Results for "${query}"`;
    if (filters.year !== "All" && filters.season !== "All") return `${filters.season} ${filters.year} anime`;
    if (filters.year !== "All") return `${filters.year} anime`;
    return "Explore anime";
  }, [filters.season, filters.year, query]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 md:gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Compass size={28} /></div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Anime</h1>
        </div>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
          Find your next favorite from every season, format, and status.
        </p>
      </header>

      <AnimeFilters filters={filters} onChange={handleChange} onReset={resetFilters} />

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{heading}</h2>
            {data?.pageInfo.total !== undefined && (
              <p className="text-sm text-muted-foreground">{data.pageInfo.total.toLocaleString()} titles</p>
            )}
          </div>
          {isFetching && !isLoading && <Loader2 className="animate-spin text-primary" size={20} />}
        </div>

        {error ? (
          <div className="rounded-xl bg-destructive/10 p-4 text-destructive">
            Unable to load anime: {(error as Error).message}
          </div>
        ) : (
          <>
            <AnimeGrid anime={data?.data ?? []} loading={isLoading} />
            <AnimePagination
              page={filters.page}
              pageInfo={data?.pageInfo}
              onPageChange={(page) => {
                handleChange({ page });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
