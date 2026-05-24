export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
}

export interface Show {
  id: string;
  name: string;
  url: string;
  color: string;
  episodes: Episode[];
}

export interface PlaylistItem {
  showId: string;
  episodeId: string;
  watched: boolean;
}

export type ShuffleMode = 'auto' | 'curated';

export interface AppState {
  shows: Show[];
  playlist: PlaylistItem[];
  shuffleMode: ShuffleMode;
  selectedEpisodeIds: string[]; // for curated mode
}
