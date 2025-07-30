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
const database_1 = __importDefault(require("./database"));
const User_1 = __importDefault(require("../models/User"));
const Artefact_1 = __importDefault(require("../models/Artefact"));
const Agent_1 = __importDefault(require("../models/Agent"));
function testDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 Testing database connection...');
            // Test the connection
            yield database_1.default.authenticate();
            console.log('✅ Database connection established successfully.');
            // Sync all models with the database
            yield database_1.default.sync({ force: true }); // This will drop and recreate tables
            console.log('✅ Database models synchronized.');
            // Create a test user
            const testUser = yield User_1.default.create({
                email: 'test@agenticiso.com',
                password: 'test123',
                name: 'Test User',
                role: 'viewer',
            });
            console.log('✅ Test user created:', testUser.email);
            // Create a test artefact
            const testArtefact = yield Artefact_1.default.create({
                title: 'Test Policy',
                type: 'policy',
                clause: 'ISO 9001:2015 - 5.2',
                content: 'This is a test policy content.',
                ownerId: testUser.id,
                createdById: testUser.id,
                lastUpdatedById: testUser.id,
                version: '1.0',
                status: 'draft'
            });
            console.log('✅ Test artefact created:', testArtefact.title);
            // Create a test agent
            const testAgent = yield Agent_1.default.create({
                name: 'Test Agent',
                type: 'risk_management',
                description: 'A test agent for database testing',
                status: 'active',
                config: {
                    enabled: true,
                    autoReview: false,
                    notificationSettings: { email: true, slack: false }
                }
            });
            console.log('✅ Test agent created:', testAgent.name);
            // Test fetching data
            const users = yield User_1.default.findAll();
            const artefacts = yield Artefact_1.default.findAll();
            const agents = yield Agent_1.default.findAll();
            console.log(`✅ Database test completed successfully!`);
            console.log(`   - Users: ${users.length}`);
            console.log(`   - Artefacts: ${artefacts.length}`);
            console.log(`   - Agents: ${agents.length}`);
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Database test failed:', error);
            process.exit(1);
        }
    });
}
testDatabase();
