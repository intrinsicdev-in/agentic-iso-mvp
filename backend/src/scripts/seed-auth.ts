import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAuth() {
  console.log('🌱 Seeding authentication data...');
  
  try {
    // Create test organization
    const testOrg = await prisma.organization.upsert({
      where: { slug: 'test-org' },
      update: {},
      create: {
        name: 'Test Organization',
        slug: 'test-org',
        description: 'Test organization for development',
        isActive: true,
        settings: {
          create: {
            enabledStandards: ['ISO_9001_2015', 'ISO_27001_2022'],
            enableAIAgents: true,
            enableReports: true,
            enableAuditLogs: true
          }
        }
      }
    });

    // Create Super Admin user
    const superAdminPassword = await bcrypt.hash('SuperAdmin123!', 10);
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {},
      create: {
        email: 'superadmin@example.com',
        name: 'Super Admin',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });

    // Create Account Admin user
    const accountAdminPassword = await bcrypt.hash('AccountAdmin123!', 10);
    const accountAdmin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Account Admin',
        password: accountAdminPassword,
        role: 'ACCOUNT_ADMIN',
        organizationId: testOrg.id,
        isActive: true
      }
    });

    // Create Regular User
    const userPassword = await bcrypt.hash('User123!', 10);
    const regularUser = await prisma.user.upsert({
      where: { email: 'user@example.com' },
      update: {},
      create: {
        email: 'user@example.com',
        name: 'Regular User',
        password: userPassword,
        role: 'USER',
        organizationId: testOrg.id,
        isActive: true
      }
    });

    // Create legacy test user for backwards compatibility
    const testUser = await prisma.user.upsert({
      where: { email: 'test@agenticiiso.com' },
      update: {},
      create: {
        id: 'test-user-id',
        email: 'test@agenticiiso.com',
        name: 'Test User',
        password: await bcrypt.hash('test123', 10),
        role: 'USER',
        organizationId: testOrg.id,
        isActive: true
      }
    });

    console.log('✅ Authentication data seeded successfully!');
    console.log('📋 Test accounts created:');
    console.log(`  Super Admin: ${superAdmin.email} / SuperAdmin123!`);
    console.log(`  Account Admin: ${accountAdmin.email} / AccountAdmin123!`);
    console.log(`  Regular User: ${regularUser.email} / User123!`);
    console.log(`  Legacy Test User: ${testUser.email} / test123`);
    
  } catch (error) {
    console.error('❌ Error seeding authentication data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAuth();
}

export { seedAuth };