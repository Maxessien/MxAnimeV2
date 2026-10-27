import IframeStream from "@/components/anime-stream/IframeStream";
import { VideoPlayer } from "@/components/anime-stream/local";
import StreamShell from "@/components/anime-stream/StreamShell";
import NotFound from "@/components/layout/NotFound";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { useEffect, useRef } from "react";
import { useSearchParams } from "wouter";

export const AnimeStream = () => {
  return (
    <StreamShell player={<IframeStream />} />
  );
};

export const AnimeStreamLocal = () => {
  const [searchParam, _] = useSearchParams();

  const malId = searchParam.get("mal_id");
  const ep = searchParam.get("ep");
  const title = searchParam.get("title");


  const { json } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const eps = json.downloads.filter(({ mal_id }) => mal_id.toString() === malId);

  const filePath = eps.find(v => v.episode.ep.toString() === ep)?.episode.path

  return (
    <VideoPlayer
      source={filePath || ""}
      title={`${title} - EP ${ep}`}
    />
  );
};
