import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { AuthenticatedRequest, Ranking } from '../types/index.js';

const router = Router();

// Zod schemas for ranking data validation
const AnimeItemSchema = z.object({
  type: z.literal('anime'),
  id: z.string().min(1),
  parentFolderId: z.string().optional(),
});

const MarkerItemSchema = z.object({
  type: z.literal('marker'),
  id: z.string().min(1),
  minRating: z.number().int().min(0).max(100),
  label: z.string().min(1).max(100),
});

const FolderItemSchema = z.object({
  type: z.literal('folder'),
  id: z.string().min(1),
  label: z.string().min(1).max(100),
  isExpanded: z.boolean(),
});

const RankingItemSchema = z.discriminatedUnion('type', [
  AnimeItemSchema,
  MarkerItemSchema,
  FolderItemSchema,
]);

const RankingDataSchema = z.array(RankingItemSchema).max(10000);

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

    // Validate ranking data with Zod
    const validationResult = RankingDataSchema.safeParse(data);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid ranking data',
        details: validationResult.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    // Upsert ranking data (use validated data)
    await query(
      `INSERT INTO rankings (user_id, data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE
         data = VALUES(data),
         updated_at = CURRENT_TIMESTAMP`,
      [req.user!.userId, JSON.stringify(validationResult.data)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving rankings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
