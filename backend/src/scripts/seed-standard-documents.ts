import { PrismaClient, StandardType, DocumentType } from '@prisma/client';

const prisma = new PrismaClient();

const iso9001Documents = [
  {
    title: 'Quality Policy',
    category: 'Required',
    description: 'Defines your quality commitment',
    clauseRef: '5.2',
    importance: 'Defines your quality commitment and sets the direction for the QMS',
    keywords: ['quality', 'policy', 'commitment', 'direction', 'statement'],
    clauseNumbers: ['5.2', '5.2.1', '5.2.2'],
    documentType: DocumentType.POLICY,
    canBeFulfilledBy: ['Quality Manual', 'Quality & ISMS Manual'],
    fulfills: []
  },
  {
    title: 'Quality Objectives',
    category: 'Required',
    description: 'Measurable improvement goals',
    clauseRef: '6.2',
    importance: 'Sets measurable targets for quality improvement',
    keywords: ['quality', 'objectives', 'goals', 'targets', 'measurable', 'improvement'],
    clauseNumbers: ['6.2', '6.2.1', '6.2.2'],
    documentType: DocumentType.PLAN,
    canBeFulfilledBy: ['Quality Manual', 'Quality & ISMS Manual'],
    fulfills: []
  },
  {
    title: 'Scope of the QMS',
    category: 'Required',
    description: 'Defines what\'s covered in the QMS',
    clauseRef: '4.3',
    importance: 'Clearly defines boundaries and applicability of the QMS',
    keywords: ['scope', 'qms', 'boundaries', 'applicability', 'coverage'],
    clauseNumbers: ['4.3']
  },
  {
    title: 'Process Descriptions',
    category: 'Required',
    description: 'Describes how key processes work',
    clauseRef: '4.4',
    importance: 'Ensures consistent process execution and understanding',
    keywords: ['process', 'descriptions', 'procedures', 'workflow', 'operations'],
    clauseNumbers: ['4.4', '4.4.1', '4.4.2']
  },
  {
    title: 'Document Control Procedure',
    category: 'Required',
    description: 'Ensures control of documented info',
    clauseRef: '7.5',
    importance: 'Manages document versions, access, and distribution',
    keywords: ['document', 'control', 'procedure', 'version', 'access', 'distribution'],
    clauseNumbers: ['7.5', '7.5.1', '7.5.2', '7.5.3']
  },
  {
    title: 'Internal Audit Plan / Schedule',
    category: 'Required',
    description: 'Plans audits at planned intervals',
    clauseRef: '9.2',
    importance: 'Ensures systematic evaluation of QMS effectiveness',
    keywords: ['internal', 'audit', 'plan', 'schedule', 'intervals'],
    clauseNumbers: ['9.2', '9.2.1', '9.2.2'],
    documentType: DocumentType.PLAN,
    canBeFulfilledBy: [],
    fulfills: []
  },
  {
    title: 'Internal Audit Reports',
    category: 'Required',
    description: 'Evidence of completed audits',
    clauseRef: '9.2',
    importance: 'Documents audit findings and improvement opportunities',
    keywords: ['internal', 'audit', 'reports', 'findings', 'evidence'],
    clauseNumbers: ['9.2', '9.2.1', '9.2.2'],
    documentType: DocumentType.REPORT,
    canBeFulfilledBy: [],
    fulfills: []
  },
  {
    title: 'Management Review Minutes',
    category: 'Required',
    description: 'Shows top management involvement',
    clauseRef: '9.3',
    importance: 'Demonstrates leadership commitment and strategic direction',
    keywords: ['management', 'review', 'minutes', 'leadership', 'commitment'],
    clauseNumbers: ['9.3', '9.3.1', '9.3.2', '9.3.3']
  },
  {
    title: 'Nonconformity and Corrective Action Log',
    category: 'Required',
    description: 'Captures issues and actions',
    clauseRef: '10.2',
    importance: 'Tracks problems and ensures systematic resolution',
    keywords: ['nonconformity', 'corrective', 'action', 'log', 'issues', 'problems'],
    clauseNumbers: ['10.2', '10.2.1', '10.2.2']
  },
  {
    title: 'Customer Feedback / Complaints Log',
    category: 'Required',
    description: 'Tracks customer satisfaction',
    clauseRef: '9.1.2',
    importance: 'Monitors customer satisfaction and drives improvements',
    keywords: ['customer', 'feedback', 'complaints', 'satisfaction', 'log'],
    clauseNumbers: ['9.1.2', '8.2.1']
  },
  {
    title: 'Training Records / Competency Matrix',
    category: 'Required',
    description: 'Proves staff are qualified',
    clauseRef: '7.2',
    importance: 'Ensures personnel have necessary competencies',
    keywords: ['training', 'records', 'competency', 'matrix', 'qualified', 'skills'],
    clauseNumbers: ['7.2', '7.2.1'],
    documentType: DocumentType.RECORD,
    canBeFulfilledBy: [],
    fulfills: []
  },
  {
    title: 'Supplier Evaluation Criteria or Logs',
    category: 'Required',
    description: 'Manages outsourced providers',
    clauseRef: '8.4',
    importance: 'Controls quality of external products and services',
    keywords: ['supplier', 'evaluation', 'criteria', 'logs', 'outsourced', 'external'],
    clauseNumbers: ['8.4', '8.4.1', '8.4.2', '8.4.3']
  },
  {
    title: 'Risk Log',
    category: 'Optional',
    description: 'Supports addressing risks and opportunities',
    clauseRef: '6.1',
    importance: 'Proactively identifies and manages risks to quality',
    keywords: ['risk', 'log', 'opportunities', 'register', 'assessment'],
    clauseNumbers: ['6.1', '6.1.1', '6.1.2'],
    documentType: DocumentType.LOG,
    canBeFulfilledBy: ['Risk Register', 'Quality & ISMS Manual'],
    fulfills: []
  },
  {
    title: 'Procedure Manuals',
    category: 'Optional',
    description: 'Helps ensure consistent execution of tasks',
    clauseRef: null,
    importance: 'Provides detailed work instructions for complex tasks',
    keywords: ['procedure', 'manuals', 'instructions', 'tasks', 'workflow'],
    clauseNumbers: []
  },
  {
    title: 'Job Descriptions',
    category: 'Optional',
    description: 'Clarifies role expectations and supports competence',
    clauseRef: null,
    importance: 'Defines responsibilities and required competencies',
    keywords: ['job', 'descriptions', 'role', 'responsibilities', 'competencies'],
    clauseNumbers: []
  },
  {
    title: 'Customer Journey Map',
    category: 'Optional',
    description: 'Visualises how customers interact with your process',
    clauseRef: null,
    importance: 'Enhances understanding of customer experience',
    keywords: ['customer', 'journey', 'map', 'experience', 'interaction'],
    clauseNumbers: []
  },
  // Cross-standard manual that can fulfill multiple requirements
  {
    title: 'Quality & ISMS Manual',
    category: 'Optional',
    description: 'Comprehensive manual covering quality management and information security',
    clauseRef: null,
    importance: 'Consolidates multiple policies and procedures into one comprehensive document',
    keywords: ['quality', 'isms', 'manual', 'comprehensive', 'integrated'],
    clauseNumbers: [],
    documentType: DocumentType.MANUAL,
    canBeFulfilledBy: [],
    fulfills: ['Quality Policy', 'Quality Objectives', 'Information Security Policy', 'Scope of the QMS', 'Process Descriptions']
  }
];

