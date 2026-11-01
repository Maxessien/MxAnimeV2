import IframeStream from "@/components/anime-stream/IframeStream";
import { VideoPlayer } from "@/components/anime-stream/local";
import StreamShell from "@/components/anime-stream/StreamShell";
import NotFound from "@/components/layout/NotFound";
import { Shell } from "@/components/layout/Shell";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { WatchHistory } from "@/types/storage";
import { useSearchParams } from "wouter";

export const AnimeStream = () => {
  return <StreamShell player={<IframeStream />} />;
};

export const AnimeStreamLocal = () => {
  const [searchParam, _] = useSearchParams();

  const malId = searchParam.get("mal_id");
  const ep = searchParam.get("ep");
  const title = searchParam.get("title");

  const { json: downloads } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const { remove: updateHistory, json: watchHistory } = useJson<WatchHistory>({
    type: "history",
  });

  if (!malId || !ep) {
    return (
      <Shell>
        <NotFound />
      </Shell>
    );
  }

  const eps = downloads.filter(({ mal_id }) => mal_id.toString() === malId);

  const entry = eps.find((v) => v.episode.ep.toString() === ep);

  const filterFn = (v: WatchHistory) => v.malId == malId && v.episode == ep;

  return (
    <VideoPlayer
      source={entry?.episode.path || ""}
      title={`${title ?? "Download"} - EP ${ep ?? "N/A"}`}
      startTimeSec={watchHistory.find(v=> v.episode.toString() === ep)?.watchTimeSec || 0}
      updateWatchHistory={(watchTimeSec, duration) => {
        updateHistory.mutateAsync((history) => {
          const isUpdate = history.find(filterFn);

          const newVal: WatchHistory = isUpdate
            ? { ...isUpdate, lastWatch: Date.now(), watchTimeSec, duration }
            : {
                malId: malId,
                episode: ep,
                lastWatch: Date.now(),
                watchTimeSec,
                duration,
              };

          const filtered = history.filter((v) => !filterFn(v));
          return [...filtered, newVal];
        });
      }}
    />
  );
};
