"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const artefacts_1 = __importDefault(require("./routes/artefacts"));
const events_1 = __importDefault(require("./routes/events"));
const ai_suggestions_1 = __importDefault(require("./routes/ai-suggestions"));
const onboarding_1 = __importDefault(require("./routes/onboarding"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const responsibility_matrix_1 = __importDefault(require("./routes/responsibility-matrix"));
const proxy_1 = __importDefault(require("./routes/proxy"));
const auth_1 = __importDefault(require("./routes/auth"));
const organizations_1 = __importDefault(require("./routes/organizations"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const prisma = new client_1.PrismaClient();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://yourproductiondomain.com']
        : true, // Allow all origins in development
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
    }
    catch (error) {
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
app.use('/api/auth', auth_1.default);
app.use('/api/organizations', organizations_1.default);
app.use('/api/artefacts', artefacts_1.default);
app.use('/api/events', events_1.default);
app.use('/api/ai-suggestions', ai_suggestions_1.default);
app.use('/api/onboarding', onboarding_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/responsibility-matrix', responsibility_matrix_1.default);
app.use('/api', proxy_1.default);
app.get('/api/iso-clauses', async (req, res) => {
    try {
        const { standard } = req.query;
        const clauses = await prisma.iSOClause.findMany({
            where: standard ? { standard: standard } : undefined,
            orderBy: { clauseNumber: 'asc' }
        });
        res.json(clauses);
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Error handling middleware
app.use((error, req, res, next) => {
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
//# sourceMappingURL=index.js.map