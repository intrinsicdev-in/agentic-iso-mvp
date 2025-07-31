import { PrismaClient, StandardType } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentMatchResult {
  isMatch: boolean;
  confidence: number;
  matchType: 'clause' | 'keyword' | 'title' | 'none';
  matchedStandardDoc?: any;
}

/**
 * Intelligent document matching that considers:
 * 1. Clause mappings (highest priority)
 * 2. Fuzzy title matching
 * 3. Keyword matching
 */
// Common document abbreviations mapping
const DOCUMENT_ABBREVIATIONS: { [key: string]: string[] } = {
  'statement of applicability': ['soa', 'statement applicability', 'applicability statement'],
  'quality objectives': ['qo', 'qual objectives', 'quality obj'],
  'quality policy': ['qp', 'qual policy'],
  'business continuity plan': ['bcp', 'bus continuity', 'continuity plan'],
  'risk assessment': ['ra', 'risk assess'],
  'risk register': ['rr', 'risk reg'],
  'training records': ['tr', 'training rec'],
  'internal audit': ['ia', 'int audit'],
  'management review': ['mr', 'mgmt review', 'management rev'],
  'information security policy': ['isp', 'infosec policy', 'info sec policy', 'infosec'],
  'isms': ['information security management system'],
  'qms': ['quality management system'],
  'management review minutes': ['mr minutes', 'mgmt review minutes', 'mr', 'management minutes'],
  'internal audit plan': ['ia plan', 'audit plan', 'ia schedule', 'audit schedule'],
  'nonconformity': ['nc', 'non conformity'],
  'corrective action': ['ca', 'corrective actions']
};

export class DocumentMatcher {
  
  /**
   * Check if an existing document fulfills a standard requirement
   */
  async matchDocument(
    existingDoc: {
      id: string;
      title: string;
      clauseMappings: Array<{
        clause: {
          clauseNumber: string;
          standard: StandardType;
        };
      }>;
    },
    standardDoc: {
      id: string;
      title: string;
      keywords: string[];
      clauseNumbers: string[];
      standard: StandardType;
    }
  ): Promise<DocumentMatchResult> {
    
    // 1. Clause-based matching (most reliable)
    const clauseMatch = this.checkClauseMatch(existingDoc, standardDoc);
    if (clauseMatch.isMatch) {
      return clauseMatch;
    }
    
    // 2. Fuzzy title matching
    const titleMatch = this.checkTitleMatch(existingDoc.title, standardDoc.title);
    if (titleMatch.isMatch) {
      return {
        ...titleMatch,
        matchedStandardDoc: standardDoc
      };
    }
    
    // 3. Keyword matching
    const keywordMatch = this.checkKeywordMatch(existingDoc.title, standardDoc.keywords);
    if (keywordMatch.isMatch) {
      return {
        ...keywordMatch,
        matchedStandardDoc: standardDoc
      };
    }
    
    return {
      isMatch: false,
      confidence: 0,
      matchType: 'none'
    };
  }
  
  /**
   * Check if document has clause mappings that match the standard document's clauses
   */
  private checkClauseMatch(
    existingDoc: {
      clauseMappings: Array<{
        clause: {
          clauseNumber: string;
          standard: StandardType;
        };
      }>;
    },
    standardDoc: {
      clauseNumbers: string[];
      standard: StandardType;
    }
  ): DocumentMatchResult {
    
    const existingClauses = existingDoc.clauseMappings
      .filter(mapping => mapping.clause.standard === standardDoc.standard)
      .map(mapping => mapping.clause.clauseNumber);
    
    // Check for exact clause matches
    const exactMatches = standardDoc.clauseNumbers.filter(clause => 
      existingClauses.includes(clause)
    );
    
    if (exactMatches.length > 0) {
      const confidence = exactMatches.length / standardDoc.clauseNumbers.length;
      return {
        isMatch: true,
        confidence: Math.min(confidence * 1.2, 1.0), // Boost clause matches
        matchType: 'clause'
      };
    }
    
    // Check for partial clause matches (e.g., "6.2" matches "6.2.1")
    const partialMatches = standardDoc.clauseNumbers.filter(stdClause =>
      existingClauses.some(existingClause => 
        stdClause.startsWith(existingClause) || existingClause.startsWith(stdClause)
      )
    );
    
    if (partialMatches.length > 0) {
      const confidence = (partialMatches.length / standardDoc.clauseNumbers.length) * 0.8;
      return {
        isMatch: confidence > 0.3, // Lower threshold for partial matches
        confidence,
        matchType: 'clause'
      };
    }
    
    return {
      isMatch: false,
      confidence: 0,
      matchType: 'none'
    };
  }
  
