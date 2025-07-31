import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import artefactRoutes from './routes/artefacts';
import eventRoutes from './routes/events';
import aiSuggestionRoutes from './routes/ai-suggestions';
import onboardingRoutes from './routes/onboarding';
import taskRoutes from './routes/tasks';
import responsibilityMatrixRoutes from './routes/responsibility-matrix';
import proxyRoutes from './routes/proxy';
import authRoutes from './routes/auth';
import organizationRoutes from './routes/organizations';
import dashboardRoutes from './routes/dashboard';
import auditLogRoutes from './routes/audit-logs';
import masterDocumentListRoutes from './routes/master-document-list';
import documentAnalysisRoutes from './routes/document-analysis';
import documentRelationshipRoutes from './routes/document-relationships';
import duplicateManagementRoutes from './routes/duplicate-management';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourproductiondomain.com'] 
    : true, // Allow all origins in development
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root route with API info
app.get('/', (req, res) => {
  res.json({
    name: 'ETS Aero ISO Backend API',
    version: '1.0.0',
    status: 'Running',
    endpoints: {
      health: 'GET /health',
      database: 'GET /db-test',
      artefacts: 'GET /api/artefacts',
      isoClauses: 'GET /api/iso-clauses?standard=ISO_9001_2015',
      responsibilityMatrix: 'GET /api/responsibility-matrix',
      masterDocumentList: 'GET /api/master-document-list',
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API health check (for frontend proxy)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Test database connection
app.get('/db-test', async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: 'Database connected successfully' });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ status: 'Database connection failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Debug middleware to log all requests
app.use('/api', (req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/artefacts', artefactRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai-suggestions', aiSuggestionRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/responsibility-matrix', responsibilityMatrixRoutes);
app.use('/api/master-document-list', masterDocumentListRoutes);
app.use('/api/document-analysis', documentAnalysisRoutes);
app.use('/api/document-relationships', documentRelationshipRoutes);
app.use('/api/duplicates', duplicateManagementRoutes);
app.use('/api', proxyRoutes);

app.get('/api/iso-clauses', async (req, res) => {
  try {
    const { standard } = req.query;
    const clauses = await prisma.iSOClause.findMany({
      where: standard ? { standard: standard as any } : undefined,
      orderBy: { clauseNumber: 'asc' }
    });
    res.json(clauses);
  } catch (error) {
    console.error('Error fetching ISO clauses:', error);
    res.status(500).json({ error: 'Failed to fetch ISO clauses' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      },
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Agentic ISO Backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});