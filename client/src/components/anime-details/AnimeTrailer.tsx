import { Video } from "lucide-react";

type AnimeTrailerProps = {
  animeTitle: string;
  url?: string | null;
};

export function AnimeTrailer({ animeTitle, url }: AnimeTrailerProps) {
  if (!url) return null;

  return (
    <section className="max-w-140 w-full mx-auto">
      <h2 className="text-2xl font-bold font-display mb-4 border-l-4 border-primary pl-3 flex items-center gap-2">
        <Video size={24} className="text-primary" /> Trailer
      </h2>
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border">
        <iframe
          src={url}
          title={`${animeTitle} Trailer`}
          className="w-full h-full"
          allowFullScreen
        />
      </div>
    </section>
  );
}
