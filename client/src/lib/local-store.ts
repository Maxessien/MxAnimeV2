import { JsonFiles } from "@/hooks/use-json";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { downloadQueue } from "./queue";

const BACKEND_URL = "";

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image: string | null;
  type?: string | null;
  episode: {
    ep: string | number;
    season: string | number;
    path: string;
  };
  score?: number | null;
};

export type AnimeDownload = { url: string; fileName: string };

export interface WatchHistory extends AnimeSummary {
  viewedAt: string;
}

async function getDownloads<T>(subPath: string) {
  let file = await invoke<string>("get_json_file", {
    subPath,
  });
  let downloads: T[] = JSON.parse(file);

  return downloads;
}

async function downloadAnime(mutateAsync: UseMutateAsyncFunction<void, Error, {
    anime: AnimeSummary | AnimeSummary[];
    type: JsonFiles;
}, void>) {
  downloadQueue.isProcessing = true;
  const info = downloadQueue.pop();

  const {mal_id, episode} = info

  const res = await axios.get<AnimeDownload>(`${BACKEND_URL}/download`, {
    params: {mal_id, eid: episode.ep, sid: episode.season},
  });

  const path = await invoke<string>("dl_file", {url: res.data.url, fileName: `${info.title} - Episode ${episode.ep}.mkv`});

  await mutateAsync({
          anime: {...info, episode: {ep: episode.ep, path, season: episode.season}},
          type: "downloads"
        })

  if (downloadQueue.traverse().length > 0)
    return downloadAnime(mutateAsync);
  else {
    downloadQueue.isProcessing = false;
  }
}

export { downloadAnime, getDownloads };
