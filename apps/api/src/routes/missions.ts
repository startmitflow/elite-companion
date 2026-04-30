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

// Get missions (filterable by status)
router.get('/', authenticate, async (req: any, res) => {
  const { status } = req.query;

  try {
    let query = 'SELECT * FROM missions WHERE user_id = $1';
    const params: any[] = [req.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// Create mission
router.post('/', authenticate, async (req: any, res) => {
  const { missionId, name, missionType, targetSystem, targetStation, reward, expiry } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO missions (user_id, mission_id, name, mission_type, target_system, target_station, reward, expiry)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.userId, missionId, name, missionType, targetSystem, targetStation, reward, expiry]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mission' });
  }
});

// Update mission
router.put('/:id', authenticate, async (req: any, res) => {
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE missions SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mission' });
  }
});

// Delete mission
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM missions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mission' });
  }
});

export default router;