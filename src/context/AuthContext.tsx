import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AniListUser } from '../api/types';
import { getCurrentUser, logout as apiLogout, getOAuthError, clearOAuthError, type CurrentUser } from '../api/auth';
import { getViewer } from '../api/anilist';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AniListUser | null;
  backendUser: CurrentUser | null;
  error: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [backendUser, setBackendUser] = useState<CurrentUser | null>(null);
  const [user, setUser] = useState<AniListUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      try {
        // Check for OAuth errors in URL
        const oauthError = getOAuthError();
        if (oauthError) {
          setError(`Authentication failed: ${oauthError}`);
          clearOAuthError();
          setIsLoading(false);
          return;
        }

        // Check if user is authenticated via backend
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setBackendUser(currentUser);

          // Fetch full AniList user data for media list access
          try {
            const anilistUser = await getViewer();
            setUser(anilistUser);
          } catch {
            // AniList token might be expired, but we still have backend auth
            console.warn('Failed to fetch AniList viewer, token may be expired');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const logout = async () => {
    await apiLogout();
    setBackendUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!backendUser,
        isLoading,
        user,
        backendUser,
        error,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
