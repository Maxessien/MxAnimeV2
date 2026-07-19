import { Button } from "@/components/ui/button";
import { BACKEND_URL } from "@/lib/local-store";
import { DbEpisode } from "@/types/apiResponses";
import { UseMutateAsyncFunction, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";
import { HiX } from "react-icons/hi";

export function AnimeEpisodesDl({
  episodeInfo: { eId, mal_id, sId },
  closeFn,
  mutationFn,
}: {
  episodeInfo: { mal_id: string | number; eId: number; sId: number };
  closeFn: () => void;
  mutationFn: UseMutateAsyncFunction<
    void,
    Error,
    {
      eid: string | number;
      season: string | number;
      quality: number
    },
    unknown
  >;
}) {
  const { data, isFetching } = useQuery({
    queryKey: ["episode_info", eId, mal_id, sId],
    queryFn: async () => {
      const res = await axios.post<
        Pick<DbEpisode, "eId" | "malId" | "quality" | "sId">[]
      >(`${BACKEND_URL}/show/ep`, {
        mal_id,
        eId,
        sId,
      });
      return res.data;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 3,
  });

  return (
    <div className="flex justify-center items-center backdrop-blur-3xl z-99999 fixed top-0 left-0 w-screen h-screen">
      <div className="bg-muted/30 p-6 max-w-140 rounded-2xl border">
      <div className="flex justify-end items-center">
        <button onClick={closeFn} className="text-2xl font-medium"><HiX /></button>
      </div>
        <h2 className="font-bold text-lg mb-2">Download Quality</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Choose quality to download file with
        </p>

        <div className="flex flex-wrap gap-3">
          {isFetching && (
            <div className="flex items-center justify-center w-full py-8">
              <FaSpinner className="text-3xl animate-spin text-primary" />
            </div>
          )}
          {data &&
            !isFetching &&
            data.map(({ eId, quality, sId }) => (
              <Button
                key={`${eId}-${sId}-${quality}`}
                onClick={() => {
                  mutationFn({ eid: eId, season: sId, quality })
                  closeFn()
                }}
                variant="secondary"
                className="min-w-20 cursor-pointer hover:brightness-110 transition-all"
              >
                {quality}P
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
}
