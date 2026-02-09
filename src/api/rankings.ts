// API base URL - in development, use Vite proxy; in production, use same origin
const API_BASE = import.meta.env.VITE_API_URL || '';

// Serialized ranking data format (what gets saved to server/localStorage)
export interface RankingOrderData {
  type: 'anime' | 'marker' | 'folder';
  id: string;
  // marker fields
  minRating?: number;
  label?: string;
  // folder fields
  isExpanded?: boolean;
  // anime fields
  parentFolderId?: string;
}

/**
 * Fetch user's rankings from the server
 * Returns null if not authenticated or no data exists
 */
export async function fetchRankings(): Promise<RankingOrderData[] | null> {
  try {
    const response = await fetch(`${API_BASE}/api/rankings`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch {
    console.error('Failed to fetch rankings from server');
    return null;
  }
}

/**
 * Save user's rankings to the server
 * Returns true if successful, false otherwise
 */
export async function saveRankings(data: RankingOrderData[]): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/rankings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });

    return response.ok;
  } catch {
    console.error('Failed to save rankings to server');
    return false;
  }
}
