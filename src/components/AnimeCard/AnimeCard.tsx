import { memo, useState } from 'react';
import type { AniListMedia, TitleFormat, ScoreFormat, RankingFolder } from '../../api/types';
import { getTitle, formatScoreForDisplay } from '../../utils/ratingCalculator';
import { ContextMenu, ContextMenuItem } from '../ContextMenu';
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
  folders?: RankingFolder[];
  onAddToFolder?: (folderId: string) => void;
}

export const AnimeCard = memo(function AnimeCard({
  anime,
  rank,
  titleFormat,
  calculatedScore,
  scoreFormat = 'POINT_100',
  isDragging = false,
  viewMode = 'list',
  folders = [],
  onAddToFolder,
}: AnimeCardProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const title = getTitle(anime.title, titleFormat);
  const isGrid = viewMode === 'grid';

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }

  function handleAddToFolder(folderId: string) {
    onAddToFolder?.(folderId);
    setContextMenu(null);
  }

  return (
    <>
      <div
        className={`${styles.card} ${isDragging ? styles.dragging : ''} ${isGrid ? styles.gridCard : ''}`}
        onContextMenu={handleContextMenu}
      >
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

      {contextMenu && folders.length > 0 && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)}>
          <ContextMenuItem
            label="Add to Folder"
            hasSubmenu
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#f5c542">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
            }
          >
            {folders.map(folder => (
              <ContextMenuItem
                key={folder.id}
                label={folder.label}
                onClick={() => handleAddToFolder(folder.id)}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5c542">
                    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                }
              />
            ))}
          </ContextMenuItem>
        </ContextMenu>
      )}
    </>
  );
});
