import {
  AnimeDetailEpisodes,
  AnimeDetailHero,
  AnimeDetailInfo,
  AnimeSynopsis,
  AnimeTrailer,
} from "@/components/anime-details";
import { EpisodeEntry } from "@/components/anime-details/AnimeEpisodes";
import { AnimeEpisodesDl } from "@/components/anime-details/AnimeEpisodesDl";
import BackBtn from "@/components/layout/BackBtn";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimeEpisodes, useAnimeFull } from "@/hooks/use-jikan";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary, downloadAnime } from "@/lib/local-store";
import { downloadQueue } from "@/lib/queue";
import { AugmentedAnimeMedia } from "@/types/anilink";
import { AniZipMetadata } from "@/types/anizip";
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
        queueId: window.crypto.randomUUID(),
      });

      if (!downloadQueue.isProcessing) await downloadAnime(add.mutateAsync);
    },
  });

  const anilinkEp = episodesData as AugmentedAnimeMedia;
  const anizipEp = episodesData as AniZipMetadata;

  const episodes: EpisodeEntry[] = episodesData?.isAnilist
    ? anilinkEp?.airingSchedule.nodes &&
      anilinkEp?.airingSchedule.nodes.length > 0
      ? anilinkEp.airingSchedule.nodes.map(({ airingAt, episode }) => ({
          episode,
          hasAired: new Date((airingAt * 1000)).getTime() < Date.now(),
          airDate: airingAt * 1000,
          episodeNumber: episode,
          seasonNumber: anilinkEp.seasonNumber,
        }))
      : Array(anilinkEp.nextAiringEpisode.episode)
          .fill("v")
          .map((_, idx, arr) => ({
            episodeNumber: idx + 1,
            seasonNumber: anilinkEp.seasonNumber,
            episode: idx + 1,
            hasAired: idx + 1 < arr.length,
            airDate:
              (anilinkEp.nextAiringEpisode.airingAt -
                3600 * 24 * 7 * (idx + 1)) *
              1000,
          }))
    : anizipEp?.episodes
      ? Object.entries(anizipEp.episodes).map((v) => ({
          episode: v[1].episodeNumber || Number(v[1].episode),
          airDate: v[1].airDate || v[1].airDateUtc || v[1].airdate,
          hasAired: Boolean(
            (v[1].airDateUtc || v[1].airDate || v[1].airdate) &&
            new Date(
              v[1].airDateUtc || v[1].airDate || v[1].airdate,
            ).getTime() < Date.now(),
          ),
          episodeNumber: v[1].episodeNumber,
          seasonNumber: v[1].seasonNumber,
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

  const trailerUrl = episodesData?.isAnilist
    ? anilinkEp?.trailer?.site === "youtube"
      ? `https://www.youtube.com/embed/${anilinkEp.trailer.id}`
      : null
    : null;

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-0 z-99">
        <BackBtn />
      </div>
      <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
        {dlPopup.active && dlPopup.info && (
          <AnimeEpisodesDl
            closeFn={() => setDlPopup({ active: false, info: null })}
            mutationFn={mutateAsync}
            episodeInfo={dlPopup.info}
          />
        )}
        <AnimeDetailHero anime={anime} trailerUrl={null} />
        <AnimeTrailer animeTitle={anime.title} url={trailerUrl} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <AnimeDetailInfo anime={anime} />

          <div className="lg:col-span-2 space-y-12 order-1 lg:order-2">
            <AnimeSynopsis anime={anime} />
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
    </div>
  );
}
