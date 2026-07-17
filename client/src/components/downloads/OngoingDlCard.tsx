import { OngoingDl, Tasks } from "@/types/apiResponses";

const OngoingDlCard = ({ anime, curr, status, total }: OngoingDl) => {
    if (!status) return <></>

  const progress =
    status.status === "completed"
      ? total > 0
        ? Math.min(100, Math.max(0, (curr / total) * 100))
        : 0
      : status.progress;

  const stMapping: Record<Tasks["status"], string> = {
    pending: "Processing...",
    completed: "Downloading...",
    error: "Download Failed",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm shadow-sm transition-all hover:shadow-md hover:border-primary/30">
      <div
        className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
        style={{ width: `${progress}%` }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border bg-muted shadow-sm">
          {anime.image && (
            <img
              className="h-full w-full object-cover object-center"
              src={anime.image}
              alt={anime.title}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm sm:text-base font-semibold leading-tight text-foreground">
                {anime.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stMapping[status.status]}
              </p>
            </div>

            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>

          {status.status === "completed" && (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                  aria-hidden="true"
                />
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {curr.toFixed(1)}MB / {total.toFixed(1)}MB
                </span>
                <span>{progress >= 100 ? "Finalizing" : "Downloading"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OngoingDlCard;
