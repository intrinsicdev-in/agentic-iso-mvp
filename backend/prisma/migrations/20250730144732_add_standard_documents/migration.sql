-- CreateTable
CREATE TABLE "StandardDocument" (
    "id" TEXT NOT NULL,
    "standard" "StandardType" NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clauseRef" TEXT,
    "importance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StandardDocument_standard_idx" ON "StandardDocument"("standard");

-- CreateIndex
CREATE INDEX "StandardDocument_category_idx" ON "StandardDocument"("category");

-- CreateIndex
CREATE UNIQUE INDEX "StandardDocument_standard_title_key" ON "StandardDocument"("standard", "title");