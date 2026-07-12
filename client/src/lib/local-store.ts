// Lightweight localStorage-backed persistence for per-browser features
// (watch history, downloads). Jikan is a read-only metadata API with no
// user accounts and no video assets, so these features track the user's
// local activity/intent rather than syncing real accounts or real files.

export type AnimeSummary = {
  mal_id: number;
  title: string;
  image: string | null;
  type?: string | null;
  episodes?: number | null;
  score?: number | null;
};

export type WatchHistoryEntry = AnimeSummary & { viewedAt: number };
export type DownloadEntry = AnimeSummary & { addedAt: number };

const HISTORY_KEY = 'anime-hub:watch-history';
const DOWNLOADS_KEY = 'anime-hub:downloads';
const HISTORY_LIMIT = 100;
const CHANGE_EVENT = 'anime-hub:local-store-change';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently, feature degrades gracefully
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
}

export function subscribeToLocalStore(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// --- Watch History ---

export function getWatchHistory(): WatchHistoryEntry[] {
  return read<WatchHistoryEntry>(HISTORY_KEY).sort((a, b) => b.viewedAt - a.viewedAt);
}

export function recordWatchHistory(anime: AnimeSummary) {
  const existing = read<WatchHistoryEntry>(HISTORY_KEY).filter((e) => e.mal_id !== anime.mal_id);
  const updated = [{ ...anime, viewedAt: Date.now() }, ...existing].slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, updated);
}

export function removeWatchHistoryEntry(mal_id: number) {
  write(HISTORY_KEY, read<WatchHistoryEntry>(HISTORY_KEY).filter((e) => e.mal_id !== mal_id));
}

export function clearWatchHistory() {
  write(HISTORY_KEY, []);
}

// --- Downloads ---

export function getDownloads(): DownloadEntry[] {
  return read<DownloadEntry>(DOWNLOADS_KEY).sort((a, b) => b.addedAt - a.addedAt);
}

export function isDownloaded(mal_id: number): boolean {
  return read<DownloadEntry>(DOWNLOADS_KEY).some((e) => e.mal_id === mal_id);
}

export function addDownload(anime: AnimeSummary) {
  const existing = read<DownloadEntry>(DOWNLOADS_KEY).filter((e) => e.mal_id !== anime.mal_id);
  write(DOWNLOADS_KEY, [{ ...anime, addedAt: Date.now() }, ...existing]);
}

export function removeDownload(mal_id: number) {
  write(DOWNLOADS_KEY, read<DownloadEntry>(DOWNLOADS_KEY).filter((e) => e.mal_id !== mal_id));
}

export function clearDownloads() {
  write(DOWNLOADS_KEY, []);
}
