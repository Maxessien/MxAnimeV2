import { ongoingDownloadQueue } from "@/lib/queue";
import {
  UndefinedInitialDataOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

export interface AppSettings {
  theme: "dark" | "light" | "system";
  maxParallelDownloads: number | "unlimited";
}

export const useSettings = (
  queryOptions?: UndefinedInitialDataOptions<
    AppSettings,
    Error,
    AppSettings,
    string[]
  >,
) => {
  const [settings, setSettings] = useState<AppSettings>({
    maxParallelDownloads: 1,
    theme: "system",
  });

  const [fileLoaded, setFileLoaded] = useState(false);
  const { setTheme } = useTheme();

  const { data, dataUpdatedAt, errorUpdatedAt } = useQuery({
    ...queryOptions,
    queryKey: ["settings"],
    queryFn: async () => {
      const file = await invoke<string>("get_json_file", {
        subPath: "settings.json",
        defaultJson: JSON.stringify({
          maxParallelDownloads: 1,
          theme: "system",
        }),
      });

      const s = JSON.parse(file);

      setFileLoaded(true);

      const allowTheme = ["dark", "light", "system"];
      const allowMaxParallelDownloads = ["unlimited", 1, 3, 5, 10];

      if (
        s.theme &&
        allowTheme.includes(s.theme) &&
        allowMaxParallelDownloads.includes(s.maxParallelDownloads)
      )
        return s as AppSettings;
      else throw new Error("Invalid settings json");
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await invoke("save_json_file", {
        json: JSON.stringify(settings),
        file: "settings.json",
      });
    },
  });

  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data, dataUpdatedAt, errorUpdatedAt]);

  const saveTimeout = useRef<NodeJS.Timeout>(null);

  const saveSettings = () => {
    if (!fileLoaded) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      saveTimeout.current = null;
      await mutateAsync();
    }, 1500);
  };

  useEffect(() => {
    saveSettings();
  }, [settings]);

  useEffect(() => {
    ongoingDownloadQueue.setMaxCapacity(
      ongoingDownloadQueue.getElements.filter((v) => v.isPaused).length +
        (settings.maxParallelDownloads === "unlimited"
          ? Infinity
          : Number(settings.maxParallelDownloads)),
    );
  }, [settings.maxParallelDownloads]);

  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme]);

  return { settings, setSettings };
};
