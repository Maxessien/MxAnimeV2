import { VidPlayer } from "@/components/VidPlayer";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useRoute } from "wouter";

const Play = () => {
  const [, params] = useRoute("/play/:id");
  const id = params?.id || "";

  const { json } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const eps = json.downloads.filter(({ mal_id }) => mal_id.toString() === id);

  return (
    <VidPlayer
      initPlaylist={eps.map(
        ({ mal_id, title, episode: { path, season, ep } }) => ({
          id: `${mal_id} - ${season} - ${ep}`,
          title,
          url: convertFileSrc(path),
        }),
      )}
    />
  );
};

export default Play;
