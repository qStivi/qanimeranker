import { memo } from 'react';
import type { AniListMedia, TitleFormat, ScoreFormat } from '../../api/types';
import { getTitle, formatScoreForDisplay } from '../../utils/ratingCalculator';
import styles from './AnimeCard.module.css';

type ViewMode = 'list' | 'grid';

interface AnimeCardProps {
  anime: AniListMedia;
  rank: number;
  titleFormat: TitleFormat;
  calculatedScore?: number;
  scoreFormat?: ScoreFormat;
  isDragging?: boolean;
  viewMode?: ViewMode;
}

export const AnimeCard = memo(function AnimeCard({
  anime,
  rank,
  titleFormat,
  calculatedScore,
  scoreFormat = 'POINT_100',
  isDragging = false,
  viewMode = 'list',
}: AnimeCardProps) {
  const title = getTitle(anime.title, titleFormat);
  const isGrid = viewMode === 'grid';

  return (
    <div className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isGrid ? styles.gridCard : ''}`}>
      <span className={styles.rank}>#{rank}</span>
      <img
        src={anime.coverImage.large}
        alt={title}
        className={styles.cover}
        loading="lazy"
      />
      <div className={styles.info}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        {!isGrid && (
          <div className={styles.meta}>
            {anime.format && <span className={styles.format}>{anime.format}</span>}
            {anime.episodes && <span className={styles.episodes}>{anime.episodes} eps</span>}
          </div>
        )}
        {calculatedScore !== undefined && (
          <div className={styles.score}>
            <span className={styles.scoreValue}>
              {formatScoreForDisplay(calculatedScore, scoreFormat)}
            </span>
            {scoreFormat !== 'POINT_100' && !isGrid && (
              <span className={styles.scoreRaw}>({calculatedScore})</span>
            )}
          </div>
        )}
      </div>
      {!isGrid && (
        <div className={styles.dragHandle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
});
