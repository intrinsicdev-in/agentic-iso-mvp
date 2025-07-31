import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateToOrganizations() {
  try {
    console.log('🚀 Starting migration to organizations...');

    // Create a default organization
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        name: 'Default Organization',
        slug: 'default',
        description: 'Default organization for existing users',
        isActive: true
      }
    });

    console.log(`✅ Created default organization: ${defaultOrg.name}`);

    // Create default organization settings
    await prisma.organizationSettings.upsert({
      where: { organizationId: defaultOrg.id },
      update: {},
      create: {
        organizationId: defaultOrg.id,
        enabledStandards: ['ISO_9001_2015', 'ISO_27001_2022'],
        enableAIAgents: true,
        enableReports: true,
        enableAuditLogs: true,
        enforcePasswordPolicy: true,
        require2FA: false,
        sessionTimeout: 1440,
        maxFileSize: 50,
        maxTotalStorage: 1000
      }
    });

    console.log('✅ Created default organization settings');

    // Create super admin user
    const superAdminPassword = 'SuperAdmin123!';
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {},
      create: {
        email: 'superadmin@example.com',
        name: 'Super Administrator',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        organizationId: null // Super admin doesn't belong to any organization
      }
    });

    console.log(`✅ Created super admin user: ${superAdmin.email}`);
    console.log(`📝 Super admin password: ${superAdminPassword}`);

    // Create account admin for default organization
    const accountAdminPassword = 'AccountAdmin123!';
    const accountAdminHashed = await bcrypt.hash(accountAdminPassword, 10);

    const accountAdmin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        name: 'Account Administrator',
        password: accountAdminHashed,
        role: 'ACCOUNT_ADMIN',
        isActive: true,
        organizationId: defaultOrg.id
      }
    });

    console.log(`✅ Created account admin user: ${accountAdmin.email}`);
    console.log(`📝 Account admin password: ${accountAdminPassword}`);

    // Update all existing users to belong to default organization and set role to USER
    const existingUsers = await prisma.user.findMany({
      where: {
        NOT: {
          email: {
            in: ['superadmin@example.com', 'admin@example.com']
          }
        }
      }
    });

    for (const user of existingUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          organizationId: defaultOrg.id,
          role: 'USER'
        }
      });
    }

    console.log(`✅ Updated ${existingUsers.length} existing users to belong to default organization`);

    // Update all existing artefacts to belong to default organization
    const existingArtefacts = await prisma.artefact.findMany();

    for (const artefact of existingArtefacts) {
      await prisma.artefact.update({
        where: { id: artefact.id },
        data: {
          organizationId: defaultOrg.id
        }
      });
    }

    console.log(`✅ Updated ${existingArtefacts.length} existing artefacts to belong to default organization`);

    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Default organization: ${defaultOrg.name} (${defaultOrg.slug})`);
    console.log(`   - Super admin: ${superAdmin.email} (password: ${superAdminPassword})`);
    console.log(`   - Account admin: ${accountAdmin.email} (password: ${accountAdminPassword})`);
    console.log(`   - Migrated ${existingUsers.length} users`);
    console.log(`   - Migrated ${existingArtefacts.length} artefacts`);
    console.log('');
    console.log('⚠️  Please save these credentials securely!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateToOrganizations();
}

export { migrateToOrganizations };