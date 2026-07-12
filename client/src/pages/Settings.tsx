import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor, Settings as SettingsIcon, History, Download, Trash2, Info } from 'lucide-react';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { useDownloads } from '@/hooks/use-downloads';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { history, clear: clearHistory } = useWatchHistory();
  const { downloads, clear: clearDownloads } = useDownloads();

  useEffect(() => setMounted(true), []);

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="flex flex-col gap-8 pb-20 max-w-2xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-tight flex items-center gap-3">
          <SettingsIcon size={32} className="text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">Manage appearance and your locally saved data.</p>
      </div>

      {/* Appearance */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Appearance</h2>
        <p className="text-sm text-muted-foreground -mt-2">Choose how Anime Hub looks on this device.</p>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((opt) => {
            const active = mounted && theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                <opt.icon size={20} />
                {opt.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Data */}
      <section className="bg-card border rounded-2xl p-6 space-y-5">
        <h2 className="font-bold text-lg">Your Data</h2>
        <p className="text-sm text-muted-foreground -mt-3">
          Watch history and downloads are stored only in this browser — nothing is sent to a server.
        </p>

        <div className="flex items-center justify-between gap-4 py-3 border-t border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <History size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Watch History</p>
              <p className="text-xs text-muted-foreground">{history.length} title{history.length === 1 ? '' : 's'} saved</p>
            </div>
          </div>
          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-colors"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 py-3 border-t border-border/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <Download size={18} />
            </div>
            <div>
              <p className="font-medium text-sm">Downloads</p>
              <p className="text-xs text-muted-foreground">{downloads.length} title{downloads.length === 1 ? '' : 's'} saved</p>
            </div>
          </div>
          <button
            onClick={clearDownloads}
            disabled={downloads.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-muted hover:bg-destructive hover:text-destructive-foreground disabled:opacity-40 disabled:hover:bg-muted disabled:hover:text-muted-foreground transition-colors"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </section>

      {/* About */}
      <section className="bg-card border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Info size={18} className="text-primary" /> About
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Anime Hub is a passion-project database for browsing anime, seasons, and rankings, powered by the{' '}
          <a href="https://jikan.moe" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">
            Jikan API
          </a>{' '}
          (an unofficial MyAnimeList API). Not affiliated with MyAnimeList.
        </p>
      </section>
    </div>
  );
}
