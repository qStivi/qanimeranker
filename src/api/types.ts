export interface AniListTitle {
  romaji: string;
  english: string | null;
  native: string | null;
}

export interface AniListCoverImage {
  large: string;
}

export interface AniListMedia {
  id: number;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  episodes: number | null;
  format: string | null;
}

export interface AniListMediaListEntry {
  id: number;
  mediaId: number;
  score: number;
  media: AniListMedia;
}

export interface AniListUser {
  id: number;
  name: string;
  avatar: {
    large: string;
  };
  mediaListOptions: {
    scoreFormat: ScoreFormat;
  };
}

export type ScoreFormat =
  | 'POINT_100'
  | 'POINT_10_DECIMAL'
  | 'POINT_10'
  | 'POINT_5'
  | 'POINT_3';

export type TitleFormat = 'english' | 'romaji' | 'native';

export interface RankingItem {
  type: 'anime';
  id: string;
  mediaId: number;
  entryId: number;
  anime: AniListMedia;
  currentScore: number;
}

export interface RatingMarker {
  type: 'marker';
  id: string;
  minRating: number;
  label: string;
}

export interface RankingFolder {
  type: 'folder';
  id: string;
  label: string;
  isExpanded: boolean;
}

export type RankingListItem = RankingItem | RatingMarker | RankingFolder;

export interface CalculatedScore {
  mediaId: number;
  entryId: number;
  score: number;
  displayScore: string;
  title: string;
}
