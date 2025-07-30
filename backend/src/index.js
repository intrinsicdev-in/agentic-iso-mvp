"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const auth_1 = require("./routes/auth");
const artefacts_1 = require("./routes/artefacts");
const agents_1 = require("./routes/agents");
const calendar_1 = require("./routes/calendar");
const reviews_1 = require("./routes/reviews");
const risks_1 = require("./routes/risks");
const analytics_1 = require("./routes/analytics");
const init_1 = require("./config/init");
const realtime_1 = __importDefault(require("./services/realtime"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/artefacts', artefacts_1.artefactRoutes);
app.use('/api/agents', agents_1.agentRoutes);
app.use('/api/calendar', calendar_1.calendarRoutes);
app.use('/api/reviews', reviews_1.reviewRoutes);
app.use('/api/risks', risks_1.riskRoutes);
app.use('/api/analytics', analytics_1.analyticsRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Initialize database and start server
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, init_1.initializeDatabase)();
        // Initialize real-time service
        realtime_1.default.initialize(server);
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Database connected and initialized`);
            console.log(`🔗 API available at http://localhost:${PORT}/api`);
            console.log(`🔌 WebSocket server ready for real-time features`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
