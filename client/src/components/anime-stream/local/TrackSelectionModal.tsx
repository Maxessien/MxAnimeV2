import React from 'react'
import { X, Check, Subtitles, Volume2, Film } from 'lucide-react'
import type { TrackKind } from '@get-air/video'
import type { ControlsState, TracksState } from './types'

interface TrackSelectionModalProps {
  controlsState: ControlsState
  tracksState: TracksState
  onSelectTrack: (kind: TrackKind, trackId?: string) => void
  onClose: () => void
  onTabChange: (tab: 'subtitle' | 'audio' | 'video') => void
}

export const TrackSelectionModal: React.FC<TrackSelectionModalProps> = ({
  controlsState,
  tracksState,
  onSelectTrack,
  onClose,
  onTabChange,
}) => {
  if (!controlsState.showTrackModal) return null

  const activeTab = controlsState.activeModalTab
  const currentTracks = tracksState.tracks.filter((t) => t.kind === activeTab)

  const getSelectedId = () => {
    if (activeTab === 'subtitle') return tracksState.selectedSubtitleId
    if (activeTab === 'audio') return tracksState.selectedAudioId
    return tracksState.selectedVideoId
  }

  const selectedId = getSelectedId()

  const tabs: Array<{ id: 'subtitle' | 'audio' | 'video'; label: string; icon: React.ReactNode }> = [
    { id: 'subtitle', label: 'Subtitles', icon: <Subtitles className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'video', label: 'Quality', icon: <Film className="w-4 h-4" /> },
  ]

  return (
    <div
      data-air-video-controls
      className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[80%] bg-card text-card-foreground border-t border-border rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Media Tracks</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Bar */}
        <div className="flex p-1.5 mx-4 my-3 bg-muted rounded-xl gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-1">
          {activeTab === 'subtitle' && (
            <button
              type="button"
              onClick={() => onSelectTrack('subtitle', undefined)}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-colors ${
                !selectedId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span className="text-sm">Off</span>
              {!selectedId && <Check className="w-4 h-4 text-primary" />}
            </button>
          )}

          {currentTracks.map((track) => {
            const isSelected = selectedId === track.id
            const label =
              track.label ||
              track.language ||
              (track.height ? `${track.height}p` : `Track #${track.streamIndex + 1}`)

            const subtitleDetail = [
              track.language?.toUpperCase(),
              track.codec?.toUpperCase(),
              track.default ? 'Default' : null,
              track.forced ? 'Forced' : null,
            ]
              .filter(Boolean)
              .join(' • ')

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onSelectTrack(activeTab, track.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                }`}
              >
                <div>
                  <div className="text-sm">{label}</div>
                  {subtitleDetail && (
                    <div className="text-xs text-muted-foreground mt-0.5">{subtitleDetail}</div>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            )
          })}

          {currentTracks.length === 0 && activeTab !== 'subtitle' && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No alternate {activeTab} streams available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