const iso27001Documents = [
  {
    title: 'Information Security Policy',
    category: 'Required',
    description: 'Core ISMS policy',
    clauseRef: '5.2',
    importance: 'Establishes management direction and support for information security',
    keywords: ['information', 'security', 'policy', 'isms', 'cyber'],
    clauseNumbers: ['5.2', '5.2.1', '5.2.2'],
    documentType: DocumentType.POLICY,
    canBeFulfilledBy: ['Quality & ISMS Manual', 'ISMS Manual'],
    fulfills: []
  },
  {
    title: 'Statement of Applicability (SoA)',
    category: 'Required',
    description: 'Lists applicable Annex A controls and justification',
    clauseRef: '6.1.3',
    importance: 'Documents which controls are implemented and why others are excluded',
    keywords: ['statement', 'applicability', 'soa', 'controls', 'annex', 'statement of applicability'],
    clauseNumbers: ['6.1.3', 'A.5', 'A.6', 'A.7', 'A.8']
  },
  {
    title: 'Risk Assessment Procedure',
    category: 'Required',
    description: 'Defines how risks are identified and evaluated',
    clauseRef: '6.1.2',
    importance: 'Ensures consistent approach to identifying and assessing information security risks',
    keywords: ['risk', 'assessment', 'procedure', 'evaluation', 'identification'],
    clauseNumbers: ['6.1.2', '6.1.2.1', '6.1.2.2']
  },
  {
    title: 'Risk Treatment Plan',
    category: 'Required',
    description: 'Describes how selected controls mitigate risks',
    clauseRef: '6.1.3',
    importance: 'Shows how identified risks will be addressed through controls',
    keywords: ['risk', 'treatment', 'plan', 'mitigation', 'controls'],
    clauseNumbers: ['6.1.3', '6.1.3.1']
  },
  {
    title: 'Risk Register',
    category: 'Required',
    description: 'Lists and tracks individual risks',
    clauseRef: '6.1.2',
    importance: 'Central repository for all identified risks and their treatment status',
    keywords: ['risk', 'register', 'log', 'tracking', 'repository'],
    clauseNumbers: ['6.1.2', '6.1.2.1', '6.1.2.2'],
    documentType: DocumentType.LOG,
    canBeFulfilledBy: ['Risk Log', 'Quality & ISMS Manual'],
    fulfills: ['Risk Log']
  },
  {
    title: 'Asset Inventory',
    category: 'Required',
    description: 'Identifies assets and their owners',
    clauseRef: 'A.5.9, A.5.10',
    importance: 'Ensures all information assets are identified and have responsible owners',
    keywords: ['asset', 'inventory', 'register', 'owners', 'classification'],
    clauseNumbers: ['A.5.9', 'A.5.10', 'A.5.8']
  },
  {
    title: 'Access Control Policy',
    category: 'Required',
    description: 'Manages user access',
    clauseRef: 'A.5.15',
    importance: 'Controls who has access to information and systems',
    keywords: ['access', 'control', 'policy', 'user', 'permissions'],
    clauseNumbers: ['A.5.15', 'A.5.16', 'A.6.1']
  },
  {
    title: 'Incident Management Procedure',
    category: 'Required',
    description: 'Defines how security incidents are handled',
    clauseRef: 'A.5.24',
    importance: 'Ensures consistent and effective response to security incidents',
    keywords: ['incident', 'management', 'procedure', 'response', 'security'],
    clauseNumbers: ['A.5.24', 'A.5.25', 'A.5.26']
  },
  {
    title: 'Business Continuity Plan',
    category: 'Required',
    description: 'Ensures continuity during disruptions',
    clauseRef: 'A.5.30, A.5.31',
    importance: 'Maintains critical operations during adverse events',
    keywords: ['business', 'continuity', 'plan', 'disaster', 'recovery'],
    clauseNumbers: ['A.5.30', 'A.5.31', 'A.5.29']
  },
  {
    title: 'Backup and Recovery Procedure',
    category: 'Required',
    description: 'Ensures data resilience',
    clauseRef: 'A.5.12, A.5.31',
    importance: 'Protects against data loss and ensures recovery capability',
    keywords: ['backup', 'recovery', 'procedure', 'data', 'resilience'],
    clauseNumbers: ['A.5.12', 'A.5.31', 'A.5.13']
  },
  {
    title: 'Training and Awareness Records',
    category: 'Required',
    description: 'Evidence of security training',
    clauseRef: '7.2, A.6.3',
    importance: 'Demonstrates staff have necessary security awareness and competence',
    keywords: ['training', 'awareness', 'records', 'security', 'competence'],
    clauseNumbers: ['7.2', 'A.6.3', '7.2.1'],
    documentType: DocumentType.RECORD,
    canBeFulfilledBy: ['Training Records / Competency Matrix'],
    fulfills: ['Training Records / Competency Matrix']
  },
  {
    title: 'Internal Audit Reports',
    category: 'Required',
    description: 'Evidence of ISMS auditing',
    clauseRef: '9.2',
    importance: 'Shows systematic evaluation of ISMS effectiveness',
    keywords: ['internal', 'audit', 'reports', 'isms', 'evaluation'],
    clauseNumbers: ['9.2', '9.2.1', '9.2.2']
  },
  {
    title: 'Management Review Minutes',
    category: 'Required',
    description: 'Top management reviews of ISMS',
    clauseRef: '9.3',
    importance: 'Demonstrates leadership involvement in ISMS governance',
    keywords: ['management', 'review', 'minutes', 'isms', 'leadership'],
    clauseNumbers: ['9.3', '9.3.1', '9.3.2', '9.3.3']
  },
  {
    title: 'Nonconformity and Corrective Action Log',
    category: 'Required',
    description: 'Tracks and resolves ISMS issues',
    clauseRef: '10.1',
    importance: 'Ensures systematic resolution of security issues',
    keywords: ['nonconformity', 'corrective', 'action', 'log', 'issues'],
    clauseNumbers: ['10.1', '10.2', '10.2.1']
  },
  {
    title: 'Supplier Security Policy',
    category: 'Optional',
    description: 'Ensures supplier risk is managed',
    clauseRef: 'A.5.19',
    importance: 'Controls security risks from third-party suppliers',
    keywords: ['supplier', 'security', 'policy', 'third-party', 'vendor'],
    clauseNumbers: ['A.5.19', 'A.5.20', 'A.5.21']
  },
  {
    title: 'Acceptable Use Policy',
    category: 'Optional',
    description: 'Defines user responsibilities',
    clauseRef: 'A.5.10, A.5.13',
    importance: 'Sets clear expectations for acceptable use of IT resources',
    keywords: ['acceptable', 'use', 'policy', 'user', 'responsibilities'],
    clauseNumbers: ['A.5.10', 'A.5.13', 'A.6.2']
  },
  {
    title: 'Threat Intelligence Log',
    category: 'Optional',
    description: 'Tracks relevant security threats',
    clauseRef: 'A.5.7',
    importance: 'Maintains awareness of evolving threat landscape',
    keywords: ['threat', 'intelligence', 'log', 'security', 'landscape'],
    clauseNumbers: ['A.5.7', 'A.5.8']
  },
  {
    title: 'Audit Schedule',
    category: 'Optional',
    description: 'Useful for planning recurring audits',
    clauseRef: null,
    importance: 'Ensures systematic coverage of all ISMS areas',
    keywords: ['audit', 'schedule', 'planning', 'recurring', 'coverage'],
    clauseNumbers: []
  },
  {
    title: 'Mobile Device Policy',
    category: 'Optional',
    description: 'Covers risks of mobile working',
    clauseRef: 'A.5.10, A.5.13',
    importance: 'Addresses security risks from mobile and remote working',
    keywords: ['mobile', 'device', 'policy', 'remote', 'working'],
    clauseNumbers: ['A.5.10', 'A.5.13', 'A.6.7']
  }
];

