import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';
import { getIO } from '../socket.js';

const pool = getPool();
const io = getIO();

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

// Receive journal events from desktop agent
router.post('/events', authenticate, async (req: any, res) => {
  const { events } = req.body;

  if (!Array.isArray(events)) {
    return res.status(400).json({ error: 'events array required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const event of events) {
      // Store the event
      await client.query(
        'INSERT INTO journal_events (user_id, event_type, event_data) VALUES ($1, $2, $3)',
        [req.userId, event.event, JSON.stringify(event)]
      );

      // Process different event types
      switch (event.event) {
        case 'LoadGame':
          await processLoadGame(client, req.userId, event);
          break;
        case 'Shipyard':
        case 'Loadout':
          await processLoadout(client, req.userId, event);
          break;
        case 'Materials':
          await processMaterials(client, req.userId, event);
          break;
        case 'MissionAccepted':
          await processMissionAccepted(client, req.userId, event);
          break;
        case 'MissionCompleted':
          await processMissionCompleted(client, req.userId, event);
          break;
        case 'FSDJump':
          await processFSDJump(client, req.userId, event);
          break;
        case 'Scan':
          await processScan(client, req.userId, event);
          break;
        case 'Market':
          await processMarket(client, req.userId, event);
          break;
      }
    }

    await client.query('COMMIT');

    // Notify connected clients
    io.to(`user:${req.userId}`).emit('journal:synced', {
      count: events.length,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, processed: events.length });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Journal processing error:', error);
    res.status(500).json({ error: 'Failed to process events' });
  } finally {
    client.release();
  }
});

// Event processors
async function processLoadGame(client: any, userId: string, event: any) {
  await client.query(
    'UPDATE users SET commander_name = $1 WHERE id = $2',
    [event.Commander, userId]
  );
}

async function processLoadout(client: any, userId: string, event: any) {
  await client.query(
    `INSERT INTO ships (user_id, name, ship_type, loadout)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, name)
     DO UPDATE SET ship_type = $3, loadout = $4, updated_at = NOW()`,
    [userId, event.ShipName || event.Ship, event.Ship, JSON.stringify(event)]
  );
}

async function processMaterials(client: any, userId: string, event: any) {
  const materials = [
    ...(event.Materials || []).map((m: any) => ({ name: m.Name, count: m.Count, category: 'raw' })),
    ...(event.Raw || []).map((m: any) => ({ name: m.Name, count: m.Count, category: 'raw' })),
    ...(event.Manufactured || []).map((m: any) => ({ name: m.Name, count: m.Count, category: 'manufactured' })),
    ...(event.Encoded || []).map((m: any) => ({ name: m.Name, count: m.Count, category: 'encoded' })),
  ];

  for (const mat of materials) {
    const matResult = await client.query('SELECT id FROM materials WHERE name = $1', [mat.name]);

    if (matResult.rows.length > 0) {
      await client.query(
        `INSERT INTO user_inventory (user_id, material_id, count, last_updated)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, material_id)
         DO UPDATE SET count = $3, last_updated = NOW()`,
        [userId, matResult.rows[0].id, mat.count]
      );
    }
  }
}

async function processMissionAccepted(client: any, userId: string, event: any) {
  await client.query(
    `INSERT INTO missions (user_id, mission_id, name, mission_type, target_system, target_station, reward, expiry)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, event.MissionID, event.Name, event.MissionType, event.DestinationSystem, event.DestinationStation, event.Reward, event.Expiry]
  );
}

async function processMissionCompleted(client: any, userId: string, event: any) {
  await client.query(
    'UPDATE missions SET status = $1 WHERE mission_id = $2 AND user_id = $3',
    ['completed', event.MissionID, userId]
  );
}

async function processFSDJump(client: any, userId: string, event: any) {
  await client.query(
    `INSERT INTO exploration_stats (user_id, systems_visited, total_distance_ly)
     VALUES ($1, 1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET systems_visited = exploration_stats.systems_visited + 1, total_distance_ly = exploration_stats.total_distance_ly + $2`,
    [userId, event.JumpDist || 0]
  );
}

async function processScan(client: any, userId: string, event: any) {
  const isFirstDiscovery = event.ScanType === 'Detailed' || event.DistanceFromArrivalLS > 0;
  const estimatedValue = calculateScanValue(event);

  await client.query(
    `INSERT INTO discoveries (user_id, system_name, body_name, body_type, is_first_discovery, scan_type, estimated_value)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, event.StarSystem || event.SystemAddress, event.BodyName, event.PlanetClass || event.StarType, isFirstDiscovery, event.ScanType, estimatedValue]
  );

  if (isFirstDiscovery) {
    await client.query(
      `INSERT INTO exploration_stats (user_id, first_discoveries, estimated_credits)
       VALUES ($1, 1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET first_discoveries = exploration_stats.first_discoveries + 1, estimated_credits = exploration_stats.estimated_credits + $2`,
      [userId, estimatedValue]
    );
  }
}

async function processMarket(client: any, userId: string, event: any) {
  if (!event.Items) return;

  for (const item of event.Items) {
    await client.query(
      `INSERT INTO market_prices (system_name, station_name, commodity_name, buy_price, sell_price, demand, supply)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (system_name, station_name, commodity_name)
       DO UPDATE SET buy_price = $4, sell_price = $5, demand = $6, supply = $7`,
      [event.StarSystem, event.StationName, item.Name, item.BuyPrice, item.SellPrice, item.Demand, item.Stock]
    );
  }
}

function calculateScanValue(event: any): number {
  // Simplified scan value calculation
  // Real implementation would use actual ED scan value formulas
  const bodyType = event.PlanetClass || event.StarType;

  if (event.StarType) {
    return 5000; // Base star scan value
  }

  if (event.PlanetClass?.includes('Earth') || event.PlanetClass?.includes('Water')) {
    return 50000;
  }

  if (event.PlanetClass?.includes('Gas Giant')) {
    return 15000;
  }

  return 1000; // Default scan value
}

export default router;