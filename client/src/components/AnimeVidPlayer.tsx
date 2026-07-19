import { AnimeSummary } from '@/lib/local-store';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  items: AnimeSummary[];
  initialIndex?: number;
  className?: string;
};

export default function AnimeVidPlayer({ items, initialIndex = 0, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [index, setIndex] = useState<number>(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState<number>(1);

  const current = items[index];
  const src = current?.episode?.path ?? undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setTimeout(() => setIndex((i) => (i < items.length - 1 ? i + 1 : i)), 50);
    };

    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
    };
  }, [items.length]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (src) {
      v.src = src;
      v.load();
      v.play().catch(() => {});
    } else {
      v.removeAttribute('src');
      v.load();
      setIsPlaying(false);
    }
    setCurrentTime(0);
    setDuration(0);
  }, [index, src]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) v.pause();
    else v.play().catch(() => {});
  }, [isPlaying]);

  const seek = (t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, duration || 0));
    setCurrentTime(v.currentTime);
  };

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  const fmt = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-black rounded-md overflow-hidden">
        <video ref={videoRef} className="w-full h-64 md:h-96 bg-black" controls={false} />
      </div>

      <div className="flex items-center gap-3">
        <button onClick={prev} className="px-3 py-2 rounded bg-muted/30">Prev</button>
        <button onClick={togglePlay} className="px-4 py-2 rounded bg-primary text-primary-foreground">{isPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={next} className="px-3 py-2 rounded bg-muted/30">Next</button>

        <div className="flex-1 mx-2">
          <input
            aria-label="seek"
            type="range"
            className="w-full"
            min={0}
            max={duration || 0}
            value={currentTime}
            step={0.1}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Vol</label>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        </div>

        <div className="ml-4">
          <label className="text-sm text-muted-foreground mr-2">Speed</label>
          <select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))} className="bg-muted/10 rounded px-2 py-1 text-sm">
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <h3 className="font-semibold">{current?.title ?? 'No media'}</h3>
          <p className="text-sm text-muted-foreground">Episode {current?.episode.ep} • Season {current?.episode.season}</p>
        </div>

        <div className="md:col-span-1">
          <div className="space-y-2">
            {items.map((it, i) => (
              <button
                key={`${it.mal_id}-${it.episode.ep}-${it.episode.season}`}
                onClick={() => setIndex(i)}
                className={`w-full text-left px-3 py-2 rounded ${i === index ? 'bg-primary/10 border border-primary' : 'bg-card/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{it.title} — Ep {it.episode.ep}</span>
                  <span className="text-xs text-muted-foreground">{it.episode.quality}P</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
