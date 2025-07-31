import { Router } from 'express';
import { OnboardingService } from '../services/onboarding.service';

const router = Router();
const onboardingService = new OnboardingService();

// Submit onboarding data and get assessment
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      industry,
      employeeCount,
      currentCertifications,
      targetStandards,
      currentProcesses,
      timeline,
      budget,
      primaryContact,
      additionalNotes
    } = req.body;

    // TODO: Get from authentication
    const userId = 'test-user-id';

    // Validate required fields
    if (!companyName || !industry || !employeeCount || !targetStandards || !currentProcesses || !timeline || !primaryContact) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryContact.email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    const result = await onboardingService.saveOnboardingData({
      companyName,
      industry,
      employeeCount: parseInt(employeeCount),
      currentCertifications: currentCertifications || [],
      targetStandards,
      currentProcesses,
      timeline,
      budget,
      primaryContact,
      additionalNotes
    }, userId);

    res.status(201).json({
      success: true,
      message: 'Onboarding data submitted successfully',
      ...result
    });
  } catch (error) {
    console.error('Error processing onboarding data:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process onboarding data' 
    });
  }
});

// Get onboarding history for user
router.get('/history', async (req, res) => {
  try {
    // TODO: Get from authentication
    const userId = 'test-user-id';

    const history = await onboardingService.getOnboardingHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching onboarding history:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch onboarding history' 
    });
  }
});

// Get specific assessment by ID
router.get('/assessment/:id', async (req, res) => {
  try {
    const assessment = await onboardingService.getAssessmentById(req.params.id);
    res.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    if (error instanceof Error && error.message === 'Assessment not found') {
      res.status(404).json({ error: 'Assessment not found' });
    } else {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to fetch assessment' 
      });
    }
  }
});

// Get industry templates/suggestions
router.get('/industry-templates', async (req, res) => {
  try {
    const { industry } = req.query;

    // Return industry-specific templates and recommendations
    const templates = {
      'MANUFACTURING': {
        commonStandards: ['ISO_9001_2015', 'ISO_14001_2015'],
        criticalProcesses: ['quality_control', 'supplier_management', 'environmental_management'],
        typicalTimeline: '9-12 months',
        keyConsiderations: [
          'Production quality control',
          'Supplier qualification',
          'Environmental compliance',
          'Worker safety protocols'
        ]
      },
      'HEALTHCARE': {
        commonStandards: ['ISO_13485_2016', 'ISO_27001_2022'],
        criticalProcesses: ['patient_safety', 'data_protection', 'regulatory_compliance'],
        typicalTimeline: '12-18 months',
        keyConsiderations: [
          'Patient data protection',
          'Medical device regulations',
          'Clinical risk management',
          'Staff competency tracking'
        ]
      },
      'TECHNOLOGY': {
        commonStandards: ['ISO_27001_2022', 'ISO_9001_2015'],
        criticalProcesses: ['information_security', 'software_development', 'incident_response'],
        typicalTimeline: '6-12 months',
        keyConsiderations: [
          'Data security and privacy',
          'Software development lifecycle',
          'Incident response procedures',
          'Access control management'
        ]
      },
      'FINANCIAL_SERVICES': {
        commonStandards: ['ISO_27001_2022', 'ISO_22301_2019'],
        criticalProcesses: ['risk_management', 'business_continuity', 'data_protection'],
        typicalTimeline: '12-15 months',
        keyConsiderations: [
          'Financial data protection',
          'Regulatory compliance',
          'Business continuity planning',
          'Risk assessment procedures'
        ]
      }
    };

    const templateKey = industry as string;
    const template = templates[templateKey as keyof typeof templates];
    
    if (template) {
      res.json({
        industry: templateKey,
        template,
        recommendations: [
          'Start with risk assessment',
          'Establish document control early',
          'Engage senior management',
          'Plan for regular internal audits'
        ]
      });
    } else {
      res.json({
        industry: 'GENERAL',
        template: {
          commonStandards: ['ISO_9001_2015'],
          criticalProcesses: ['document_control', 'internal_audit', 'management_review'],
          typicalTimeline: '9-12 months',
          keyConsiderations: [
            'Document and process control',
            'Staff training and competency',
            'Internal audit program',
            'Management commitment'
          ]
        },
        recommendations: [
          'Conduct gap analysis first',
          'Focus on core processes',
          'Ensure management buy-in',
          'Plan phased implementation'
        ]
      });
    }
  } catch (error) {
    console.error('Error fetching industry templates:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch industry templates' 
    });
  }
});

// Get compliance checklist based on standards
router.get('/checklist', async (req, res) => {
  try {
    const { standards } = req.query;
    const standardList = Array.isArray(standards) ? standards as string[] : [standards as string];

    const checklists: any = {
      'ISO_9001_2015': {
        standard: 'ISO 9001:2015',
        categories: [
          {
            name: 'Context of the Organization',
            items: [
              'Define organizational context and interested parties',
              'Establish quality management system scope',
              'Document quality policy and objectives'
            ]
          },
          {
            name: 'Leadership',
            items: [
              'Demonstrate leadership commitment',
              'Establish customer focus',
              'Define roles and responsibilities'
            ]
          },
          {
            name: 'Planning',
            items: [
              'Address risks and opportunities',
              'Set quality objectives and planning',
              'Plan changes to QMS'
            ]
          },
          {
            name: 'Support',
            items: [
              'Determine required resources',
              'Ensure competence of personnel',
              'Establish communication channels'
            ]
          },
          {
            name: 'Operation',
            items: [
              'Plan and control operational processes',
              'Determine customer requirements',
              'Control externally provided processes'
            ]
          },
          {
            name: 'Performance Evaluation',
            items: [
              'Monitor and measure processes',
              'Conduct internal audits',
              'Management review'
            ]
          },
          {
            name: 'Improvement',
            items: [
              'Address nonconformities',
              'Implement corrective actions',
              'Continual improvement'
            ]
          }
        ]
      },
      'ISO_27001_2022': {
        standard: 'ISO 27001:2022',
        categories: [
          {
            name: 'Information Security Policy',
            items: [
              'Develop information security policy',
              'Define security objectives',
              'Establish governance framework'
            ]
          },
          {
            name: 'Risk Management',
            items: [
              'Conduct information security risk assessment',
              'Implement risk treatment plan',
              'Monitor and review risks'
            ]
          },
          {
            name: 'Asset Management',
            items: [
              'Inventory information assets',
              'Classify information assets',
              'Define acceptable use policies'
            ]
          },
          {
            name: 'Access Control',
            items: [
              'Implement access control policy',
              'Manage user access rights',
              'Control privileged access rights'
            ]
          },
          {
            name: 'Incident Management',
            items: [
              'Establish incident response procedures',
              'Report security incidents',
              'Learn from incidents'
            ]
          }
        ]
      }
    };

    const result = standardList
      .filter(std => std && checklists[std])
      .map(std => checklists[std]);

    res.json({
      standards: standardList,
      checklists: result,
      estimatedComplexity: result.length > 1 ? 'HIGH' : 'MEDIUM'
    });
  } catch (error) {
    console.error('Error generating checklist:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to generate checklist' 
    });
  }
});

export default router;