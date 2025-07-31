-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ArtefactStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('DOCUMENT_REVIEWER', 'RISK_ASSESSOR', 'COMPLIANCE_CHECKER', 'TASK_MANAGER', 'REPORT_GENERATOR');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StandardType" AS ENUM ('ISO_9001_2015', 'ISO_27001_2022', 'ISO_27001_2013');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('NONCONFORMITY', 'COMPLAINT', 'RISK', 'INCIDENT', 'TRAINING', 'AUDIT', 'MANAGEMENT_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CONTRIBUTOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artefact" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "ArtefactStatus" NOT NULL DEFAULT 'DRAFT',
    "fileUrl" TEXT,
    "metadata" JSONB,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artefact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtefactVersion" (
    "id" TEXT NOT NULL,
    "artefactId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "fileUrl" TEXT,
    "changes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtefactVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ISOClause" (
    "id" TEXT NOT NULL,
    "standard" "StandardType" NOT NULL,
    "clauseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,

    CONSTRAINT "ISOClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClauseMapping" (
    "id" TEXT NOT NULL,
    "artefactId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "keywords" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClauseMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClauseAssignment" (
    "id" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClauseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "assigneeId" TEXT,
    "agentId" TEXT,
    "createdById" TEXT NOT NULL,
    "artefactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 2,
    "reportedById" TEXT NOT NULL,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "rationale" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "artefactId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "artefactId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Artefact_ownerId_idx" ON "Artefact"("ownerId");

-- CreateIndex
CREATE INDEX "ArtefactVersion_artefactId_idx" ON "ArtefactVersion"("artefactId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtefactVersion_artefactId_version_key" ON "ArtefactVersion"("artefactId", "version");

-- CreateIndex
CREATE INDEX "ISOClause_standard_idx" ON "ISOClause"("standard");

-- CreateIndex
CREATE UNIQUE INDEX "ISOClause_standard_clauseNumber_key" ON "ISOClause"("standard", "clauseNumber");

-- CreateIndex
CREATE INDEX "ClauseMapping_artefactId_idx" ON "ClauseMapping"("artefactId");

-- CreateIndex
CREATE INDEX "ClauseMapping_clauseId_idx" ON "ClauseMapping"("clauseId");

-- CreateIndex
CREATE UNIQUE INDEX "ClauseMapping_artefactId_clauseId_key" ON "ClauseMapping"("artefactId", "clauseId");

-- CreateIndex
CREATE INDEX "ClauseAssignment_userId_idx" ON "ClauseAssignment"("userId");

-- CreateIndex
CREATE INDEX "ClauseAssignment_agentId_idx" ON "ClauseAssignment"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClauseAssignment_clauseId_key" ON "ClauseAssignment"("clauseId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_reportedById_idx" ON "Event"("reportedById");

-- CreateIndex
CREATE INDEX "AISuggestion_agentId_idx" ON "AISuggestion"("agentId");

-- CreateIndex
CREATE INDEX "AISuggestion_status_idx" ON "AISuggestion"("status");

-- CreateIndex
CREATE INDEX "Review_artefactId_idx" ON "Review"("artefactId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Comment_artefactId_idx" ON "Comment"("artefactId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Artefact" ADD CONSTRAINT "Artefact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtefactVersion" ADD CONSTRAINT "ArtefactVersion_artefactId_fkey" FOREIGN KEY ("artefactId") REFERENCES "Artefact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtefactVersion" ADD CONSTRAINT "ArtefactVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ISOClause" ADD CONSTRAINT "ISOClause_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ISOClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseMapping" ADD CONSTRAINT "ClauseMapping_artefactId_fkey" FOREIGN KEY ("artefactId") REFERENCES "Artefact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseMapping" ADD CONSTRAINT "ClauseMapping_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "ISOClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseAssignment" ADD CONSTRAINT "ClauseAssignment_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "ISOClause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseAssignment" ADD CONSTRAINT "ClauseAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClauseAssignment" ADD CONSTRAINT "ClauseAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_artefactId_fkey" FOREIGN KEY ("artefactId") REFERENCES "Artefact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_artefactId_fkey" FOREIGN KEY ("artefactId") REFERENCES "Artefact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_artefactId_fkey" FOREIGN KEY ("artefactId") REFERENCES "Artefact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