async function seedStandardDocuments() {
  console.log('🌱 Seeding standard documents...');

  try {
    // Clear existing standard documents
    await prisma.standardDocument.deleteMany({
      where: { 
        OR: [
          { standard: StandardType.ISO_9001_2015 },
          { standard: StandardType.ISO_27001_2022 }
        ]
      }
    });

    // Insert ISO 9001 documents
    for (const doc of iso9001Documents) {
      await prisma.standardDocument.create({
        data: {
          standard: StandardType.ISO_9001_2015,
          documentType: doc.documentType || DocumentType.DOCUMENT,
          canBeFulfilledBy: doc.canBeFulfilledBy || [],
          fulfills: doc.fulfills || [],
          ...doc
        }
      });
    }

    console.log('✅ Successfully seeded ISO 9001:2015 standard documents');

    // Insert ISO 27001 documents
    for (const doc of iso27001Documents) {
      await prisma.standardDocument.create({
        data: {
          standard: StandardType.ISO_27001_2022,
          documentType: doc.documentType || DocumentType.DOCUMENT,
          canBeFulfilledBy: doc.canBeFulfilledBy || [],
          fulfills: doc.fulfills || [],
          ...doc
        }
      });
    }

    console.log('✅ Successfully seeded ISO 27001:2022 standard documents');

    // Count documents by standard and category
    const iso9001RequiredCount = await prisma.standardDocument.count({
      where: { 
        standard: StandardType.ISO_9001_2015,
        category: 'Required'
      }
    });

    const iso9001OptionalCount = await prisma.standardDocument.count({
      where: { 
        standard: StandardType.ISO_9001_2015,
        category: 'Optional'
      }
    });

    const iso27001RequiredCount = await prisma.standardDocument.count({
      where: { 
        standard: StandardType.ISO_27001_2022,
        category: 'Required'
      }
    });

    const iso27001OptionalCount = await prisma.standardDocument.count({
      where: { 
        standard: StandardType.ISO_27001_2022,
        category: 'Optional'
      }
    });

    console.log(`📊 ISO 9001:2015 - Added ${iso9001RequiredCount} required documents and ${iso9001OptionalCount} optional documents`);
    console.log(`📊 ISO 27001:2022 - Added ${iso27001RequiredCount} required documents and ${iso27001OptionalCount} optional documents`);

  } catch (error) {
    console.error('❌ Error seeding standard documents:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedStandardDocuments();