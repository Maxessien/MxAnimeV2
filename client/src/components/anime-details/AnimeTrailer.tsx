import { Video } from "lucide-react";

type AnimeTrailerProps = {
  animeTitle: string;
  youtubeId?: string | null;
};

export function AnimeTrailer({ animeTitle, youtubeId }: AnimeTrailerProps) {
  if (!youtubeId) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold font-display mb-4 border-l-4 border-primary pl-3 flex items-center gap-2">
        <Video size={24} className="text-primary" /> Trailer
      </h2>
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={`${animeTitle} Trailer`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    </section>
  );
}