import { PrismaClient, StandardType } from '@prisma/client';
import { ISO_9001_2015_CLAUSES, ISO_27001_2022_CLAUSES } from '../../../shared/src/constants/iso-standards';

const prisma = new PrismaClient();

async function seedISOClauses() {
  console.log('🌱 Seeding ISO clauses...');

  // Seed ISO 9001:2015 clauses
  console.log('Creating ISO 9001:2015 clauses...');
  for (const [clauseNumber, clauseData] of Object.entries(ISO_9001_2015_CLAUSES)) {
    // Create main clause
    const mainClause = await prisma.iSOClause.upsert({
      where: {
        standard_clauseNumber: {
          standard: StandardType.ISO_9001_2015,
          clauseNumber: clauseNumber
        }
      },
      update: {},
      create: {
        standard: StandardType.ISO_9001_2015,
        clauseNumber: clauseNumber,
        title: clauseData.title,
        description: `ISO 9001:2015 - ${clauseData.title}`
      }
    });

    // Create subclauses
    if (clauseData.subclauses) {
      for (const [subclauseNumber, subclauseTitle] of Object.entries(clauseData.subclauses)) {
        await prisma.iSOClause.upsert({
          where: {
            standard_clauseNumber: {
              standard: StandardType.ISO_9001_2015,
              clauseNumber: subclauseNumber
            }
          },
          update: {},
          create: {
            standard: StandardType.ISO_9001_2015,
            clauseNumber: subclauseNumber,
            title: subclauseTitle,
            description: `ISO 9001:2015 - ${subclauseTitle}`,
            parentId: mainClause.id
          }
        });
      }
    }
  }

  // Seed ISO 27001:2022 clauses
  console.log('Creating ISO 27001:2022 clauses...');
  for (const [clauseNumber, clauseData] of Object.entries(ISO_27001_2022_CLAUSES)) {
    // Create main clause
    const mainClause = await prisma.iSOClause.upsert({
      where: {
        standard_clauseNumber: {
          standard: StandardType.ISO_27001_2022,
          clauseNumber: clauseNumber
        }
      },
      update: {},
      create: {
        standard: StandardType.ISO_27001_2022,
        clauseNumber: clauseNumber,
        title: clauseData.title,
        description: `ISO 27001:2022 - ${clauseData.title}`
      }
    });

    // Create subclauses
    if (clauseData.subclauses) {
      for (const [subclauseNumber, subclauseTitle] of Object.entries(clauseData.subclauses)) {
        await prisma.iSOClause.upsert({
          where: {
            standard_clauseNumber: {
              standard: StandardType.ISO_27001_2022,
              clauseNumber: subclauseNumber
            }
          },
          update: {},
          create: {
            standard: StandardType.ISO_27001_2022,
            clauseNumber: subclauseNumber,
            title: subclauseTitle,
            description: `ISO 27001:2022 - ${subclauseTitle}`,
            parentId: mainClause.id
          }
        });
      }
    }
  }

  // Create default AI agents
  console.log('Creating default AI agents...');
  
  const defaultAgents = [
    {
      name: 'Document Reviewer',
      type: 'DOCUMENT_REVIEWER',
      description: 'Reviews documents for compliance and suggests improvements',
      config: {
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 2000
      }
    },
    {
      name: 'Risk Assessor',
      type: 'RISK_ASSESSOR',
      description: 'Identifies and assesses risks in documentation and processes',
      config: {
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 1500
      }
    },
    {
      name: 'Compliance Checker',
      type: 'COMPLIANCE_CHECKER',
      description: 'Checks documents against ISO requirements',
      config: {
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        maxTokens: 1000
      }
    }
  ];

  for (const agent of defaultAgents) {
    const existing = await prisma.aIAgent.findFirst({
      where: { name: agent.name }
    });
    
    if (!existing) {
      await prisma.aIAgent.create({
        data: agent as any
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

async function main() {
  try {
    await seedISOClauses();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedISOClauses };