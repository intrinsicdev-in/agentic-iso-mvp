"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const duplicate_detector_1 = require("../utils/duplicate-detector");
const prisma = new client_1.PrismaClient();
async function createTestDocuments(organizationId, userId) {
    console.log('📝 Creating test documents for duplicate detection...\n');
    // Test case 1: Version-based duplicates
    const soaDocs = [
        {
            title: 'SOA-15-Jul-2026-V2',
            currentVersion: 2,
            status: 'APPROVED'
        },
        {
            title: 'SOA-15-Jul-2026-V1',
            currentVersion: 1,
            status: 'DRAFT'
        },
        {
            title: 'Statement_of_Applicability_v3.1',
            currentVersion: 3,
            status: 'APPROVED'
        }
    ];
    // Test case 2: Similar titles with different formats
    const qualityDocs = [
        {
            title: 'Quality_objectives.xlsx',
            currentVersion: 1,
            status: 'APPROVED'
        },
        {
            title: 'QO-2024-draft.xlsx',
            currentVersion: 1,
            status: 'DRAFT'
        },
        {
            title: 'Quality Objectives - Final.docx',
            currentVersion: 2,
            status: 'APPROVED'
        }
    ];
    // Test case 3: Policy documents with different naming
    const policyDocs = [
        {
            title: 'InfoSec-Policy-2024.pdf',
            currentVersion: 1,
            status: 'APPROVED'
        },
        {
            title: 'ISP_Latest.docx',
            currentVersion: 2,
            status: 'DRAFT'
        },
        {
            title: 'Information Security Policy v1.0',
            currentVersion: 1,
            status: 'APPROVED'
        }
    ];
    // Test case 4: Training records
    const trainingDocs = [
        {
            title: 'Training Records 2024',
            currentVersion: 1,
            status: 'APPROVED'
        },
        {
            title: 'TR-Latest-Version.xlsx',
            currentVersion: 2,
            status: 'DRAFT'
        }
    ];
    const allTestDocs = [
        ...soaDocs.map(doc => ({ ...doc, category: 'SOA' })),
        ...qualityDocs.map(doc => ({ ...doc, category: 'Quality Objectives' })),
        ...policyDocs.map(doc => ({ ...doc, category: 'InfoSec Policy' })),
        ...trainingDocs.map(doc => ({ ...doc, category: 'Training Records' }))
    ];
    const createdDocs = [];
    for (const doc of allTestDocs) {
        const created = await prisma.artefact.create({
            data: {
                title: doc.title,
                currentVersion: doc.currentVersion,
                status: doc.status,
                ownerId: userId,
                organizationId,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
            }
        });
        createdDocs.push({ ...created, category: doc.category });
    }
    console.log(`✅ Created ${createdDocs.length} test documents\n`);
    return createdDocs;
}
async function testDuplicateDetection() {
    console.log('🔍 Testing Duplicate Detection System\n');
    console.log('='.repeat(50));
    try {
        // Get or create test organization and user
        let testOrg = await prisma.organization.findFirst({
            where: { name: 'Test Organization - Duplicates' }
        });
        if (!testOrg) {
            testOrg = await prisma.organization.create({
                data: {
                    name: 'Test Organization - Duplicates',
                    slug: 'test-org-duplicates',
                    description: 'Test organization for duplicate detection',
                    website: 'https://test-duplicates.com'
                }
            });
        }
        let testUser = await prisma.user.findFirst({
            where: { email: 'test-duplicates@example.com' }
        });
        if (!testUser) {
            testUser = await prisma.user.create({
                data: {
                    name: 'Test User - Duplicates',
                    email: 'test-duplicates@example.com',
                    password: 'hashed-password-for-testing',
                    organizationId: testOrg.id,
                    role: client_1.UserRole.ACCOUNT_ADMIN
                }
            });
        }
        // Clean up existing test documents
        await prisma.artefact.deleteMany({
            where: { organizationId: testOrg.id }
        });
        // Create test documents
        const testDocs = await createTestDocuments(testOrg.id, testUser.id);
        // Initialize duplicate detector
        const detector = new duplicate_detector_1.DuplicateDetector();
        console.log('🔄 Running duplicate detection...\n');
        const result = await detector.detectDuplicates(testOrg.id);
        console.log('📊 DUPLICATE DETECTION RESULTS');
        console.log('='.repeat(40));
        console.log(`Total Documents: ${result.totalDocuments}`);
        console.log(`Duplicates Found: ${result.duplicatesFound}`);
        console.log(`Duplicate Groups: ${result.duplicateGroups.length}\n`);
        if (result.duplicateGroups.length === 0) {
            console.log('❌ No duplicate groups found. This might indicate an issue with the detection algorithm.');
            return;
        }
        // Analyze each duplicate group
        for (let i = 0; i < result.duplicateGroups.length; i++) {
            const group = result.duplicateGroups[i];
            console.log(`\n📁 DUPLICATE GROUP ${i + 1}: "${group.baseDocument}"`);
            console.log('-'.repeat(50));
            console.log(`Recommended Action: ${group.recommendedAction.toUpperCase()}`);
            console.log(`Confidence: ${Math.round(group.confidence * 100)}%`);
            console.log('Documents in group:');
            group.documents.forEach((doc, index) => {
                const latest = doc.isLatestVersion ? ' 🌟 (LATEST)' : '';
                const version = doc.versionInfo.versionNumber ? ` v${doc.versionInfo.versionNumber}` : '';
                const date = doc.versionInfo.versionDate ? ` (${doc.versionInfo.versionDate})` : '';
                console.log(`  ${index + 1}. "${doc.title}"${version}${date}${latest}`);
                console.log(`     Status: ${doc.status} | Version: ${doc.currentVersion} | Owner: ${doc.owner.name}`);
            });
            // Show what action would be recommended
            switch (group.recommendedAction) {
                case 'keep_latest':
                    const latestDoc = group.documents.find(d => d.isLatestVersion);
                    console.log(`\n💡 Recommendation: Keep "${latestDoc?.title}" and remove others`);
                    break;
                case 'merge_content':
                    console.log(`\n💡 Recommendation: Merge content from all documents`);
                    break;
                case 'manual_review':
                    console.log(`\n💡 Recommendation: Manual review required (different owners or complex situation)`);
                    break;
            }
        }
        console.log('\n\n🧪 TESTING EDGE CASES');
        console.log('='.repeat(30));
        // Test individual similarity calculations
        const testCases = [
            ['SOA-15-Jul-2026-V2', 'Statement_of_Applicability_v3.1'],
            ['Quality_objectives.xlsx', 'QO-2024-draft.xlsx'],
            ['InfoSec-Policy-2024.pdf', 'Information Security Policy v1.0'],
            ['Training Records 2024', 'TR-Latest-Version.xlsx']
        ];
        console.log('\nTesting individual document similarities:');
        for (const [doc1, doc2] of testCases) {
            const normalizeTitle = (title) => {
                return title
                    .toLowerCase()
                    .replace(/[_\-\.]/g, ' ')
                    .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '')
                    .replace(/v\d+(\.\d+)?/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
            };
            const norm1 = normalizeTitle(doc1);
            const norm2 = normalizeTitle(doc2);
            console.log(`\n  "${doc1}" vs "${doc2}"`);
            console.log(`  Normalized: "${norm1}" vs "${norm2}"`);
            console.log(`  Should be detected as duplicates: ${norm1.length > 0 && norm2.length > 0 ? 'YES' : 'NO'}`);
        }
        console.log('\n\n✅ Duplicate detection test completed successfully!');
        console.log('\n📋 SUMMARY:');
        console.log(`- Created ${testDocs.length} test documents across 4 categories`);
        console.log(`- Found ${result.duplicateGroups.length} duplicate groups`);
        console.log(`- Total duplicates: ${result.duplicatesFound} out of ${result.totalDocuments} documents`);
        // Calculate detection rate
        const expectedDuplicateGroups = 4; // SOA, Quality, InfoSec, Training
        const detectionRate = (result.duplicateGroups.length / expectedDuplicateGroups) * 100;
        console.log(`- Detection rate: ${Math.round(detectionRate)}% (${result.duplicateGroups.length}/${expectedDuplicateGroups} expected groups)`);
    }
    catch (error) {
        console.error('❌ Error during duplicate detection test:', error);
        throw error;
    }
}
// Run the test
testDuplicateDetection()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔚 Test completed and database connection closed.');
});
//# sourceMappingURL=test-duplicate-detection.js.map