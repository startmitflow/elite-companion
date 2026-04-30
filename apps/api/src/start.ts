import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPool, getPool } from './db.js';
import { initSocket, getIO } from './socket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Initialize database
const pool = initPool(
  process.env.DATABASE_URL!,
  process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
);

// Initialize socket.io
const io = initSocket(httpServer, process.env.FRONTEND_URL || 'http://localhost:3000');

// Run migrations on startup (for production)
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const initSql = fs.readFileSync(path.join(__dirname, 'db', 'init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Seed materials if needed
async function seedMaterials() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM materials');
    if (parseInt(result.rows[0].count) === 0) {
      console.log('Seeding materials...');
      const materials = [
        // Raw materials
        ['Carbon', 'raw', 1], ['Iron', 'raw', 1], ['Nickel', 'raw', 1], ['Phosphorus', 'raw', 1], ['Sulphur', 'raw', 1],
        ['Chromium', 'raw', 2], ['Germanium', 'raw', 2], ['Manganese', 'raw', 2], ['Vanadium', 'raw', 2], ['Zinc', 'raw', 2],
        ['Arsenic', 'raw', 3], ['Cadmium', 'raw', 3], ['Mercury', 'raw', 3], ['Molybdenum', 'raw', 3], ['Niobium', 'raw', 3],
        ['Antimony', 'raw', 4], ['Polonium', 'raw', 4], ['Ruthenium', 'raw', 4], ['Technetium', 'raw', 4], ['Tellurium', 'raw', 4],
        ['Yttrium', 'raw', 4], ['Tin', 'raw', 3], ['Tungsten', 'raw', 3],
        // Manufactured materials
        ['Basic Conductors', 'manufactured', 1], ['Chemical Storage Units', 'manufactured', 1],
        ['Compact Composites', 'manufactured', 1], ['Heat Conduits', 'manufactured', 1],
        ['Hybrid Capacitors', 'manufactured', 1], ['Mechanical Components', 'manufactured', 1],
        ['Micro Controllers', 'manufactured', 1], ['Power Converters', 'manufactured', 1],
        ['Chemical Processors', 'manufactured', 2], ['Conductive Components', 'manufactured', 2],
        ['Grid Resistors', 'manufactured', 2], ['Heat Exchangers', 'manufactured', 2],
        ['Mechanical Equipment', 'manufactured', 2], ['Polymer Capacitors', 'manufactured', 2],
        ['Shield Emitters', 'manufactured', 2], ['Focus Crystals', 'manufactured', 3],
        ['Heat Vanes', 'manufactured', 3], ['High Density Composites', 'manufactured', 3],
        ['Mechanical Scrap', 'manufactured', 3], ['Phase Alloys', 'manufactured', 3],
        ['Propellant Tanks', 'manufactured', 3], ['Shielding Sensors', 'manufactured', 3],
        ['Compound Shielding', 'manufactured', 4], ['Configurable Components', 'manufactured', 4],
        ['Feed Resonators', 'manufactured', 4], ['Heat Resistant Ceramics', 'manufactured', 4],
        ['Imperial Shielding', 'manufactured', 4], ['Refined Focus Crystals', 'manufactured', 4],
        ['Thermic Alloys', 'manufactured', 4], ['Biotech Conductors', 'manufactured', 5],
        ['Core Dynamics Composites', 'manufactured', 5], ['Filament Composites', 'manufactured', 5],
        ['Improvised Components', 'manufactured', 5], ['Military Grade Alloys', 'manufactured', 5],
        ['Military Supercapacitors', 'manufactured', 5], ['Proto Heat Radiators', 'manufactured', 5],
        // Encoded materials
        ['Abnormal Compact Commissions Data', 'encoded', 1], ['Anomalous Bulk Scan Data', 'encoded', 1],
        ['Atypical Disrupted Echoes', 'encoded', 1], ['Atypical Encryption Codes', 'encoded', 1],
        ['Cracked Industrial Firmware', 'encoded', 1], ['Distorted Shield Cycle Recordings', 'encoded', 1],
        ['Inconsistent Shield Data', 'encoded', 1], ['Irregular Emission Data', 'encoded', 1],
        ['Specialized Legacy Firmware', 'encoded', 1], ['Unexpected Emission Data', 'encoded', 1],
        ['Abnormal Correlated Emission Data', 'encoded', 2], ['Archived Emission Data', 'encoded', 2],
        ['Compact Emission Data', 'encoded', 2], ['Diverted Emission Data', 'encoded', 2],
        ['Exceptional Scrambled Emission Data', 'encoded', 2],
        ['Adaptive Encryptors', 'encoded', 3], ['Classified Scan Databanks', 'encoded', 3],
        ['Datamined Wake Exceptions', 'encoded', 3], ['Decoded Emission Data', 'encoded', 3],
        ['Diversified Emission Data', 'encoded', 3],
        ['Classified Scan Fragment', 'encoded', 4],
        ['Peculiar Shield Frequency Data', 'encoded', 5], ['Tagged Encryption Codes', 'encoded', 5],
      ];

      for (const [name, category, rarity] of materials) {
        await pool.query(
          'INSERT INTO materials (name, category, rarity) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
          [name, category, rarity]
        );
      }
      console.log('Materials seeded successfully');
    }
  } catch (error) {
    console.error('Seed error:', error);
  }
}

// Start server
const startServer = async () => {
  await runMigrations();
  await seedMaterials();

  // Import routes
  const { default: authRoutes } = await import('./routes/auth.js');
  const { default: shipsRoutes } = await import('./routes/ships.js');
  const { default: materialsRoutes } = await import('./routes/materials.js');
  const { default: missionsRoutes } = await import('./routes/missions.js');
  const { default: tradingRoutes } = await import('./routes/trading.js');
  const { default: colonisationRoutes } = await import('./routes/colonisation.js');
  const { default: explorationRoutes } = await import('./routes/exploration.js');
  const { default: journalRoutes } = await import('./routes/journal.js');

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });
  app.use('/api/', limiter);

  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api/ships', shipsRoutes);
  app.use('/api/materials', materialsRoutes);
  app.use('/api/missions', missionsRoutes);
  app.use('/api/trading', tradingRoutes);
  app.use('/api/colonisation', colonisationRoutes);
  app.use('/api/exploration', explorationRoutes);
  app.use('/api/journal', journalRoutes);

  // WebSocket
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('subscribe', (userId: string) => {
      socket.join(`user:${userId}`);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Elite Companion API running on port ${PORT}`);
  });
};

startServer().catch(console.error);