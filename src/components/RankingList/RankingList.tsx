import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useRanking } from '../../context/RankingContext';
import { useAuth } from '../../context/AuthContext';
import type { ScoreFormat, CalculatedScore, RatingMarker as RatingMarkerType, RankingFolder, RankingListItem } from '../../api/types';
import { calculateScores, MARKER_PRESETS } from '../../utils/ratingCalculator';
import { SortableItem } from './SortableItem';
import styles from './RankingList.module.css';

interface RankingListProps {
  onScoresCalculated?: (scores: CalculatedScore[]) => void;
}

export function RankingList({ onScoresCalculated }: RankingListProps) {
  const { state, dispatch, animeItems, folders } = useRanking();
  const { user } = useAuth();
  const [showAddMarker, setShowAddMarker] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);

  const scoreFormat: ScoreFormat = user?.mediaListOptions?.scoreFormat || 'POINT_100';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const calculatedScores = useMemo(() => {
    return calculateScores(state.items, state.titleFormat);
  }, [state.items, state.titleFormat]);

  // Notify parent of score changes after render (not during)
  useEffect(() => {
    onScoresCalculated?.(calculatedScores);
  }, [calculatedScores, onScoresCalculated]);

  const scoreMap = useMemo(() => {
    const map = new Map<number, CalculatedScore>();
    for (const score of calculatedScores) {
      map.set(score.mediaId, score);
    }
    return map;
  }, [calculatedScores]);

  // Index cache for O(1) lookups instead of O(n) findIndex
  const indexMap = useMemo(() => {
    const map = new Map<string, number>();
    state.items.forEach((item, i) => map.set(item.id, i));
    return map;
  }, [state.items]);

  // Filter items for rendering based on folder collapse state (using parentFolderId)
  const visibleItems = useMemo(() => {
    // Build set of collapsed folder IDs
    const collapsedFolderIds = new Set(
      state.items
        .filter((i): i is RankingFolder => i.type === 'folder' && !i.isExpanded)
        .map(f => f.id)
    );

    return state.items.filter(item => {
      if (item.type === 'folder' || item.type === 'marker') return true;
      if (item.type === 'anime') {
        // Hide if parent folder is collapsed
        return !item.parentFolderId || !collapsedFolderIds.has(item.parentFolderId);
      }
      return true;
    });
  }, [state.items]);

  // Get IDs of items belonging to a folder (folder + anime with matching parentFolderId)
  function getFolderBlockIds(items: RankingListItem[], folderId: string): string[] {
    const blockIds = [folderId];
    for (const item of items) {
      if (item.type === 'anime' && item.parentFolderId === folderId) {
        blockIds.push(item.id);
      }
    }
    return blockIds;
  }

  // Move a block of items (folder + contents) to a new position
  function moveItemsAsBlock(
    items: RankingListItem[],
    blockIds: string[],
    targetIndex: number
  ): RankingListItem[] {
    // Extract block items
    const blockItems = items.filter(item => blockIds.includes(item.id));
    // Remove block items from array
    const remaining = items.filter(item => !blockIds.includes(item.id));

    // Adjust target index for items removed before the target
    const firstBlockIndex = items.findIndex(item => blockIds.includes(item.id));
    let adjustedTarget = targetIndex;
    if (firstBlockIndex < targetIndex) {
      adjustedTarget = targetIndex - blockIds.length;
    }

    // Insert block at new position
    remaining.splice(Math.max(0, adjustedTarget), 0, ...blockItems);
    return remaining;
  }

  function handleDragStart(_event: DragStartEvent) {
    // Can be used for additional drag state if needed
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setDropTargetFolderId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeItem = state.items.find(i => i.id === activeId);
    const overItem = state.items.find(i => i.id === overId);

    // Dragging anime over a folder = highlight folder as drop target
    if (activeItem?.type === 'anime' && overItem?.type === 'folder') {
      setDropTargetFolderId(overId);
    } else {
      setDropTargetFolderId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Capture the drop target folder BEFORE clearing state
    const targetFolderId = dropTargetFolderId;

    // Clear drag state
    setDropTargetFolderId(null);

    const activeId = String(active.id);
    const activeItem = state.items.find(i => i.id === activeId);

    // Priority 1: Check if we were hovering over a folder (use captured state)
    // This handles the case where the folder moved out of the way
    if (activeItem?.type === 'anime' && targetFolderId) {
      dispatch({ type: 'MOVE_TO_FOLDER', itemId: activeId, folderId: targetFolderId });
      return; // Don't also reorder
    }

    if (over && active.id !== over.id) {
      const overId = String(over.id);
      const overItem = state.items.find(i => i.id === overId);

      // Check if dragging a folder
      if (activeItem?.type === 'folder') {
        // Move folder and its contents as a block
        const blockIds = getFolderBlockIds(state.items, activeId);
        const targetIndex = indexMap.get(overId);

        if (targetIndex !== undefined) {
          dispatch({
            type: 'SET_ITEMS',
            items: moveItemsAsBlock(state.items, blockIds, targetIndex),
          });
        }
      } else if (activeItem?.type === 'anime') {
        // Check if dropping on a folder = add to folder (backup check)
        if (overItem?.type === 'folder') {
          dispatch({ type: 'MOVE_TO_FOLDER', itemId: activeId, folderId: overId });
          return;
        }
        // Check if dropping on an anime outside any folder = remove from folder
        if (overItem?.type === 'anime' && !overItem.parentFolderId && activeItem.parentFolderId) {
          dispatch({ type: 'REMOVE_FROM_FOLDER', itemId: activeId });
        }
        // Normal reorder
        const oldIndex = indexMap.get(activeId);
        const newIndex = indexMap.get(overId);

        if (oldIndex !== undefined && newIndex !== undefined) {
          dispatch({
            type: 'SET_ITEMS',
            items: arrayMove(state.items, oldIndex, newIndex),
          });
        }
      } else {
        // Marker or other item - normal move
        const oldIndex = indexMap.get(activeId);
        const newIndex = indexMap.get(overId);

        if (oldIndex !== undefined && newIndex !== undefined) {
          dispatch({
            type: 'SET_ITEMS',
            items: arrayMove(state.items, oldIndex, newIndex),
          });
        }
      }
    }
  }

  function handleRemoveMarker(id: string) {
    dispatch({ type: 'REMOVE_MARKER', id });
  }

  function handleRemoveFolder(id: string) {
    dispatch({ type: 'REMOVE_FOLDER', id });
  }

  function handleToggleFolder(id: string) {
    dispatch({ type: 'TOGGLE_FOLDER', id });
  }

  function handleRenameFolder(id: string, label: string) {
    dispatch({ type: 'RENAME_FOLDER', id, label });
  }

  function handleAddFolder() {
    const label = newFolderName.trim() || 'New Folder';
    const folder: RankingFolder = {
      type: 'folder',
      id: `folder-${Date.now()}`,
      label,
      isExpanded: true,
    };
    dispatch({ type: 'ADD_FOLDER', folder, atIndex: 0 });
    setNewFolderName('');
    setShowAddFolder(false);
  }

  // Helper to count anime items belonging to a folder (using parentFolderId)
  function getFolderItemCount(items: RankingListItem[], folderId: string): number {
    return items.filter(
      item => item.type === 'anime' && item.parentFolderId === folderId
    ).length;
  }

  function handleAddMarker(preset: { value: number; label: string }) {
    const marker: RatingMarkerType = {
      type: 'marker',
      id: `marker-${Date.now()}`,
      minRating: preset.value,
      label: preset.label,
    };

    // Find the right position based on the marker value
    // Insert after the last anime that should be above this marker
    let insertIndex = 0;
    const tempScores = calculateScores(
      state.items.filter(i => i.type === 'anime'),
      state.titleFormat
    );

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (item.type === 'anime') {
        const score = tempScores.find(s => s.mediaId === item.mediaId);
        if (score && score.score >= preset.value) {
          insertIndex = i + 1;
        }
      }
    }

    dispatch({ type: 'ADD_MARKER', marker, atIndex: insertIndex });
    setShowAddMarker(false);
  }

  // Calculate rank for each anime (excluding markers)
  let animeRank = 0;
  const ranks = new Map<string, number>();
  for (const item of state.items) {
    if (item.type === 'anime') {
      animeRank++;
      ranks.set(item.id, animeRank);
    }
  }

  const presets = MARKER_PRESETS[scoreFormat] || MARKER_PRESETS.POINT_100;

  if (!state.isLoaded) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading your anime list...</p>
      </div>
    );
  }

  if (animeItems.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No completed anime found in your list.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.stats}>
          <span>{animeItems.length} anime</span>
          <span className={styles.separator}>|</span>
          <span>{folders.length} folders</span>
          <span className={styles.separator}>|</span>
          <span>{state.items.filter(i => i.type === 'marker').length} markers</span>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.viewToggle} ${state.viewMode === 'list' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'list' })}
            title="List View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 2h14v2H1V2zm0 5h14v2H1V7zm0 5h14v2H1v-2z"/>
            </svg>
          </button>
          <button
            className={`${styles.viewToggle} ${state.viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', mode: 'grid' })}
            title="Grid View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/>
            </svg>
          </button>
          <button
            className={styles.addFolderBtn}
            onClick={() => {
              setShowAddFolder(!showAddFolder);
              setShowAddMarker(false);
            }}
          >
            {showAddFolder ? 'Cancel' : '+ Add Folder'}
          </button>
          <button
            className={styles.addMarkerBtn}
            onClick={() => {
              setShowAddMarker(!showAddMarker);
              setShowAddFolder(false);
            }}
          >
            {showAddMarker ? 'Cancel' : '+ Add Marker'}
          </button>
        </div>
      </div>

      {showAddFolder && (
        <div className={styles.folderForm}>
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name (e.g., Attack on Titan)"
            className={styles.folderInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') setShowAddFolder(false);
            }}
            autoFocus
          />
          <button className={styles.createFolderBtn} onClick={handleAddFolder}>
            Create Folder
          </button>
        </div>
      )}

      {showAddMarker && (
        <div className={styles.markerPresets}>
          <p className={styles.presetsLabel}>Select a rating threshold:</p>
          <div className={styles.presetsList}>
            {presets.map(preset => (
              <button
                key={preset.value}
                className={styles.presetBtn}
                onClick={() => handleAddMarker(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <DndContext
        key={state.viewMode}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleItems.map(i => i.id)}
          strategy={state.viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <div className={`${styles.list} ${state.viewMode === 'grid' ? styles.gridView : ''}`}>
            {visibleItems.map(item => (
              <SortableItem
                key={item.id}
                item={item}
                rank={item.type === 'anime' ? ranks.get(item.id) || 0 : 0}
                titleFormat={state.titleFormat}
                scoreFormat={scoreFormat}
                calculatedScore={
                  item.type === 'anime' ? scoreMap.get(item.mediaId) : undefined
                }
                onRemoveMarker={handleRemoveMarker}
                onRemoveFolder={handleRemoveFolder}
                onToggleFolder={handleToggleFolder}
                onRenameFolder={handleRenameFolder}
                folderItemCount={item.type === 'folder' ? getFolderItemCount(state.items, item.id) : 0}
                isDropTarget={item.type === 'folder' && item.id === dropTargetFolderId}
                viewMode={state.viewMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
