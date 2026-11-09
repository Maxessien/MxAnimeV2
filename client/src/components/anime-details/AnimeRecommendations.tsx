import { RecentEpisode } from "@/types/anilist";
import { Link } from "wouter";

type AnimeRecommendationsProps = {
  recommendations: RecentEpisode["media"][];
};

export function AnimeRecommendations({
  recommendations,
}: AnimeRecommendationsProps) {
  const availableRecommendations = recommendations.filter(
    (recommendation) => recommendation.idMal,
  );

  if (availableRecommendations.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        No recommendations available for this title.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {availableRecommendations.map((recommendation) => {
        const title =
          recommendation.title.english ||
          recommendation.title.romaji ||
          "Untitled anime";
        const image =
          recommendation.coverImage.large ||
          recommendation.coverImage.extraLarge ||
          recommendation.coverImage.medium;

        return (
          <Link
            key={recommendation.id}
            href={`/anime/${recommendation.idMal}`}
            className="group min-w-0"
          >
            <div className="aspect-3/4 overflow-hidden rounded-xl bg-muted">
              {image ? (
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <h3 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-primary">
              {title}
            </h3>
            <span className="text-xs text-muted-foreground">
              {recommendation.startDate?.year || "Year unknown"} ·{" "}
              {recommendation.format}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
