import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AISuggestion {
  id: string;
  type: 'policy_update' | 'risk_assessment' | 'audit_preparation' | 'training_recommendation';
  title: string;
  description: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  relatedClauses: string[];
  estimatedImpact: string;
}

export interface AgentContext {
  agentType: 'risk_management' | 'policy_optimization' | 'audit_preparation' | 'training_compliance';
  currentArtefacts: any[];
  recentRisks: any[];
  upcomingAudits: any[];
  complianceStatus: any;
}

export class AIService {
  private static instance: AIService;
  
  private constructor() {}
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async generateSuggestion(
    agentType: string,
    context: AgentContext,
    prompt: string
  ): Promise<AISuggestion> {
    try {
      const systemPrompt = this.getSystemPrompt(agentType);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Context: ${JSON.stringify(context)}\n\nRequest: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the AI response into a structured suggestion
      return this.parseAIResponse(response, agentType);
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
      throw new Error('Failed to generate AI suggestion');
    }
  }

  private getSystemPrompt(agentType: string): string {
    const prompts = {
      risk_management: `You are a Risk Register Agent specializing in ISO 27001 and ISO 9001 compliance. 
      Your role is to identify, assess, and suggest mitigation strategies for risks related to information security and quality management.
      Provide structured risk assessments with clear impact analysis and mitigation recommendations.`,
      
      policy_optimization: `You are a Policy Optimiser Agent specializing in ISO documentation improvement.
      Your role is to analyze policies and procedures and suggest improvements for better compliance, clarity, and effectiveness.
      Focus on practical, actionable recommendations that enhance compliance posture.`,
      
      audit_preparation: `You are an Audit Preparer Agent specializing in ISO audit readiness.
      Your role is to help organizations prepare for internal and external audits by identifying gaps, compiling documentation, and suggesting improvements.
      Provide comprehensive audit preparation guidance.`,
      
      training_compliance: `You are a Training Compliance Agent specializing in ISO training requirements.
      Your role is to identify training needs, track compliance requirements, and suggest training programs to meet ISO standards.
      Focus on competency development and compliance coverage.`
    };

    return prompts[agentType as keyof typeof prompts] || prompts.risk_management;
  }

  private parseAIResponse(response: string, agentType: string): AISuggestion {
    // In a real implementation, you'd parse the AI response more carefully
    // For now, we'll create a structured response
    const id = `suggestion_${Date.now()}`;
    
    return {
      id,
      type: this.mapAgentTypeToSuggestionType(agentType),
      title: `AI Suggestion from ${agentType.replace('_', ' ')} Agent`,
      description: response.substring(0, 200) + '...',
      content: response,
      priority: 'medium',
      confidence: 0.85,
      relatedClauses: ['ISO 9001:2015 - 5.2', 'ISO 27001:2022 - 6.1'],
      estimatedImpact: 'Medium impact on compliance posture'
    };
  }

  private mapAgentTypeToSuggestionType(agentType: string): AISuggestion['type'] {
    const mapping = {
      risk_management: 'risk_assessment' as const,
      policy_optimization: 'policy_update' as const,
      audit_preparation: 'audit_preparation' as const,
      training_compliance: 'training_recommendation' as const
    };
    
    return mapping[agentType as keyof typeof mapping] || 'policy_update';
  }

  async analyzeArtefact(artefact: any): Promise<AISuggestion[]> {
    const context: AgentContext = {
      agentType: 'policy_optimization',
      currentArtefacts: [artefact],
      recentRisks: [],
      upcomingAudits: [],
      complianceStatus: {}
    };

    const suggestions: AISuggestion[] = [];
    
    // Generate multiple suggestions for different aspects
    const aspects = [
      'compliance alignment',
      'clarity and readability',
      'practical implementation',
      'risk mitigation'
    ];

    for (const aspect of aspects) {
      try {
        const suggestion = await this.generateSuggestion(
          'policy_optimization',
          context,
          `Analyze this artefact for ${aspect} and provide specific improvement recommendations.`
        );
        suggestions.push(suggestion);
      } catch (error) {
        console.error(`Failed to generate suggestion for ${aspect}:`, error);
      }
    }

    return suggestions;
  }

  async assessRisk(riskData: any): Promise<AISuggestion> {
    const context: AgentContext = {
      agentType: 'risk_management',
      currentArtefacts: [],
      recentRisks: [riskData],
      upcomingAudits: [],
      complianceStatus: {}
    };

    return this.generateSuggestion(
      'risk_management',
      context,
      'Assess this risk and provide mitigation strategies with compliance considerations.'
    );
  }

  async prepareAudit(auditData: any): Promise<AISuggestion[]> {
    const context: AgentContext = {
      agentType: 'audit_preparation',
      currentArtefacts: [],
      recentRisks: [],
      upcomingAudits: [auditData],
      complianceStatus: {}
    };

    const suggestions: AISuggestion[] = [];
    
    const preparationAreas = [
      'documentation review',
      'gap analysis',
      'evidence collection',
      'stakeholder preparation'
    ];

    for (const area of preparationAreas) {
      try {
        const suggestion = await this.generateSuggestion(
          'audit_preparation',
          context,
          `Provide guidance for ${area} in preparation for this audit.`
        );
        suggestions.push(suggestion);
      } catch (error) {
        console.error(`Failed to generate audit preparation suggestion for ${area}:`, error);
      }
    }

    return suggestions;
  }
}

export default AIService.getInstance(); 