  /**
   * Fuzzy title matching with various normalization techniques
   */
  private checkTitleMatch(existingTitle: string, standardTitle: string): DocumentMatchResult {
    const normalizeTitle = (title: string): string => {
      return title
        .toLowerCase()
        .replace(/[_\-\.]/g, ' ')  // Replace underscores, hyphens, dots with spaces
        .replace(/\d{1,2}[\-\/]\w{3}[\-\/]\d{2,4}/g, '') // Remove dates like 15-Jul-2026
        .replace(/v\d+(\.\d+)?/gi, '') // Remove version numbers like V2, v1.0
        .replace(/\s+/g, ' ')      // Multiple spaces to single space
        .trim();
    };
    
    const normalizedExisting = normalizeTitle(existingTitle);
    const normalizedStandard = normalizeTitle(standardTitle);
    
    // Check for abbreviation matches
    const abbrevMatch = this.checkAbbreviationMatch(normalizedExisting, normalizedStandard);
    if (abbrevMatch.isMatch) {
      return {
        isMatch: true,
        confidence: abbrevMatch.confidence,
        matchType: 'title'
      };
    }
    
    // Exact match after normalization
    if (normalizedExisting === normalizedStandard) {
      return {
        isMatch: true,
        confidence: 1.0,
        matchType: 'title'
      };
    }
    
    // Check if one title contains the other
    if (normalizedExisting.includes(normalizedStandard) || 
        normalizedStandard.includes(normalizedExisting)) {
      const shorter = Math.min(normalizedExisting.length, normalizedStandard.length);
      const longer = Math.max(normalizedExisting.length, normalizedStandard.length);
      const confidence = shorter / longer;
      
      return {
        isMatch: confidence > 0.6,
        confidence,
        matchType: 'title'
      };
    }
    
    // Calculate similarity using Levenshtein distance
    const similarity = this.calculateSimilarity(normalizedExisting, normalizedStandard);
    
    return {
      isMatch: similarity > 0.5, // Lower threshold for similarity
      confidence: similarity,
      matchType: 'title'
    };
  }
  
  /**
   * Check for abbreviation matches
   */
  private checkAbbreviationMatch(existingTitle: string, standardTitle: string): DocumentMatchResult {
    // Check if existing title is an abbreviation of standard title
    for (const [fullForm, abbreviations] of Object.entries(DOCUMENT_ABBREVIATIONS)) {
      if (standardTitle.includes(fullForm)) {
        for (const abbrev of abbreviations) {
          if (existingTitle.includes(abbrev) || existingTitle === abbrev) {
            return {
              isMatch: true,
              confidence: 0.9, // High confidence for abbreviation matches
              matchType: 'title'
            };
          }
        }
      }
    }
    
    // Check reverse - if standard title contains abbreviation that matches existing
    const existingWords = existingTitle.split(' ');
    for (const word of existingWords) {
      for (const [fullForm, abbreviations] of Object.entries(DOCUMENT_ABBREVIATIONS)) {
        if (abbreviations.includes(word) && standardTitle.includes(fullForm)) {
          return {
            isMatch: true,
            confidence: 0.85,
            matchType: 'title'
          };
        }
      }
    }
    
    return {
      isMatch: false,
      confidence: 0,
      matchType: 'none'
    };
  }
  
  /**
   * Check if document title contains keywords from standard document
   */
  private checkKeywordMatch(existingTitle: string, keywords: string[]): DocumentMatchResult {
    const normalizedTitle = existingTitle.toLowerCase();
    
    const matchedKeywords = keywords.filter(keyword => 
      normalizedTitle.includes(keyword.toLowerCase())
    );
    
    if (matchedKeywords.length === 0) {
      return {
        isMatch: false,
        confidence: 0,
        matchType: 'none'
      };
    }
    
    const confidence = matchedKeywords.length / keywords.length;
    
    return {
      isMatch: confidence > 0.3, // Need at least 30% keyword match
      confidence: confidence * 0.8, // Slightly higher confidence for keyword matches
      matchType: 'keyword'
    };
  }
  
  /**
   * Calculate similarity between two strings using a simple algorithm
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

/**
 * Find missing documents by checking existing documents against standard requirements
 */
export async function findMissingDocuments(
  organizationId: string,
  standard?: StandardType
): Promise<any[]> {
  const matcher = new DocumentMatcher();
  
  // Get existing documents with their clause mappings
  const existingDocs = await prisma.artefact.findMany({
    where: { organizationId },
    include: {
      clauseMappings: {
        include: {
          clause: {
            select: {
              clauseNumber: true,
              standard: true
            }
          }
        }
      }
    }
  });
  
  // Get standard documents to check against
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
  
  // Check each standard document to see if it's fulfilled
  const missingDocs = [];
  
  for (const standardDoc of standardDocs) {
    let isFulfilled = false;
    
    for (const existingDoc of existingDocs) {
      const matchResult = await matcher.matchDocument(existingDoc, standardDoc);
      
      if (matchResult.isMatch && matchResult.confidence > 0.5) {
        isFulfilled = true;
        console.log(`✅ ${standardDoc.title} fulfilled by ${existingDoc.title} (${matchResult.matchType}, ${Math.round(matchResult.confidence * 100)}%)`);
        break;
      }
    }
    
    if (!isFulfilled) {
      missingDocs.push({
        title: standardDoc.title,
        category: standardDoc.category,
        description: standardDoc.description,
        clauseRef: standardDoc.clauseRef,
        importance: standardDoc.importance,
        standard: standardDoc.standard
      });
    }
  }
  
  return missingDocs;
}