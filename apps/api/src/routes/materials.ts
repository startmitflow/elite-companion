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

// Get all materials
router.get('/', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM materials ORDER BY category, rarity, name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Get user inventory
router.get('/inventory', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.name, m.category, m.rarity, ui.count, ui.last_updated
       FROM materials m
       LEFT JOIN user_inventory ui ON m.id = ui.material_id AND ui.user_id = $1
       ORDER BY m.category, m.rarity, m.name`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Sync inventory from journal
router.post('/inventory/sync', authenticate, async (req: any, res) => {
  const { materials } = req.body; // Array of { name, count }

  if (!Array.isArray(materials)) {
    return res.status(400).json({ error: 'Materials array required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const mat of materials) {
      const matResult = await client.query(
        'SELECT id FROM materials WHERE name = $1',
        [mat.name]
      );

      if (matResult.rows.length > 0) {
        const matId = matResult.rows[0].id;
        await client.query(
          `INSERT INTO user_inventory (user_id, material_id, count, last_updated)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, material_id)
           DO UPDATE SET count = $3, last_updated = NOW()`,
          [req.userId, matId, mat.count]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, updated: materials.length });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to sync inventory' });
  } finally {
    client.release();
  }
});

// Update single material count
router.put('/inventory/:materialId', authenticate, async (req: any, res) => {
  const { count } = req.body;
  const materialId = req.params.materialId;

  try {
    const result = await pool.query(
      `INSERT INTO user_inventory (user_id, material_id, count, last_updated)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id, material_id)
       DO UPDATE SET count = $3, last_updated = NOW()
       RETURNING *`,
      [req.userId, materialId, count]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update material' });
  }
});

export default router;