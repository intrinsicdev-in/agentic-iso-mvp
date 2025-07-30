"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
class AIService {
    constructor() { }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    generateSuggestion(agentType, context, prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const systemPrompt = this.getSystemPrompt(agentType);
                const completion = yield openai.chat.completions.create({
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
                const response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                if (!response) {
                    throw new Error('No response from OpenAI');
                }
                // Parse the AI response into a structured suggestion
                return this.parseAIResponse(response, agentType);
            }
            catch (error) {
                console.error('AI suggestion generation failed:', error);
                throw new Error('Failed to generate AI suggestion');
            }
        });
    }
    getSystemPrompt(agentType) {
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
        return prompts[agentType] || prompts.risk_management;
    }
    parseAIResponse(response, agentType) {
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
    mapAgentTypeToSuggestionType(agentType) {
        const mapping = {
            risk_management: 'risk_assessment',
            policy_optimization: 'policy_update',
            audit_preparation: 'audit_preparation',
            training_compliance: 'training_recommendation'
        };
        return mapping[agentType] || 'policy_update';
    }
    analyzeArtefact(artefact) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = {
                agentType: 'policy_optimization',
                currentArtefacts: [artefact],
                recentRisks: [],
                upcomingAudits: [],
                complianceStatus: {}
            };
            const suggestions = [];
            // Generate multiple suggestions for different aspects
            const aspects = [
                'compliance alignment',
                'clarity and readability',
                'practical implementation',
                'risk mitigation'
            ];
            for (const aspect of aspects) {
                try {
                    const suggestion = yield this.generateSuggestion('policy_optimization', context, `Analyze this artefact for ${aspect} and provide specific improvement recommendations.`);
                    suggestions.push(suggestion);
                }
                catch (error) {
                    console.error(`Failed to generate suggestion for ${aspect}:`, error);
                }
            }
            return suggestions;
        });
    }
    assessRisk(riskData) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = {
                agentType: 'risk_management',
                currentArtefacts: [],
                recentRisks: [riskData],
                upcomingAudits: [],
                complianceStatus: {}
            };
            return this.generateSuggestion('risk_management', context, 'Assess this risk and provide mitigation strategies with compliance considerations.');
        });
    }
    prepareAudit(auditData) {
        return __awaiter(this, void 0, void 0, function* () {
            const context = {
                agentType: 'audit_preparation',
                currentArtefacts: [],
                recentRisks: [],
                upcomingAudits: [auditData],
                complianceStatus: {}
            };
            const suggestions = [];
            const preparationAreas = [
                'documentation review',
                'gap analysis',
                'evidence collection',
                'stakeholder preparation'
            ];
            for (const area of preparationAreas) {
                try {
                    const suggestion = yield this.generateSuggestion('audit_preparation', context, `Provide guidance for ${area} in preparation for this audit.`);
                    suggestions.push(suggestion);
                }
                catch (error) {
                    console.error(`Failed to generate audit preparation suggestion for ${area}:`, error);
                }
            }
            return suggestions;
        });
    }
}
exports.AIService = AIService;
exports.default = AIService.getInstance();
