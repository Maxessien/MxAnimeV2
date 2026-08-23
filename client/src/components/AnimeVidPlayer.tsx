import { AnimeSummary } from '@/lib/local-store';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import BackBtn from './layout/BackBtn';

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
    <div className={`mx-auto max-w-7xl px-4 py-2 ${className}`}>
      <BackBtn />

      {/* Grid: 1 Column on Mobile, 3 Columns on LG screens (2 columns for content, 1 column for Playlist sidebar) */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column: Player and Info */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Responsive Video Canvas with modern 16:9 Aspect Ratio aspect-video fallback */}
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
            <video 
              src={convertFileSrc(src || "")} 
              ref={videoRef} 
              className="absolute top-0 left-0 w-full h-full object-contain bg-black" 
              controls={false} 
            />
          </div>

          {/* Controls Container */}
          <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur-xs space-y-4">
            
            {/* Timeline Slider Section */}
            <div className="w-full">
              <input
                aria-label="seek"
                type="range"
                className="w-full h-1.5 cursor-pointer rounded-lg bg-muted accent-primary"
                min={0}
                max={duration || 0}
                value={currentTime}
                step={0.1}
                onChange={(e) => seek(Number(e.target.value))}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1.5 font-mono">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Core Buttons & System Adjusters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              
              {/* Media Toggles */}
              <div className="flex items-center gap-2">
                <button onClick={prev} className="px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors">Prev</button>
                <button onClick={togglePlay} className="px-5 py-1.5 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors min-w-19">{isPlaying ? 'Pause' : 'Play'}</button>
                <button onClick={next} className="px-3 py-1.5 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors">Next</button>
              </div>

              {/* Utility Panel: Volume + Speed adjustments */}
              <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                {/* Volume slider auto-hides labels on super small screens */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground hidden sm:block">Vol</label>
                  <input 
                    type="range" 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    value={volume} 
                    onChange={(e) => setVolume(Number(e.target.value))} 
                    className="w-20 sm:w-24 h-1 cursor-pointer accent-primary"
                  />
                </div>

                {/* Speed selector drop menu */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Speed</label>
                  <select 
                    value={String(speed)} 
                    onChange={(e) => setSpeed(Number(e.target.value))} 
                    className="bg-muted hover:bg-muted/80 rounded-md px-2 py-1 text-xs font-medium outline-hidden transition-colors border border-border"
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Current Video Details block */}
          <div className="pb-2 border-b border-border/60">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">{current?.title ?? 'No media'}</h1>
            <p className="text-sm text-muted-foreground mt-1">Episode {current?.episode.ep} • Season {current?.episode.season}</p>
          </div>

        </div>

        {/* Right Column: Dynamic Sidebar Queue Playlist */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-semibold text-sm tracking-wider uppercase text-muted-foreground px-1">Up Next ({items.length})</h3>
            
            {/* Scrollable Container if playlist contains many elements on large viewport heights */}
            <div className="space-y-2 max-h-100 lg:max-h-150 overflow-y-auto pr-1 custom-scrollbar">
              {items.map((it, i) => (
                <button
                  key={`${it.mal_id}-${it.episode.ep}-${it.episode.season}`}
                  onClick={() => setIndex(i)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 group flex items-center justify-between gap-3 ${
                    i === index 
                      ? 'bg-primary/10 border-primary text-primary font-medium' 
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  }`}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-sm">{it.title}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/70">Ep {it.episode.ep} • Season {it.episode.season}</span>
                  </div>
                  <span className="text-2xs font-mono font-bold tracking-wider px-1.5 py-0.5 bg-muted rounded text-muted-foreground/80 self-center shrink-0">
                    {it.episode.quality}P
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
