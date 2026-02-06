import { Router, Response } from 'express';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, Ranking } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/rankings - Fetch user's ranking data
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rankings = await query<Ranking[]>(
      'SELECT * FROM rankings WHERE user_id = ?',
      [req.user!.userId]
    );

    if (rankings.length === 0) {
      // No ranking data yet - return empty
      return res.json({ data: null });
    }

    res.json({ data: rankings[0].data });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/rankings - Save user's ranking data
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'Missing ranking data' });
    }

    // Upsert ranking data
    await query(
      `INSERT INTO rankings (user_id, data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         data = VALUES(data),
         updated_at = CURRENT_TIMESTAMP`,
      [req.user!.userId, JSON.stringify(data)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
