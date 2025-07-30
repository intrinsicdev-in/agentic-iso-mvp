import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { authRoutes } from './routes/auth';
import { artefactRoutes } from './routes/artefacts';
import { agentRoutes } from './routes/agents';
import { calendarRoutes } from './routes/calendar';
import { reviewRoutes } from './routes/reviews';
import { riskRoutes } from './routes/risks';
import { analyticsRoutes } from './routes/analytics';
import { initializeDatabase } from './config/init';
import realtimeService from './services/realtime';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artefacts', artefactRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initializeDatabase();
    
    // Initialize real-time service
    realtimeService.initialize(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database connected and initialized`);
      console.log(`🔗 API available at http://localhost:${PORT}/api`);
      console.log(`🔌 WebSocket server ready for real-time features`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 