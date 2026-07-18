import * as Menubar from '@radix-ui/react-menubar';
import { ChevronRight } from 'lucide-react';
import { AspectRatio, ZoomLevel, RepeatMode } from './types';

export interface MenuBarProps {
  onTogglePlaylist: () => void;
  onToggleStatusBar: () => void;
  onToggleFullscreen: () => void;
  onShowPreferences: () => void;
  onShowMediaInfo: () => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeedChange: (s: number) => void;
  onJumpToTime: () => void;
  onToggleLoop: () => void;
  onToggleShuffle: () => void;
  volume: number;
  isMuted: boolean;
  onChangeVolume: (v: number) => void;
  onToggleMute: () => void;
  aspectRatio: AspectRatio;
  onChangeAspectRatio: (r: AspectRatio) => void;
  zoomLevel: ZoomLevel;
  onChangeZoom: (z: ZoomLevel) => void;
  onTakeSnapshot: () => void;
  deinterlace: boolean;
  onToggleDeinterlace: () => void;
  repeatMode: RepeatMode;
  isShuffle: boolean;
}

const MItem = ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
  <Menubar.Item
    className="px-6 py-1 text-xs outline-none cursor-default select-none hover:bg-[#FF8800] hover:text-white data-highlighted:bg-[#FF8800] data-highlighted:text-white data-disabled:opacity-40"
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </Menubar.Item>
);

const MCheck = ({ children, checked, onCheckedChange }: { children: React.ReactNode; checked: boolean; onCheckedChange: (v: boolean) => void }) => (
  <Menubar.CheckboxItem
    className="px-6 py-1 text-xs outline-none cursor-default select-none hover:bg-[#FF8800] hover:text-white data-highlighted:bg-[#FF8800] data-highlighted:text-white relative"
    checked={checked}
    onCheckedChange={onCheckedChange}
  >
    <Menubar.ItemIndicator className="absolute left-2 text-xs">✓</Menubar.ItemIndicator>
    {children}
  </Menubar.CheckboxItem>
);

const MRadio = ({ children, value }: { children: React.ReactNode; value: string }) => (
  <Menubar.RadioItem
    value={value}
    className="px-6 py-1 text-xs outline-none cursor-default select-none hover:bg-[#FF8800] hover:text-white data-highlighted:bg-[#FF8800] data-highlighted:text-white relative"
  >
    <Menubar.ItemIndicator className="absolute left-2 text-xs">•</Menubar.ItemIndicator>
    {children}
  </Menubar.RadioItem>
);

const MSub = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Menubar.Sub>
    <Menubar.SubTrigger className="px-6 py-1 text-xs outline-none cursor-default select-none hover:bg-[#FF8800] hover:text-white data-highlighted:bg-[#FF8800] data-highlighted:text-white flex items-center justify-between gap-4">
      {label}<ChevronRight className="w-3 h-3" />
    </Menubar.SubTrigger>
    <Menubar.Portal>
      <Menubar.SubContent className="min-w-37.5 bg-[#242424] border border-[#404040] py-1 shadow-lg z-50 text-[#E0E0E0]">
        {children}
      </Menubar.SubContent>
    </Menubar.Portal>
  </Menubar.Sub>
);

const MSep = () => <Menubar.Separator className="h-px bg-[#404040] my-1 mx-2" />;

const SPEEDS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 1.67, 2, 2.5, 3, 4];
const ASPECT_RATIOS: AspectRatio[] = ['default', '16:9', '4:3', '1:1', '16:10', '2.21:1', '5:4'];
const ZOOM_LEVELS: ZoomLevel[] = [0, 0.25, 0.5, 1, 2];
const ZOOM_LABELS: Record<ZoomLevel, string> = { 0: 'Fit Window', 0.25: '1:4 Quarter', 0.5: '1:2 Half', 1: '1:1 Original', 2: '2:1 Double' };

