/**
 * Seed the database with the sample Spectora InterNACHI-like template
 * so the app opens with an already-imported template.
 */
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { parseSpectoraHtmlText } from "../src/lib/spectora-parser";

const prisma = new PrismaClient();

async function main() {
  const samplePath = path.join(
    process.cwd(),
    "samples",
    "spectora-internachi-sample.xlsx"
  );
  if (!fs.existsSync(samplePath)) {
    throw new Error(
      `Missing ${samplePath}. Run: npx tsx scripts/generate-sample.ts`
    );
  }

  const existing = await prisma.template.findFirst({
    where: { source: "seed" },
  });
  if (existing) {
    console.log(`Seed template already present: ${existing.id} (${existing.name})`);
    return;
  }

  const buf = fs.readFileSync(samplePath);
  const preview = parseSpectoraHtmlText(buf, {
    filename: "spectora-internachi-sample.xlsx",
    templateName: "InterNACHI Residential (sample)",
  });

  const template = await prisma.template.create({
    data: {
      name: preview.templateName,
      source: "seed",
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
      for (let ci = 0; ci < item.comments.length; ci++) {
        const c = item.comments[ci];
        await prisma.comment.create({
          data: {
            itemId: createdItem.id,
            bodyHtml: c.bodyHtml,
            position: ci,
            sourceKey: c.sourceKey ?? null,
          },
        });
      }
    }
  }

  await prisma.importReport.create({
    data: {
      templateId: template.id,
      filename: "spectora-internachi-sample.xlsx",
      preservedJson: JSON.stringify(preview.preserved),
      skippedJson: JSON.stringify(preview.skipped),
    },
  });

  console.log(
    `Seeded template ${template.id}: ${preview.preserved.sectionCount} sections, ` +
      `${preview.preserved.itemCount} items, ${preview.preserved.commentCount} comments`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
