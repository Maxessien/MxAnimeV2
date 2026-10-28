import BackBtn from "@/components/layout/BackBtn";
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
import { WatchHistory } from "@/types/storage";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { openPath } from "@tauri-apps/plugin-opener";
import { platform } from "@tauri-apps/plugin-os";
import { Download, Trash } from "lucide-react";
import { useState } from "react";
import { FaPlay } from "react-icons/fa";
import { toast } from "react-toastify";
import { Link, useRoute, useLocation } from "wouter";

const DownloadDetails = () => {
  const [, params] = useRoute("/downloads/:id");
  const [_, navigate] = useLocation();
  const id = params?.id || "";
  const [optionsModal, setOptionsModal] = useState<{
    active: boolean;
    entry: AnimeSummary | null;
  }>({ active: false, entry: null });

  const { json: downloads, remove: removeDl } = useJson<AnimeSummary>({
    type: "downloads",
  });

  const { json: history, remove: removeHistory } = useJson<WatchHistory>({
    type: "history",
  });

  const [errored, setErrored] = useState({ imgPath: false });

  const eps = downloads
    .filter(({ mal_id }) => mal_id.toString() === id)
    .map((v) => {
      const modHistory = history.find(
        (h) => h.malId === v.mal_id.toString() && h.episode == v.episode.ep,
      );
      let watchPercentage = 0;
      if (modHistory) {
        const duration = modHistory.duration;
        const curr = modHistory.watchTimeSec;
        watchPercentage = duration > 0 ? (curr / duration) * 100 : 0;
      }
      const mod = { ...v, history: modHistory, watchPercentage };
      return mod;
    });
  const first = eps[0] ?? null;

  if (eps.length === 0)
    return (
      <div className="py-12">
        <BackBtn />
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

  const saveToDownloads = async ({ title, episode }: AnimeSummary) => {
    try {
      await invoke("save_to_downloads", {
        filePath: episode.path,
        saveAs: `${title.replace(/[<>:"/\\|?*]/g, "_")} - EP ${episode.ep}.mkv`,
      });
      setOptionsModal({ active: false, entry: null });
      toast.success("Saved to Downloads");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Unknown error");
    }
  };

  const deleteFile = async (
    path: string,
    malId?: string,
    ep?: string | number,
  ) => {
    try {
      const length = eps.length;
      await invoke("delete_file", { path });
      setOptionsModal({ active: false, entry: null });

      removeDl.mutateAsync((e) => e.filter((v) => v.episode.path !== path));
      if (malId && ep)
        removeHistory.mutateAsync((e) =>
          e.filter((v) => v.malId == malId && v.episode == ep),
        );

      if (length === 1) navigate("/downloads?tab=downloads");
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Unknown error");
    }
  };

  return (
    <div className="space-y-6">
      <BackBtn />
      {/* Banner from first entry */}
      {first && (
        <div className="relative w-full mb-8">
          <div className="h-56 md:h-96 w-full overflow-hidden bg-black">
            {first.imagePath && !errored.imgPath && (
              <img
                className="w-full h-full object-cover opacity-30 blur-sm scale-110"
                src={convertFileSrc(first.imagePath)}
                alt={first.title}
                onError={() => setErrored({ imgPath: true })}
                onLoad={() => setErrored({ imgPath: true })}
              ></img>
            )}
            {first.image && (!first.imagePath || errored.imgPath) && (
              <img
                className="w-full h-full object-cover opacity-30 blur-sm scale-110"
                src={first.image}
                alt={first.title}
              ></img>
            )}
            <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10 -mt-24 md:-mt-32 flex items-end gap-6">
            <div className="w-32 md:w-48 shrink-0 shadow-2xl rounded-2xl overflow-hidden border-4 border-background bg-background">
              {first.imagePath && !errored.imgPath && (
                <img
                  className="h-full w-full object-center object-cover"
                  src={convertFileSrc(first.imagePath)}
                  alt={first.title}
                  onError={() => setErrored({ imgPath: true })}
                  onLoad={() => setErrored({ imgPath: true })}
                ></img>
              )}
              {first.image && (!first.imagePath || errored.imgPath) && (
                <img
                  className="h-full w-full object-center object-cover"
                  src={first.image}
                  alt={first.title}
                ></img>
              )}
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
      <div className="space-y-4 max-w-160 mx-auto">
        {eps.map((entry) => (
          <Card
            key={`${entry.mal_id}-${entry.episode.ep}-${entry.episode.season}`}
          >
            <div className="flex p-4 relative items-center justify-between">
              <div>
                <div className="font-semibold">Episode {entry.episode.ep}</div>
                <div className="font-semibold flex flex-wrap items-center gap-2 justify-start text-muted-foreground">
                  <span>Season {entry.episode.season}</span> -{" "}
                  <span>{entry.watchPercentage.toFixed(0)}% Complete</span>
                </div>
              </div>

              {optionsModal.active &&
                optionsModal.entry?.episode.ep === entry.episode.ep && (
                  <Card className="p-2 sm:p-3 z-999 bg-secondary absolute bottom-full right-0">
                    <button
                      onClick={() => saveToDownloads(entry)}
                      className="w-full p-2 rounded-md transition-colors cursor-pointer hover:bg-primary active:bg-primary text-xs md:text-md flex justify-start items-center gap-2 font-medium"
                    >
                      <Download /> Save to Downloads
                    </button>
                    <button
                      onClick={() =>
                        deleteFile(
                          entry.episode.path,
                          entry.history?.malId,
                          entry.history?.episode,
                        )
                      }
                      className="w-full p-2 rounded-md transition-colors cursor-pointer hover:bg-primary active:bg-primary text-xs md:text-md flex justify-start items-center gap-2 font-medium"
                    >
                      <Trash /> Delete
                    </button>
                  </Card>
                )}

              <div className="flex gap-2 justify-end items-center">
                <button
                  onClick={() => {
                    if (platform() === "android") {
                      navigate(
                        `/stream/local?mal_id=${entry.mal_id}&ep=${entry.episode.ep}&title=${entry.title}&total=${eps.length}`,
                      );
                    } else {
                      openPath(entry.episode.path);
                    }
                  }}
                  className="rounded-full hover:bg-primary/90 transition-all p-2 text-sm sm:text-base md:p-4 border-2 border-(--border) bg-primary hover:cursor-pointer"
                >
                  <FaPlay />
                </button>
                <button
                  onClick={() =>
                    optionsModal.active &&
                    optionsModal.entry?.episode.ep === entry.episode.ep
                      ? setOptionsModal({ active: false, entry: null })
                      : setOptionsModal({ active: true, entry })
                  }
                  className="text-lg rounded-full px-2 aspect-square flex items-start cursor-pointer hover:bg-muted font-semibold"
                >
                  ...
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DownloadDetails;
