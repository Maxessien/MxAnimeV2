import { JsonFiles } from "@/hooks/use-json";
import { DownloadStatus } from "@/types/apiResponses";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { toast } from "react-toastify";
import { downloadQueue, ongoingDownloadQueue } from "./queue";

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
  console.log("first", downloadQueue);
  downloadQueue.isProcessing = true;
  const info = downloadQueue.pop();

  const { mal_id, episode } = info;

  const {
    data: { taskId, isCompressed, episode: ep },
  } = await axios.get<{
    taskId: number | string;
    episode: DownloadStatus["episode"];
    isCompressed: boolean;
  }>(`${BACKEND_URL}/show/download`, {
    params: {
      mal_id,
      eId: episode.ep,
      sId: episode.season,
      dl_quality: episode.quality,
    },
  });

  let status: DownloadStatus | undefined =
    isCompressed && ep
      ? {
          episode: ep,
          status: {
            progress: 100,
            status: "completed",
            epInfo: {
              episodeId: Number(episode.ep),
              malId: mal_id,
              quality: episode.quality.toString(),
              season: Number(episode.season),
            },
          },
        }
      : undefined;

  ongoingDownloadQueue.push({
    anime: { image: info.image, title: info.title },
    curr: 0,
    total: 100,
    status: status?.status ?? null,
    id: taskId,
  });

  while (!status || status.status.status === "pending") {
    const { data } = await axios.get<DownloadStatus>(
      `${BACKEND_URL}/show/status/${taskId}`,
    );

    ongoingDownloadQueue.updateStatus(taskId, data.status);

    status = data;

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (status.status.status === "completed" && status.episode) {
    const safeTitle = info.title.replace(/[<>:"/\\|?*]/g, "_");

    try {
      const path = await invoke<string>("dl_file", {
        url: status.episode.fileUrl,
        saveAs: `${safeTitle} - Episode ${episode.ep}.mkv`,
        taskId: taskId.toString(),
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
    } catch (err) {
      console.log("Failed download", err);
      toast.error(`${info.title} - Episode ${episode.ep} download failed`);
    }
  }

  if (status.status.status === "error")
    toast.error(`${info.title} - Episode ${episode.ep} download failed`);

  ongoingDownloadQueue.removeById(taskId);

  if (downloadQueue.traverse().length > 0) return downloadAnime(mutateAsync);
  else {
    downloadQueue.isProcessing = false;
  }
}

export { downloadAnime, getDownloads };
