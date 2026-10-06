import { AnimeSummary } from "@/lib/local-store"
import { downloadQueue } from "@/lib/queue";
import { useState } from "react";
import { Button } from "../ui/button";

const WatingCard = ({ anime, queueId }: { anime: Pick<AnimeSummary, "image" | "title">, queueId: string }) => {
  const [_, triggerRender] = useState(0);
  const increment = () => triggerRender((prev) => prev + 1);

  const removeWaiting = () => {
    const idx = downloadQueue.traverse().findIndex(v => v.queueId === queueId)
    downloadQueue.removeAt(idx)
    increment()
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">

      <div className="relative flex items-center gap-4 p-4 sm:p-5">
        {/* Anime Image Wrapper */}
        <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-muted shadow-xs transition-transform duration-300 group-hover:scale-105">
          {anime.image ? (
            <img
              className="h-full w-full object-cover object-center"
              src={anime.image}
              alt={anime.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-accent text-muted-foreground text-[10px] font-bold tracking-wider">
              NO IMG
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold sm:text-base tracking-tight text-foreground transition-colors group-hover:text-primary">
            {anime.title}
          </p>

          {/* Waiting Status with pulsing indicator dot */}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span className="font-mono text-[11px] font-medium tracking-wider uppercase text-muted-foreground/90">
              Waiting
            </span>
          </div>
        </div>

        <Button onClick={removeWaiting} className="bg-secondary text-primary rounded-full hover:scale-[1.05] cursor-pointer transition-all">
          Cancel
        </Button>
      </div>

      <span
        className="absolute bottom-0 h-0.5 w-[30%] rounded-sm bg-primary"
        style={{
          animation: 'inline-slide 2s infinite linear',
        }}
      />

      <style>{`
        @keyframes inline-slide {
          0% { left: -30%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
}

export default WatingCard
