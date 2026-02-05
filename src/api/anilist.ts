import type { AniListMediaListEntry, AniListUser } from './types';

// Use proxied endpoint to avoid CORS issues (proxy configured in vite.config.ts)
const API_URL = '/api/graphql';

class RateLimiter {
  private requestTimes: number[] = [];
  // AniList API is degraded to 30 req/min, use 25 to be safe
  private readonly maxRequests = 25;
  private readonly windowMs = 60000; // 1 minute
  // Minimum delay between requests to avoid burst limiting (2.5 seconds)
  private readonly minDelayMs = 2500;
  private lastRequestTime = 0;
  // Track if we're currently waiting due to rate limit
  private rateLimitedUntil = 0;

  async throttle(): Promise<void> {
    const now = Date.now();

    // If we're rate limited, wait until the limit expires
    if (now < this.rateLimitedUntil) {
      const waitTime = this.rateLimitedUntil - now;
      console.log(`Rate limited, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Clean up old request times
    this.requestTimes = this.requestTimes.filter(t => now - t < this.windowMs);

    // If we've hit the limit, wait for the oldest request to expire
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 100;
      console.log(`Request limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Enforce minimum delay between requests to avoid burst limiting
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.minDelayMs - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
    this.requestTimes.push(this.lastRequestTime);
  }

  // Call this when we receive a 429 response
  setRateLimited(retryAfterSeconds: number): void {
    this.rateLimitedUntil = Date.now() + retryAfterSeconds * 1000;
    // Clear request times since we're starting fresh after the wait
    this.requestTimes = [];
  }
}

const rateLimiter = new RateLimiter();

async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
): Promise<T> {
  await rateLimiter.throttle();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 429) {
    // Use Retry-After header, fallback to 60 seconds
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
    console.log(`429 Too Many Requests - waiting ${retryAfter}s (from Retry-After header)`);
    rateLimiter.setRateLimited(retryAfter);
    // Retry the request after waiting
    return graphqlRequest(query, variables, token);
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

export async function getViewer(token: string): Promise<AniListUser> {
  const query = `
    query {
      Viewer {
        id
        name
        avatar {
          large
        }
        mediaListOptions {
          scoreFormat
        }
      }
    }
  `;

  const data = await graphqlRequest<{ Viewer: AniListUser }>(query, {}, token);
  return data.Viewer;
}

export async function getCompletedAnimeList(
  userId: number,
  token: string
): Promise<AniListMediaListEntry[]> {
  const query = `
    query ($userId: Int!) {
      MediaListCollection(userId: $userId, type: ANIME, status: COMPLETED) {
        lists {
          name
          entries {
            id
            mediaId
            score(format: POINT_100)
            media {
              id
              title {
                romaji
                english
                native
              }
              coverImage {
                large
              }
              episodes
              format
            }
          }
        }
      }
    }
  `;

  const data = await graphqlRequest<{
    MediaListCollection: {
      lists: Array<{ name: string; entries: AniListMediaListEntry[] }>;
    };
  }>(query, { userId }, token);

  // Only use the main "Completed" list, ignore custom lists to avoid duplicates
  const completedList = data.MediaListCollection.lists.find(
    list => list.name === 'Completed'
  );

  return completedList?.entries ?? [];
}

export async function updateAnimeScore(
  mediaId: number,
  score: number,
  token: string
): Promise<void> {
  // Use scoreRaw (Int) instead of score (Float) to set the raw 0-100 value
  // This works regardless of the user's score format setting (5-star, 10-point, etc.)
  const query = `
    mutation ($mediaId: Int!, $scoreRaw: Int!) {
      SaveMediaListEntry(mediaId: $mediaId, scoreRaw: $scoreRaw) {
        id
        score
      }
    }
  `;

  await graphqlRequest(query, { mediaId, scoreRaw: Math.round(score) }, token);
}

// Batch size for grouped mutations (conservative to stay within rate limits)
const BATCH_SIZE = 10;

/**
 * Build a batched mutation query using GraphQL aliases
 * This sends multiple SaveMediaListEntry mutations in a single request
 * Uses scoreRaw (Int) to set raw 0-100 values regardless of user's score format
 */
function buildBatchMutation(
  batch: Array<{ mediaId: number; score: number; index: number }>
): { query: string; variables: Record<string, unknown> } {
  // Build variable definitions: $mediaId0: Int!, $scoreRaw0: Int!, ...
  const varDefs = batch
    .map((_, i) => `$mediaId${i}: Int!, $scoreRaw${i}: Int!`)
    .join(', ');

  // Build mutation fields with aliases: update0: SaveMediaListEntry(...), ...
  const mutations = batch
    .map(
      (_, i) =>
        `update${i}: SaveMediaListEntry(mediaId: $mediaId${i}, scoreRaw: $scoreRaw${i}) { id score }`
    )
    .join('\n    ');

  const query = `
    mutation BatchUpdate(${varDefs}) {
      ${mutations}
    }
  `;

  // Build variables object: { mediaId0: 123, scoreRaw0: 85, ... }
  const variables: Record<string, unknown> = {};
  batch.forEach((item, i) => {
    variables[`mediaId${i}`] = item.mediaId;
    variables[`scoreRaw${i}`] = Math.round(item.score);
  });

  return { query, variables };
}

export interface SyncProgress {
  current: number;
  total: number;
  currentTitle: string;
  batchInfo?: string;
}

export async function syncScoresToAniList(
  scores: Array<{ mediaId: number; score: number; title: string }>,
  token: string,
  onProgress?: (progress: SyncProgress) => void
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  // Split scores into batches
  const batches: Array<Array<{ mediaId: number; score: number; title: string; index: number }>> = [];
  for (let i = 0; i < scores.length; i += BATCH_SIZE) {
    batches.push(
      scores.slice(i, i + BATCH_SIZE).map((s, idx) => ({ ...s, index: i + idx }))
    );
  }

  console.log(`Syncing ${scores.length} scores in ${batches.length} batches of up to ${BATCH_SIZE}`);

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchStart = batchIdx * BATCH_SIZE;

    // Update progress with batch info
    onProgress?.({
      current: batchStart + 1,
      total: scores.length,
      currentTitle: batch.map(s => s.title).join(', '),
      batchInfo: `Batch ${batchIdx + 1}/${batches.length}`,
    });

    try {
      const { query, variables } = buildBatchMutation(batch);
      await graphqlRequest(query, variables, token);
      success += batch.length;
      console.log(`Batch ${batchIdx + 1}/${batches.length} completed (${batch.length} items)`);
    } catch (error) {
      // If batch fails, try individual updates as fallback
      console.warn(`Batch ${batchIdx + 1} failed, falling back to individual updates:`, error);
      for (const item of batch) {
        onProgress?.({
          current: item.index + 1,
          total: scores.length,
          currentTitle: item.title,
        });

        try {
          await updateAnimeScore(item.mediaId, item.score, token);
          success++;
        } catch (individualError) {
          failed++;
          errors.push(`Failed to update ${item.title}: ${individualError}`);
        }
      }
    }
  }

  // Final progress update
  onProgress?.({
    current: scores.length,
    total: scores.length,
    currentTitle: 'Done!',
  });

  return { success, failed, errors };
}
