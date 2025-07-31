"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const relationship_document_matcher_1 = require("../utils/relationship-document-matcher");
const prisma = new client_1.PrismaClient();
async function testRelationshipMatching() {
    console.log('🧪 Testing Document Relationship Matching Logic...\n');
    // Create a test organization with unique slug
    const timestamp = Date.now();
    const testOrg = await prisma.organization.create({
        data: {
            name: 'Test Organization',
            slug: `test-org-${timestamp}`,
            description: 'Test organization for relationship matching'
        }
    });
    // Create a test user
    const testUser = await prisma.user.create({
        data: {
            email: 'test@example.com',
            name: 'Test User',
            password: 'hashedpassword',
            organizationId: testOrg.id
        }
    });
    console.log(`📋 Created test organization: ${testOrg.name}\n`);
    try {
        // Test Scenario 1: Quality & ISMS Manual that should fulfill multiple requirements
        console.log('📄 Test Scenario 1: Quality & ISMS Manual');
        const qualityManual = await prisma.artefact.create({
            data: {
                title: 'Quality & ISMS Manual v2.1',
                description: 'Comprehensive manual covering quality management and information security management systems',
                documentType: client_1.DocumentType.MANUAL,
                ownerId: testUser.id,
                organizationId: testOrg.id
            }
        });
        console.log(`  ✅ Created: ${qualityManual.title}`);
        // Test Scenario 2: Individual documents that should be covered by the manual
        console.log('\n📄 Test Scenario 2: Individual documents');
        const riskLog = await prisma.artefact.create({
            data: {
                title: 'Corporate Risk Register 2024',
                description: 'Comprehensive risk register',
                documentType: client_1.DocumentType.LOG,
                ownerId: testUser.id,
                organizationId: testOrg.id
            }
        });
        const trainingRecords = await prisma.artefact.create({
            data: {
                title: 'Employee Training Matrix',
                description: 'Training and competency records',
                documentType: client_1.DocumentType.RECORD,
                ownerId: testUser.id,
                organizationId: testOrg.id
            }
        });
        console.log(`  ✅ Created: ${riskLog.title}`);
        console.log(`  ✅ Created: ${trainingRecords.title}`);
        // Test Scenario 3: Check missing documents before relationships
        console.log('\n🔍 Test Scenario 3: Missing documents check');
        const missingBefore = await (0, relationship_document_matcher_1.findMissingDocumentsWithRelationships)(testOrg.id);
        console.log(`  📊 Missing documents before relationships: ${missingBefore.length}`);
        const requiredMissing = missingBefore.filter(doc => doc.category === 'Required');
        console.log(`  🚨 Required missing: ${requiredMissing.length}`);
        // Show some examples
        console.log('  📋 Examples of missing required documents:');
        requiredMissing.slice(0, 5).forEach(doc => {
            console.log(`    - ${doc.title} (${doc.standard})`);
        });
        // Test Scenario 4: Add clause mappings to demonstrate fulfillment
        console.log('\n🔗 Test Scenario 4: Adding clause mappings');
        // Get some ISO clauses to map to
        const iso9001Clauses = await prisma.iSOClause.findMany({
            where: {
                standard: client_1.StandardType.ISO_9001_2015,
                clauseNumber: { in: ['5.2', '6.2', '4.3', '7.2'] }
            }
        });
        const iso27001Clauses = await prisma.iSOClause.findMany({
            where: {
                standard: client_1.StandardType.ISO_27001_2022,
                clauseNumber: { in: ['5.2', '6.1.2', '7.2'] }
            }
        });
        // Map Quality Manual to multiple clauses (simulating it covers multiple requirements)
        for (const clause of [...iso9001Clauses, ...iso27001Clauses]) {
            await prisma.clauseMapping.create({
                data: {
                    artefactId: qualityManual.id,
                    clauseId: clause.id,
                    confidence: 0.85,
                    keywords: ['quality', 'manual', 'comprehensive']
                }
            });
        }
        // Map risk log to risk-related clauses
        const riskClauses = iso27001Clauses.filter(c => c.clauseNumber.includes('6.1'));
        for (const clause of riskClauses) {
            await prisma.clauseMapping.create({
                data: {
                    artefactId: riskLog.id,
                    clauseId: clause.id,
                    confidence: 0.9,
                    keywords: ['risk', 'register', 'log']
                }
            });
        }
        // Map training records to competency clauses
        const trainingClauses = [...iso9001Clauses, ...iso27001Clauses].filter(c => c.clauseNumber === '7.2');
        for (const clause of trainingClauses) {
            await prisma.clauseMapping.create({
                data: {
                    artefactId: trainingRecords.id,
                    clauseId: clause.id,
                    confidence: 0.95,
                    keywords: ['training', 'competency', 'records']
                }
            });
        }
        console.log(`  ✅ Added clause mappings to Quality Manual: ${iso9001Clauses.length + iso27001Clauses.length} clauses`);
        console.log(`  ✅ Added clause mappings to Risk Log: ${riskClauses.length} clauses`);
        console.log(`  ✅ Added clause mappings to Training Records: ${trainingClauses.length} clauses`);
        // Test Scenario 5: Check missing documents after relationships
        console.log('\n🔍 Test Scenario 5: Missing documents after adding relationships');
        const missingAfter = await (0, relationship_document_matcher_1.findMissingDocumentsWithRelationships)(testOrg.id);
        console.log(`  📊 Missing documents after relationships: ${missingAfter.length}`);
        const requiredMissingAfter = missingAfter.filter(doc => doc.category === 'Required');
        console.log(`  🚨 Required missing after: ${requiredMissingAfter.length}`);
        const improvement = requiredMissing.length - requiredMissingAfter.length;
        console.log(`  📈 Improvement: ${improvement} fewer missing required documents`);
        if (improvement > 0) {
            console.log('  🎉 SUCCESS: Relationship matching is working!');
        }
        else {
            console.log('  ⚠️  No improvement detected - check matching logic');
        }
        // Test Scenario 6: Check specific standard
        console.log('\n🔍 Test Scenario 6: ISO 9001 specific check');
        const iso9001Missing = await (0, relationship_document_matcher_1.findMissingDocumentsWithRelationships)(testOrg.id, client_1.StandardType.ISO_9001_2015);
        console.log(`  📊 ISO 9001 missing documents: ${iso9001Missing.length}`);
        console.log('\n🔍 Test Scenario 7: ISO 27001 specific check');
        const iso27001Missing = await (0, relationship_document_matcher_1.findMissingDocumentsWithRelationships)(testOrg.id, client_1.StandardType.ISO_27001_2022);
        console.log(`  📊 ISO 27001 missing documents: ${iso27001Missing.length}`);
        console.log('\n🎉 Relationship matching tests completed successfully!');
    }
    finally {
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        await prisma.clauseMapping.deleteMany({
            where: {
                artefact: { organizationId: testOrg.id }
            }
        });
        await prisma.artefact.deleteMany({
            where: { organizationId: testOrg.id }
        });
        await prisma.user.deleteMany({
            where: { organizationId: testOrg.id }
        });
        await prisma.organization.delete({
            where: { id: testOrg.id }
        });
        console.log('✅ Cleanup completed');
    }
}
testRelationshipMatching()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-relationship-matching.js.map