import { useAuth } from '../../context/AuthContext';
import { useRanking } from '../../context/RankingContext';
import { initiateLogin } from '../../api/auth';
import type { TitleFormat } from '../../api/types';
import styles from './Header.module.css';

export function Header() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { state, dispatch } = useRanking();

  const titleFormats: { value: TitleFormat; label: string }[] = [
    { value: 'english', label: 'English' },
    { value: 'romaji', label: 'Romaji' },
    { value: 'native', label: 'Native' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>Anime Ranker</h1>
        <span className={styles.subtitle}>Rank your AniList anime</span>
      </div>

      <div className={styles.controls}>
        {isAuthenticated && (
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
