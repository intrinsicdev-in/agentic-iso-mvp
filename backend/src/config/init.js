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
exports.initializeDatabase = void 0;
const database_1 = __importDefault(require("./database"));
const User_1 = __importDefault(require("../models/User"));
const Artefact_1 = __importDefault(require("../models/Artefact"));
const Agent_1 = __importDefault(require("../models/Agent"));
// Import all models to ensure they are registered
const models = {
    User: User_1.default,
    Artefact: Artefact_1.default,
    Agent: Agent_1.default,
};
const initializeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test the connection
        yield database_1.default.authenticate();
        console.log('✅ Database connection established successfully.');
        // Sync all models with the database
        yield database_1.default.sync({ alter: true });
        console.log('✅ Database models synchronized.');
        // Create default admin user if it doesn't exist
        const adminUser = yield User_1.default.findOne({ where: { email: 'admin@agenticiso.com' } });
        if (!adminUser) {
            yield User_1.default.create({
                email: 'admin@agenticiso.com',
                password: 'admin123',
                name: 'Admin User',
                role: 'admin',
            });
            console.log('✅ Default admin user created.');
        }
        // Create default AI agents if they don't exist
        const defaultAgents = [
            {
                name: 'Risk Register Agent',
                type: 'risk_management',
                description: 'Identifies and manages risks across ISO 27001/9001',
                status: 'active',
                config: {
                    enabled: true,
                    autoReview: false,
                    notificationSettings: { email: true, slack: false },
                    specializations: ['ISO 9001', 'ISO 27001']
                }
            },
            {
                name: 'Policy Optimiser Agent',
                type: 'policy_optimization',
                description: 'Suggests improvements to policies and procedures',
                status: 'active',
                config: {
                    enabled: true,
                    autoReview: false,
                    notificationSettings: { email: true, slack: false },
                    specializations: ['ISO 9001', 'ISO 27001']
                }
            },
            {
                name: 'Audit Preparer Agent',
                type: 'audit_preparation',
                description: 'Compiles documentation ahead of audits',
                status: 'active',
                config: {
                    enabled: true,
                    autoReview: false,
                    notificationSettings: { email: true, slack: false },
                    specializations: ['ISO 9001', 'ISO 27001']
                }
            },
            {
                name: 'Training Compliance Agent',
                type: 'training_compliance',
                description: 'Tracks required training events and coverage',
                status: 'active',
                config: {
                    enabled: true,
                    autoReview: false,
                    notificationSettings: { email: true, slack: false },
                    specializations: ['ISO 9001', 'ISO 27001']
                }
            }
        ];
        for (const agentData of defaultAgents) {
            const existingAgent = yield Agent_1.default.findOne({ where: { name: agentData.name } });
            if (!existingAgent) {
                yield Agent_1.default.create(agentData);
            }
        }
        console.log('✅ Default AI agents created.');
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
});
exports.initializeDatabase = initializeDatabase;
exports.default = models;
