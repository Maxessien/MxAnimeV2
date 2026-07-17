import DlHistory from "@/components/downloads/DlHistory";
import OngoingDlCard from "@/components/downloads/OngoingDlCard";
import { useJson } from "@/hooks/use-json";
import { AnimeSummary } from "@/lib/local-store";
import { ongoingDownloadQueue } from "@/lib/queue";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Download as DownloadIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Downloads() {
  const { json, remove, clear } = useJson<AnimeSummary>({
    type: "downloads",
    removeOptions: {
      onSuccess: () => toast.success("Download Removed"),
      onError: () => toast.error("couldn't delete download"),
    },
  });

  const [tab, setTab] = useState<"downloads" | "ongoing">("ongoing");

  const [_, triggerRender] = useState(0);

  useEffect(() => {
    const increment = () => triggerRender((prev) => prev + 1);
    ongoingDownloadQueue.addEventListener("modify", () => increment);
    ongoingDownloadQueue.addEventListener("status_update", () => increment);
    ongoingDownloadQueue.addEventListener("prog_update", () => increment);

    let unlisten: UnlistenFn | undefined;

    listen<{
      current: number;
      total: number;
      task_id: string;
    }>("dl_progress", ({ payload }) =>
      ongoingDownloadQueue.updateProg(payload.task_id, {
        curr: payload.current / (1024 * 1024),
        total: payload.total / (1024 * 1024),
      }),
    ).then((fn) => (unlisten = fn));

    return () => {
      ongoingDownloadQueue.removeEventListener("modify", increment);
      ongoingDownloadQueue.removeEventListener(
        "status_update",
        () => increment,
      );
      ongoingDownloadQueue.removeEventListener("prog_update", () => increment);
      if (unlisten) unlisten();
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
          <p className="text-muted-foreground mt-2">
            Titles you've saved on this device for quick offline reference.
          </p>
        </div>
        {tab === "downloads" && json.downloads.length > 0 && (
          <button
            onClick={() => clear.mutateAsync()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 size={16} /> Clear All
          </button>
        )}
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1 sm:gap-2">
          <button
            onClick={() => setTab("downloads")}
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
            onClick={() => setTab("ongoing")}
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
        </div>
      </div>

      <div>
        {tab === "downloads" ? (
          <DlHistory json={json} remove={remove} />
        ) : ongoingDownloadQueue.traverse().length > 0 ? (
          <div className="space-y-3">
            {ongoingDownloadQueue.traverse().map((val, idx) => (
              <OngoingDlCard key={idx} {...val} />
            ))}
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
        )}
      </div>
    </div>
  );
}
