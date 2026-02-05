const AUTH_URL = 'https://anilist.co/api/v2/oauth/authorize';
// Use proxied endpoint to avoid CORS issues (proxy configured in vite.config.ts)
const TOKEN_URL = '/api/oauth/token';

const CLIENT_ID = import.meta.env.VITE_ANILIST_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_ANILIST_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_ANILIST_REDIRECT_URI;

const TOKEN_KEY = 'anilist_access_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function initiateLogin(): void {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
  });
  window.location.href = `${AUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token;
  setStoredToken(token);
  return token;
}

export function getCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

export function isCallbackUrl(): boolean {
  return window.location.pathname === '/callback';
}
