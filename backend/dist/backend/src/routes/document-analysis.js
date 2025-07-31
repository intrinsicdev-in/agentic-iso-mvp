"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const client_1 = require("@prisma/client");
const document_matcher_1 = require("../utils/document-matcher");
const ai_document_categorizer_service_1 = require("../services/ai-document-categorizer.service");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Analyze existing documents and suggest ISO mappings
router.post('/analyze-documents', auth_1.authenticateToken, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const { documentIds, standard } = req.body;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const matcher = new document_matcher_1.DocumentMatcher();
        // Get documents to analyze
        const whereClause = { organizationId };
        if (documentIds && documentIds.length > 0) {
            whereClause.id = { in: documentIds };
        }
        const documents = await prisma.artefact.findMany({
            where: whereClause,
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
        // Get standard documents to match against
        const standardWhereClause = standard
            ? { standard: standard }
            : {
                OR: [
                    { standard: client_1.StandardType.ISO_9001_2015 },
                    { standard: client_1.StandardType.ISO_27001_2022 }
                ]
            };
        const standardDocs = await prisma.standardDocument.findMany({
            where: standardWhereClause
        });
        const analysisResults = [];
        // Analyze each document
        for (const doc of documents) {
            const suggestedMappings = [];
            for (const standardDoc of standardDocs) {
                const matchResult = await matcher.matchDocument(doc, standardDoc);
                if (matchResult.confidence > 0.3) { // Include lower confidence suggestions
                    suggestedMappings.push({
                        standardDocument: {
                            id: standardDoc.id,
                            title: standardDoc.title,
                            standard: standardDoc.standard,
                            category: standardDoc.category,
                            clauseNumbers: standardDoc.clauseNumbers
                        },
                        confidence: matchResult.confidence,
                        matchType: matchResult.matchType,
                        shouldMap: matchResult.confidence > 0.6 // Auto-suggest high confidence matches
                    });
                }
            }
            // Sort by confidence
            suggestedMappings.sort((a, b) => b.confidence - a.confidence);
            analysisResults.push({
                documentId: doc.id,
                documentTitle: doc.title,
                suggestedMappings: suggestedMappings.slice(0, 5) // Top 5 suggestions
            });
        }
        // Log the analysis action
        await prisma.auditLog.create({
            data: {
                action: 'ANALYZE_DOCUMENTS',
                entityType: 'DOCUMENT_ANALYSIS',
                entityId: 'ANALYSIS',
                userId: req.user?.id,
                details: {
                    documentsAnalyzed: documents.length,
                    standardFilter: standard || 'ALL',
                    organizationId,
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            }
        });
        res.json({
            success: true,
            data: {
                analysisResults,
                totalDocuments: documents.length,
                analyzedAt: new Date()
            }
        });
    }
    catch (error) {
        console.error('Error analyzing documents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze documents'
        });
    }
});
// Apply suggested mappings
router.post('/apply-mappings', auth_1.authenticateToken, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const { mappings } = req.body; // Array of { documentId, standardDocumentId, confidence }
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const appliedMappings = [];
        for (const mapping of mappings) {
            const { documentId, standardDocumentId, confidence } = mapping;
            // Get the standard document to find its clause numbers
            const standardDoc = await prisma.standardDocument.findUnique({
                where: { id: standardDocumentId }
            });
            if (!standardDoc || standardDoc.clauseNumbers.length === 0) {
                continue;
            }
            // Find the corresponding ISO clauses
            const isoClauses = await prisma.iSOClause.findMany({
                where: {
                    standard: standardDoc.standard,
                    clauseNumber: { in: standardDoc.clauseNumbers }
                }
            });
            // Create clause mappings
            for (const clause of isoClauses) {
                try {
                    await prisma.clauseMapping.create({
                        data: {
                            artefactId: documentId,
                            clauseId: clause.id,
                            confidence: confidence,
                            keywords: standardDoc.keywords
                        }
                    });
                    appliedMappings.push({
                        documentId,
                        clauseNumber: clause.clauseNumber,
                        standardTitle: standardDoc.title,
                        confidence
                    });
                }
                catch (error) {
                    // Mapping might already exist, skip
                    console.log(`Mapping already exists for document ${documentId} and clause ${clause.clauseNumber}`);
                }
            }
        }
        // Log the mapping action
        await prisma.auditLog.create({
            data: {
                action: 'APPLY_DOCUMENT_MAPPINGS',
                entityType: 'CLAUSE_MAPPING',
                entityId: 'BULK_MAPPING',
                userId: req.user?.id,
                details: {
                    mappingsApplied: appliedMappings.length,
                    organizationId,
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            }
        });
        res.json({
            success: true,
            data: {
                appliedMappings,
                totalApplied: appliedMappings.length
            }
        });
    }
    catch (error) {
        console.error('Error applying mappings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to apply mappings'
        });
    }
});
// Get document fulfillment status
router.get('/fulfillment-status', auth_1.authenticateToken, async (req, res) => {
    try {
        const organizationId = req.user?.organizationId;
        const { standard } = req.query;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const matcher = new document_matcher_1.DocumentMatcher();
        // Get existing documents
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
        // Get standard documents
        const standardWhereClause = standard
            ? { standard: standard }
            : {
                OR: [
                    { standard: client_1.StandardType.ISO_9001_2015 },
                    { standard: client_1.StandardType.ISO_27001_2022 }
                ]
            };
        const standardDocs = await prisma.standardDocument.findMany({
            where: standardWhereClause
        });
        // Check fulfillment status
        const fulfillmentStatus = [];
        for (const standardDoc of standardDocs) {
            let fulfilledBy = null;
            let confidence = 0;
            for (const existingDoc of existingDocs) {
                const matchResult = await matcher.matchDocument(existingDoc, standardDoc);
                if (matchResult.isMatch && matchResult.confidence > confidence) {
                    fulfilledBy = {
                        id: existingDoc.id,
                        title: existingDoc.title,
                        matchType: matchResult.matchType,
                        confidence: matchResult.confidence
                    };
                    confidence = matchResult.confidence;
                }
            }
            fulfillmentStatus.push({
                standardDocument: {
                    id: standardDoc.id,
                    title: standardDoc.title,
                    category: standardDoc.category,
                    standard: standardDoc.standard,
                    clauseRef: standardDoc.clauseRef
                },
                isFulfilled: fulfilledBy !== null,
                fulfilledBy,
                confidence
            });
        }
        res.json({
            success: true,
            data: {
                fulfillmentStatus,
                summary: {
                    total: standardDocs.length,
                    fulfilled: fulfillmentStatus.filter(s => s.isFulfilled).length,
                    missing: fulfillmentStatus.filter(s => !s.isFulfilled).length,
                    requiredMissing: fulfillmentStatus.filter(s => !s.isFulfilled && s.standardDocument.category === 'Required').length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting fulfillment status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get fulfillment status'
        });
    }
});
// AI-powered document categorization
router.post('/ai-categorize', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentIds, standard } = req.body;
        const organizationId = req.user?.organizationId;
        if (!organizationId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID is required'
            });
        }
        const aiCategorizer = new ai_document_categorizer_service_1.AIDocumentCategorizerService();
        if (documentIds && documentIds.length > 0) {
            // Batch categorize specific documents
            const results = await aiCategorizer.batchCategorizeDocuments(documentIds);
            // Convert Map to object for JSON response
            const resultsObj = Object.fromEntries(results);
            res.json({
                success: true,
                data: {
                    categorizationResults: resultsObj,
                    totalProcessed: results.size
                }
            });
        }
        else {
            return res.status(400).json({
                success: false,
                error: 'Document IDs are required'
            });
        }
    }
    catch (error) {
        console.error('Error in AI categorization:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to categorize documents'
        });
    }
});
// Auto-apply AI suggestions with high confidence
router.post('/ai-auto-apply', auth_1.authenticateToken, async (req, res) => {
    try {
        const { documentId, minConfidence = 0.8 } = req.body;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.id;
        if (!organizationId || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Organization ID and User ID are required'
            });
        }
        // Get document
        const document = await prisma.artefact.findFirst({
            where: {
                id: documentId,
                organizationId
            },
            include: {
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1
                }
            }
        });
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }
        const aiCategorizer = new ai_document_categorizer_service_1.AIDocumentCategorizerService();
        // Get AI categorization
        const content = document.versions[0]?.content;
        const categoryResult = await aiCategorizer.categorizeDocument(document.title, content);
        // Auto-apply high confidence mappings
        const appliedCount = await aiCategorizer.autoApplyMappings(documentId, categoryResult, userId, minConfidence);
        // Log the action
        await prisma.auditLog.create({
            data: {
                action: 'AI_AUTO_APPLY_MAPPINGS',
                entityType: 'CLAUSE_MAPPING',
                entityId: documentId,
                userId,
                details: {
                    appliedMappings: appliedCount,
                    minConfidence,
                    organizationId,
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            }
        });
        res.json({
            success: true,
            data: {
                documentId,
                appliedMappings: appliedCount,
                categoryResult,
                minConfidence
            }
        });
    }
    catch (error) {
        console.error('Error in AI auto-apply:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to auto-apply AI suggestions'
        });
    }
});
exports.default = router;
//# sourceMappingURL=document-analysis.js.map