import { Router } from 'express';
import analyticsService from '../services/analytics';

const router = Router();

// Get compliance metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await analyticsService.getComplianceMetrics();
    res.json({ metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch compliance metrics' });
  }
});

// Get agent performance
router.get('/agents/performance', async (req, res) => {
  try {
    const performance = await analyticsService.getAgentPerformance();
    res.json({ performance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent performance' });
  }
});

// Get audit readiness
router.get('/audit-readiness', async (req, res) => {
  try {
    const readiness = await analyticsService.getAuditReadiness();
    res.json({ readiness });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit readiness' });
  }
});

// Get trends data
router.get('/trends', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const trends = await analyticsService.getTrends(period as 'week' | 'month' | 'quarter');
    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

// Generate comprehensive compliance report
router.get('/report', async (req, res) => {
  try {
    const report = await analyticsService.generateComplianceReport();
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// Get dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const [metrics, performance, readiness] = await Promise.all([
      analyticsService.getComplianceMetrics(),
      analyticsService.getAgentPerformance(),
      analyticsService.getAuditReadiness()
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
});

export const analyticsRoutes = router; 