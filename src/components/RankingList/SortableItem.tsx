import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RankingListItem, TitleFormat, ScoreFormat, CalculatedScore, RankingFolder } from '../../api/types';
import { AnimeCard } from '../AnimeCard';
import { RatingMarker } from '../RatingMarker';
import { FolderHeader } from '../FolderHeader';

type ViewMode = 'list' | 'grid';

interface PreviewItem {
  coverUrl: string;
  title: string;
}

interface SortableItemProps {
  item: RankingListItem;
  rank: number;
  titleFormat: TitleFormat;
  scoreFormat: ScoreFormat;
  calculatedScore?: CalculatedScore;
  onRemoveMarker: (id: string) => void;
  onRemoveFolder: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onRenameFolder: (id: string, label: string) => void;
  onAddToFolder?: (itemId: string, folderId: string) => void;
  folderItemCount: number;
  folderPreviewItems?: PreviewItem[];
  folders?: RankingFolder[];
  isDropTarget?: boolean;
  viewMode: ViewMode;
}

export const SortableItem = memo(function SortableItem({
  item,
  rank,
  titleFormat,
  scoreFormat,
  calculatedScore,
  onRemoveMarker,
  onRemoveFolder,
  onOpenFolder,
  onRenameFolder,
  onAddToFolder,
  folderItemCount,
  folderPreviewItems,
  folders = [],
  isDropTarget = false,
  viewMode,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {item.type === 'anime' ? (
        <AnimeCard
          anime={item.anime}
          rank={rank}
          titleFormat={titleFormat}
          calculatedScore={calculatedScore?.score}
          scoreFormat={scoreFormat}
          isDragging={isDragging}
          viewMode={viewMode}
          folders={folders}
          onAddToFolder={folderId => onAddToFolder?.(item.id, folderId)}
        />
      ) : item.type === 'folder' ? (
        <FolderHeader
          folder={item}
          itemCount={folderItemCount}
          previewItems={folderPreviewItems}
          onOpen={() => onOpenFolder(item.id)}
          onRemove={() => onRemoveFolder(item.id)}
          onRename={(label) => onRenameFolder(item.id, label)}
          isDragging={isDragging}
          isDropTarget={isDropTarget}
          viewMode={viewMode}
        />
      ) : (
        <RatingMarker
          marker={item}
          scoreFormat={scoreFormat}
          onRemove={() => onRemoveMarker(item.id)}
          isDragging={isDragging}
          viewMode={viewMode}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if relevant props changed
  const baseEqual =
    prevProps.item.id === nextProps.item.id &&
    prevProps.rank === nextProps.rank &&
    prevProps.titleFormat === nextProps.titleFormat &&
    prevProps.scoreFormat === nextProps.scoreFormat &&
    prevProps.calculatedScore?.score === nextProps.calculatedScore?.score &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.folderItemCount === nextProps.folderItemCount &&
    prevProps.isDropTarget === nextProps.isDropTarget &&
    prevProps.folders?.length === nextProps.folders?.length;

  if (!baseEqual) return false;

  // Check folder-specific props
  if (prevProps.item.type === 'folder' && nextProps.item.type === 'folder') {
    // Check if preview items changed
    const prevPreviews = prevProps.folderPreviewItems || [];
    const nextPreviews = nextProps.folderPreviewItems || [];
    if (prevPreviews.length !== nextPreviews.length) return false;
    for (let i = 0; i < prevPreviews.length; i++) {
      if (prevPreviews[i].coverUrl !== nextPreviews[i].coverUrl) return false;
    }
    return prevProps.item.label === nextProps.item.label;
  }

  return true;
});
