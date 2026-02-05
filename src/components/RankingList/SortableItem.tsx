import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RankingListItem, TitleFormat, ScoreFormat, CalculatedScore } from '../../api/types';
import { AnimeCard } from '../AnimeCard';
import { RatingMarker } from '../RatingMarker';

type ViewMode = 'list' | 'grid';

interface SortableItemProps {
  item: RankingListItem;
  rank: number;
  titleFormat: TitleFormat;
  scoreFormat: ScoreFormat;
  calculatedScore?: CalculatedScore;
  onRemoveMarker: (id: string) => void;
  viewMode: ViewMode;
}

export const SortableItem = memo(function SortableItem({
  item,
  rank,
  titleFormat,
  scoreFormat,
  calculatedScore,
  onRemoveMarker,
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
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.rank === nextProps.rank &&
    prevProps.titleFormat === nextProps.titleFormat &&
    prevProps.scoreFormat === nextProps.scoreFormat &&
    prevProps.calculatedScore?.score === nextProps.calculatedScore?.score &&
    prevProps.viewMode === nextProps.viewMode
  );
});
