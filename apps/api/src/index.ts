import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { Pool } from 'pg';

import authRoutes from './routes/auth.js';
import shipsRoutes from './routes/ships.js';
import materialsRoutes from './routes/materials.js';
import missionsRoutes from './routes/missions.js';
import tradingRoutes from './routes/trading.js';
import colonisationRoutes from './routes/colonisation.js';
import explorationRoutes from './routes/exploration.js';
import journalRoutes from './routes/journal.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} subscribed to updates`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io };

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Elite Companion API running on port ${PORT}`);
});