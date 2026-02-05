import { useState } from 'react';
import type { CalculatedScore } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { syncScoresToAniList, type SyncProgress } from '../../api/anilist';
import styles from './SyncPanel.module.css';

interface SyncPanelProps {
  scores: CalculatedScore[];
}

export function SyncPanel({ scores }: SyncPanelProps) {
  const { token } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  async function handleSync() {
    if (!token || syncing) return;

    setSyncing(true);
    setResult(null);
    setProgress({ current: 0, total: scores.length, currentTitle: '' });

    try {
      const syncResult = await syncScoresToAniList(
        scores.map(s => ({ mediaId: s.mediaId, score: s.score, title: s.title })),
        token,
        setProgress
      );
      setResult(syncResult);
    } catch (error) {
      setResult({
        success: 0,
        failed: scores.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sync to AniList</h3>
        <span className={styles.count}>{scores.length} anime</span>
      </div>

      <p className={styles.description}>
        Push your ranking to AniList. Scores are calculated based on position in the list.
      </p>

      <button
        className={styles.syncBtn}
        onClick={handleSync}
        disabled={syncing || scores.length === 0}
      >
        {syncing ? 'Syncing...' : 'Sync Ratings to AniList'}
      </button>

      {syncing && progress && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className={styles.progressText}>
            {progress.current} / {progress.total} - {progress.currentTitle}
          </p>
        </div>
      )}

      {result && !syncing && (
        <div className={`${styles.result} ${result.failed > 0 ? styles.hasErrors : ''}`}>
          <p>
            <strong>{result.success}</strong> updated successfully
            {result.failed > 0 && (
              <span className={styles.failed}>, <strong>{result.failed}</strong> failed</span>
            )}
          </p>
          {result.errors.length > 0 && (
            <details className={styles.errors}>
              <summary>Show errors</summary>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
