"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtefactService = void 0;
const client_1 = require("@prisma/client");
const iso_document_parser_1 = require("../lib/parsers/iso-document-parser");
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
class ArtefactService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.s3 = new aws_sdk_1.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
            endpoint: process.env.AWS_ENDPOINT_URL,
            s3ForcePathStyle: true, // Required for MinIO
            signatureVersion: 'v4'
        });
        this.documentParser = new iso_document_parser_1.ISODocumentParser();
    }
    async createArtefact(data) {
        let fileUrl;
        // Upload file to S3 if provided
        if (data.file) {
            fileUrl = await this.uploadToS3(data.file);
        }
        // Create artefact with initial version
        const artefact = await this.prisma.artefact.create({
            data: {
                title: data.title,
                description: data.description,
                ownerId: data.ownerId,
                fileUrl,
                versions: {
                    create: {
                        version: 1,
                        content: data.content || '',
                        fileUrl,
                        createdById: data.ownerId
                    }
                }
            },
            include: {
                versions: true,
                owner: true
            }
        });
        // Create audit log
        await this.createAuditLog('artefact.created', 'artefact', artefact.id, data.ownerId, {
            title: artefact.title
        });
        return artefact;
    }
    async importAndClassifyArtefact(data) {
        console.log('🚀 Starting importAndClassifyArtefact');
        console.log('📁 File info:', {
            originalname: data.file.originalname,
            mimetype: data.file.mimetype,
            size: data.file.size,
            ownerId: data.ownerId,
            standard: data.standard,
            autoClassify: data.autoClassify
        });
        // Parse the document
        console.log('📖 Starting document parsing...');
        const parsedDoc = await this.documentParser.parseDocument(data.file.buffer, data.file.mimetype, data.file.originalname);
        console.log('✅ Document parsing completed');
        // Extract metadata
        const extractedMetadata = await this.documentParser.extractMetadata(parsedDoc);
        // Upload to S3
        const fileUrl = await this.uploadToS3(data.file);
        // Create artefact
        const artefactData = {
            title: extractedMetadata.documentType || data.file.originalname,
            description: `Imported from ${data.file.originalname}`,
            ownerId: data.ownerId,
            fileUrl,
            metadata: {
                ...parsedDoc.metadata,
                ...extractedMetadata,
                importedAt: new Date(),
                originalFilename: data.file.originalname
            },
            versions: {
                create: {
                    version: 1,
                    content: parsedDoc.content,
                    fileUrl,
                    createdById: data.ownerId,
                    changes: 'Initial import'
                }
            }
        };
        console.log('📊 Artefact data structure:', JSON.stringify(artefactData, null, 2));
        console.log('📊 Content length:', parsedDoc.content.length);
        console.log('📊 Owner ID:', data.ownerId);
        const artefact = await this.prisma.artefact.create({
            data: artefactData,
            include: {
                versions: true,
                owner: true
            }
        });
        let mappings = [];
        // Auto-classify if requested
        if (data.autoClassify) {
            const standardKey = data.standard === client_1.StandardType.ISO_9001_2015 ? 'ISO9001' : 'ISO27001';
            const classifications = await this.documentParser.classifyToISOClauses(parsedDoc, standardKey);
            // Create clause mappings
            for (const [sectionTitle, clauseMappings] of classifications.entries()) {
                for (const mapping of clauseMappings) {
                    // Find or create the ISO clause
                    const isoClause = await this.prisma.iSOClause.findUnique({
                        where: {
                            standard_clauseNumber: {
                                standard: data.standard,
                                clauseNumber: mapping.clauseNumber
                            }
                        }
                    });
                    if (isoClause) {
                        // Check if mapping already exists to avoid unique constraint violation
                        const existingMapping = await this.prisma.clauseMapping.findUnique({
                            where: {
                                artefactId_clauseId: {
                                    artefactId: artefact.id,
                                    clauseId: isoClause.id
                                }
                            }
                        });
                        if (!existingMapping) {
                            const clauseMapping = await this.prisma.clauseMapping.create({
                                data: {
                                    artefactId: artefact.id,
                                    clauseId: isoClause.id,
                                    confidence: mapping.confidence,
                                    keywords: mapping.keywords
                                }
                            });
                            mappings.push(clauseMapping);
                        }
                        else {
                            console.log(`📋 Clause mapping already exists for artefact ${artefact.id} and clause ${isoClause.id}`);
                            mappings.push(existingMapping);
                        }
                    }
                }
            }
            // Create AI suggestion for review
            await this.createAISuggestion({
                agentId: await this.getDefaultAgentId('DOCUMENT_REVIEWER'),
                type: 'document_classification',
                title: `Document Classification Review for ${artefact.title}`,
                content: `The document has been automatically classified to ${mappings.length} ISO clauses. Please review the mappings for accuracy.`,
                metadata: {
                    artefactId: artefact.id,
                    mappingCount: mappings.length,
                    standard: data.standard
                }
            });
        }
        // Create audit log
        await this.createAuditLog('artefact.imported', 'artefact', artefact.id, data.ownerId, {
            title: artefact.title,
            standard: data.standard,
            autoClassified: data.autoClassify,
            mappingsCreated: mappings.length
        });
        return { artefact, mappings };
    }
    async updateArtefact(id, userId, data) {
        const existingArtefact = await this.prisma.artefact.findUnique({
            where: { id },
            include: { versions: { orderBy: { version: 'desc' }, take: 1 } }
        });
        if (!existingArtefact) {
            throw new Error('Artefact not found');
        }
        const latestVersion = existingArtefact.versions[0];
        const newVersion = latestVersion.version + 1;
        // Update artefact and create new version
        const updated = await this.prisma.artefact.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                status: data.status,
                currentVersion: newVersion,
                versions: {
                    create: {
                        version: newVersion,
                        content: data.content || latestVersion.content,
                        fileUrl: latestVersion.fileUrl,
                        createdById: userId,
                        changes: this.generateChangeDescription(existingArtefact, data)
                    }
                }
            },
            include: {
                versions: { orderBy: { version: 'desc' }, take: 1 },
                owner: true,
                clauseMappings: true
            }
        });
        // Create audit log
        await this.createAuditLog('artefact.updated', 'artefact', id, userId, {
            version: newVersion,
            changes: data
        });
        return updated;
    }
    async getArtefactWithMappings(id) {
        return this.prisma.artefact.findUnique({
            where: { id },
            include: {
                owner: true,
                versions: { orderBy: { version: 'desc' } },
                clauseMappings: {
                    include: {
                        clause: true
                    }
                },
                reviews: {
                    include: {
                        reviewer: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                tasks: {
                    where: { status: { not: 'COMPLETED' } }
                }
            }
        });
    }
    async uploadToS3(file) {
        const key = `artefacts/${Date.now()}-${(0, uuid_1.v4)()}-${file.originalname}`;
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype
        };
        await this.s3.upload(params).promise();
        // For MinIO local development
        if (process.env.AWS_ENDPOINT_URL) {
            return `${process.env.AWS_ENDPOINT_URL}/${process.env.AWS_S3_BUCKET}/${key}`;
        }
        // For AWS S3 production
        return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
    generateChangeDescription(existing, changes) {
        const changeList = [];
        if (changes.title && changes.title !== existing.title) {
            changeList.push(`Title changed from "${existing.title}" to "${changes.title}"`);
        }
        if (changes.description && changes.description !== existing.description) {
            changeList.push('Description updated');
        }
        if (changes.content && changes.content !== existing.versions[0]?.content) {
            changeList.push('Content updated');
        }
        if (changes.status && changes.status !== existing.status) {
            changeList.push(`Status changed from ${existing.status} to ${changes.status}`);
        }
        return changeList.join('; ') || 'Minor updates';
    }
    async createAuditLog(action, entityType, entityId, userId, details) {
        await this.prisma.auditLog.create({
            data: {
                action,
                entityType,
                entityId,
                userId,
                details
            }
        });
    }
    async getDefaultAgentId(type) {
        const agent = await this.prisma.aIAgent.findFirst({
            where: { type: type }
        });
        return agent?.id || '';
    }
    async getAllArtefacts() {
        return this.prisma.artefact.findMany({
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: { versions: true, clauseMappings: true }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async createAISuggestion(data) {
        await this.prisma.aISuggestion.create({ data });
    }
    // REVIEW METHODS
    async createReview(artefactId, reviewerId, status, comments) {
        return this.prisma.review.create({
            data: {
                artefactId,
                reviewerId,
                status,
                comments
            },
            include: {
                reviewer: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }
    async getArtefactReviews(artefactId) {
        return this.prisma.review.findMany({
            where: { artefactId },
            include: {
                reviewer: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    // COMMENT METHODS
    async createComment(artefactId, authorId, content, parentId) {
        return this.prisma.comment.create({
            data: {
                artefactId,
                authorId,
                content,
                parentId
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                replies: {
                    include: {
                        author: {
                            select: { id: true, name: true, email: true }
                        }
                    }
                }
            }
        });
    }
    async getArtefactComments(artefactId) {
        return this.prisma.comment.findMany({
            where: {
                artefactId,
                parentId: null // Only get top-level comments
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true }
                },
                replies: {
                    include: {
                        author: {
                            select: { id: true, name: true, email: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    // TASK METHODS
    async createTask(artefactId, createdById, title, description, dueDate, priority, assigneeId) {
        return this.prisma.task.create({
            data: {
                artefactId,
                createdById,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                priority: priority || 2,
                assigneeId
            },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }
    async getArtefactTasks(artefactId) {
        return this.prisma.task.findMany({
            where: { artefactId },
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updateTask(taskId, userId, updates) {
        const data = {};
        if (updates.status) {
            data.status = updates.status;
        }
        if (updates.completedAt) {
            data.completedAt = new Date(updates.completedAt);
        }
        else if (updates.status === 'COMPLETED') {
            data.completedAt = new Date();
        }
        return this.prisma.task.update({
            where: { id: taskId },
            data,
            include: {
                assignee: {
                    select: { id: true, name: true, email: true }
                },
                createdBy: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
    }
    async deleteArtefact(artefactId, userId) {
        // First, get the artefact to verify ownership and get details
        const artefact = await this.prisma.artefact.findUnique({
            where: { id: artefactId },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                },
                versions: true,
                clauseMappings: true,
                reviews: true,
                comments: true,
                tasks: true
            }
        });
        if (!artefact) {
            throw new Error('Artefact not found');
        }
        // Create audit log before deletion
        await this.prisma.auditLog.create({
            data: {
                action: 'artefact.deleted',
                entityType: 'artefact',
                entityId: artefactId,
                userId,
                details: {
                    title: artefact.title,
                    ownerId: artefact.ownerId,
                    status: artefact.status,
                    versionsCount: artefact.versions.length,
                    mappingsCount: artefact.clauseMappings.length,
                    reviewsCount: artefact.reviews.length,
                    commentsCount: artefact.comments.length,
                    tasksCount: artefact.tasks.length
                }
            }
        });
        // Delete the artefact (cascade will handle related records)
        const deleted = await this.prisma.artefact.delete({
            where: { id: artefactId },
            include: {
                owner: {
                    select: { id: true, name: true, email: true }
                }
            }
        });
        return deleted;
    }
}
exports.ArtefactService = ArtefactService;
//# sourceMappingURL=artefact.service.js.map