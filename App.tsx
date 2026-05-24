import React, { useState, useMemo, useCallback } from 'react';
import {
  Tv,
  Shuffle,
  ListChecks,
  Plus,
  Sparkles,
  Settings2,
  Eye,
  EyeOff,
} from 'lucide-react';
import AddShowForm from './components/AddShowForm';
import ShowCard from './components/ShowCard';
import PlaylistView from './components/PlaylistView';
import type { Show, AppState } from './types';
import {
  generateAutoPlaylist,
  generateCuratedPlaylist,
  loadState,
  saveState,
  getWatchedCount,
  shuffleArray,
} from './utils';

type Tab = 'shows' | 'playlist';

const initialState: AppState = {
  shows: [],
  playlist: [],
  shuffleMode: 'auto',
  selectedEpisodeIds: [],
};

function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = loadState();
    return saved ? { ...initialState, ...(saved as Partial<AppState>) } : initialState;
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('shows');
  const [expandedShows, setExpandedShows] = useState<Set<string>>(new Set());

  // Persist state on change
  React.useEffect(() => {
    saveState(state);
  }, [state]);

  const selectedEpisodeIds = useMemo(
    () => new Set(state.selectedEpisodeIds),
    [state.selectedEpisodeIds]
  );

  // Handlers
  const addShow = useCallback(
    (show: Show) => {
      setState((prev) => {
        const newShows = [...prev.shows, show];
        return {
          ...prev,
          shows: newShows,
          playlist: generateAutoPlaylist(newShows),
        };
      });
      setShowAddForm(false);
    },
    []
  );

  const removeShow = useCallback(
    (showId: string) => {
      setState((prev) => {
        const newShows = prev.shows.filter((s) => s.id !== showId);
        // Remove associated selected episodes
        const newSelected = prev.selectedEpisodeIds.filter((id) => {
          const show = prev.shows.find((s) => s.id === showId);
          return show ? !show.episodes.some((e) => e.id === id) : true;
        });
        return {
          ...prev,
          shows: newShows,
          selectedEpisodeIds: newSelected,
          playlist:
            prev.shuffleMode === 'auto'
              ? generateAutoPlaylist(newShows)
              : generateCuratedPlaylist(newShows, newSelected),
        };
      });
      setExpandedShows((prev) => {
        const next = new Set(prev);
        next.delete(showId);
        return next;
      });
    },
    []
  );

  const toggleEpisode = useCallback(
    (_showId: string, episodeId: string) => {
      setState((prev) => {
        const isSelected = prev.selectedEpisodeIds.includes(episodeId);
        const newSelected = isSelected
          ? prev.selectedEpisodeIds.filter((id) => id !== episodeId)
          : [...prev.selectedEpisodeIds, episodeId];
        return {
          ...prev,
          selectedEpisodeIds: newSelected,
          playlist: generateCuratedPlaylist(prev.shows, newSelected),
        };
      });
    },
    []
  );

  const selectAll = useCallback(
    (showId: string) => {
      setState((prev) => {
        const show = prev.shows.find((s) => s.id === showId);
        if (!show) return prev;
        const currentIds = new Set(prev.selectedEpisodeIds);
        show.episodes.forEach((ep) => currentIds.add(ep.id));
        const newSelected = Array.from(currentIds);
        return {
          ...prev,
          selectedEpisodeIds: newSelected,
          playlist: generateCuratedPlaylist(prev.shows, newSelected),
        };
      });
    },
    []
  );

  const deselectAll = useCallback(
    (showId: string) => {
      setState((prev) => {
        const show = prev.shows.find((s) => s.id === showId);
        if (!show) return prev;
        const showEpIds = new Set(show.episodes.map((e) => e.id));
        const newSelected = prev.selectedEpisodeIds.filter((id) => !showEpIds.has(id));
        return {
          ...prev,
          selectedEpisodeIds: newSelected,
          playlist: generateCuratedPlaylist(prev.shows, newSelected),
        };
      });
    },
    []
  );

  const toggleExpanded = useCallback((showId: string) => {
    setExpandedShows((prev) => {
      const next = new Set(prev);
      if (next.has(showId)) next.delete(showId);
      else next.add(showId);
      return next;
    });
  }, []);

  const toggleWatched = useCallback((index: number) => {
    setState((prev) => {
      const newPlaylist = [...prev.playlist];
      newPlaylist[index] = { ...newPlaylist[index], watched: !newPlaylist[index].watched };
      return { ...prev, playlist: newPlaylist };
    });
  }, []);

  const reshuffle = useCallback(() => {
    setState((prev) => {
      if (prev.shuffleMode === 'auto') {
        // Re-shuffle all episodes
        const allEpisodes: { showId: string; episodeId: string }[] = [];
        prev.shows.forEach((show) => {
          show.episodes.forEach((ep) => {
            allEpisodes.push({ showId: show.id, episodeId: ep.id });
          });
        });
        const shuffled = shuffleArray(allEpisodes);
        const watchedMap = new Map<string, boolean>();
        prev.playlist.forEach((p) => watchedMap.set(p.episodeId, p.watched));
        const newPlaylist = shuffled.map((item) => ({
          ...item,
          watched: watchedMap.get(item.episodeId) || false,
        }));
        return { ...prev, playlist: newPlaylist };
      } else {
        // Re-shuffle curated playlist
        const watched = prev.playlist.filter((p) => p.watched);
        const unwatched = shuffleArray(prev.playlist.filter((p) => !p.watched));
        return { ...prev, playlist: [...watched, ...unwatched] };
      }
    });
  }, []);

  const resetAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playlist: prev.playlist.map((p) => ({ ...p, watched: false })),
    }));
  }, []);

  const markAllWatched = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playlist: prev.playlist.map((p) => ({ ...p, watched: true })),
    }));
  }, []);

  const switchMode = useCallback(
    (mode: 'auto' | 'curated') => {
      setState((prev) => {
        if (mode === 'curated') {
          // Select all episodes by default when switching to curated
          const allIds = prev.shows.flatMap((s) => s.episodes.map((e) => e.id));
          return {
            ...prev,
            shuffleMode: mode,
            selectedEpisodeIds: allIds,
            playlist: generateCuratedPlaylist(prev.shows, allIds),
          };
        } else {
          return {
            ...prev,
            shuffleMode: mode,
            playlist: generateAutoPlaylist(prev.shows),
          };
        }
      });
    },
    []
  );

  const totalEpisodes = useMemo(
    () => state.shows.reduce((sum, s) => sum + s.episodes.length, 0),
    [state.shows]
  );
  const watchedCount = getWatchedCount(state.playlist);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-fuchsia-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Shuffle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  ShowShuffle
                </h1>
                <p className="text-xs text-gray-500">Mix your watchlist, break the monotony</p>
              </div>
            </div>
            {state.shows.length > 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium text-sm transition-colors shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Show
              </button>
            )}
          </div>

          {/* Stats */}
          {state.shows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-violet-400">{state.shows.length}</p>
                <p className="text-xs text-gray-500">Shows</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-fuchsia-400">{totalEpisodes}</p>
                <p className="text-xs text-gray-500">Episodes</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-400">{watchedCount}</p>
                <p className="text-xs text-gray-500">Watched</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {state.playlist.length - watchedCount}
                </p>
                <p className="text-xs text-gray-500">Remaining</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          {state.shows.length > 0 && (
            <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
              <button
                onClick={() => setActiveTab('shows')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'shows'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Tv className="w-4 h-4" />
                My Shows
              </button>
              <button
                onClick={() => setActiveTab('playlist')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'playlist'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                Playlist
                <span className="bg-violet-500/30 text-violet-300 text-xs px-1.5 py-0.5 rounded-md">
                  {state.playlist.length - watchedCount}
                </span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          {state.shows.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-3xl flex items-center justify-center mb-6 border border-violet-500/20">
                <Sparkles className="w-10 h-10 text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Start building your mixed watchlist</h2>
              <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
                Add TV shows and movies, then let ShowShuffle create a mixed episode playlist so
                you can watch multiple shows at once without losing your place.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-2xl text-white font-semibold text-lg transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                Add Your First Show
              </button>

              <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Tv className="w-5 h-5 text-violet-400" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Add Shows</p>
                  <p className="text-gray-500 text-xs">Paste a URL or add shows manually</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-fuchsia-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Shuffle className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Mix Episodes</p>
                  <p className="text-gray-500 text-xs">Auto-shuffle or curate your picks</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Watch & Track</p>
                  <p className="text-gray-500 text-xs">Check off episodes as you go</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'shows' && (
                <div className="space-y-6">
                  {/* Mode Selector */}
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings2 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Playlist Mode</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => switchMode('auto')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          state.shuffleMode === 'auto'
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <Shuffle className="w-4 h-4" />
                        Auto Mix
                        <span className="text-xs opacity-60">— all episodes</span>
                      </button>
                      <button
                        onClick={() => switchMode('curated')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                          state.shuffleMode === 'curated'
                            ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <ListChecks className="w-4 h-4" />
                        Curated
                        <span className="text-xs opacity-60">— pick & choose</span>
                      </button>
                    </div>

                    {state.shuffleMode === 'curated' && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                        {state.selectedEpisodeIds.length === totalEpisodes ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            All {totalEpisodes} episodes selected. Toggle episodes below to customize.
                          </>
                        ) : state.selectedEpisodeIds.length > 0 ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-violet-300 font-medium">
                              {state.selectedEpisodeIds.length}
                            </span>
                            of {totalEpisodes} episodes selected
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            No episodes selected. Click episodes below to build your playlist.
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show Cards */}
                  <div className="space-y-3">
                    {state.shows.map((show) => (
                      <ShowCard
                        key={show.id}
                        show={show}
                        selectedEpisodes={selectedEpisodeIds}
                        curatedMode={state.shuffleMode === 'curated'}
                        onToggleEpisode={toggleEpisode}
                        onRemove={removeShow}
                        onSelectAll={selectAll}
                        onDeselectAll={deselectAll}
                        expanded={expandedShows.has(show.id)}
                        onToggleExpanded={toggleExpanded}
                      />
                    ))}
                  </div>

                  {/* Add More */}
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-violet-400 hover:border-violet-500/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Another Show
                  </button>

                  {/* Generate Playlist CTA */}
                  {state.playlist.length > 0 && (
                    <button
                      onClick={() => setActiveTab('playlist')}
                      className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-2xl text-white font-semibold text-lg transition-all shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 flex items-center justify-center gap-3"
                    >
                      <Shuffle className="w-5 h-5" />
                      View Mixed Playlist ({state.playlist.length} episodes)
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'playlist' && (
                <PlaylistView
                  shows={state.shows}
                  playlist={state.playlist}
                  shuffleMode={state.shuffleMode}
                  onToggleWatched={toggleWatched}
                  onReshuffle={reshuffle}
                  onResetAll={resetAll}
                  onMarkAllWatched={markAllWatched}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center text-xs text-gray-600">
          <p>
            Built with ❤️ — No more boring single-show binges.
          </p>
        </footer>
      </div>

      {/* Add Show Modal */}
      {showAddForm && (
        <AddShowForm
          onAdd={addShow}
          existingColors={state.shows.map((s) => s.color)}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

export default App;
