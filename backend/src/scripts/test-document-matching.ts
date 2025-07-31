import { PrismaClient, StandardType } from '@prisma/client';
import { DocumentMatcher } from '../utils/document-matcher';

const prisma = new PrismaClient();

async function testDocumentMatching() {
  console.log('🧪 Testing Document Matching Logic...\n');
  
  const matcher = new DocumentMatcher();

  // Test Case 1: Quality Objectives document
  console.log('Test Case 1: Quality_objectives.xlsx');
  
  const qualityObjectivesDoc = {
    id: 'test-1',
    title: 'Quality_objectives.xlsx',
    clauseMappings: [
      {
        clause: {
          clauseNumber: '6.2',
          standard: StandardType.ISO_9001_2015
        }
      }
    ]
  };

  const qualityObjectivesStandard = {
    id: 'std-1',
    title: 'Quality Objectives',
    keywords: ['quality', 'objectives', 'goals', 'targets', 'measurable', 'improvement'],
    clauseNumbers: ['6.2', '6.2.1', '6.2.2'],
    standard: StandardType.ISO_9001_2015
  };

  const result1 = await matcher.matchDocument(qualityObjectivesDoc, qualityObjectivesStandard);
  console.log(`  Match Result: ${result1.isMatch ? '✅' : '❌'}`);
  console.log(`  Confidence: ${Math.round(result1.confidence * 100)}%`);
  console.log(`  Match Type: ${result1.matchType}`);
  console.log('');

  // Test Case 2: Information Security Policy
  console.log('Test Case 2: InfoSec_Policy_v2.docx');
  
  const infoSecDoc = {
    id: 'test-2',
    title: 'InfoSec_Policy_v2.docx',
    clauseMappings: [
      {
        clause: {
          clauseNumber: '5.2',
          standard: StandardType.ISO_27001_2022
        }
      }
    ]
  };

  const infoSecStandard = {
    id: 'std-2',
    title: 'Information Security Policy',
    keywords: ['information', 'security', 'policy', 'isms', 'cyber'],
    clauseNumbers: ['5.2', '5.2.1', '5.2.2'],
    standard: StandardType.ISO_27001_2022
  };

  const result2 = await matcher.matchDocument(infoSecDoc, infoSecStandard);
  console.log(`  Match Result: ${result2.isMatch ? '✅' : '❌'}`);
  console.log(`  Confidence: ${Math.round(result2.confidence * 100)}%`);
  console.log(`  Match Type: ${result2.matchType}`);
  console.log('');

  // Test Case 3: Title-only matching
  console.log('Test Case 3: risk-register-2024.xlsx (title matching)');
  
  const riskRegisterDoc = {
    id: 'test-3',
    title: 'risk-register-2024.xlsx',
    clauseMappings: [] // No existing clause mappings
  };

  const riskRegisterStandard = {
    id: 'std-3',
    title: 'Risk Register',
    keywords: ['risk', 'register', 'log', 'tracking', 'repository'],
    clauseNumbers: ['6.1.2', '6.1.2.1', '6.1.2.2'],
    standard: StandardType.ISO_27001_2022
  };

  const result3 = await matcher.matchDocument(riskRegisterDoc, riskRegisterStandard);
  console.log(`  Match Result: ${result3.isMatch ? '✅' : '❌'}`);
  console.log(`  Confidence: ${Math.round(result3.confidence * 100)}%`);
  console.log(`  Match Type: ${result3.matchType}`);
  console.log('');

  // Test Case 4: Keyword matching
  console.log('Test Case 4: employee_training_records.pdf (keyword matching)');
  
  const trainingDoc = {
    id: 'test-4',
    title: 'employee_training_records.pdf',
    clauseMappings: [] // No existing clause mappings
  };

  const trainingStandard = {
    id: 'std-4',
    title: 'Training Records / Competency Matrix',
    keywords: ['training', 'records', 'competency', 'matrix', 'qualified', 'skills'],
    clauseNumbers: ['7.2', '7.2.1'],
    standard: StandardType.ISO_9001_2015
  };

  const result4 = await matcher.matchDocument(trainingDoc, trainingStandard);
  console.log(`  Match Result: ${result4.isMatch ? '✅' : '❌'}`);
  console.log(`  Confidence: ${Math.round(result4.confidence * 100)}%`);
  console.log(`  Match Type: ${result4.matchType}`);
  console.log('');

  // Test Case 5: No match
  console.log('Test Case 5: random_file.txt (should not match)');
  
  const randomDoc = {
    id: 'test-5',
    title: 'random_file.txt',
    clauseMappings: []
  };

  const result5 = await matcher.matchDocument(randomDoc, qualityObjectivesStandard);
  console.log(`  Match Result: ${result5.isMatch ? '✅' : '❌'}`);
  console.log(`  Confidence: ${Math.round(result5.confidence * 100)}%`);
  console.log(`  Match Type: ${result5.matchType}`);
  console.log('');

  console.log('🎉 Document matching tests completed!');
}

testDocumentMatching()
  .catch(console.error)
  .finally(() => prisma.$disconnect());