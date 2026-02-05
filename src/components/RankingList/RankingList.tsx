import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import type { ScoreFormat, CalculatedScore, RatingMarker as RatingMarkerType } from '../../api/types';
import { calculateScores, MARKER_PRESETS } from '../../utils/ratingCalculator';
import { SortableItem } from './SortableItem';
import styles from './RankingList.module.css';

interface RankingListProps {
  onScoresCalculated?: (scores: CalculatedScore[]) => void;
}

export function RankingList({ onScoresCalculated }: RankingListProps) {
  const { state, dispatch, animeItems } = useRanking();
  const { user } = useAuth();
  const [showAddMarker, setShowAddMarker] = useState(false);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = indexMap.get(String(active.id));
      const newIndex = indexMap.get(String(over.id));

      if (oldIndex !== undefined && newIndex !== undefined) {
        dispatch({
          type: 'SET_ITEMS',
          items: arrayMove(state.items, oldIndex, newIndex),
        });
      }
    }
  }

  function handleRemoveMarker(id: string) {
    dispatch({ type: 'REMOVE_MARKER', id });
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
            className={styles.addMarkerBtn}
            onClick={() => setShowAddMarker(!showAddMarker)}
          >
            {showAddMarker ? 'Cancel' : '+ Add Marker'}
          </button>
        </div>
      </div>

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
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={state.items.map(i => i.id)}
          strategy={state.viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <div className={`${styles.list} ${state.viewMode === 'grid' ? styles.gridView : ''}`}>
            {state.items.map(item => (
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
                viewMode={state.viewMode}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
