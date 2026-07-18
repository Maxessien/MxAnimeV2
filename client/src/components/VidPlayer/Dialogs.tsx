import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as RadixTabs from '@radix-ui/react-tabs';
import { PlayerPreferences, AspectRatio } from './types';
import { formatTime } from './helpers';

// ── Shell ────────────────────────────────────────────────────────────────────

function DlgShell({ open, onOpenChange, title, width = 420, children }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
        <Dialog.Content
          style={{ width }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#242424] border border-[#404040] shadow-2xl z-[201]"
        >
          <div className="bg-[#2E2E2E] px-3 py-1.5 border-b border-[#404040] flex items-center justify-between">
            <Dialog.Title className="text-xs font-semibold text-[#E0E0E0] m-0">{title}</Dialog.Title>
            <Dialog.Close className="text-[#909090] hover:text-[#E0E0E0] text-base leading-none">&times;</Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Open URL ─────────────────────────────────────────────────────────────────

export function OpenURLDialog({ open, onOpenChange, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (url: string) => void;
}) {
  const [url, setUrl] = useState('');
  return (
    <DlgShell open={open} onOpenChange={onOpenChange} title="Open Media">
      <form
        className="p-4"
        onSubmit={e => { e.preventDefault(); if (url.trim()) { onSubmit(url.trim()); onOpenChange(false); setUrl(''); } }}
      >
        <p className="text-xs text-[#E0E0E0] mb-2">Please enter a network URL:</p>
        <input
          autoFocus type="text" value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="http://example.com/video.mp4"
          className="w-full bg-[#181818] border border-[#404040] p-1.5 text-xs text-[#E0E0E0] focus:border-[#FF8800] outline-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Cancel</button>
          <button type="submit" className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Play</button>
        </div>
      </form>
    </DlgShell>
  );
}

// ── Jump to Time ──────────────────────────────────────────────────────────────

export function JumpToTimeDialog({ open, onOpenChange, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (t: string) => void;
}) {
  const [time, setTime] = useState('');
  return (
    <DlgShell open={open} onOpenChange={onOpenChange} title="Jump to Time" width={340}>
      <form
        className="p-4"
        onSubmit={e => { e.preventDefault(); if (time.trim()) { onSubmit(time.trim()); onOpenChange(false); setTime(''); } }}
      >
        <p className="text-xs text-[#E0E0E0] mb-2">Enter time (HH:MM:SS or seconds):</p>
        <input
          autoFocus type="text" value={time}
          onChange={e => setTime(e.target.value)}
          placeholder="00:01:30"
          className="w-full bg-[#181818] border border-[#404040] p-1.5 text-xs text-[#E0E0E0] focus:border-[#FF8800] outline-none mb-4"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Cancel</button>
          <button type="submit" className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Go</button>
        </div>
      </form>
    </DlgShell>
  );
}

// ── Media Info ────────────────────────────────────────────────────────────────

export function MediaInfoDialog({ open, onOpenChange, title, duration, videoRef }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  duration: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const vid = videoRef.current;
  const rows = [
    ['Title', title || 'N/A'],
    ['Duration', duration > 0 ? formatTime(duration) : 'N/A'],
    ['Resolution', vid && vid.videoWidth ? `${vid.videoWidth} × ${vid.videoHeight}` : 'N/A'],
    ['Text Tracks', vid ? String(vid.textTracks?.length ?? 0) : 'N/A'],
  ];
  return (
    <DlgShell open={open} onOpenChange={onOpenChange} title="Media Information" width={480}>
      <div className="p-4 space-y-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_1fr] gap-2">
            <span className="text-[#909090]">{k}</span>
            <span className="text-[#E0E0E0] truncate">{v}</span>
          </div>
        ))}
        <div className="flex justify-end mt-4">
          <button onClick={() => onOpenChange(false)} className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Close</button>
        </div>
      </div>
    </DlgShell>
  );
}

