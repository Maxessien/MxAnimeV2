import {
  AnimeDetailEpisodes,
  AnimeDetailHero,
  AnimeDetailInfo,
  AnimeSynopsis,
  AnimeTrailer,
} from "@/components/anime-details";
import { AnimeEpisodesDl } from "@/components/anime-details/AnimeEpisodesDl";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimeEpisodes, useAnimeFull } from "@/hooks/use-jikan";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary, downloadAnime } from "@/lib/local-store";
import { downloadQueue } from "@/lib/queue";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRoute } from "wouter";

export default function AnimeDetail() {
  const [, params] = useRoute("/anime/:id");
  const id = params?.id || "";

  const {
    data: animeData,
    isLoading: isLoadingAnime,
    error: animeError,
  } = useAnimeFull(id);

  const {
    data: episodesData,
    isLoading: isLoadingEpisodes,
    isFetching: isFetchingEpisodes,
    error: episodesError,
  } = useAnimeEpisodes(id);

  const { add } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const anime = animeData?.data;

  const { mutateAsync } = useMutation({
    mutationFn: async ({
      eid,
      season,
      quality,
    }: {
      eid: string | number;
      season: string | number;
      quality: number;
    }) => {
      console.log(downloadQueue)
      if (!anime) return;
      downloadQueue.push({
        mal_id: anime.mal_id,
        title: anime.title,
        image: anime.images.webp.large_image_url,
        type: anime.type,
        episode: {
          ep: eid,
          season,
          path: "",
          quality,
        },
        score: anime.score,
      });

      if (!downloadQueue.isProcessing) await downloadAnime(add.mutateAsync);
    },
  });

  const episodes = episodesData?.data?.episodes
    ? Object.entries(episodesData.data.episodes).map((v) => ({
        ...v[1],
        hasAired: Boolean(
          v[1].airDateUtc && new Date(v[1].airDateUtc).getTime() < Date.now(),
        ),
      }))
    : [];

  const [dlPopup, setDlPopup] = useState<{
    active: boolean;
    info: { mal_id: string | number; eId: number; sId: number } | null;
  }>({ active: false, info: null });

  if (animeError) {
    return (
      <div className="py-20 text-center text-destructive">
        <h2 className="text-2xl font-bold">Failed to load anime details</h2>
        <p className={(animeError as Error).message}></p>
      </div>
    );
  }

  if (isLoadingAnime) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-100 bg-muted rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-4">
            <Skeleton className="h-100 w-full rounded-2xl" />
          </div>
          <div className="col-span-2 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!anime) return null;

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      {dlPopup.active && dlPopup.info && (
        <AnimeEpisodesDl
          closeFn={() => setDlPopup({ active: false, info: null })}
          mutationFn={mutateAsync}
          episodeInfo={dlPopup.info}
        />
      )}
      <AnimeDetailHero
        anime={anime}
        trailerUrl={null}
        epIds={episodes.map((v, i) => v.episodeNumber ?? i + 1)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <AnimeDetailInfo anime={anime} />

        <div className="lg:col-span-2 space-y-12 order-1 lg:order-2">
          <AnimeSynopsis anime={anime} />
          <AnimeTrailer animeTitle={anime.title} youtubeId={null} />
          <AnimeDetailEpisodes
            anime={anime}
            episodes={episodes}
            isLoading={isLoadingEpisodes}
            isFetching={isFetchingEpisodes}
            error={episodesError}
            showDlPopup={(val) => setDlPopup({ active: true, info: val })}
          />
        </div>
      </div>
    </div>
  );
}
