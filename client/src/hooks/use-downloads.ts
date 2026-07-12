import { useEffect, useState } from 'react';
import {
  getDownloads,
  addDownload,
  removeDownload,
  clearDownloads,
  isDownloaded,
  subscribeToLocalStore,
  type AnimeSummary,
} from '@/lib/local-store';

export function useDownloads() {
  const [downloads, setDownloads] = useState(() => getDownloads());

  useEffect(() => {
    const refresh = () => setDownloads(getDownloads());
    return subscribeToLocalStore(refresh);
  }, []);

  return {
    downloads,
    isDownloaded: (mal_id: number) => downloads.some((d) => d.mal_id === mal_id),
    add: (anime: AnimeSummary) => addDownload(anime),
    remove: (mal_id: number) => removeDownload(mal_id),
    clear: () => clearDownloads(),
  };
}

export { isDownloaded };
