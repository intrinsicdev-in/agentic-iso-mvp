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
exports.agentRoutes = void 0;
const express_1 = require("express");
const Agent_1 = __importDefault(require("../models/Agent"));
const router = (0, express_1.Router)();
// Get all AI agents
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agents = yield Agent_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ agents });
    }
    catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
}));
// Get agent by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const agent = yield Agent_1.default.findByPk(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({ agent });
    }
    catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ error: 'Failed to fetch agent' });
    }
}));
// Get agent suggestions
router.get('/:id/suggestions', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // For now, return mock suggestions
        // In a real app, this would query a suggestions table
        const suggestions = [
            {
                id: 1,
                agentId: parseInt(id),
                type: 'policy_update',
                title: 'Update Quality Policy for ISO 9001:2015 Clause 5.2',
                description: 'The current quality policy should be updated to better align with customer focus requirements.',
                status: 'pending_review',
                priority: 'medium',
                createdAt: '2024-01-15T10:00:00Z',
                content: 'Recommend updating section 3.2 to include...'
            },
            {
                id: 2,
                agentId: parseInt(id),
                type: 'risk_assessment',
                title: 'New Risk Identified: Data Breach',
                description: 'Potential risk of data breach due to outdated access controls.',
                status: 'approved',
                priority: 'high',
                createdAt: '2024-01-14T15:30:00Z',
                content: 'Risk assessment reveals vulnerability in...'
            }
        ];
        res.json({ suggestions });
    }
    catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
}));
// Approve/reject suggestion
router.post('/suggestions/:id/review', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { action, comment } = req.body; // action: 'approve' | 'reject'
        // TODO: Implement actual approval logic with database
        res.json({
            success: true,
            message: `Suggestion ${action}ed successfully`,
            suggestionId: parseInt(id)
        });
    }
    catch (error) {
        console.error('Error reviewing suggestion:', error);
        res.status(500).json({ error: 'Failed to review suggestion' });
    }
}));
// Get agent configuration
router.get('/:id/config', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const agent = yield Agent_1.default.findByPk(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        res.json({ config: agent.config });
    }
    catch (error) {
        console.error('Error fetching agent configuration:', error);
        res.status(500).json({ error: 'Failed to fetch agent configuration' });
    }
}));
// Update agent configuration
router.put('/:id/config', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const config = req.body;
        const agent = yield Agent_1.default.findByPk(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        yield agent.update({ config });
        res.json({
            success: true,
            message: 'Agent configuration updated successfully',
            config: agent.config
        });
    }
    catch (error) {
        console.error('Error updating agent configuration:', error);
        res.status(500).json({ error: 'Failed to update agent configuration' });
    }
}));
// Create new agent
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, type, description, config } = req.body;
        if (!name || !type || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const newAgent = yield Agent_1.default.create({
            name,
            type,
            description,
            config: config || {},
            status: 'active'
        });
        res.status(201).json({ agent: newAgent });
    }
    catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
}));
// Update agent
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, type, description, status, config } = req.body;
        const agent = yield Agent_1.default.findByPk(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        yield agent.update(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (name && { name })), (type && { type })), (description && { description })), (status && { status })), (config && { config })));
        res.json({
            success: true,
            agent,
            message: 'Agent updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Failed to update agent' });
    }
}));
// Delete agent
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const agent = yield Agent_1.default.findByPk(id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        yield agent.destroy();
        res.json({
            success: true,
            message: 'Agent deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ error: 'Failed to delete agent' });
    }
}));
exports.agentRoutes = router;
