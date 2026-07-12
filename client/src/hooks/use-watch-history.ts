import { useEffect, useState } from 'react';
import {
  getWatchHistory,
  recordWatchHistory,
  removeWatchHistoryEntry,
  clearWatchHistory,
  subscribeToLocalStore,
  type AnimeSummary,
} from '@/lib/local-store';

export function useWatchHistory() {
  const [history, setHistory] = useState(() => getWatchHistory());

  useEffect(() => {
    const refresh = () => setHistory(getWatchHistory());
    return subscribeToLocalStore(refresh);
  }, []);

  return {
    history,
    record: (anime: AnimeSummary) => recordWatchHistory(anime),
    remove: (mal_id: number) => removeWatchHistoryEntry(mal_id),
    clear: () => clearWatchHistory(),
  };
}
