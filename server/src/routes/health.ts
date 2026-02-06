import { Router, Request, Response } from 'express';
import { getPool } from '../db.js';

const router = Router();

// GET /health - Health check endpoint for CI/CD and monitoring
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const pool = await getPool();
    await pool.execute('SELECT 1');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
