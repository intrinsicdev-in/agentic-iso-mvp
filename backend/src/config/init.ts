import sequelize from './database';
import User from '../models/User';
import Artefact from '../models/Artefact';
import Agent from '../models/Agent';

// Import all models to ensure they are registered
const models = {
  User,
  Artefact,
  Agent,
};

export const initializeDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models with the database
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');

    // Create default admin user if it doesn't exist
    const adminUser = await User.findOne({ where: { email: 'admin@agenticiso.com' } });
    if (!adminUser) {
      await User.create({
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
        type: 'risk_management' as const,
        description: 'Identifies and manages risks across ISO 27001/9001',
        status: 'active' as const,
        config: {
          enabled: true,
          autoReview: false,
          notificationSettings: { email: true, slack: false },
          specializations: ['ISO 9001', 'ISO 27001']
        }
      },
      {
        name: 'Policy Optimiser Agent',
        type: 'policy_optimization' as const,
        description: 'Suggests improvements to policies and procedures',
        status: 'active' as const,
        config: {
          enabled: true,
          autoReview: false,
          notificationSettings: { email: true, slack: false },
          specializations: ['ISO 9001', 'ISO 27001']
        }
      },
      {
        name: 'Audit Preparer Agent',
        type: 'audit_preparation' as const,
        description: 'Compiles documentation ahead of audits',
        status: 'active' as const,
        config: {
          enabled: true,
          autoReview: false,
          notificationSettings: { email: true, slack: false },
          specializations: ['ISO 9001', 'ISO 27001']
        }
      },
      {
        name: 'Training Compliance Agent',
        type: 'training_compliance' as const,
        description: 'Tracks required training events and coverage',
        status: 'active' as const,
        config: {
          enabled: true,
          autoReview: false,
          notificationSettings: { email: true, slack: false },
          specializations: ['ISO 9001', 'ISO 27001']
        }
      }
    ];

    for (const agentData of defaultAgents) {
      const existingAgent = await Agent.findOne({ where: { name: agentData.name } });
      if (!existingAgent) {
        await Agent.create(agentData);
      }
    }
    console.log('✅ Default AI agents created.');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export default models; 