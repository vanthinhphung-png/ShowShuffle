import React from 'react';
import { Play, ExternalLink, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { Show } from '../types';

interface ShowCardProps {
  show: Show;
  selectedEpisodes: Set<string>;
  curatedMode: boolean;
  onToggleEpisode: (showId: string, episodeId: string) => void;
  onRemove: (showId: string) => void;
  onSelectAll: (showId: string) => void;
  onDeselectAll: (showId: string) => void;
  expanded: boolean;
  onToggleExpanded: (showId: string) => void;
}

const ShowCard: React.FC<ShowCardProps> = ({
  show,
  selectedEpisodes,
  curatedMode,
  onToggleEpisode,
  onRemove,
  onSelectAll,
  onDeselectAll,
  expanded,
  onToggleExpanded,
}) => {
  const selectedCount = show.episodes.filter((ep) => selectedEpisodes.has(ep.id)).length;
  const isExpanded = expanded;

  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-gray-700"
      style={{ borderLeftWidth: '4px', borderLeftColor: show.color }}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">{show.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                {show.episodes.length} episodes
              </span>
              {show.url && (
                <a
                  href={show.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-violet-400 transition-colors truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  <span className="truncate">{show.url}</span>
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {curatedMode && (
              <div className="flex gap-1 mr-2">
                <button
                  onClick={() => onSelectAll(show.id)}
                  className="px-2 py-1 text-xs rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  title="Select all"
                >
                  All
                </button>
                <button
                  onClick={() => onDeselectAll(show.id)}
                  className="px-2 py-1 text-xs rounded-md bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                  title="Deselect all"
                >
                  None
                </button>
              </div>
            )}
            <button
              onClick={() => onToggleExpanded(show.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onRemove(show.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Curated mode selection info */}
        {curatedMode && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(selectedCount / show.episodes.length) * 100}%`,
                  backgroundColor: show.color,
                }}
              />
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {selectedCount}/{show.episodes.length}
            </span>
          </div>
        )}
      </div>

      {/* Episode Grid (expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-800 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {show.episodes.map((ep) => {
              const isSelected = selectedEpisodes.has(ep.id);
              return (
                <button
                  key={ep.id}
                  onClick={() => curatedMode && onToggleEpisode(show.id, ep.id)}
                  disabled={!curatedMode}
                  className={`
                    relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${curatedMode ? 'cursor-pointer' : 'cursor-default'}
                    ${
                      isSelected
                        ? 'text-white shadow-sm'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
                    }
                  `}
                  style={isSelected ? { backgroundColor: show.color, opacity: 0.9 } : {}}
                >
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2" />
                  )}
                  <span className={isSelected ? 'pr-5' : ''}>
                    S{String(ep.season).padStart(2, '0')}E{String(ep.episode).padStart(2, '0')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowCard;
