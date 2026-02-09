import { useEffect, useState, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RankingProvider, useRanking } from './context/RankingContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { RankingList } from './components/RankingList';
import { SyncPanel } from './components/SyncPanel';
import { getCompletedAnimeList } from './api/anilist';
import type { CalculatedScore, AniListMediaListEntry } from './api/types';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { state, dispatch } = useRanking();
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedScores, setCalculatedScores] = useState<CalculatedScore[]>([]);
  const [resetting, setResetting] = useState(false);
  const entriesRef = useRef<AniListMediaListEntry[]>([]);

  useEffect(() => {
    async function loadAnimeList() {
      if (!isAuthenticated || !user || state.isLoaded) return;

      setLoadingList(true);
      setError(null);

      try {
        const entries = await getCompletedAnimeList(user.id);
        entriesRef.current = entries; // Store for reset functionality
        dispatch({ type: 'LOAD_FROM_ENTRIES', entries });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load anime list');
      } finally {
        setLoadingList(false);
      }
    }

    loadAnimeList();
  }, [isAuthenticated, user, state.isLoaded, dispatch]);

  const handleScoresCalculated = useCallback((scores: CalculatedScore[]) => {
    setCalculatedScores(scores);
  }, []);

  const handleResetFromAniList = useCallback(async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'This will reset your ranking order to match your current AniList scores (sorted highest to lowest). All markers will be removed. Continue?'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      // Fetch fresh data from AniList
      const entries = await getCompletedAnimeList(user.id);
      entriesRef.current = entries;
      dispatch({ type: 'RESET_FROM_ANILIST', entries });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset from AniList');
    } finally {
      setResetting(false);
    }
  }, [user, dispatch]);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        {!isAuthenticated ? (
          <div className="welcome">
            <h2>Welcome to Anime Ranker</h2>
            <p>
              Rank your completed anime from AniList by dragging them into your preferred order.
              Your rankings will be converted to scores and synced back to your AniList account.
            </p>
            <ul>
              <li>Login with your AniList account</li>
              <li>Drag and drop anime to rank them</li>
              <li>Add rating markers to define score boundaries</li>
              <li>Preview and sync your ratings to AniList</li>
            </ul>
          </div>
        ) : error ? (
          <div className="error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : loadingList ? (
          <div className="loading-screen">
            <div className="spinner" />
            <p>Loading your anime list...</p>
          </div>
        ) : (
          <div className="content">
            <div className="ranking-column">
              <RankingList onScoresCalculated={handleScoresCalculated} />
            </div>
            <div className="sync-column">
              <SyncPanel scores={calculatedScores} />
              <button
                className="reset-btn"
                onClick={handleResetFromAniList}
                disabled={resetting}
              >
                {resetting ? 'Resetting...' : 'Reset from AniList'}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RankingProvider>
        <AppContent />
      </RankingProvider>
    </AuthProvider>
  );
}

export default App;
