import { RecentEpisodeAnimeCard } from "@/components/AnimeCard";
import DlHistory from "@/components/downloads/DlHistory";
import OngoingDlCard from "@/components/downloads/OngoingDlCard";
import WatingCard from "@/components/downloads/WaitingCard";
import { useJson } from "@/hooks/use-json";
import { AnimeSaved, AnimeSummary } from "@/lib/local-store";
import { downloadQueue, ongoingDownloadQueue } from "@/lib/queue";
import { Download as DownloadIcon, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { MdSavedSearch } from "react-icons/md";
import { toast } from "react-toastify";
import { Link, useSearchParams } from "wouter";

type Tab = "downloads" | "ongoing" | "saved"

export default function Downloads() {
  const { json, remove } = useJson<AnimeSummary>({
    type: "downloads",
    removeOptions: {
      onSuccess: () => toast.success("Download Removed"),
      onError: () => toast.error("couldn't delete download"),
    },
  });

  const {json: saved} = useJson<AnimeSaved>({type: "saved"})

  const [searchParam, setSearchParam] = useSearchParams()

  const allowedTabs = ["downloads", "ongoing", "saved"]

  const sTab = searchParam.get("tab");
  const tab: Tab = sTab && allowedTabs.includes(sTab) ? sTab as Tab : "ongoing";

  const [_, triggerRender] = useState(0);

  useEffect(() => {
    const increment = () => triggerRender((prev) => prev + 1);

    if (!tab) setSearchParam({tab: "ongoing"})

    downloadQueue.addEventListener("modify", increment)
    ongoingDownloadQueue.addEventListener("modify", increment);
    ongoingDownloadQueue.addEventListener("status_update", increment);
    ongoingDownloadQueue.addEventListener("prog_update", increment);


    return () => {
      ongoingDownloadQueue.removeEventListener("modify", increment);
      ongoingDownloadQueue.removeEventListener("status_update", increment);
      ongoingDownloadQueue.removeEventListener("prog_update", increment);
      downloadQueue.removeEventListener("modify", increment)

    };
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight flex items-center gap-3">
            <DownloadIcon size={32} className="text-primary" />
            Downloads
          </h1>
        </div>
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => setSearchParam({tab: "downloads"})}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              tab === "downloads"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Downloaded
            {tab === "downloads" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setSearchParam({tab: "ongoing"})}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              tab === "ongoing"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ongoing Downloads
            {tab === "ongoing" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setSearchParam({tab: "saved"})}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              tab === "saved"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Saved Downloads
            {tab === "saved" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      <div>
        {tab === "downloads" && (
          <DlHistory json={json} remove={remove} />
        )}
        {tab === "ongoing" && (ongoingDownloadQueue.getElements.length > 0 || downloadQueue.traverse().length > 0 ? (
          <div className="space-y-3">
            {ongoingDownloadQueue.getElements.map((val, idx) => (
              <OngoingDlCard key={idx} {...val} />
            ))}
            {downloadQueue.traverse().map((val, i) => <WatingCard queueId={val.queueId} anime={{
              image: val.image, title: `${val.title} - Episode ${val.episode.ep}`
            }} key={i} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 gap-3 border-2 border-dashed rounded-2xl">
            <DownloadIcon
              size={32}
              className="text-muted-foreground opacity-40"
            />
            <h3 className="font-semibold">No active downloads</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Downloads will appear here as they're being processed.
            </p>
          </div>
        ))}
        {tab === "saved" && saved.length > 0 ? <div className="relative">
          {/*{loading && <Loader2 className="absolute right-0 top-0 z-10 animate-spin text-primary" />}*/}
          <div className={`grid grid-cols-2 gap-x-3 gap-y-8 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`}>
            {saved.map((item, index) => (
              <div key={item.media.idMal} className="animate-in fade-in zoom-in-95" style={{ animationDelay: `${Math.min(index, 10) * 40}ms`, animationFillMode: "both" }}>
                <RecentEpisodeAnimeCard anime={item} type="search" />
              </div>
            ))}
          </div>
        </div> : tab === "saved" && <div className="flex flex-col items-center justify-center text-center py-16 gap-3 border-2 border-dashed rounded-2xl">
          <MdSavedSearch
            size={32}
            className="text-muted-foreground opacity-40"
          />
          <h3 className="font-semibold">No saved anime</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            You haven't added any anime to your saved list.
          </p>
          <Link
            href="/"
            className="mt-2 text-primary font-medium hover:underline"
          >
            Browse anime
          </Link>
        </div>}
      </div>
    </div>
  );
}
