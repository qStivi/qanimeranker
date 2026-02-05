import type { RatingMarker as RatingMarkerType, ScoreFormat } from '../../api/types';
import { formatScoreForDisplay } from '../../utils/ratingCalculator';
import styles from './RatingMarker.module.css';

type ViewMode = 'list' | 'grid';

interface RatingMarkerProps {
  marker: RatingMarkerType;
  scoreFormat: ScoreFormat;
  onRemove: () => void;
  isDragging?: boolean;
  viewMode?: ViewMode;
}

export function RatingMarker({
  marker,
  scoreFormat,
  onRemove,
  isDragging = false,
  viewMode = 'list',
}: RatingMarkerProps) {
  const isGrid = viewMode === 'grid';

  return (
    <div className={`${styles.marker} ${isDragging ? styles.dragging : ''} ${isGrid ? styles.gridMarker : ''}`}>
      <div className={styles.line} />
      <div className={styles.content}>
        <div className={styles.flag}>
          <span className={styles.label}>{marker.label}</span>
          <span className={styles.score}>
            {formatScoreForDisplay(marker.minRating, scoreFormat)}+
          </span>
        </div>
        <button className={styles.removeBtn} onClick={onRemove} title="Remove marker">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.line} />
    </div>
  );
}
