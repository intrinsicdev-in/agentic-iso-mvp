import { OpenAI } from 'openai';
import { PrismaClient, StandardType } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize OpenAI if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

interface AICategorizationResult {
  suggestedMappings: Array<{
    standardDocument: string;
    confidence: number;
    reasoning: string;
    clauseNumbers: string[];
    standard: StandardType;
  }>;
  documentSummary: string;
  confidence: number;
}

export class AIDocumentCategorizerService {
  
  /**
   * Use AI to analyze document content and suggest ISO standard mappings
   */
  async categorizeDocument(
    documentTitle: string,
    documentContent?: string,
    standard?: StandardType
  ): Promise<AICategorizationResult> {
    
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }

    // Get standard documents for context
    const whereClause = standard 
      ? { standard }
      : { 
          OR: [
            { standard: StandardType.ISO_9001_2015 },
            { standard: StandardType.ISO_27001_2022 }
          ]
        };

    const standardDocs = await prisma.standardDocument.findMany({
      where: whereClause
    });

    // Create context for AI
    const standardDocsContext = standardDocs.map(doc => ({
      title: doc.title,
      description: doc.description,
      category: doc.category,
      clauseRef: doc.clauseRef,
      keywords: doc.keywords,
      clauseNumbers: doc.clauseNumbers,
      standard: doc.standard
    }));

    const prompt = this.buildCategorizationPrompt(
      documentTitle,
      standardDocsContext,
      documentContent
    );

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert in ISO 9001:2015 and ISO 27001:2022 standards. 
            Your task is to analyze documents and suggest which ISO standard requirements they fulfill.
            Always respond with valid JSON only, no additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const result = JSON.parse(aiResponse);
      
