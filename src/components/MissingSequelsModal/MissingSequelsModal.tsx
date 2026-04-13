import { useEffect, useState } from 'react';
import type { AniListMediaListEntry, TitleFormat } from '../../api/types';
import { getAllUserAnimeIds, findMissingSequels } from '../../api/anilist';
import type { MissingSequel } from '../../api/types';
import { SequelCard } from './SequelCard';
import styles from './MissingSequelsModal.module.css';

interface MissingSequelsModalProps {
  entries: AniListMediaListEntry[];
  userId: number;
  titleFormat: TitleFormat;
  onClose: () => void;
}

export function MissingSequelsModal({
  entries,
  userId,
  titleFormat,
  onClose,
}: MissingSequelsModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingSequels, setMissingSequels] = useState<MissingSequel[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const allIds = await getAllUserAnimeIds(userId);
        const results = findMissingSequels(entries, allIds, titleFormat);
        setMissingSequels(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check for missing sequels');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [entries, userId, titleFormat]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

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
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>Missing Sequels</h2>
            {!loading && !error && (
              <span className={styles.count}>{missingSequels.length} found</span>
            )}
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Checking for missing sequels...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={() => { setError(null); setLoading(true); }}>
              Retry
            </button>
          </div>
        ) : missingSequels.length === 0 ? (
          <div className={styles.empty}>
            <p>No missing sequels found — you're all caught up!</p>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.grid}>
              {missingSequels.map(sequel => (
                <SequelCard
                  key={sequel.sequel.id}
                  sequel={sequel}
                  titleFormat={titleFormat}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
