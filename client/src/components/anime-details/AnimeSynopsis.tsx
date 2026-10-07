import { AnimeFull } from "@/types/jikan";

type AnimeSynopsisProps = {
  anime: AnimeFull;
};

export function AnimeSynopsis({ anime }: AnimeSynopsisProps) {
  return (
    <section>
      <h2 className="text-2xl font-bold font-display mb-4 border-l-4 border-primary pl-3">
        Synopsis
      </h2>
      <p className="text-muted-foreground leading-relaxed text-base sm:text-lg whitespace-pre-line">
        {anime.synopsis || "No synopsis available for this title."}
      </p>
    </section>
  );
}
