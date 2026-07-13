import { Link } from "wouter";
import { History as HistoryIcon, Trash2, X } from "lucide-react";
import { useJson } from "@/hooks/use-json";
import { WatchHistory } from "@/lib/local-store";

export default function History() {
  const { remove, clear, json } = useJson<WatchHistory>({type: "history"});

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight flex items-center gap-3">
            <HistoryIcon size={32} className="text-primary" />
            Watch History
          </h1>
          <p className="text-muted-foreground mt-2">
            Titles you've viewed on this device, most recent first.
          </p>
        </div>
        {json.history.length > 0 && (
          <button
            onClick={()=> clear.mutateAsync()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 size={16} /> Clear History
          </button>
        )}
      </div>

      {json.history.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 gap-3 border-2 border-dashed rounded-3xl">
          <HistoryIcon size={40} className="text-muted-foreground opacity-40" />
          <h2 className="text-xl font-semibold">No history yet</h2>
          <p className="text-muted-foreground max-w-sm">
            Anime you open will show up here so you can pick up where you left
            off.
          </p>
          <Link
            href="/"
            className="mt-2 text-primary font-medium hover:underline"
          >
            Browse anime
          </Link>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-2xl border bg-card overflow-hidden">
          {json.history.map((entry, i) => (
            <div
              key={entry.mal_id}
              className="flex items-center gap-4 p-3 md:p-4 hover:bg-muted/40 transition-colors group animate-in fade-in slide-in-from-bottom-1"
              style={{ animationDelay: `${Math.min(i, 20) * 20}ms` }}
            >
              <Link
                href={`/anime/${entry.mal_id}`}
                className="shrink-0 w-14 h-20 rounded-lg overflow-hidden bg-muted"
              >
                {entry.image ? (
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : null}
              </Link>
              <Link href={`/anime/${entry.mal_id}`} className="flex-1 min-w-0">
                <p className="font-semibold truncate group-hover:text-primary transition-colors">
                  {entry.title}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {entry.type && (
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      {entry.type}
                    </span>
                  )}
                  {entry.episode ? (
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                      {entry.episode.ep} eps
                    </span>
                  ) : null}
                  <span>
                    Viewed{" "}
                    {new Date(entry.viewedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Link>
              <button
                onClick={() => remove.mutateAsync(lt => lt.filter((v)=> v.mal_id !== entry.mal_id))}
                aria-label={`Remove ${entry.title} from history`}
                className="shrink-0 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
