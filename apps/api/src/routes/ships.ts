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

// Get all ships for user
router.get('/', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ships WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ships' });
  }
});

// Get single ship
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ships WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ship' });
  }
});

// Create ship
router.post('/', authenticate, async (req: any, res) => {
  const { name, shipType, loadout } = req.body;

  if (!name || !shipType || !loadout) {
    return res.status(400).json({ error: 'Name, shipType, and loadout are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO ships (user_id, name, ship_type, loadout) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.userId, name, shipType, JSON.stringify(loadout)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ship' });
  }
});

// Update ship
router.put('/:id', authenticate, async (req: any, res) => {
  const { name, shipType, loadout, isFavorite } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM ships WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    const result = await pool.query(
      `UPDATE ships SET
        name = COALESCE($1, name),
        ship_type = COALESCE($2, ship_type),
        loadout = COALESCE($3, loadout),
        is_favorite = COALESCE($4, is_favorite),
        updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *`,
      [name, shipType, loadout ? JSON.stringify(loadout) : null, isFavorite, req.params.id, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ship' });
  }
});

// Delete ship
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM ships WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ship' });
  }
});

export default router;