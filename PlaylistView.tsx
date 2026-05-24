import React from 'react';
import { Play, CheckCircle, Circle, Shuffle, RotateCcw, CheckCheck } from 'lucide-react';
import type { Show, PlaylistItem } from '../types';
import { getNextUnwatched, getWatchedCount } from '../utils';

interface PlaylistViewProps {
  shows: Show[];
  playlist: PlaylistItem[];
  shuffleMode: 'auto' | 'curated';
  onToggleWatched: (index: number) => void;
  onReshuffle: () => void;
  onResetAll: () => void;
  onMarkAllWatched: () => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  shows,
  playlist,
  shuffleMode,
  onToggleWatched,
  onReshuffle,
  onResetAll,
  onMarkAllWatched,
}) => {
  const watched = getWatchedCount(playlist);
  const total = playlist.length;
  const nextUnwatched = getNextUnwatched(playlist);
  const progress = total > 0 ? (watched / total) * 100 : 0;

  const getShow = (showId: string) => shows.find((s) => s.id === showId);
  const getEpisode = (show: Show | undefined, episodeId: string) =>
    show?.episodes.find((e) => e.id === episodeId);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Shuffle className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No playlist yet</h3>
        <p className="text-center max-w-sm">
          Add some shows and generate a mixed playlist to start watching!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Shuffle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Mixed Playlist</p>
              <p className="text-xs text-gray-400">
                {shuffleMode === 'auto' ? 'Auto-shuffled' : 'Curated selection'} &middot; {total} episodes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {watched}/{total} watched
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={onReshuffle}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Reshuffle
          </button>
          <button
            onClick={onResetAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
          {watched < total && (
            <button
              onClick={onMarkAllWatched}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Watched
            </button>
          )}
        </div>
      </div>

      {/* Playlist Items */}
      <div className="space-y-2">
        {playlist.map((item, index) => {
          const show = getShow(item.showId);
          const episode = getEpisode(show, item.episodeId);
          if (!show || !episode) return null;

          const isNext = index === nextUnwatched;
          // isPast used for potential future styling

          return (
            <div
              key={`${item.showId}-${item.episodeId}-${index}`}
              className={`
                group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                ${
                  item.watched
                    ? 'bg-gray-900/50 border-gray-800/50 opacity-60'
                    : isNext
                    ? 'bg-violet-500/10 border-violet-500/50 shadow-lg shadow-violet-500/5'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }
              `}
              onClick={() => onToggleWatched(index)}
            >
              {/* Number / Status */}
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                {item.watched ? (
                  <CheckCircle className="w-6 h-6 text-gray-600" />
                ) : isNext ? (
                  <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center animate-pulse">
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  </div>
                ) : (
                  <Circle className="w-6 h-6 text-gray-600" />
                )}
              </div>

              {/* Episode Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: show.color }}
                  />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider truncate">
                    {show.name}
                  </span>
                </div>
                <p className="text-white font-medium truncate">
                  {episode.title}
                </p>
              </div>

              {/* Index */}
              <span className="text-sm text-gray-600 font-mono shrink-0">
                #{index + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {watched === total && total > 0 && (
        <div className="text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">All caught up! 🎉</h3>
          <p className="text-gray-400 mb-4">You've watched all episodes in your playlist.</p>
          <button
            onClick={onResetAll}
            className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
          >
            Reset & Reshuffle
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;
