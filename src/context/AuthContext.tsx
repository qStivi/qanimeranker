import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AniListUser } from '../api/types';
import {
  getStoredToken,
  clearStoredToken,
  exchangeCodeForToken,
  getCodeFromUrl,
  isCallbackUrl,
} from '../api/auth';
import { getViewer } from '../api/anilist';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AniListUser | null;
  token: string | null;
  error: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AniListUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      try {
        // Check if this is a callback from OAuth
        if (isCallbackUrl()) {
          const code = getCodeFromUrl();
          if (code) {
            const newToken = await exchangeCodeForToken(code);
            setToken(newToken);
            const userData = await getViewer(newToken);
            setUser(userData);
            // Clear the URL params
            window.history.replaceState({}, '', '/');
          }
        } else {
          // Check for existing token
          const storedToken = getStoredToken();
          if (storedToken) {
            try {
              const userData = await getViewer(storedToken);
              setToken(storedToken);
              setUser(userData);
            } catch {
              // Token is invalid, clear it
              clearStoredToken();
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        clearStoredToken();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        isLoading,
        user,
        token,
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