      // Validate and enhance the result
      return this.validateAndEnhanceResult(result, standardDocs);

    } catch (error) {
      console.error('AI categorization error:', error);
      
      // Fallback to basic keyword matching if AI fails
      return this.fallbackCategorization(documentTitle, documentContent, standardDocs);
    }
  }

  /**
   * Build the prompt for AI categorization
   */
  private buildCategorizationPrompt(
    documentTitle: string,
    standardDocs: any[],
    documentContent?: string
  ): string {
    return `
Analyze this document and suggest which ISO standard requirements it fulfills:

Document Title: "${documentTitle}"
${documentContent ? `Document Content Preview: "${documentContent.substring(0, 1000)}..."` : ''}

Available ISO Standard Requirements:
${standardDocs.map((doc, index) => `
${index + 1}. ${doc.title} (${doc.standard})
   - Category: ${doc.category}
   - Description: ${doc.description}
   - Clause Reference: ${doc.clauseRef || 'N/A'}
   - Keywords: ${doc.keywords.join(', ')}
   - Clause Numbers: ${doc.clauseNumbers.join(', ')}
`).join('')}

Respond with JSON only in this exact format:
{
  "documentSummary": "Brief summary of what this document appears to be",
  "confidence": 0.85,
  "suggestedMappings": [
    {
      "standardDocument": "Quality Objectives",
      "confidence": 0.9,
      "reasoning": "Document contains measurable quality targets",
      "clauseNumbers": ["6.2", "6.2.1"],
      "standard": "ISO_9001_2015"
    }
  ]
}

Rules:
- Only suggest mappings with confidence > 0.5
- Provide clear reasoning for each suggestion
- Include specific clause numbers from the standard requirements
- Use exact standard document titles from the list above
- Overall confidence should reflect certainty of analysis
`;
  }

  /**
   * Validate and enhance AI response
   */
  private validateAndEnhanceResult(
    aiResult: any,
    standardDocs: any[]
  ): AICategorizationResult {
    
    const validatedMappings = [];
    
    if (aiResult.suggestedMappings && Array.isArray(aiResult.suggestedMappings)) {
      for (const mapping of aiResult.suggestedMappings) {
        // Find the corresponding standard document
        const standardDoc = standardDocs.find(doc => 
          doc.title === mapping.standardDocument
        );
        
        if (standardDoc && mapping.confidence > 0.5) {
          validatedMappings.push({
            standardDocument: mapping.standardDocument,
            confidence: Math.min(mapping.confidence, 1.0),
            reasoning: mapping.reasoning || 'AI suggested mapping',
            clauseNumbers: mapping.clauseNumbers || standardDoc.clauseNumbers,
            standard: mapping.standard || standardDoc.standard
          });
        }
      }
    }

    return {
      suggestedMappings: validatedMappings,
      documentSummary: aiResult.documentSummary || 'Document analyzed by AI',
      confidence: Math.min(aiResult.confidence || 0.5, 1.0)
    };
  }

  /**
   * Fallback categorization using keyword matching
   */
  private fallbackCategorization(
    documentTitle: string,
    documentContent: string | undefined,
    standardDocs: any[]
  ): AICategorizationResult {
    
    const fullText = `${documentTitle} ${documentContent || ''}`.toLowerCase();
    const suggestedMappings = [];

    for (const standardDoc of standardDocs) {
      let matchScore = 0;
      let matchedKeywords = [];

      // Check keyword matches
      for (const keyword of standardDoc.keywords) {
        if (fullText.includes(keyword.toLowerCase())) {
          matchScore += 0.2;
          matchedKeywords.push(keyword);
        }
      }

      // Check title similarity
      const titleWords = standardDoc.title.toLowerCase().split(' ');
      for (const word of titleWords) {
        if (word.length > 3 && fullText.includes(word)) {
          matchScore += 0.15;
        }
      }

      if (matchScore > 0.5) {
        suggestedMappings.push({
          standardDocument: standardDoc.title,
          confidence: Math.min(matchScore, 0.8), // Cap fallback confidence
          reasoning: `Keyword match: ${matchedKeywords.join(', ')}`,
          clauseNumbers: standardDoc.clauseNumbers,
          standard: standardDoc.standard
        });
      }
    }

    // Sort by confidence
    suggestedMappings.sort((a, b) => b.confidence - a.confidence);

    return {
      suggestedMappings: suggestedMappings.slice(0, 3), // Top 3 suggestions
      documentSummary: 'Document analyzed using keyword matching',
      confidence: suggestedMappings.length > 0 ? suggestedMappings[0].confidence : 0.3
    };
  }

  /**
   * Batch categorize multiple documents
   */
  async batchCategorizeDocuments(documentIds: string[]): Promise<Map<string, AICategorizationResult>> {
    const results = new Map<string, AICategorizationResult>();
    
    // Get documents with content
    const documents = await prisma.artefact.findMany({
      where: { id: { in: documentIds } },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    });

    // Process each document
    for (const doc of documents) {
      try {
        const content = doc.versions[0]?.content;
        const result = await this.categorizeDocument(doc.title, content);
        results.set(doc.id, result);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error categorizing document ${doc.id}:`, error);
        // Add empty result for failed documents
        results.set(doc.id, {
          suggestedMappings: [],
          documentSummary: 'Failed to analyze',
          confidence: 0
        });
      }
    }

    return results;
  }

  /**
   * Auto-apply high-confidence mappings
   */
  async autoApplyMappings(
    documentId: string,
    categoryResult: AICategorizationResult,
    userId: string,
    minConfidence: number = 0.8
  ): Promise<number> {
    
    let appliedCount = 0;
    
    for (const mapping of categoryResult.suggestedMappings) {
      if (mapping.confidence >= minConfidence) {
        try {
          // Find ISO clauses for the mapping
          const clauses = await prisma.iSOClause.findMany({
            where: {
              standard: mapping.standard,
              clauseNumber: { in: mapping.clauseNumbers }
            }
          });

          // Create clause mappings
          for (const clause of clauses) {
            await prisma.clauseMapping.create({
              data: {
                artefactId: documentId,
                clauseId: clause.id,
                confidence: mapping.confidence,
                keywords: [mapping.standardDocument] // Use standard doc title as keyword
              }
            });
            appliedCount++;
          }
        } catch (error) {
          console.error(`Error applying mapping for ${mapping.standardDocument}:`, error);
        }
      }
    }

    return appliedCount;
  }
}