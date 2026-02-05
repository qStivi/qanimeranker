import { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRanking } from '../../context/RankingContext';
import { initiateLogin } from '../../api/auth';
import { exportBackup, importBackup } from '../../utils/storageBackup';
import type { TitleFormat } from '../../api/types';
import styles from './Header.module.css';

export function Header() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { state, dispatch } = useRanking();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const titleFormats: { value: TitleFormat; label: string }[] = [
    { value: 'english', label: 'English' },
    { value: 'romaji', label: 'Romaji' },
    { value: 'native', label: 'Native' },
  ];

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await importBackup(file);
    if (success) {
      // Reload the page to apply the imported data
      window.location.reload();
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>Anime Ranker</h1>
        <span className={styles.subtitle}>Rank your AniList anime</span>
      </div>

      <div className={styles.controls}>
        {isAuthenticated && (
          <>
            <div className={styles.backupControls}>
              <button
                className={styles.backupBtn}
                onClick={exportBackup}
                title="Export your ranking and folders as a backup file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Export
              </button>
              <button
                className={styles.backupBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Import a backup file to restore your ranking and folders"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className={styles.hiddenInput}
              />
            </div>

            <div className={styles.titleFormat}>
              <label className={styles.label}>Titles:</label>
              <select
                value={state.titleFormat}
                onChange={e => dispatch({ type: 'SET_TITLE_FORMAT', format: e.target.value as TitleFormat })}
                className={styles.select}
              >
                {titleFormats.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className={styles.auth}>
          {isLoading ? (
            <span className={styles.loading}>Loading...</span>
          ) : isAuthenticated && user ? (
            <div className={styles.user}>
              <img
                src={user.avatar.large}
                alt={user.name}
                className={styles.avatar}
              />
              <span className={styles.username}>{user.name}</span>
              <button className={styles.logoutBtn} onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <button className={styles.loginBtn} onClick={initiateLogin}>
              Login with AniList
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
