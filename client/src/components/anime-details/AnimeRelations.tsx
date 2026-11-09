import { AnimeRelationEdge } from "@/types/anilist";
import { RecentEpisodeAnimeCard } from "@/components/AnimeCard";

type AnimeRelationsProps = {
  relations: AnimeRelationEdge[];
};

const relationLabels: Record<string, string> = {
  ADAPTATION: "Adaptation",
  PREQUEL: "Prequel",
  SEQUEL: "Sequel",
  PARENT: "Parent story",
  SIDE_STORY: "Side story",
  CHARACTER: "Character story",
  SUMMARY: "Summary",
  ALTERNATIVE: "Alternative version",
  SPIN_OFF: "Spin-off",
  OTHER: "Other",
};

export function AnimeRelations({ relations }: AnimeRelationsProps) {
  if (relations.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        No related anime available for this title.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {relations.map((relation) => (
        <div key={`${relation.id}-${relation.node.idMal}`} className="min-w-0">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {relationLabels[relation.relationType] ||
              relation.relationType.replace("_", " ")}
          </p>
          <RecentEpisodeAnimeCard
            anime={{ media: relation.node, episode: 0 }}
            type="search"
          />
        </div>
      ))}
    </div>
  );
}
