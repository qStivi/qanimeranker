import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config.js';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, User, AniListTokenResponse, AniListUser } from '../types/index.js';

const router = Router();

// Store state tokens temporarily (in production, use Redis or similar)
const stateTokens = new Map<string, { expires: number }>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of stateTokens.entries()) {
    if (data.expires < now) {
      stateTokens.delete(token);
    }
  }
}, 60000); // Clean every minute

// GET /api/auth/login - Redirect to AniList OAuth
router.get('/login', (_req, res: Response) => {
  // Generate state token for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  stateTokens.set(state, { expires: Date.now() + 600000 }); // 10 minutes

  const params = new URLSearchParams({
    client_id: config.anilist.clientId,
    redirect_uri: config.anilist.redirectUri,
    response_type: 'code',
    state,
  });

  res.redirect(`${config.anilist.authUrl}?${params.toString()}`);
});

// GET /api/auth/callback - Handle OAuth callback
router.get('/callback', async (req, res: Response) => {
  const { code, state } = req.query;

  // Validate state token
  if (!state || typeof state !== 'string' || !stateTokens.has(state)) {
    return res.redirect(`${config.frontendUrl}?error=invalid_state`);
  }
  stateTokens.delete(state);

  if (!code || typeof code !== 'string') {
    return res.redirect(`${config.frontendUrl}?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(config.anilist.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: config.anilist.clientId,
        client_secret: config.anilist.clientSecret,
        redirect_uri: config.anilist.redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect(`${config.frontendUrl}?error=token_exchange_failed`);
    }

    const tokenData: AniListTokenResponse = await tokenResponse.json();

    // Get user info from AniList
    const userResponse = await fetch(config.anilist.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      body: JSON.stringify({
        query: `
          query {
            Viewer {
              id
              name
              avatar {
                large
              }
            }
          }
        `,
      }),
    });

    if (!userResponse.ok) {
      return res.redirect(`${config.frontendUrl}?error=user_fetch_failed`);
    }

    const userData = await userResponse.json();
    const anilistUser: AniListUser = userData.data.Viewer;

    // Upsert user in database
    await query(
      `INSERT INTO users (anilist_id, username, avatar_url, access_token)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         avatar_url = VALUES(avatar_url),
         access_token = VALUES(access_token),
         updated_at = CURRENT_TIMESTAMP`,
      [anilistUser.id, anilistUser.name, anilistUser.avatar?.large || null, tokenData.access_token]
    );

    // Get user from DB to get internal ID
    const users = await query<User[]>(
      'SELECT * FROM users WHERE anilist_id = ?',
      [anilistUser.id]
    );
    const user = users[0];

    // Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        anilistId: user.anilist_id,
        username: user.username,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set httpOnly cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend
    res.redirect(config.frontendUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${config.frontendUrl}?error=auth_failed`);
  }
});

// POST /api/auth/logout - Clear session
router.post('/logout', (_req, res: Response) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
  });
  res.json({ success: true });
});

// GET /api/auth/me - Get current user
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await query<User[]>(
      'SELECT id, anilist_id, username, avatar_url, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      anilistId: user.anilist_id,
      username: user.username,
      avatarUrl: user.avatar_url,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
