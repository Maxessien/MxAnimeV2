import { useState } from 'react';
import { PlaylistItem } from './types';
import { formatTime } from './helpers';

interface PlaylistPanelProps {
  items: PlaylistItem[];
  currentIndex: number;
  onPlay: (i: number) => void;
  onRemove: (i: number) => void;
  onMove: (from: number, to: number) => void;
  onClose: () => void;
}

export function PlaylistPanel({ items, currentIndex, onPlay, onMove, onClose }: PlaylistPanelProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  return (
    <div className="w-70 shrink-0 bg-[#242424] border-l border-[#404040] flex flex-col overflow-hidden">
      <div className="h-7 bg-[#2E2E2E] border-b border-[#404040] flex items-center justify-between px-2 text-[#E0E0E0] text-xs font-semibold shrink-0">
        <span>Playlist</span>
        <button onClick={onClose} className="hover:text-[#FF8800] px-1 leading-none text-base">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#909090] text-xs italic text-center p-4">
            Playlist is empty.<br />Drag files here.
          </div>
        ) : (
          <table className="w-full text-left table-fixed border-collapse text-xs">
            <colgroup>
              <col className="w-7" />
              <col />
              <col className="w-14" />
            </colgroup>
            <tbody>
              {items.map((item, idx) => {
                const active = idx === currentIndex;
                return (
                  <tr
                    key={item.id}
                    className={`border-b border-[#303030] cursor-pointer last:border-0 ${
                      active ? 'bg-[#FF8800]/20 text-[#FF8800] font-semibold' : 'hover:bg-[#2E2E2E] text-[#E0E0E0]'
                    }`}
                    onDoubleClick={() => onPlay(idx)}
                    draggable
                    onDragStart={e => {
                      setDragIdx(idx);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(idx));
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (dragIdx !== null && dragIdx !== idx) onMove(dragIdx, idx);
                      setDragIdx(null);
                    }}
                  >
                    <td className="py-1.5 px-1 text-center text-[#909090] border-r border-[#303030]">
                      {active ? <span className="text-[#FF8800]">▶</span> : idx + 1}
                    </td>
                    <td className="py-1.5 px-2 truncate" title={item.title}>{item.title}</td>
                    <td className="py-1.5 px-1 text-right text-[#909090] pr-1.5">
                      {item.duration ? formatTime(item.duration) : '--:--'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