// ── Preferences ───────────────────────────────────────────────────────────────

export function PreferencesDialog({ open, onOpenChange, preferences, onSave }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preferences: PlayerPreferences;
  onSave: (p: PlayerPreferences) => void;
}) {
  const [prefs, setPrefs] = useState(preferences);
  useEffect(() => { if (open) setPrefs(preferences); }, [open]);

  return (
    <DlgShell open={open} onOpenChange={onOpenChange} title="Preferences" width={500}>
      <RadixTabs.Root defaultValue="interface">
        <RadixTabs.List className="flex border-b border-[#404040] bg-[#2E2E2E]">
          {['interface', 'playback', 'video'].map(tab => (
            <RadixTabs.Trigger
              key={tab} value={tab}
              className="px-4 py-1.5 text-xs capitalize text-[#909090] data-[state=active]:text-[#E0E0E0] data-[state=active]:border-b-2 data-[state=active]:border-[#FF8800] outline-none"
            >
              {tab}
            </RadixTabs.Trigger>
          ))}
        </RadixTabs.List>

        <div className="p-4 text-xs text-[#E0E0E0] min-h-[180px]">
          <RadixTabs.Content value="interface" className="space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefs.showStatusBar} onChange={e => setPrefs({ ...prefs, showStatusBar: e.target.checked })} className="accent-[#FF8800]" />
              Show Status Bar
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={prefs.showPlaylistOnStart} onChange={e => setPrefs({ ...prefs, showPlaylistOnStart: e.target.checked })} className="accent-[#FF8800]" />
              Show Playlist on Start
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[#909090] w-28">Default Volume</span>
              <input type="range" min="0" max="2" step="0.05" value={prefs.defaultVolume} onChange={e => setPrefs({ ...prefs, defaultVolume: parseFloat(e.target.value) })} className="w-32 accent-[#FF8800]" />
              <span className="w-8">{Math.round(prefs.defaultVolume * 100)}%</span>
            </div>
          </RadixTabs.Content>

          <RadixTabs.Content value="playback" className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[#909090] w-28">Continue Playback</span>
              <select value={prefs.continuePlayback} onChange={e => setPrefs({ ...prefs, continuePlayback: e.target.value as PlayerPreferences['continuePlayback'] })} className="bg-[#181818] border border-[#404040] p-1 text-xs text-[#E0E0E0]">
                {['ask', 'always', 'never'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#909090] w-28">Default Speed</span>
              <select value={prefs.defaultSpeed} onChange={e => setPrefs({ ...prefs, defaultSpeed: parseFloat(e.target.value) })} className="bg-[#181818] border border-[#404040] p-1 text-xs text-[#E0E0E0]">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => <option key={s} value={s}>{s === 1 ? 'Normal' : `${s}x`}</option>)}
              </select>
            </div>
          </RadixTabs.Content>

          <RadixTabs.Content value="video" className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[#909090] w-28">Default Aspect Ratio</span>
              <select value={prefs.defaultAspectRatio} onChange={e => setPrefs({ ...prefs, defaultAspectRatio: e.target.value as AspectRatio })} className="bg-[#181818] border border-[#404040] p-1 text-xs text-[#E0E0E0]">
                {['default', '16:9', '4:3', '1:1', '16:10'].map(v => <option key={v} value={v}>{v === 'default' ? 'Default' : v}</option>)}
              </select>
            </div>
          </RadixTabs.Content>
        </div>

        <div className="px-4 py-2 border-t border-[#404040] flex justify-end gap-2">
          <button onClick={() => onOpenChange(false)} className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Cancel</button>
          <button onClick={() => { onSave(prefs); onOpenChange(false); }} className="px-4 py-1 text-xs bg-[#2E2E2E] border border-[#404040] hover:bg-[#383838] text-[#E0E0E0]">Save</button>
        </div>
      </RadixTabs.Root>
    </DlgShell>
  );
}
