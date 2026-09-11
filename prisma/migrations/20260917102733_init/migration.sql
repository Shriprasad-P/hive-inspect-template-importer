-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "parent_template_id" TEXT,
    CONSTRAINT "templates_parent_template_id_fkey" FOREIGN KEY ("parent_template_id") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "source_key" TEXT,
    CONSTRAINT "sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "source_key" TEXT,
    CONSTRAINT "items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "item_id" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "source_key" TEXT,
    CONSTRAINT "comments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "import_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT,
    "filename" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preserved_json" TEXT NOT NULL,
    "skipped_json" TEXT NOT NULL,
    CONSTRAINT "import_reports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "sections_template_id_idx" ON "sections"("template_id");

-- CreateIndex
CREATE INDEX "items_section_id_idx" ON "items"("section_id");

-- CreateIndex
CREATE INDEX "comments_item_id_idx" ON "comments"("item_id");
