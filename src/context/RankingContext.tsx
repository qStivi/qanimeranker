import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type Dispatch,
} from 'react';
import type {
  RankingListItem,
  RankingItem,
  RatingMarker,
  RankingFolder,
  TitleFormat,
  AniListMediaListEntry,
} from '../api/types';
import { saveRankings, type RankingOrderData } from '../api/rankings';
import { debounce } from '../utils/debounce';

type ViewMode = 'list' | 'grid';
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface RankingState {
  items: RankingListItem[];
  titleFormat: TitleFormat;
  viewMode: ViewMode;
  isLoaded: boolean;
  syncStatus: SyncStatus;
}

type RankingAction =
  | { type: 'SET_ITEMS'; items: RankingListItem[] }
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'ADD_MARKER'; marker: RatingMarker; atIndex: number }
  | { type: 'REMOVE_MARKER'; id: string }
  | { type: 'UPDATE_MARKER'; id: string; minRating: number; label: string }
  | { type: 'ADD_FOLDER'; folder: RankingFolder; atIndex: number }
  | { type: 'REMOVE_FOLDER'; id: string }
  | { type: 'RENAME_FOLDER'; id: string; label: string }
  | { type: 'TOGGLE_FOLDER'; id: string }
  | { type: 'MOVE_TO_FOLDER'; itemId: string; folderId: string }
  | { type: 'REMOVE_FROM_FOLDER'; itemId: string }
  | { type: 'SET_TITLE_FORMAT'; format: TitleFormat }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'LOAD_FROM_ENTRIES'; entries: AniListMediaListEntry[]; serverData?: RankingOrderData[] | null }
  | { type: 'RESET' }
  | { type: 'RESET_FROM_ANILIST'; entries: AniListMediaListEntry[] }
  | { type: 'SET_SYNC_STATUS'; status: SyncStatus };

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
    ...(item.type === 'folder' && {
      label: item.label,
      isExpanded: item.isExpanded,
    }),
    ...(item.type === 'anime' && item.parentFolderId && {
      parentFolderId: item.parentFolderId,
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
      return { ...state, items: action.items, isLoaded: true, syncStatus: 'idle' };
    }

    case 'SET_SYNC_STATUS': {
      return { ...state, syncStatus: action.status };
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

    case 'ADD_FOLDER': {
      const newItems = [...state.items];
      newItems.splice(action.atIndex, 0, action.folder);
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'REMOVE_FOLDER': {
      const folderIndex = state.items.findIndex(item => item.id === action.id);
      const childItems = state.items
        .filter(item => item.type === 'anime' && item.parentFolderId === action.id)
        .map(item => ({ ...item, parentFolderId: undefined }));
      const newItems = state.items.filter(
        item => item.id !== action.id && !(item.type === 'anime' && item.parentFolderId === action.id)
      );
      newItems.splice(folderIndex, 0, ...childItems);
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'RENAME_FOLDER': {
      const newItems = state.items.map(item =>
        item.type === 'folder' && item.id === action.id
          ? { ...item, label: action.label }
          : item
      );
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'TOGGLE_FOLDER': {
      const newItems = state.items.map(item =>
        item.type === 'folder' && item.id === action.id
          ? { ...item, isExpanded: !item.isExpanded }
          : item
      );
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'MOVE_TO_FOLDER': {
      const newItems = state.items.map(item =>
        item.type === 'anime' && item.id === action.itemId
          ? { ...item, parentFolderId: action.folderId }
          : item
      );
      saveToStorage(newItems);
      return { ...state, items: newItems };
    }

    case 'REMOVE_FROM_FOLDER': {
      const newItems = state.items.map(item =>
        item.type === 'anime' && item.id === action.itemId
          ? { ...item, parentFolderId: undefined }
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
      // Priority: server data > localStorage > default (sorted by score)
      const savedOrder = action.serverData ?? localStorage.getItem(STORAGE_KEY);
      let items: RankingListItem[];

      if (savedOrder) {
        try {
          // Parse if it's a string (from localStorage), otherwise use directly (from server)
          const orderData = (typeof savedOrder === 'string'
            ? JSON.parse(savedOrder)
            : savedOrder) as Array<{
            type: 'anime' | 'marker' | 'folder';
            id: string;
            minRating?: number;
            label?: string;
            isExpanded?: boolean;
            parentFolderId?: string;
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
            } else if (orderItem.type === 'folder') {
              items.push({
                type: 'folder',
                id: orderItem.id,
                label: orderItem.label || 'Folder',
                isExpanded: orderItem.isExpanded ?? true,
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
                  parentFolderId: orderItem.parentFolderId,
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

          // Clean up orphaned items (parentFolderId pointing to non-existent folders)
          const folderIds = new Set(items.filter(i => i.type === 'folder').map(i => i.id));
          items = items.map(item =>
            item.type === 'anime' && item.parentFolderId && !folderIds.has(item.parentFolderId)
              ? { ...item, parentFolderId: undefined }
              : item
          );
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
      return { ...state, items, isLoaded: true, syncStatus: 'idle' };
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
  folders: RankingFolder[];
  syncToServer: () => void;
}

const RankingContext = createContext<RankingContextType | null>(null);

// Convert items to the format expected by server/localStorage
function itemsToOrderData(items: RankingListItem[]): RankingOrderData[] {
  return items.map(item => ({
    type: item.type,
    id: item.id,
    ...(item.type === 'marker' && {
      minRating: item.minRating,
      label: item.label,
    }),
    ...(item.type === 'folder' && {
      label: item.label,
      isExpanded: item.isExpanded,
    }),
    ...(item.type === 'anime' && item.parentFolderId && {
      parentFolderId: item.parentFolderId,
    }),
  }));
}

interface RankingProviderProps {
  children: ReactNode;
  isAuthenticated?: boolean;
}

export function RankingProvider({ children, isAuthenticated = false }: RankingProviderProps) {
  const [state, dispatch] = useReducer(rankingReducer, {
    items: [],
    titleFormat: loadTitleFormat(),
    viewMode: loadViewMode(),
    isLoaded: false,
    syncStatus: 'idle',
  });

  // Track the previous items for comparison
  const prevItemsRef = useRef<RankingListItem[]>([]);
  const isFirstRender = useRef(true);

  // Debounced server save function
  const debouncedSave = useCallback(
    debounce(async (items: RankingListItem[]) => {
      if (!isAuthenticated) return;

      dispatch({ type: 'SET_SYNC_STATUS', status: 'saving' });
      const orderData = itemsToOrderData(items);
      const success = await saveRankings(orderData);
      dispatch({ type: 'SET_SYNC_STATUS', status: success ? 'saved' : 'error' });

      // Reset to idle after a short delay
      if (success) {
        setTimeout(() => {
          dispatch({ type: 'SET_SYNC_STATUS', status: 'idle' });
        }, 2000);
      }
    }, 2000),
    [isAuthenticated]
  );

  // Sync to server when items change (debounced)
  useEffect(() => {
    // Skip first render and when not loaded
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!state.isLoaded || !isAuthenticated) return;

    // Only sync if items actually changed
    if (prevItemsRef.current !== state.items) {
      prevItemsRef.current = state.items;
      debouncedSave(state.items);
    }
  }, [state.items, state.isLoaded, isAuthenticated, debouncedSave]);

  // Manual sync function (for immediate save)
  const syncToServer = useCallback(() => {
    if (!isAuthenticated || !state.isLoaded) return;
    const orderData = itemsToOrderData(state.items);
    saveRankings(orderData);
  }, [isAuthenticated, state.isLoaded, state.items]);

  const animeItems = state.items.filter((item): item is RankingItem => item.type === 'anime');
  const markers = state.items.filter((item): item is RatingMarker => item.type === 'marker');
  const folders = state.items.filter((item): item is RankingFolder => item.type === 'folder');

  return (
    <RankingContext.Provider value={{ state, dispatch, animeItems, markers, folders, syncToServer }}>
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
