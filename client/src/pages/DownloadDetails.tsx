import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { FaPlay } from "react-icons/fa";
import { Link, useRoute } from "wouter";

const DownloadDetails = () => {
  const [, params] = useRoute("/downloads/:id");
  const id = params?.id || "";

  const { json } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const eps = json.downloads.filter(({ mal_id }) => mal_id.toString() === id);
  const first = eps[0] ?? null;

  //   const handleRemove = (entry: AnimeSummary) => {
  //     remove.mutate((list) => list.filter((v) => !(v.mal_id === entry.mal_id && v.episode.ep === entry.episode.ep && v.episode.season === entry.episode.season)));
  //   };

  if (eps.length === 0)
    return (
      <div className="py-12">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>No downloads found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There are no downloads saved for this anime.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/">
              <Button variant="ghost">Go Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );

  return (
    <div className="space-y-6 py-8">
      {/* Banner from first entry */}
      {first && (
        <div className="relative -mx-4 md:-mx-8 mb-8">
          <div className="h-56 md:h-96 w-full overflow-hidden bg-black">
            <img
              src={first.image ?? ""}
              alt={first.title}
              className="w-full h-full object-cover opacity-30 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10 -mt-24 md:-mt-32 flex items-end gap-6">
            <div className="w-32 md:w-48 shrink-0 shadow-2xl rounded-2xl overflow-hidden border-4 border-background bg-background">
              <img
                src={first.image ?? ""}
                alt={first.title}
                className="w-full h-full object-center object-cover"
              />
            </div>

            <div className="flex-1 text-left">
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">
                {first.title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {first.type ?? ""} {first.score ? `• Score ${first.score}` : ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Episodes list (compact) */}
      <div className="space-y-4">
        {eps.map((entry) => (
          <Card
            key={`${entry.mal_id}-${entry.episode.ep}-${entry.episode.season}`}
            className="p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Episode {entry.episode.ep}</div>
                <div className="text-sm text-muted-foreground">
                  Season {entry.episode.season}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {entry.episode.quality}P
                </Badge>
                {entry.episode.path ? (
                  <Badge className="px-3 py-1 text-sm">Downloaded</Badge>
                ) : (
                  <Badge variant="outline" className="px-3 py-1 text-sm">
                    Pending
                  </Badge>
                )}
              </div>

              <Link
                href={`/play/${entry.mal_id}`}
                className="rounded-full hover:bg-primary/90 transition-all p-4 border-2 border-(--border) bg-primary hover:cursor-pointer"
              ><FaPlay /></Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DownloadDetails;
