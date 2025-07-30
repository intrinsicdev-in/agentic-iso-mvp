import sequelize from './database';
import User from '../models/User';
import Artefact from '../models/Artefact';
import Agent from '../models/Agent';

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models with the database
    await sequelize.sync({ force: true }); // This will drop and recreate tables
    console.log('✅ Database models synchronized.');
    
    // Create a test user
    const testUser = await User.create({
      email: 'test@agenticiso.com',
      password: 'test123',
      name: 'Test User',
      role: 'viewer',
    });
    console.log('✅ Test user created:', testUser.email);
    
    // Create a test artefact
    const testArtefact = await Artefact.create({
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
    const testAgent = await Agent.create({
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
    const users = await User.findAll();
    const artefacts = await Artefact.findAll();
    const agents = await Agent.findAll();
    
    console.log(`✅ Database test completed successfully!`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Artefacts: ${artefacts.length}`);
    console.log(`   - Agents: ${agents.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

testDatabase(); 