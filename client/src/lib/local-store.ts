import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { downloadQueue } from "./queue";

const BACKEND_URL = "";

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image: string | null;
  type?: string | null;
  episodes?: number | null;
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

async function downloadAnime() {
  downloadQueue.isProcessing = true;
  const { mal_id } = downloadQueue.pop();

  const res = await axios.get<AnimeDownload>(
    BACKEND_URL + "/download/" + mal_id,
  );

  await invoke("dl_file", res.data);

  if (downloadQueue.traverse().length > 0) return downloadAnime();
  else downloadQueue.isProcessing = false;
}

export { getDownloads, downloadAnime };
