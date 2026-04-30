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

// Get trade routes
router.get('/routes', authenticate, async (req: any, res) => {
  const { originSystem, maxJumpRange, cargoCapacity } = req.query;

  if (!originSystem) {
    return res.status(400).json({ error: 'originSystem is required' });
  }

  try {
    // Find profitable routes based on market data
    // This is a simplified version - real implementation would use more complex algorithms
    const result = await pool.query(
      `SELECT
        mp1.system_name as from_system,
        mp1.station_name as from_station,
        mp2.system_name as to_system,
        mp2.station_name as to_station,
        mp1.commodity_name,
        mp2.sell_price - mp1.buy_price as profit_per_unit
       FROM market_prices mp1
       JOIN market_prices mp2 ON mp1.commodity_name = mp2.commodity_name
       WHERE mp1.system_name = $1
         AND mp1.buy_price > 0
         AND mp2.sell_price > mp1.buy_price
       ORDER BY profit_per_unit DESC
       LIMIT 20`,
      [originSystem]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to find trade routes' });
  }
});

// Get commodities list
router.get('/commodities', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT commodity_name FROM market_prices ORDER BY commodity_name'
    );
    res.json(result.rows.map((r: any) => r.commodity_name));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commodities' });
  }
});

// Search systems
router.get('/systems', authenticate, async (req: any, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      'SELECT DISTINCT system_name FROM market_prices WHERE system_name ILIKE $1 ORDER BY system_name LIMIT 20',
      [`%${q}%`]
    );
    res.json(result.rows.map((r: any) => r.system_name));
  } catch (error) {
    res.status(500).json({ error: 'Failed to search systems' });
  }
});

// Update market prices (from journal)
router.post('/market', authenticate, async (req: any, res) => {
  const { systemName, stationName, commodities } = req.body;

  if (!systemName || !stationName || !Array.isArray(commodities)) {
    return res.status(400).json({ error: 'systemName, stationName, and commodities array required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const commodity of commodities) {
      await client.query(
        `INSERT INTO market_prices (system_name, station_name, commodity_name, buy_price, sell_price, demand, supply, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (system_name, station_name, commodity_name)
         DO UPDATE SET buy_price = $4, sell_price = $5, demand = $6, supply = $7, updated_at = NOW()`,
        [systemName, stationName, commodity.name, commodity.buyPrice, commodity.sellPrice, commodity.demand, commodity.supply]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, updated: commodities.length });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to update market prices' });
  } finally {
    client.release();
  }
});

export default router;