export function TopMenuBar(props: MenuBarProps) {
  const triggerCls = "px-3 py-0.5 text-xs outline-none hover:bg-[#404040] data-[state=open]:bg-[#404040] cursor-default select-none";
  const contentCls = "min-w-[220px] bg-[#242424] border border-[#404040] py-1 shadow-lg z-50 text-[#E0E0E0]";

  return (
    <Menubar.Root className="flex bg-[#2E2E2E] border-b border-[#404040] h-6 items-center px-1 z-50 shrink-0">

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Playback</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem onClick={props.onPlayPause}>{props.isPlaying ? 'Pause' : 'Play'}</MItem>
            <MItem onClick={props.onStop}>Stop</MItem>
            <MSep />
            <MItem onClick={props.onPrevious}>Previous</MItem>
            <MItem onClick={props.onNext}>Next</MItem>
            <MSep />
            <MSub label="Speed">
              {SPEEDS.map(s => <MItem key={s} onClick={() => props.onSpeedChange(s)}>{s === 1 ? 'Normal (1x)' : `${s}x`}</MItem>)}
            </MSub>
            <MItem onClick={props.onJumpToTime}>Jump to Specific Time...</MItem>
            <MSep />
            <Menubar.RadioGroup value={props.repeatMode} onValueChange={() => props.onToggleLoop()}>
              <MRadio value="none">No Repeat</MRadio>
              <MRadio value="one">Repeat One</MRadio>
              <MRadio value="all">Repeat All</MRadio>
            </Menubar.RadioGroup>
            <MSep />
            <MCheck checked={props.isShuffle} onCheckedChange={() => props.onToggleShuffle()}>Random</MCheck>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Audio</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem disabled>Audio Track</MItem>
            <MSep />
            <MItem onClick={props.onToggleMute}>{props.isMuted ? 'Unmute' : 'Mute'}</MItem>
            <MItem onClick={() => props.onChangeVolume(Math.min(2, props.volume + 0.1))}>Increase Volume</MItem>
            <MItem onClick={() => props.onChangeVolume(Math.max(0, props.volume - 0.1))}>Decrease Volume</MItem>
            <MSep />
            <MItem disabled>Stereo Mode</MItem>
            <MItem disabled>Visualizations</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Video</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem disabled>Video Track</MItem>
            <MSep />
            <MItem onClick={props.onToggleFullscreen}>Fullscreen</MItem>
            <MSep />
            <MSub label="Zoom">
              {ZOOM_LEVELS.map(z => <MItem key={z} onClick={() => props.onChangeZoom(z)}>{ZOOM_LABELS[z]}</MItem>)}
            </MSub>
            <MSub label="Aspect Ratio">
              {ASPECT_RATIOS.map(r => <MItem key={r} onClick={() => props.onChangeAspectRatio(r)}>{r === 'default' ? 'Default' : r}</MItem>)}
            </MSub>
            <MSub label="Crop">
              {['Default', '16:10', '16:9', '4:3', '1:1'].map(c => <MItem key={c} disabled>{c}</MItem>)}
            </MSub>
            <MSep />
            <MCheck checked={props.deinterlace} onCheckedChange={() => props.onToggleDeinterlace()}>Deinterlace</MCheck>
            <MSep />
            <MItem onClick={props.onTakeSnapshot}>Take Snapshot</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Subtitle</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem disabled>Subtitle Track</MItem>
            <MSep />
            <MItem disabled>Add Subtitle File...</MItem>
            <MItem disabled>Sub Delay</MItem>
            <MItem disabled>Sub Speed</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Tools</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem disabled>Effects &amp; Filters</MItem>
            <MItem disabled>Codec Information</MItem>
            <MItem onClick={props.onShowMediaInfo}>Media Information</MItem>
            <MSep />
            <MItem onClick={props.onTogglePlaylist}>Playlist</MItem>
            <MSep />
            <MItem onClick={props.onShowPreferences}>Preferences</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>View</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem onClick={props.onTogglePlaylist}>Playlist</MItem>
            <MItem onClick={props.onToggleStatusBar}>Status Bar</MItem>
            <MSep />
            <MItem onClick={props.onToggleFullscreen}>Toggle Fullscreen</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Trigger className={triggerCls}>Help</Menubar.Trigger>
        <Menubar.Portal>
          <Menubar.Content className={contentCls}>
            <MItem disabled>Check for Updates</MItem>
            <MSep />
            <MItem disabled>About VLC Web Player</MItem>
          </Menubar.Content>
        </Menubar.Portal>
      </Menubar.Menu>
    </Menubar.Root>
  );
}
