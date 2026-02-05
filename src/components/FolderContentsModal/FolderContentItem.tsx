import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RankingItem, TitleFormat, ScoreFormat, CalculatedScore } from '../../api/types';
import { AnimeCard } from '../AnimeCard';
import styles from './FolderContentsModal.module.css';

interface FolderContentItemProps {
  item: RankingItem;
  rank: number;
  titleFormat: TitleFormat;
  scoreFormat: ScoreFormat;
  calculatedScore?: CalculatedScore;
  onRemove: () => void;
  viewMode: 'list' | 'grid';
}

export function FolderContentItem({
  item,
  rank,
  titleFormat,
  scoreFormat,
  calculatedScore,
  onRemove,
  viewMode,
}: FolderContentItemProps) {
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
    <div ref={setNodeRef} style={style} className={styles.itemWrapper}>
      <div {...attributes} {...listeners} className={styles.dragArea}>
        <AnimeCard
          anime={item.anime}
          rank={rank}
          titleFormat={titleFormat}
          calculatedScore={calculatedScore?.score}
          scoreFormat={scoreFormat}
          isDragging={isDragging}
          viewMode={viewMode}
        />
      </div>
      <button
        className={styles.removeFromFolderBtn}
        onClick={onRemove}
        title="Remove from folder"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
