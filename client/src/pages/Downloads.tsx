import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { Download as DownloadIcon, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "wouter";

export default function Downloads() {
  const { json, remove, clear } = useJson<AnimeSummary>({
    type: "downloads",
    removeOptions: { onSuccess: () => toast.success("Download Removed"), onError: ()=> toast.error("couldn't delete download") },
  });

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight flex items-center gap-3">
            <DownloadIcon size={32} className="text-primary" />
            Downloads
          </h1>
          <p className="text-muted-foreground mt-2">
            Titles you've saved on this device for quick offline reference.
          </p>
        </div>
        {json.downloads.length > 0 && (
          <button
            onClick={() => clear.mutateAsync()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      {!json?.downloads?.length || json.downloads?.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 gap-3 border-2 border-dashed rounded-3xl">
          <DownloadIcon
            size={40}
            className="text-muted-foreground opacity-40"
          />
          <h2 className="text-xl font-semibold">Nothing saved yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Open an anime and tap "Save for Offline" to keep its info and
            episode list handy here.
          </p>
          <Link
            href="/"
            className="mt-2 text-primary font-medium hover:underline"
          >
            Browse anime
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {json.downloads.map((entry, i) => (
            <div
              key={entry.mal_id}
              className="group relative flex flex-col gap-3 animate-in fade-in zoom-in-95"
              style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
            >
              <Link
                href={`/anime/${entry.mal_id}`}
                className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted shadow-sm block"
              >
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                    No Image
                  </div>
                )}
              </Link>
              <button
                onClick={() =>
                  remove.mutateAsync((lt) =>
                    lt.filter((v) => v.mal_id !== entry.mal_id),
                  )
                }
                aria-label={`Remove ${entry.title} from downloads`}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 backdrop-blur-md text-muted-foreground hover:text-destructive shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <div>
                <Link href={`/anime/${entry.mal_id}`}>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors">
                    {entry.title}
                  </h3>
                </Link>
                <div className="flex flex-wrap gap-1 mt-1.5 opacity-80">
                  {entry.type && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {entry.type}
                    </span>
                  )}
                  {entry.episodes ? (
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      {entry.episodes} eps
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
