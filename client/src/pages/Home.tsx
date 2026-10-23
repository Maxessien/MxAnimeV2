import { AnimeCard, RecentEpisodeAnimeCard } from "@/components/AnimeCard";
import HomeSection from "@/components/layout/HomeSection";
import {
  useRecentlyReleased,
  useSeasonsNow,
  useTopAnime,
} from "@/hooks/use-jikan";
import { Loader2, PlayCircle } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const {
    data: trending,
    isLoading: isLoadingTrending,
    error: trendingError,
  } = useSeasonsNow(1);
  const {
    data: top,
    isLoading: isLoadingTop,
    error: topError,
  } = useTopAnime(1, "bypopularity");
  const {
    data: recent,
    isLoading: isLoadingRecent,
    error: recentError,
  } = useRecentlyReleased(1, 10);

  const spotlight = trending?.data?.[0];

  return (
    <div className="flex flex-col gap-16 pb-12 animate-in fade-in duration-500">
      {/* Hero / Spotlight */}
      <section className="relative rounded-2xl h-max md:rounded-3xl overflow-hidden bg-muted aspect-4/3 md:aspect-21/9 min-h-100 flex items-end shadow-xl border">
        {isLoadingTrending && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        )}

        {spotlight && (
          <>
            <img
              src={spotlight.images.webp.large_image_url ?? undefined}
              alt={spotlight.title}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-60"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />

            <div className="z-10 p-6 w-full mx-auto max-w-4xl">
              <div className="flex items-center gap-3 mb-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
                <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                  Season Spotlight
                </span>
                <span className="text-foreground/80 text-sm font-medium backdrop-blur-md bg-background/30 px-3 py-1 rounded-full">
                  {spotlight.season} {spotlight.year}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-display font-extrabold text-foreground mb-4 leading-[1.1] animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
                {spotlight.title_english || spotlight.title}
              </h1>
              <p className="text-foreground/80 text-sm md:text-lg line-clamp-3 mb-8 max-w-2xl animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 leading-relaxed">
                {spotlight.synopsis}
              </p>
              <div className="flex gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                <Link
                  href={`/anime/${spotlight.mal_id}`}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                >
                  <PlayCircle size={24} />
                  View Details
                </Link>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Recently Released Section */}
      <HomeSection
        title="Recently Aired"
        subTitle="Most recently aired episodes"
        isError={Boolean(recentError)}
        isLoading={isLoadingRecent}
        viewAllHref="/latest"
        viewAllText="View Latest"
        list={
          <>
            {recent?.data.slice(0, 6).map((anime, i: number) => (
              <div
                key={anime.media.id}
                className="animate-in fade-in zoom-in-95 duration-500"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                <RecentEpisodeAnimeCard anime={anime} />
              </div>
            ))}
          </>
        }
      />

      {/* Airing Now Section */}
      <HomeSection
        isError={Boolean(trendingError)}
        title="Airing This Season"
        subTitle="The hottest shows broadcasting right now."
        viewAllHref="/seasons"
        viewAllText="Browse Seasons"
        isLoading={isLoadingTrending}
        list={
          <>
            {trending?.data?.slice(1, 7).map((anime: any, i: number) => (
              <div
                key={anime.mal_id}
                className="animate-in fade-in zoom-in-95 duration-500"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                <AnimeCard anime={anime} />
              </div>
            ))}
          </>
        }
      />

      {/* Top Anime Section */}
      <HomeSection
        isError={Boolean(topError)}
        isLoading={isLoadingTop}
        list={
          <>
            {top?.data?.slice(0, 6).map((anime: any, i: number) => (
              <div
                key={anime.mal_id}
                className="animate-in fade-in zoom-in-95 duration-500"
                style={{
                  animationDelay: `${i * 100}ms`,
                  animationFillMode: "both",
                }}
              >
                <AnimeCard anime={anime} />
              </div>
            ))}
          </>
        }
        title="Most Popular"
        subTitle="All-time fan favorites and trending classics."
        viewAllHref="/top"
        viewAllText="View All Top Anime"
      />
    </div>
  );
}
