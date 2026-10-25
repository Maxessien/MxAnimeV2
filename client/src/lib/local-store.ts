import { JsonFiles } from "@/hooks/use-json";
import { DownloadStatus } from "@/types/apiResponses";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { toast } from "react-toastify";
import { downloadQueue, ongoingDownloadQueue } from "./queue";
import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { fetchWithProgress, isMobile } from "./utils";
import { BaseDirectory, exists, writeFile } from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";

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
  const safeTitle = info.title.replace(/[<>:"/\\|?*]/g, "_");

  const { mal_id, episode } = info;

  let ongoingAdded: { active: boolean; taskId: string | number } = {
    active: false,
    taskId: "",
  };

  try {
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

    const controller = new AbortController();

    ongoingDownloadQueue.push({
      anime: {
        image: info.image,
        title: `${info.title} - Episode ${episode.ep}`,
      },
      curr: 0,
      total: 100,
      status: status?.status ?? null,
      id: taskId,
      isCancelled: false,
      abortController: controller,
    });

    ongoingAdded = {
      active: true,
      taskId,
    };

    const granted = await isPermissionGranted();

    if (granted && isMobile)
      sendNotification({
        title: `${safeTitle} - Episode ${episode.ep}.mkv`,
        body: "Processing - 0%",
        ongoing: true,
        id: Number(taskId),
      });

    while (!status || status.status.status === "pending") {
      const ongoing = ongoingDownloadQueue
        .traverse()
        .find((v) => v.id === taskId);

      if (ongoing && ongoing.isCancelled) break;

      const { data } = await axios.get<DownloadStatus>(
        `${BACKEND_URL}/show/status/${taskId}`,
      );

      if (granted && isMobile)
        sendNotification({
          title: `${safeTitle} - Episode ${episode.ep}.mkv`,
          body: `Processing - ${data.status.progress}%`,
          ongoing: true,
          id: Number(taskId),
        });

      ongoingDownloadQueue.updateStatus(taskId, data.status);

      status = data;

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    if (!status) throw new Error("Status not found");

    if (status.status.status === "completed" && status.episode) {
      const url = status.episode.fileUrl;
      if (!url) throw new Error("Url not found");
      const filename = `downloads/${safeTitle} - Episode ${episode.ep}`
      let saveAs = `${filename}.mkv`;

      let idx = 1;
      while (await exists(saveAs, { baseDir: BaseDirectory.AppData })) {
        saveAs = `${filename}(${idx}).mkv`;
        idx++;
      }
      const path = await join(await appDataDir(), saveAs);

      const res = await fetchWithProgress(url, controller, (total, loaded) => {
        ongoingDownloadQueue.updateProg(taskId, {
          curr: loaded / (1024 * 1024),
          total: total ? total / (1024 * 1024) : Infinity,
        });
      });

      if (!res.body || !res.ok) {
        throw new Error("Response body is not readable");
      }

      await writeFile(saveAs, res.body, {
        baseDir: BaseDirectory.AppData,
      });

      if (await exists(path))
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

      if (granted)
        sendNotification({
          title: `${safeTitle} - Episode ${episode.ep}.mkv`,
          body: "Download complete",
          ongoing: false,
          id: Number(taskId),
        });
    }

    if (status.status.status === "error") {
      if (granted)
        sendNotification({
          title: `${safeTitle} - Episode ${episode.ep}.mkv`,
          body: "Download failed",
          ongoing: false,
          id: Number(taskId),
        });
      toast.error(`${info.title} - Episode ${episode.ep} download failed`);
    }

    ongoingDownloadQueue.removeById(taskId);
  } catch (err: any) {
    console.log("Failed download", err);
    if (ongoingDownloadQueue.getElements.find(({id})=> id == ongoingAdded.taskId)?.isCancelled)
      toast.success(`${info.title} - Episode ${episode.ep} download cancelled`);
    else toast.error(`${info.title} - Episode ${episode.ep} download failed`);
    if (ongoingAdded.active)
      ongoingDownloadQueue.removeById(ongoingAdded.taskId);
  } finally {
    if (downloadQueue.traverse().length > 0) return downloadAnime(mutateAsync);
    else {
      downloadQueue.isProcessing = false;
    }
  }
}

export { downloadAnime, getDownloads };
