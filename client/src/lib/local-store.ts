import { invoke } from "@tauri-apps/api/core";

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image: string | null;
  type?: string | null;
  episodes?: number | null;
  score?: number | null;
};

export interface WatchHistory extends AnimeSummary {
  viewedAt: string
}

async function getDownloads<T>(subPath: string) {
  let file = await invoke<string>("get_json_file", {
    subPath,
  });
  let downloads: T[] = JSON.parse(file);

  return downloads;
}

export { getDownloads };
