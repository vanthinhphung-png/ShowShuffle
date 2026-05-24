import { v4 as uuidv4 } from 'uuid';
import { Episode, Show, PlaylistItem } from './types';

const STORAGE_KEY = 'showshuffle_data';

export function generateId(): string {
  return uuidv4();
}

export const SHOW_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e',
];

export function getColorForShow(index: number): string {
  return SHOW_COLORS[index % SHOW_COLORS.length];
}

export function extractShowNameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || urlObj.hostname;
    return lastPart
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return null;
  }
}

export function generateEpisodes(showName: string, numSeasons: number, episodesPerSeason: number): Episode[] {
  const episodes: Episode[] = [];
  for (let s = 1; s <= numSeasons; s++) {
    const epsForSeason = s <= numSeasons ? episodesPerSeason : episodesPerSeason;
    for (let e = 1; e <= epsForSeason; e++) {
      episodes.push({
        id: `ep-${s}-${e}`,
        season: s,
        episode: e,
        title: `${showName} S${String(s).padStart(2, '0')}E${String(e).padStart(2, '0')}`,
      });
    }
  }
  return episodes;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateAutoPlaylist(shows: Show[]): PlaylistItem[] {
  const allEpisodes: { showId: string; episodeId: string }[] = [];
  shows.forEach((show) => {
    show.episodes.forEach((ep) => {
      allEpisodes.push({ showId: show.id, episodeId: ep.id });
    });
  });
  const shuffled = shuffleArray(allEpisodes);
  return shuffled.map((item) => ({
    ...item,
    watched: false,
  }));
}

export function generateCuratedPlaylist(
  shows: Show[],
  selectedEpisodeIds: string[]
): PlaylistItem[] {
  const episodeToShow = new Map<string, string>();
  shows.forEach((show) => {
    show.episodes.forEach((ep) => {
      episodeToShow.set(ep.id, show.id);
    });
  });

  return selectedEpisodeIds
    .filter((id) => episodeToShow.has(id))
    .map((episodeId) => ({
      showId: episodeToShow.get(episodeId)!,
      episodeId,
      watched: false,
    }));
}

export function saveState(state: unknown): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

export function loadState(): unknown {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return null;
}

export function getShowById(shows: Show[], showId: string): Show | undefined {
  return shows.find((s) => s.id === showId);
}

export function getEpisodeById(show: Show, episodeId: string): Episode | undefined {
  return show.episodes.find((e) => e.id === episodeId);
}

export function getWatchedCount(playlist: PlaylistItem[]): number {
  return playlist.filter((p) => p.watched).length;
}

export function getNextUnwatched(playlist: PlaylistItem[]): number {
  return playlist.findIndex((p) => !p.watched);
}
