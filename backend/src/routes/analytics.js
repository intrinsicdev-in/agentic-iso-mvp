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
exports.analyticsRoutes = void 0;
const express_1 = require("express");
const analytics_1 = __importDefault(require("../services/analytics"));
const router = (0, express_1.Router)();
// Get compliance metrics
router.get('/metrics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const metrics = yield analytics_1.default.getComplianceMetrics();
        res.json({ metrics });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch compliance metrics' });
    }
}));
// Get agent performance
router.get('/agents/performance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const performance = yield analytics_1.default.getAgentPerformance();
        res.json({ performance });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch agent performance' });
    }
}));
// Get audit readiness
router.get('/audit-readiness', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const readiness = yield analytics_1.default.getAuditReadiness();
        res.json({ readiness });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit readiness' });
    }
}));
// Get trends data
router.get('/trends', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { period = 'month' } = req.query;
        const trends = yield analytics_1.default.getTrends(period);
        res.json({ trends });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch trends data' });
    }
}));
// Generate comprehensive compliance report
router.get('/report', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const report = yield analytics_1.default.generateComplianceReport();
        res.json({ report });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate compliance report' });
    }
}));
// Get dashboard summary
router.get('/dashboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [metrics, performance, readiness] = yield Promise.all([
            analytics_1.default.getComplianceMetrics(),
            analytics_1.default.getAgentPerformance(),
            analytics_1.default.getAuditReadiness()
        ]);
        const summary = {
            complianceScore: metrics.complianceScore,
            totalArtefacts: metrics.totalArtefacts,
            pendingReviews: metrics.pendingReviews,
            activeRisks: metrics.activeRisks,
            overdueDeadlines: metrics.overdueDeadlines,
            activeAgents: performance.length,
            auditReadiness: readiness.overallReadiness,
            lastUpdated: new Date()
        };
        res.json({ summary });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
}));
exports.analyticsRoutes = router;
