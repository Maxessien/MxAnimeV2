import { AnimeSummary } from "@/lib/local-store";
import { UseMutationResult } from "@tanstack/react-query";
import { convertFileSrc } from "@tauri-apps/api/core";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const DlHistory = ({
  json,
}: {
  json: AnimeSummary[];
  remove: UseMutationResult<
    void,
    Error,
    (v: AnimeSummary[]) => AnimeSummary[],
    void
  >;
  }) => {
  const [errored, setErrored] = useState({imgPath: false})
  return (
    <>
      {!json?.length || json?.length === 0 ? (
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
          {json.map((entry, i) => (
            <div
              key={entry.mal_id}
              className="group relative flex flex-col gap-3 animate-in fade-in zoom-in-95"
              style={{ animationDelay: `${Math.min(i, 20) * 30}ms` }}
            >
              <Link
                href={`/downloads/${entry.mal_id}`}
                className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted shadow-sm block"
              >
                {entry.image || entry.imagePath ? (
                  <>
                    {entry.imagePath && !errored.imgPath && (
                      <img
                        className="h-full w-full object-cover"
                        src={convertFileSrc(entry.imagePath)}
                        alt={entry.title}
                        onError={() => setErrored({ imgPath: true })}
                        onLoad={()=> setErrored({imgPath: false})}
                      ></img>
                    )}
                    {entry.image && (!entry.imagePath || errored.imgPath) && (
                      <img
                        className="h-full w-full object-cover"
                        src={entry.image}
                        alt={entry.title}
                      ></img>
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
                    No Image
                  </div>
                )}
              </Link>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DlHistory;
