import { JsonFiles } from "@/hooks/use-json";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { downloadQueue, ongoingDownloadQueue } from "./queue";
import { DownloadStatus } from "@/types/apiResponses";
import { toast } from "react-toastify";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image: string | null;
  type?: string | null;
  episode: {
    ep: string | number;
    season: string | number;
    path: string;
    quality: number;
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

async function downloadAnime(
  mutateAsync: UseMutateAsyncFunction<
    void,
    Error,
    {
      anime: AnimeSummary | AnimeSummary[];
      type: JsonFiles;
    },
    void
  >,
) {
  downloadQueue.isProcessing = true;
  const info = downloadQueue.pop();

  const { mal_id, episode } = info;

  const {
    data: { taskId },
  } = await axios.get<{ taskId: number | string }>(
    `${BACKEND_URL}/show/download`,
    {
      params: {
        mal_id,
        eId: episode.ep,
        sId: episode.season,
        dl_quality: episode.quality,
      },
    },
  );

  let status: DownloadStatus | undefined;

  ongoingDownloadQueue.push({
    anime: { image: info.image, title: info.title },
    curr: 0,
    total: 100,
    status: null,
    id: taskId,
  });

  while (!status || status.status.status === "pending") {
    const { data } = await axios.get<DownloadStatus>(
      `${BACKEND_URL}/show/status/${taskId}`,
    );

    ongoingDownloadQueue.updateStatus(taskId, data.status)
    
    status = data;

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (status.status.status === "completed" && status.episode) {
    const safeTitle = info.title.replace(/[<>:"/\\|?*]/g, "_");

    const path = await invoke<string>("dl_file", {
      url: status.episode.fileUrl,
      saveAs: `${safeTitle} - Episode ${episode.ep}.mkv`,
      taskId: taskId.toString()
    });

    await mutateAsync({
      anime: {
        ...info,
        episode: {
          ep: episode.ep,
          path,
          season: episode.season,
          quality: episode.quality,
        },
      },
      type: "downloads",
    });
  }

  if (status.status.status === "error")
    toast.error(`${info.title} - Episode ${episode.ep} download failed`);

  ongoingDownloadQueue.removeById(taskId)

  if (downloadQueue.traverse().length > 0) return downloadAnime(mutateAsync);
  else {
    downloadQueue.isProcessing = false;
  }
}

export { downloadAnime, getDownloads };
