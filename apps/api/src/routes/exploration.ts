import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';

const pool = getPool();

const router = Router();

// Auth middleware
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get exploration stats
router.get('/stats', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM exploration_stats WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        systemsVisited: 0,
        firstDiscoveries: 0,
        totalDistanceLy: 0,
        estimatedCredits: 0,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exploration stats' });
  }
});

// Get recent discoveries
router.get('/discoveries', authenticate, async (req: any, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM discoveries WHERE user_id = $1 ORDER BY discovered_at DESC LIMIT $2 OFFSET $3',
      [req.userId, limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch discoveries' });
  }
});

// Add discovery
router.post('/discoveries', authenticate, async (req: any, res) => {
  const { systemName, bodyName, bodyType, isFirstDiscovery, scanType, estimatedValue } = req.body;

  if (!systemName || !bodyName) {
    return res.status(400).json({ error: 'systemName and bodyName are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add discovery
    const discoveryResult = await client.query(
      `INSERT INTO discoveries (user_id, system_name, body_name, body_type, is_first_discovery, scan_type, estimated_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.userId, systemName, bodyName, bodyType, isFirstDiscovery || false, scanType, estimatedValue]
    );

    // Update stats
    await client.query(
      `INSERT INTO exploration_stats (user_id, systems_visited, first_discoveries, estimated_credits)
       VALUES ($1, 1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         systems_visited = exploration_stats.systems_visited + 1,
         first_discoveries = exploration_stats.first_discoveries + $2,
         estimated_credits = exploration_stats.estimated_credits + $3,
         updated_at = NOW()`,
      [req.userId, isFirstDiscovery ? 1 : 0, estimatedValue || 0]
    );

    await client.query('COMMIT');
    res.status(201).json(discoveryResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to add discovery' });
  } finally {
    client.release();
  }
});

// Update stats (from journal)
router.post('/stats', authenticate, async (req: any, res) => {
  const { systemsVisited, distanceLy, firstDiscoveries } = req.body;

  try {
    await pool.query(
      `INSERT INTO exploration_stats (user_id, systems_visited, first_discoveries, total_distance_ly)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET
         systems_visited = exploration_stats.systems_visited + $2,
         first_discoveries = exploration_stats.first_discoveries + $3,
         total_distance_ly = exploration_stats.total_distance_ly + $4,
         updated_at = NOW()`,
      [req.userId, systemsVisited || 0, firstDiscoveries || 0, distanceLy || 0]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

export default router;