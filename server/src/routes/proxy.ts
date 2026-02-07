import { Router, Response } from 'express';
import { config } from '../config.js';
import { optionalAuthMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, User } from '../types/index.js';
import { query } from '../db.js';

const router = Router();

// POST /api/proxy/graphql - Proxy requests to AniList GraphQL
router.post('/graphql', optionalAuthMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query: gqlQuery, variables } = req.body;

    if (!gqlQuery) {
      return res.status(400).json({ error: 'Missing query' });
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // If user is authenticated, add their AniList token for user-specific queries
    if (req.user && typeof req.user.userId === 'number') {
      // Validate userId is a positive integer (defense in depth for SQL injection)
      const userId = Math.floor(Math.abs(req.user.userId));
      if (userId > 0 && Number.isFinite(userId)) {
        const users = await query<User[]>(
          'SELECT access_token FROM users WHERE id = ?',
          [userId]
        );

        if (users.length > 0 && users[0].access_token) {
          headers['Authorization'] = `Bearer ${users[0].access_token}`;
        }
      }
    }

    // Forward request to AniList
    const response = await fetch(config.anilist.graphqlUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: gqlQuery,
        variables,
      }),
    });

    const data = await response.json();

    // Forward rate limit headers
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'retry-after',
    ];

    for (const header of rateLimitHeaders) {
      const value = response.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
});

export default router;
