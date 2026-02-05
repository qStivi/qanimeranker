import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  RankingListItem,
  RankingItem,
  RatingMarker,
  TitleFormat,
  AniListMediaListEntry,
} from '../api/types';

type ViewMode = 'list' | 'grid';

interface RankingState {
  items: RankingListItem[];
  titleFormat: TitleFormat;
  viewMode: ViewMode;
  isLoaded: boolean;
}

type RankingAction =
  | { type: 'SET_ITEMS'; items: RankingListItem[] }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'ADD_MARKER'; marker: RatingMarker; atIndex: number }
  | { type: 'REMOVE_MARKER'; id: string }
  | { type: 'UPDATE_MARKER'; id: string; minRating: number; label: string }
  | { type: 'SET_TITLE_FORMAT'; format: TitleFormat }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'LOAD_FROM_ENTRIES'; entries: AniListMediaListEntry[] }
  | { type: 'RESET' }
  | { type: 'RESET_FROM_ANILIST'; entries: AniListMediaListEntry[] };

const STORAGE_KEY = 'anime_ranking_order';
const TITLE_FORMAT_KEY = 'anime_ranking_title_format';
const VIEW_MODE_KEY = 'anime_ranking_view_mode';

function saveToStorage(items: RankingListItem[]) {
  const orderData = items.map(item => ({
    type: item.type,
    id: item.id,
    ...(item.type === 'marker' && {
      minRating: item.minRating,
      label: item.label,
    }),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orderData));
}

function loadTitleFormat(): TitleFormat {
  const stored = localStorage.getItem(TITLE_FORMAT_KEY);
  return (stored as TitleFormat) || 'english';
}

function saveTitleFormat(format: TitleFormat) {
  localStorage.setItem(TITLE_FORMAT_KEY, format);
}

function loadViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  return (stored as ViewMode) || 'list';
}

function saveViewMode(mode: ViewMode) {
  localStorage.setItem(VIEW_MODE_KEY, mode);
}

function rankingReducer(state: RankingState, action: RankingAction): RankingState {
  switch (action.type) {
    case 'SET_ITEMS': {
      saveToStorage(action.items);
      return { ...state, items: action.items, isLoaded: true };
    }

    case 'REORDER': {
      const newItems = [...state.items];
      const [removed] = newItems.splice(action.fromIndex, 1);
      newItems.splice(action.toIndex, 0, removed);
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'ADD_MARKER': {
      const newItems = [...state.items];
      newItems.splice(action.atIndex, 0, action.marker);
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'REMOVE_MARKER': {
      const newItems = state.items.filter(item => item.id !== action.id);
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'UPDATE_MARKER': {
      const newItems = state.items.map(item =>
        item.type === 'marker' && item.id === action.id
          ? { ...item, minRating: action.minRating, label: action.label }
          : item
      );
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'SET_TITLE_FORMAT': {
      saveTitleFormat(action.format);
      return { ...state, titleFormat: action.format };
    }

    case 'SET_VIEW_MODE': {
      saveViewMode(action.mode);
      return { ...state, viewMode: action.mode };
    }

    case 'LOAD_FROM_ENTRIES': {
      // Check if we have a saved order
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      let items: RankingListItem[];

      if (savedOrder) {
        try {
          const orderData = JSON.parse(savedOrder) as Array<{
            type: 'anime' | 'marker';
            id: string;
            minRating?: number;
            label?: string;
          }>;

          // Create a map of entries by mediaId
          const entryMap = new Map<number, AniListMediaListEntry>();
          for (const entry of action.entries) {
            entryMap.set(entry.mediaId, entry);
          }

          // Reconstruct items based on saved order
          items = [];
          const usedMediaIds = new Set<number>();

          for (const orderItem of orderData) {
            if (orderItem.type === 'marker') {
              items.push({
                type: 'marker',
                id: orderItem.id,
                minRating: orderItem.minRating || 50,
                label: orderItem.label || 'Rating Marker',
              });
            } else {
              // Extract mediaId from the id (format: anime-{mediaId})
              const mediaId = parseInt(orderItem.id.replace('anime-', ''), 10);
              const entry = entryMap.get(mediaId);
              if (entry) {
                items.push({
                  type: 'anime',
                  id: orderItem.id,
                  mediaId: entry.mediaId,
                  entryId: entry.id,
                  anime: entry.media,
                  currentScore: entry.score,
                });
                usedMediaIds.add(mediaId);
              }
            }
          }

          // Add any new entries that weren't in the saved order
          for (const entry of action.entries) {
            if (!usedMediaIds.has(entry.mediaId)) {
              items.push({
                type: 'anime',
                id: `anime-${entry.mediaId}`,
                mediaId: entry.mediaId,
                entryId: entry.id,
                anime: entry.media,
                currentScore: entry.score,
              });
            }
          }
        } catch {
          // Invalid saved data, use default order
          items = action.entries.map(entry => ({
            type: 'anime' as const,
            id: `anime-${entry.mediaId}`,
            mediaId: entry.mediaId,
            entryId: entry.id,
            anime: entry.media,
            currentScore: entry.score,
          }));
        }
      } else {
        // No saved order, sort by current score (highest first)
        const sortedEntries = [...action.entries].sort((a, b) => b.score - a.score);
        items = sortedEntries.map(entry => ({
          type: 'anime' as const,
          id: `anime-${entry.mediaId}`,
          mediaId: entry.mediaId,
          entryId: entry.id,
          anime: entry.media,
          currentScore: entry.score,
        }));
      }

      saveToStorage(items);
      return { ...state, items, isLoaded: true };
    }

    case 'RESET': {
      localStorage.removeItem(STORAGE_KEY);
      return { ...state, items: [], isLoaded: false };
    }

    case 'RESET_FROM_ANILIST': {
      // Clear saved order and recreate from AniList entries (sorted by score)
      localStorage.removeItem(STORAGE_KEY);
      const sortedEntries = [...action.entries].sort((a, b) => b.score - a.score);
      const items: RankingListItem[] = sortedEntries.map(entry => ({
        type: 'anime' as const,
        id: `anime-${entry.mediaId}`,
        mediaId: entry.mediaId,
        entryId: entry.id,
        anime: entry.media,
        currentScore: entry.score,
      }));
      saveToStorage(items);
      return { ...state, items, isLoaded: true };
    }

    default:
      return state;
  }
}

interface RankingContextType {
  state: RankingState;
  dispatch: Dispatch<RankingAction>;
  animeItems: RankingItem[];
  markers: RatingMarker[];
}

const RankingContext = createContext<RankingContextType | null>(null);

export function RankingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rankingReducer, {
    items: [],
    titleFormat: loadTitleFormat(),
    viewMode: loadViewMode(),
    isLoaded: false,
  });

  const animeItems = state.items.filter((item): item is RankingItem => item.type === 'anime');
  const markers = state.items.filter((item): item is RatingMarker => item.type === 'marker');

  return (
    <RankingContext.Provider value={{ state, dispatch, animeItems, markers }}>
      {children}
    </RankingContext.Provider>
  );
}

export function useRanking() {
  const context = useContext(RankingContext);
  if (!context) {
    throw new Error('useRanking must be used within a RankingProvider');
  }
  return context;
}
