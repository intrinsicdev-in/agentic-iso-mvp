"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const document_matcher_1 = require("../utils/document-matcher");
const prisma = new client_1.PrismaClient();
async function testSOAMatching() {
    console.log('🧪 Testing SOA Document Matching...\n');
    const matcher = new document_matcher_1.DocumentMatcher();
    // Test different SOA filename formats
    const testCases = [
        'SOA-15-Jul-2026-V2',
        'SOA-15-Jul-2026-V2.xlsx',
        'Statement_of_Applicability_v1.2.docx',
        'SoA_2024.pdf',
        'statement-applicability-iso27001.doc',
        'Quality_objectives.xlsx',
        'QO-2024-draft.xlsx',
        'BCP_v3.1_final.doc',
        'InfoSec-Policy-2024.pdf',
        'ISP_Latest.docx',
        'MR-Jan-2024-Minutes.pdf',
        'Internal_Audit_Plan_2024-2025.xlsx',
        'IA-Schedule-Q4.xlsx'
    ];
    // Standard document for testing
    const soaStandard = {
        id: 'std-soa',
        title: 'Statement of Applicability (SoA)',
        keywords: ['statement', 'applicability', 'soa', 'controls', 'annex', 'statement of applicability'],
        clauseNumbers: ['6.1.3', 'A.5', 'A.6', 'A.7', 'A.8'],
        standard: client_1.StandardType.ISO_27001_2022
    };
    const qualityObjStandard = {
        id: 'std-qo',
        title: 'Quality Objectives',
        keywords: ['quality', 'objectives', 'goals', 'targets', 'measurable', 'improvement'],
        clauseNumbers: ['6.2', '6.2.1', '6.2.2'],
        standard: client_1.StandardType.ISO_9001_2015
    };
    const bcpStandard = {
        id: 'std-bcp',
        title: 'Business Continuity Plan',
        keywords: ['business', 'continuity', 'plan', 'disaster', 'recovery'],
        clauseNumbers: ['A.5.30', 'A.5.31', 'A.5.29'],
        standard: client_1.StandardType.ISO_27001_2022
    };
    console.log('📊 Testing various document filename formats:\n');
    for (const testTitle of testCases) {
        const testDoc = {
            id: `test-${Date.now()}`,
            title: testTitle,
            clauseMappings: []
        };
        console.log(`\n📄 Testing: "${testTitle}"`);
        // Test against SOA
        const soaResult = await matcher.matchDocument(testDoc, soaStandard);
        if (soaResult.isMatch) {
            console.log(`  ✅ Matches SOA (${soaResult.matchType}, ${Math.round(soaResult.confidence * 100)}%)`);
        }
        // Test against Quality Objectives
        const qoResult = await matcher.matchDocument(testDoc, qualityObjStandard);
        if (qoResult.isMatch) {
            console.log(`  ✅ Matches Quality Objectives (${qoResult.matchType}, ${Math.round(qoResult.confidence * 100)}%)`);
        }
        // Test against BCP
        const bcpResult = await matcher.matchDocument(testDoc, bcpStandard);
        if (bcpResult.isMatch) {
            console.log(`  ✅ Matches Business Continuity Plan (${bcpResult.matchType}, ${Math.round(bcpResult.confidence * 100)}%)`);
        }
        if (!soaResult.isMatch && !qoResult.isMatch && !bcpResult.isMatch) {
            console.log(`  ❌ No matches found`);
        }
    }
    console.log('\n\n🔍 Testing specific SOA patterns:');
    // Test the exact problem case
    const problemDoc = {
        id: 'test-problem',
        title: 'SOA-15-Jul-2026-V2',
        clauseMappings: []
    };
    console.log(`\n📄 Problem case: "${problemDoc.title}"`);
    const result = await matcher.matchDocument(problemDoc, soaStandard);
    console.log(`  Match: ${result.isMatch ? '✅' : '❌'}`);
    console.log(`  Type: ${result.matchType}`);
    console.log(`  Confidence: ${Math.round(result.confidence * 100)}%`);
    // Show what the normalized title looks like
    const normalizeTitle = (title) => {
        return title
            .toLowerCase()
            .replace(/[_\-\.]/g, ' ')
            .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '')
            .replace(/v\d+(\.\d+)?/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    };
    console.log(`  Normalized: "${normalizeTitle(problemDoc.title)}"`);
    console.log(`  Expected to match: "statement of applicability" or "soa"`);
    console.log('\n🎉 SOA matching tests completed!');
}
testSOAMatching()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=test-soa-matching.js.map