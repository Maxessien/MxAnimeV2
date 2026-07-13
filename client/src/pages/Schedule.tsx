import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSchedules } from "@/hooks/use-jikan";
import { AnimeCard, AnimeCardSkeleton } from "@/components/AnimeCard";
import { CalendarClock } from "lucide-react";
import { ScheduleFilter } from "@/types/jikan";

const DAYS = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
  { value: "unknown", label: "TBA" },
];

export function parseSchDay(filter: string): ScheduleFilter {
  const allow: ScheduleFilter[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "unknown",
    "other",
  ];

  return allow.includes(filter as ScheduleFilter)
    ? (filter as ScheduleFilter)
    : allow[0];
}

const todayKey = () => DAYS[(new Date().getDay() + 6) % 7]?.value ?? "monday";

export default function Schedule() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);

  const [day, setDay] = useState<ScheduleFilter>(parseSchDay(searchParams.get("day") || todayKey()));
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  useEffect(() => {
    const params = new URLSearchParams();
    if (day !== todayKey()) params.set("day", day);
    if (page > 1) params.set("page", page.toString());

    const newSearch = params.toString();
    const newUrl = newSearch ? `/schedule?${newSearch}` : "/schedule";
    if (window.location.pathname + window.location.search !== newUrl) {
      setLocation(newUrl, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, page]);

  const { data, isLoading, error } = useSchedules(day, page);

  // Jikan occasionally returns the same anime twice for a given day; dedupe by mal_id.
  const entries: any[] = data?.data
    ? Array.from(new Map(data.data.map((a: any) => [a.mal_id, a])).values())
    : [];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <CalendarClock size={32} />
          </div>
          Weekly Release Schedule
        </h1>
        <p className="text-muted-foreground text-lg">
          See which anime broadcast on each day of the week.
        </p>
      </div>

      <div className="flex gap-2 w-full overflow-x-auto pb-2 hide-scrollbar bg-card p-3 rounded-xl border shadow-sm">
        {DAYS.map((d) => (
          <button
            key={d.value}
            onClick={() => {
              setDay(parseSchDay(d.value));
              setPage(1);
            }}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
              day === d.value
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            } ${d.value === todayKey() ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-card" : ""}`}
          >
            {d.label}
            {d.value === todayKey() && (
              <span className="ml-1.5 text-[10px] opacity-80 uppercase">
                Today
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            Error loading schedule: {(error as Error).message}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {Array.from({ length: 18 }).map((_, i) => (
              <AnimeCardSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed">
            <p className="text-lg">Nothing scheduled for this day.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
              {entries.map((anime: any, i: number) => (
                <div
                  key={anime.mal_id}
                  className="flex flex-col gap-2 animate-in fade-in zoom-in-95"
                  style={{
                    animationDelay: `${Math.min(i, 10) * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <AnimeCard anime={anime} />
                  {anime.broadcast?.string && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md w-fit">
                      {anime.broadcast.string}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {data?.pagination && data.pagination.last_visible_page > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8 border-t">
                <button
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={page === 1}
                  className="px-6 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-secondary/80 transition-all active:scale-95"
                >
                  Previous
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-bold bg-muted px-4 py-2 rounded-lg">
                    Page {page} of {data.pagination.last_visible_page}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPage((p) =>
                      Math.min(data.pagination.last_visible_page, p + 1),
                    );
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={!data.pagination.has_next_page}
                  className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
