// API base URL - in development, use Vite proxy; in production, use same origin
const API_BASE = import.meta.env.VITE_API_URL || '';

export interface CurrentUser {
  id: number;
  anilistId: number;
  username: string;
  avatarUrl: string | null;
}

// Check if user is authenticated by calling backend
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

// Initiate login - redirects to backend OAuth flow
export function initiateLogin(): void {
  window.location.href = `${API_BASE}/api/auth/login`;
}

// Logout - clear session
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

// Check for OAuth callback errors in URL
export function getOAuthError(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('error');
}

// Clear error from URL
export function clearOAuthError(): void {
  if (getOAuthError()) {
    window.history.replaceState({}, '', window.location.pathname);
  }
}
