import { prisma } from "./db";
import type { ParsePreview, TemplateDetail, TemplateSummary } from "./types";

function summarize(
  t: {
    id: string;
    name: string;
    source: string | null;
    createdAt: Date;
    updatedAt: Date;
    parentTemplateId: string | null;
    sections: Array<{ items: Array<{ comments: unknown[] }> }>;
  }
): TemplateSummary {
  const itemCount = t.sections.reduce((n, s) => n + s.items.length, 0);
  const commentCount = t.sections.reduce(
    (n, s) => n + s.items.reduce((m, it) => m + it.comments.length, 0),
    0
  );
  return {
    id: t.id,
    name: t.name,
    source: t.source,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    parentTemplateId: t.parentTemplateId,
    sectionCount: t.sections.length,
    itemCount,
    commentCount,
  };
}

const listInclude = {
  sections: { include: { items: { include: { comments: true } } } },
} as const;

const detailInclude = {
  sections: {
    orderBy: { position: "asc" as const },
    include: {
      items: {
        orderBy: { position: "asc" as const },
        include: {
          comments: { orderBy: { position: "asc" as const } },
        },
      },
    },
  },
};

export async function listTemplates(): Promise<TemplateSummary[]> {
  const rows = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
    include: listInclude,
  });
  return rows.map(summarize);
}

export async function getTemplate(id: string): Promise<TemplateDetail | null> {
  const t = await prisma.template.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    source: t.source,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    parentTemplateId: t.parentTemplateId,
    sections: t.sections.map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      sourceKey: s.sourceKey,
      items: s.items.map((it) => ({
        id: it.id,
        name: it.name,
        position: it.position,
        sourceKey: it.sourceKey,
        comments: it.comments.map((c) => ({
          id: c.id,
          bodyHtml: c.bodyHtml,
          position: c.position,
          sourceKey: c.sourceKey,
        })),
      })),
    })),
  };
}

export async function persistImport(
  preview: ParsePreview,
  filename: string
): Promise<{ templateId: string; reportId: string }> {
  // Avoid interactive $transaction: Supabase transaction-mode pooler (6543)
  // drops long interactive txs ("Transaction not found"). Sequential writes
  // are fine for this take-home import size.
  const template = await prisma.template.create({
    data: {
      name: preview.templateName,
      source: "spectora-html-text",
    },
  });

  for (let si = 0; si < preview.sections.length; si++) {
    const sec = preview.sections[si];
    const section = await prisma.section.create({
      data: {
        templateId: template.id,
        name: sec.name,
        position: si,
        sourceKey: sec.sourceKey ?? null,
      },
    });
    for (let ii = 0; ii < sec.items.length; ii++) {
      const item = sec.items[ii];
      const createdItem = await prisma.item.create({
        data: {
          sectionId: section.id,
          name: item.name,
          position: ii,
          sourceKey: item.sourceKey ?? null,
        },
      });
      if (item.comments.length) {
        await prisma.comment.createMany({
          data: item.comments.map((c, ci) => ({
            itemId: createdItem.id,
            bodyHtml: c.bodyHtml,
            position: ci,
            sourceKey: c.sourceKey ?? null,
          })),
        });
      }
    }
  }

  const report = await prisma.importReport.create({
    data: {
      templateId: template.id,
      filename,
      preservedJson: JSON.stringify(preview.preserved),
      skippedJson: JSON.stringify(preview.skipped),
    },
  });

  return { templateId: template.id, reportId: report.id };
}

export async function duplicateTemplate(id: string): Promise<TemplateDetail> {
  const source = await getTemplate(id);
  if (!source) throw new Error("Template not found");

  const copy = await prisma.$transaction(async (tx) => {
    const template = await tx.template.create({
      data: {
        name: `${source.name} (copy)`,
        source: "duplicate",
        parentTemplateId: source.id,
      },
    });

    for (const sec of source.sections) {
      const section = await tx.section.create({
        data: {
          templateId: template.id,
          name: sec.name,
          position: sec.position,
          sourceKey: sec.sourceKey,
        },
      });
      for (const it of sec.items) {
        const item = await tx.item.create({
          data: {
            sectionId: section.id,
            name: it.name,
            position: it.position,
            sourceKey: it.sourceKey,
          },
        });
        for (const c of it.comments) {
          await tx.comment.create({
            data: {
              itemId: item.id,
              bodyHtml: c.bodyHtml,
              position: c.position,
              sourceKey: c.sourceKey,
            },
          });
        }
      }
    }

    return template.id;
  });

  const detail = await getTemplate(copy);
  if (!detail) throw new Error("Failed to load duplicated template");
  return detail;
}

export async function updateTemplateName(id: string, name: string) {
  return prisma.template.update({ where: { id }, data: { name } });
}

export async function updateSectionName(id: string, name: string) {
  return prisma.section.update({ where: { id }, data: { name } });
}

export async function updateItemName(id: string, name: string) {
  return prisma.item.update({ where: { id }, data: { name } });
}

export async function updateCommentBody(id: string, bodyHtml: string) {
  return prisma.comment.update({ where: { id }, data: { bodyHtml } });
}

export async function deleteTemplate(id: string) {
  await prisma.template.delete({ where: { id } });
}

export async function getImportReport(templateId: string) {
  return prisma.importReport.findFirst({
    where: { templateId },
    orderBy: { createdAt: "desc" },
  });
}
