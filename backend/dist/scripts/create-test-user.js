"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = createTestUser;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestUser() {
    console.log('Creating test user...');
    try {
        const testUser = await prisma.user.upsert({
            where: { email: 'test@agenticiiso.com' },
            update: {},
            create: {
                id: 'test-user-id',
                email: 'test@agenticiiso.com',
                name: 'Test User',
                password: 'hashed-password', // In production, this would be properly hashed
                role: 'SUPER_ADMIN'
            }
        });
        console.log('✅ Test user created:', testUser);
    }
    catch (error) {
        console.error('❌ Error creating test user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    createTestUser();
}
//# sourceMappingURL=create-test-user.js.map