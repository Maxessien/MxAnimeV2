import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';

import { PlaylistItem, RepeatMode, AspectRatio, ZoomLevel, PlayerPreferences } from './types';
import { parseTimeStr } from './helpers';
import { VLCCone } from './VLCCone';
import { TopMenuBar } from './MenuBar';
import { SeekBar } from './SeekBar';
import { ControlBar } from './ControlBar';
import { PlaylistPanel } from './PlaylistPanel';
import { StatusBar } from './StatusBar';
import { ContextMenu } from './ContextMenu';
import { JumpToTimeDialog, MediaInfoDialog, PreferencesDialog } from './Dialogs';

const DEFAULT_PREFS: PlayerPreferences = {
  showStatusBar: true,
  showPlaylistOnStart: true,
  defaultVolume: 1,
  continuePlayback: 'ask',
  defaultAspectRatio: 'default',
  defaultSpeed: 1,
};

function loadPrefs(): PlayerPreferences {
  try {
    const s = localStorage.getItem('vlc-preferences');
    if (s) return { ...DEFAULT_PREFS, ...JSON.parse(s) };
  } catch {}
  return DEFAULT_PREFS;
}

export function VidPlayer({initPlaylist = []}: {initPlaylist: PlaylistItem[] }) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Player state ──────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('default');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(0);
  const [deinterlace, setDeinterlace] = useState(false);
  const [abRepeat, setAbRepeat] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });

  // ── Playlist state ────────────────────────────────────────────────────────
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>(initPlaylist);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffle, setIsShuffle] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showExtendedControls, setShowExtendedControls] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [overlayText, setOverlayText] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showControls, setShowControls] = useState(true);

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [dlgJumpTime, setDlgJumpTime] = useState(false);
  const [dlgMediaInfo, setDlgMediaInfo] = useState(false);
  const [dlgPreferences, setDlgPreferences] = useState(false);

  // ── Preferences ───────────────────────────────────────────────────────────
  const [preferences, setPreferences] = useState<PlayerPreferences>(loadPrefs);
  useEffect(() => { localStorage.setItem('vlc-preferences', JSON.stringify(preferences)); }, [preferences]);

  const currentItem = useMemo(() => playlistItems[currentIndex] ?? null, [playlistItems, currentIndex]);

  // ── Overlay helper ────────────────────────────────────────────────────────
  const showOverlay = useCallback((text: string) => {
    setOverlayText(text);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => setOverlayText(null), 1500);
  }, []);

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, [isPlaying]);

  useEffect(() => { resetHideTimer(); }, [isPlaying]);

  // ── Wire video element events ─────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatMode === 'one') { v.currentTime = 0; v.play(); return; }
      setCurrentIndex(prev => {
        if (repeatMode === 'all') return (prev + 1) % (playlistItems.length || 1);
        return prev < playlistItems.length - 1 ? prev + 1 : prev;
      });
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
  }, [repeatMode, playlistItems.length]);

  // ── A/B repeat enforcement ────────────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v || abRepeat.a === null || abRepeat.b === null) return;
    const check = () => { if (v.currentTime >= abRepeat.b!) v.currentTime = abRepeat.a!; };
    v.addEventListener('timeupdate', check);
    return () => v.removeEventListener('timeupdate', check);
  }, [abRepeat]);

  // ── Fullscreen change listener ────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Load playlist item into video element ─────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!currentItem) {
      v.removeAttribute('src'); v.load();
      setIsPlaying(false); setCurrentTime(0); setDuration(0);
      return;
    }
    let objectUrl: string | null = null;
    if (currentItem.file) { objectUrl = URL.createObjectURL(currentItem.file); v.src = objectUrl; }
    else if (currentItem.url) { v.src = currentItem.url; }
    v.play().catch(() => {});
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync loaded duration back to playlist item ────────────────────────────
  useEffect(() => {
    if (duration > 0 && currentIndex >= 0) {
      setPlaylistItems(items => items.map((it, i) => i === currentIndex ? { ...it, duration } : it));
    }
  }, [duration, currentIndex]);

  // ── Playback controls ─────────────────────────────────────────────────────
  const play = useCallback(async () => { try { await videoRef.current?.play(); } catch {} }, []);
  const pause = useCallback(() => { videoRef.current?.pause(); }, []);
  const togglePlay = useCallback(() => { isPlaying ? pause() : play(); }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause(); v.currentTime = 0;
    setIsPlaying(false); setCurrentTime(0);
  }, []);

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.max(0, Math.min(t, duration));
    v.currentTime = clamped; setCurrentTime(clamped);
  }, [duration]);

  const seekBy = useCallback((s: number) => { if (videoRef.current) seek(videoRef.current.currentTime + s); }, [seek]);
  const frameStep = useCallback(() => { pause(); seek((videoRef.current?.currentTime ?? 0) + 1 / 30); }, [pause, seek]);

  const changeVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(v, 2));
    setVolume(clamped);
    if (videoRef.current) videoRef.current.volume = Math.min(1, clamped);
    if (clamped > 0 && isMuted) { setIsMuted(false); if (videoRef.current) videoRef.current.muted = false; }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  }, [isMuted]);

  const changeSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    showOverlay(`Speed: ${rate}x`);
  }, [showOverlay]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try { await (containerRef.current ?? document.documentElement).requestFullscreen(); } catch {}
    } else { await document.exitFullscreen(); }
  }, []);

  const takeSnapshot = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    canvas.getContext('2d')?.drawImage(v, 0, 0);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `vlcsnap-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none');
  }, []);

  const toggleABRepeat = useCallback(() => {
    setAbRepeat(prev => {
      if (prev.a === null) return { a: currentTime, b: null };
      if (prev.b === null && currentTime > prev.a) return { ...prev, b: currentTime };
      return { a: null, b: null };
    });
  }, [currentTime]);

  const playNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (playlistItems.length === 0) return prev;
      if (repeatMode === 'all') return (prev + 1) % playlistItems.length;
      return prev < playlistItems.length - 1 ? prev + 1 : prev;
    });
  }, [playlistItems.length, repeatMode]);

  const playPrev = useCallback(() => { setCurrentIndex(prev => Math.max(0, prev - 1)); }, []);

  const removePlaylistItem = useCallback((idx: number) => {
    setPlaylistItems(items => items.filter((_, i) => i !== idx));
    setCurrentIndex(prev => {
      if (idx === prev) return -1;
      if (idx < prev) return prev - 1;
      return prev;
    });
  }, []);

  const movePlaylistItem = useCallback((from: number, to: number) => {
    setPlaylistItems(items => {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setCurrentIndex(prev => {
      if (prev === from) return to;
      if (prev > from && prev <= to) return prev - 1;
      if (prev < from && prev >= to) return prev + 1;
      return prev;
    });
  }, []);

  const handleJumpToTime = useCallback((str: string) => {
    const t = parseTimeStr(str);
    if (t !== null) seek(t);
  }, [seek]);

  // ── Right-click context menu ──────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // ── Video CSS style (aspect ratio + zoom) ─────────────────────────────────
  const videoStyle = useMemo<React.CSSProperties>(() => {
    const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain' };
    if (aspectRatio !== 'default') {
      const [w, h] = aspectRatio.split(':').map(Number);
      style.aspectRatio = `${w}/${h}`;
      style.objectFit = 'fill';
      style.width = 'auto';
      style.maxWidth = '100%';
    }
    if (zoomLevel !== 0) {
      style.transform = `scale(${zoomLevel})`;
      style.transformOrigin = 'center center';
    }
    return style;
  }, [aspectRatio, zoomLevel]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key.toLowerCase()) {
        case ' ':          e.preventDefault(); togglePlay(); break;
        case 's':          stop(); break;
        case 'f':          toggleFullscreen(); break;
        case 'm':          toggleMute(); showOverlay(isMuted ? 'Unmuted' : 'Muted'); break;
        case 'e':          frameStep(); break;
        case 'p':          playPrev(); break;
        case 'n':          playNext(); break;
        case 'l':          toggleRepeat(); break;
        case 'r':          setIsShuffle(s => !s); break;
        case '[':          changeSpeed(Math.max(0.25, playbackRate - 0.25)); break;
        case ']':          changeSpeed(Math.min(4, playbackRate + 0.25)); break;
        case 'arrowleft':
          if (e.altKey)              { e.preventDefault(); seekBy(-10); showOverlay('-10s'); }
          else if (e.ctrlKey || e.metaKey) { e.preventDefault(); seekBy(-60); showOverlay('-60s'); }
          break;
        case 'arrowright':
          if (e.altKey)              { e.preventDefault(); seekBy(10);  showOverlay('+10s'); }
          else if (e.ctrlKey || e.metaKey) { e.preventDefault(); seekBy(60);  showOverlay('+60s'); }
          break;
        case 'arrowup':
          e.preventDefault(); changeVolume(volume + 0.05);
          showOverlay(`Vol: ${Math.round(Math.min(volume + 0.05, 2) * 100)}%`);
          break;
        case 'arrowdown':
          e.preventDefault(); changeVolume(volume - 0.05);
          showOverlay(`Vol: ${Math.round(Math.max(volume - 0.05, 0) * 100)}%`);
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePlay, stop, toggleFullscreen, toggleMute, isMuted, frameStep, playPrev, playNext, toggleRepeat, changeSpeed, playbackRate, seekBy, changeVolume, volume, showOverlay]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen bg-[#1C1C1C] text-[#E0E0E0] overflow-hidden select-none"
      onMouseMove={resetHideTimer}
    >

      {/* Menu bar */}
      <TopMenuBar
        onTogglePlaylist={() => setShowPlaylist(s => !s)}
        onToggleStatusBar={() => setShowStatusBar(s => !s)}
        onToggleFullscreen={toggleFullscreen}
        onShowPreferences={() => setDlgPreferences(true)}
        onShowMediaInfo={() => setDlgMediaInfo(true)}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onStop={stop}
        onPrevious={playPrev}
        onNext={playNext}
        onSpeedChange={changeSpeed}
        onJumpToTime={() => setDlgJumpTime(true)}
        onToggleLoop={toggleRepeat}
        onToggleShuffle={() => setIsShuffle(s => !s)}
        volume={volume}
        isMuted={isMuted}
        onChangeVolume={changeVolume}
        onToggleMute={toggleMute}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={setAspectRatio}
        zoomLevel={zoomLevel}
        onChangeZoom={setZoomLevel}
        onTakeSnapshot={takeSnapshot}
        deinterlace={deinterlace}
        onToggleDeinterlace={() => setDeinterlace(d => !d)}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
      />

      {/* Main area: video + playlist */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video panel */}
        <div
          className={`flex-1 bg-black relative flex items-center justify-center overflow-hidden`}
          onContextMenu={handleContextMenu}
          onDoubleClick={toggleFullscreen}
          onClick={() => { if (contextMenu) { setContextMenu(null); return; } togglePlay(); }}
        >
          {currentItem
            ? <video ref={videoRef} style={videoStyle} playsInline className="block" />
            : (
              <div className="flex flex-col items-center gap-3 opacity-50 pointer-events-none">
                <VLCCone />
                <div className="text-[#E0E0E0] text-lg font-semibold tracking-wide">VLC web player</div>
                <div className="text-[#909090] text-sm">Open media to start playback</div>
              </div>
            )
          }

          {/* Paused overlay icon */}
          {!isPlaying && currentItem && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}

          {/* OSD overlay text (volume/speed feedback) */}
          {overlayText && (
            <div className="absolute top-3 right-3 text-white text-sm font-bold bg-black/60 px-3 py-1 rounded pointer-events-none">
              {overlayText}
            </div>
          )}
        </div>

        {/* Playlist panel */}
        {showPlaylist && (
          <PlaylistPanel
            items={playlistItems}
            currentIndex={currentIndex}
            onPlay={setCurrentIndex}
            onRemove={removePlaylistItem}
            onMove={movePlaylistItem}
            onClose={() => setShowPlaylist(false)}
          />
        )}
      </div>

      {/* Seek bar */}
      <SeekBar currentTime={currentTime} duration={duration} onSeek={seek} />

      {/* Control bar */}
      <ControlBar
        isPlaying={isPlaying}       onPlayPause={togglePlay}
        onStop={stop}               onPrevious={playPrev}         onNext={playNext}
        volume={volume}             isMuted={isMuted}
        onChangeVolume={changeVolume} onToggleMute={toggleMute}
        currentTime={currentTime}   duration={duration}
        onTogglePlaylist={() => setShowPlaylist(s => !s)}
        showExtendedControls={showExtendedControls}
        onToggleExtendedControls={() => setShowExtendedControls(s => !s)}
        onFrameStep={frameStep}
        onToggleRecord={() => setIsRecording(r => !r)} isRecording={isRecording}
        repeatMode={repeatMode}     onToggleRepeat={toggleRepeat}
        isShuffle={isShuffle}       onToggleShuffle={() => setIsShuffle(s => !s)}
        onToggleFullscreen={toggleFullscreen}
        abRepeat={abRepeat}         onToggleABRepeat={toggleABRepeat}
        playbackRate={playbackRate} onSpeedChange={changeSpeed}
      />

      {/* Status bar */}
      {showStatusBar && (
        <StatusBar
          statusText={currentItem?.title ?? 'VLC media player'}
          zoomLevel={zoomLevel}
          speed={playbackRate}
        />
      )}

      {/* Right-click context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}       y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          isPlaying={isPlaying}   onPlayPause={togglePlay}
          onStop={stop}
          onToggleFullscreen={toggleFullscreen}
          onShowMediaInfo={() => setDlgMediaInfo(true)}
        />
      )}

      {/* Dialogs */}
      <JumpToTimeDialog open={dlgJumpTime}   onOpenChange={setDlgJumpTime}   onSubmit={handleJumpToTime} />
      <MediaInfoDialog  open={dlgMediaInfo}  onOpenChange={setDlgMediaInfo}  title={currentItem?.title ?? ''} duration={duration} videoRef={videoRef} />
      <PreferencesDialog open={dlgPreferences} onOpenChange={setDlgPreferences} preferences={preferences} onSave={setPreferences} />
    </div>
  );
}
