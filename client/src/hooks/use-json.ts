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
    T[] | T,
    void
  >;
  removeOptions?: UseMutationOptions<void, Error, (v: T[]) => T[], void>;
  clearOptions?: UseMutationOptions;
  type: JsonFiles;
}) {
  const [json, setJson] = useState<T[]>([]);

  const query = useQuery<T[], Error, T[], readonly JsonFiles[]>({
    ...queryOptions,
    queryKey: [type],
    queryFn: ({ queryKey }) => getDownloads(queryKey[0] + ".json"),
  });

  const add = useMutation<
    void,
    Error,
    T[] | T,
    void
  >({
    ...addOptions,
    mutationFn: async (anime) => {
      const parsedAnime = Array.isArray(anime) ? anime : [anime];
      const newVal = [...json, ...parsedAnime]
      setJson(newVal);
      await invoke("save_json_file", {
        json: JSON.stringify(newVal),
        file: `${type}.json`
      });
    },
    retry: 3,
  });

  const remove = useMutation<void, Error, (v: T[]) => T[], void>({
    ...removeOptions,
    mutationFn: async (filter: (v: T[]) => T[]) => {
      await invoke("save_json_file", {
        json: JSON.stringify(filter(json)),
        file: `${type}.json`
      });
      setJson((dl) => filter(dl));
    },
    retry: 3,
  });

  const clear = useMutation({
    ...clearOptions,
    mutationFn: async () => {
      setJson([]);
      await invoke("save_json_file", { json: "[]", file: `${type}.json` });
    },
    retry: 3,
  });

  useEffect(() => {
    if (query.data)
      setJson(query.data);
  }, [query.dataUpdatedAt, query.errorUpdatedAt]);

  return {
    query,
    add,
    remove,
    clear,
    json,
  };
}
