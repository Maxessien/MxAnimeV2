import { getDownloads } from "@/lib/local-store";
import {
  UndefinedInitialDataOptions,
  useMutation,
  UseMutationOptions,
  useQuery,
} from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

type JsonFiles = "downloads" | "saved" | "history";

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
    { anime: T; type: JsonFiles, exists: (v: T[])=> boolean },
    void
  >;
  removeOptions?: UseMutationOptions<void, Error, (v: T[])=> T[], void>;
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

  const add = useMutation<void, Error, { anime: T; type: JsonFiles, exists: (v: T[])=> boolean }, void>({
    ...addOptions,
    mutationFn: async ({ anime, type, exists }) => {
      setJson((dl) => {
        if (exists(dl[type])) return dl

        let n = {...dl}
        n[type].push(anime)
        return n
      });
      let str = JSON.stringify(anime);
      switch (type) {
        case "downloads":
          await invoke("save_dl_history", { downloads: str });
          break;

        case "history":
          await invoke("save_watch_history", { history: str });
          break;

        default:
          break;
      }
    },
    retry: 3,
  });

  const remove = useMutation<void, Error, (v: T[])=> T[], void>({
    ...removeOptions,
    mutationFn: async (mal_id: (v: T[])=> T[]) => {
      setJson((dl) => ({
        ...dl,
        [type]: mal_id(dl[type])}));
      switch (type) {
        case "downloads":
          await invoke("save_dl_history", { downloads: json[type] });
          break;

        case "history":
          await invoke("save_watch_history", { history: json[type] });
          break;

        default:
          break;
      }
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
    if (query.data) setJson((dl) => ({ ...dl, [type]: query.data }));
  }, [query.dataUpdatedAt, query.errorUpdatedAt]);

  return {
    query,
    add,
    remove,
    clear,
    json,
  };
}
