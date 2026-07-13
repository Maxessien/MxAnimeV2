import { getDownloads } from "@/lib/local-store";
import {
  UndefinedInitialDataOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

export type JsonFiles = "downloads" | "saved" | "history";

export function useJson<T>({
  queryOptions,
  addOptions,
  removeOptions,
  clearOptions,
  type,
}: {
  queryOptions?: UndefinedInitialDataOptions<
    T[],
    Error,
    T[],
    readonly JsonFiles[]
  >;
  addOptions?: UseMutationOptions<
    void,
    Error,
    {
      anime: T[] | T;
      type: JsonFiles;
    },
    void
  >;
  removeOptions?: UseMutationOptions<void, Error, (v: T[]) => T[], void>;
  clearOptions?: UseMutationOptions;
  type: JsonFiles;
}) {
  const [json, setJson] = useState<Record<JsonFiles, T[]>>({
    downloads: [],
    history: [],
    saved: [],
  });

  const query = useQuery<T[], Error, T[], readonly JsonFiles[]>({
    ...queryOptions,
    queryKey: [type],
    queryFn: ({ queryKey }) => getDownloads(queryKey[0] + ".json"),
  });

  const add = useMutation<
    void,
    Error,
    {
      anime: T[] | T;
      type: JsonFiles;
    },
    void
  >({
    ...addOptions,
    mutationFn: async ({ anime, type }) => {
      let n = { ...json };
      let parsedAnime = Array.isArray(anime) ? anime : [anime];
      n[type] = [...n[type], ...parsedAnime];
      setJson(n);
      switch (type) {
        case "downloads":
          await invoke("save_dl_history", {
            downloads: JSON.stringify(n.downloads),
          });
          break;

        case "history":
          await invoke("save_watch_history", {
            history: JSON.stringify(n.history),
          });
          break;

        default:
          break;
      }
    },
    retry: 3,
  });

  const remove = useMutation<void, Error, (v: T[]) => T[], void>({
    ...removeOptions,
    mutationFn: async (filter: (v: T[]) => T[]) => {
      switch (type) {
        case "downloads":
          await invoke("save_dl_history", {
            downloads: JSON.stringify(filter(json[type])),
          });
          break;

        case "history":
          await invoke("save_watch_history", {
            history: JSON.stringify(filter(json[type])),
          });
          break;

        default:
          break;
      }
      setJson((dl) => ({
        ...dl,
        [type]: filter(dl[type]),
      }));
    },
    retry: 3,
  });

  const clear = useMutation({
    ...clearOptions,
    mutationFn: async () => {
      setJson((dl) => ({ ...dl, [type]: [] }));
      switch (type) {
        case "downloads":
          await invoke("save_dl_history", { downloads: "[]" });
          break;

        case "history":
          await invoke("save_watch_history", { history: "[]" });
          break;

        default:
          break;
      }
    },
    retry: 3,
  });

  useEffect(() => {
    if (query.data)
      setJson((dl) => {
        let n = { ...dl };
        n[type] = query.data;
        return n;
      });
  }, [query.dataUpdatedAt, query.errorUpdatedAt]);

  return {
    query,
    add,
    remove,
    clear,
    json,
  };
}
