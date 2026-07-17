import { BACKEND_URL } from "@/lib/local-store";
import { DbEpisode } from "@/types/apiResponses";
import { UseMutateAsyncFunction, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FaSpinner } from "react-icons/fa";

export function AnimeEpisodesDl({
  episodeInfo: { eId, mal_id, sId },
  mutationFn,
}: {
  episodeInfo: { mal_id: string | number; eId: number; sId: number };
  mutationFn: UseMutateAsyncFunction<
    void,
    Error,
    {
      eid: string | number;
      season: string | number;
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
    <div>
      <div>
        <h2>Download Quality</h2>
        <p>Choose quality to download file with</p>
        <div>
          {isFetching && (
            <span className="text-3xl font-medium">
              <FaSpinner className="animate-spin" />
            </span>
          )}
          {data &&
            !isFetching &&
            data.map(({ eId, quality, sId }) => (
              <button onClick={() => mutationFn({ eid: eId, season: sId })}>
                {quality}P
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
