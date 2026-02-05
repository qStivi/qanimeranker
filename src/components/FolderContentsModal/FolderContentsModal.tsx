import { useMemo } from 'react';
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
import type { RankingFolder, RankingItem, TitleFormat, ScoreFormat, CalculatedScore } from '../../api/types';
import { FolderContentItem } from './FolderContentItem';
import styles from './FolderContentsModal.module.css';

interface FolderContentsModalProps {
  folder: RankingFolder;
  onClose: () => void;
  titleFormat: TitleFormat;
  scoreFormat: ScoreFormat;
  scoreMap: Map<number, CalculatedScore>;
  viewMode: 'list' | 'grid';
}

export function FolderContentsModal({
  folder,
  onClose,
  titleFormat,
  scoreFormat,
  scoreMap,
  viewMode,
}: FolderContentsModalProps) {
  const { state, dispatch } = useRanking();

  // Get items belonging to this folder, preserving their order from state.items
  const folderItems = useMemo(() => {
    return state.items.filter(
      (item): item is RankingItem =>
        item.type === 'anime' && item.parentFolderId === folder.id
    );
  }, [state.items, folder.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find indices within the folder items
    const oldIndex = folderItems.findIndex(item => item.id === activeId);
    const newIndex = folderItems.findIndex(item => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder within folder by updating the main items array
    const reorderedFolderItems = arrayMove(folderItems, oldIndex, newIndex);

    // Rebuild state.items: remove old folder items, insert reordered ones after folder
    const newItems = state.items.filter(
      item => !(item.type === 'anime' && item.parentFolderId === folder.id)
    );

    // Find folder index and insert items after it
    const folderIndex = newItems.findIndex(item => item.id === folder.id);
    newItems.splice(folderIndex + 1, 0, ...reorderedFolderItems);

    dispatch({ type: 'SET_ITEMS', items: newItems });
  }

  function handleRemoveFromFolder(itemId: string) {
    dispatch({ type: 'REMOVE_FROM_FOLDER', itemId });
  }

  // Calculate ranks for items in this folder (1-based index within folder)
  const ranks = new Map<string, number>();
  folderItems.forEach((item, index) => {
    ranks.set(item.id, index + 1);
  });

  // Handle click outside to close
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  // Handle escape key
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.folderInfo}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#f5c542">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
            <h2 className={styles.title}>{folder.label}</h2>
            <span className={styles.count}>{folderItems.length} items</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {folderItems.length === 0 ? (
          <div className={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="#3d5a80">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>
            <p>This folder is empty</p>
            <p className={styles.hint}>Right-click on an anime to add it to this folder</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={folderItems.map(i => i.id)}
              strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              <div className={`${styles.content} ${viewMode === 'grid' ? styles.gridView : ''}`}>
                {folderItems.map(item => (
                  <FolderContentItem
                    key={item.id}
                    item={item}
                    rank={ranks.get(item.id) || 0}
                    titleFormat={titleFormat}
                    scoreFormat={scoreFormat}
                    calculatedScore={scoreMap.get(item.mediaId)}
                    onRemove={() => handleRemoveFromFolder(item.id)}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
