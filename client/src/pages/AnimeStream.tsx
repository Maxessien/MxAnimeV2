import { useEffect } from "react";
import NotFound from "@/components/layout/NotFound";
import { constructStreamUrl } from "@/lib/utils";
import { useSearchParams } from "wouter";
import BackBtn from "@/components/layout/BackBtn";

const AnimeStream = () => {
  const [searchParam, setSearchParam] = useSearchParams();

  const malId = searchParam.get("mal_id");
  const ep = searchParam.get("ep");
  const total = searchParam.get("total");
  const title = searchParam.get("title");

  const totalEpisodes = Number(total);
  const currentEpisode = Number(ep);

  // Safe redirect hook: handles fallback to episode 1 if `ep` is missing or out of bounds
  useEffect(() => {
    if (!malId || !total || totalEpisodes <= 0) return;

    if (!ep || currentEpisode > totalEpisodes || currentEpisode < 1) {
      // Build search params cleanly to avoid stripping out other URL parameters
      const params = new URLSearchParams(window.location.search);
      params.set("mal_id", malId);
      params.set("ep", "1");
      params.set("total", total);
      setSearchParam(params.toString());
    }
  }, [malId, ep, total, currentEpisode, totalEpisodes, setSearchParam]);

  // 1. Strict validation guard clauses mapping to your NotFound component
  if (!malId || !total || totalEpisodes <= 0) {
    return <NotFound />;
  }

  // 2. Render guard while the useEffect handles the out-of-bounds redirect
  if (!ep || currentEpisode > totalEpisodes || currentEpisode < 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground font-sans">
        <div className="animate-pulse">Loading episode routing...</div>
      </div>
    );
  }

  // 3. Build out the streaming source safely
  const iframeUrl = constructStreamUrl(malId, ep);

  // Quick helper to transition to next/prev episodes safely
  const changeEpisode = (targetEp: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("mal_id", malId);
    params.set("ep", String(targetEp));
    params.set("total", total);
    setSearchParam(params.toString());
  };

  return (
    <div className="min-h-screen bg-background w-full text-foreground font-sans px-4 py-6 md:px-8 mx-auto flex flex-col gap-6">
      {/* Header Info */}

      <div className="flex w-full">
        <BackBtn />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-md">
            Streaming
          </span>
          <h1 className="text-xl md:text-2xl font-bold mt-2 tracking-tight">
            {title ?? (
              <>
                Anime Title{" "}
                <span className="text-muted-foreground font-normal">
                  #MAL-{malId}
                </span>
              </>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm bg-card border border-card-border px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-primary font-bold">Episode {ep}</span>
          <span className="text-muted-foreground">/ {total}</span>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 w-full lg:grid-cols-4 gap-6 items-start">
        {/* Video Player Area */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="relative aspect-video w-full bg-card border border-card-border rounded-xl shadow-xl overflow-hidden group">
            <iframe
              src={iframeUrl}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              title={`${title ?? "Anime"} Episode ${ep}`}
            />
          </div>

          {/* Quick Player Navigation Controls */}
          <div className="flex justify-between items-center bg-card border border-card-border p-4 rounded-xl shadow-sm">
            <button
              onClick={() => changeEpisode(currentEpisode - 1)}
              disabled={currentEpisode <= 1}
              className="inline-flex items-center gap-1 text-sm font-medium bg-secondary text-secondary-foreground px-4 py-2 rounded-lg border border-border transition-all hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <svg
                xmlns="http://w3.org"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Prev
            </button>
            <span className="text-xs font-mono text-muted-foreground">
              Playing Episode {ep}
            </span>
            <button
              onClick={() => changeEpisode(currentEpisode + 1)}
              disabled={currentEpisode >= totalEpisodes}
              className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg transition-all hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              Next
              <svg
                xmlns="http://w3.org"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Episode Selection Sidebar */}
        <div className="lg:col-span-1 bg-card border border-card-border rounded-xl p-4 shadow-sm flex flex-col gap-3 max-h-150">
          <h3 className="font-bold text-sm tracking-tight border-b border-border pb-2 mb-1">
            Episodes List
          </h3>
          <div className="overflow-y-auto grid grid-cols-4 lg:grid-cols-2 gap-2 pr-1 custom-scrollbar">
            {Array.from({ length: totalEpisodes }, (_, i) => {
              const epNum = i + 1;
              const isCurrent = epNum === currentEpisode;
              return (
                <button
                  key={epNum}
                  onClick={() => changeEpisode(epNum)}
                  className={`font-mono text-sm py-2 px-3 rounded-lg border text-center transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                      : "bg-background hover:bg-muted border-border text-foreground"
                  }`}
                >
                  {epNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeStream;
