/**
 * Generates samples/spectora-internachi-sample.xlsx — a realistic synthetic
 * Spectora-like HTML Text / template spreadsheet with the official 28 columns
 * and InterNACHI-style residential inspection content.
 */
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const HEADERS = [
  "Section Name",
  "Item Name",
  "Comment Name",
  "Comment Text",
  "Comment Type",
  "Category",
  "Multiple Choice Options",
  "Unit Type Options",
  "Recommendation",
  "Order",
  "Answer Type",
  "Default Value",
  "Value 2",
  "Unit Type",
  "Location",
  "Estimate Min",
  "Estimate Max",
  "Locked",
  "Simple Format",
  "Disable Photos",
  "Uses",
  "Default Photo 1",
  "Default Photo 1 Caption",
  "Default Photo 2",
  "Default Photo 2 Caption",
  "Default Photo 3",
  "Default Photo 3 Caption",
  "Last Modified",
];

type Row = {
  section: string;
  item: string;
  commentName: string;
  commentText: string;
  commentType: string;
  category: string;
  order: number;
  answerType?: string;
  recommendation?: string;
};

const ROWS: Row[] = [
  {
    section: "1. Roof",
    item: "1.1 Coverings",
    commentName: "Asphalt shingle covering",
    commentText:
      "<p>The roof covering material is <strong>asphalt composition shingles</strong>.</p><ul><li>Age appears mid-life</li><li>No active leaks observed at time of inspection</li></ul>",
    commentType: "info",
    category: "0",
    order: 1,
    answerType: "text",
  },
  {
    section: "1. Roof",
    item: "1.1 Coverings",
    commentName: "Damaged / missing shingles",
    commentText:
      '<p>Damaged or missing shingles were observed. This condition may allow <em>water intrusion</em>.</p><p>Recommend evaluation and repair by a qualified roofing contractor.</p>',
    commentType: "defect",
    category: "1",
    order: 2,
    recommendation: "Repair or replace damaged shingles",
    answerType: "boolean",
  },
  {
    section: "1. Roof",
    item: "1.2 Flashings",
    commentName: "Flashing general",
    commentText:
      "<p>Flashings at penetrations and transitions were inspected where visible.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "1. Roof",
    item: "1.2 Flashings",
    commentName: "Kickout flashing missing",
    commentText:
      "<p><strong>Kickout flashing</strong> was not observed at a roof-to-wall intersection. Missing kickout flashing can direct water behind wall cladding.</p>",
    commentType: "defect",
    category: "1",
    order: 2,
    recommendation: "Install kickout flashing",
  },
  {
    section: "1. Roof",
    item: "1.3 Gutters & Downspouts",
    commentName: "Gutter debris",
    commentText:
      "<p>Gutters contain debris that may impede drainage. Clean and maintain regularly.</p>",
    commentType: "limit",
    category: "-1",
    order: 1,
  },
  {
    section: "2. Exterior",
    item: "2.1 Wall Coverings",
    commentName: "Fiber-cement siding",
    commentText:
      "<p>Exterior wall cladding is <strong>fiber-cement</strong> siding in generally serviceable condition.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "2. Exterior",
    item: "2.1 Wall Coverings",
    commentName: "Caulking gaps",
    commentText:
      "<p>Gaps in caulking at penetrations and trim joints were noted. Seal to reduce water intrusion risk.</p>",
    commentType: "defect",
    category: "0",
    order: 2,
  },
  {
    section: "2. Exterior",
    item: "2.2 Windows",
    commentName: "Failed insulated glass",
    commentText:
      "<p>One or more insulated glass units show condensation between panes (failed seal).</p>",
    commentType: "defect",
    category: "0",
    order: 1,
    recommendation: "Replace affected IGU(s)",
  },
  {
    section: "2. Exterior",
    item: "2.3 Doors",
    commentName: "Weatherstripping worn",
    commentText:
      "<p>Weatherstripping at the exterior door is worn and may allow air/water infiltration.</p>",
    commentType: "defect",
    category: "-1",
    order: 1,
  },
  {
    section: "3. Structure",
    item: "3.1 Foundation",
    commentName: "Foundation type",
    commentText:
      "<p>Foundation is a <strong>poured concrete</strong> slab-on-grade (where visible).</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "3. Structure",
    item: "3.1 Foundation",
    commentName: "Hairline cracks",
    commentText:
      "<p>Hairline settlement cracks observed. Typical for age; monitor for change in width or displacement.</p>",
    commentType: "limit",
    category: "-1",
    order: 2,
  },
  {
    section: "3. Structure",
    item: "3.2 Floor Structure",
    commentName: "Limited visibility",
    commentText:
      "<p><em>Inspection of floor structure was limited</em> by finished surfaces and/or insulation.</p>",
    commentType: "limit",
    category: "0",
    order: 1,
  },
  {
    section: "4. Electrical",
    item: "4.1 Service Panel",
    commentName: "Panel identification",
    commentText:
      "<p>Main service panel is a 200A breaker panel. Dead front was removed for inspection of visible conductors.</p>",
    commentType: "info",
    category: "0",
    order: 1,
    answerType: "text",
  },
  {
    section: "4. Electrical",
    item: "4.1 Service Panel",
    commentName: "Double-tapped breaker",
    commentText:
      "<p><strong>Safety concern:</strong> A double-tapped breaker was observed. This may cause overheating. Have a licensed electrician correct.</p>",
    commentType: "defect",
    category: "1",
    order: 2,
    recommendation: "Correct double-tap; one conductor per breaker (or listed)",
  },
  {
    section: "4. Electrical",
    item: "4.2 GFCI / AFCI",
    commentName: "GFCI protection",
    commentText:
      "<p>GFCI protection tested at accessible receptacles in wet locations. Recommend GFCI where missing per current standards.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "5. Plumbing",
    item: "5.1 Water Heater",
    commentName: "Water heater overview",
    commentText:
      "<p>Water heater is a gas-fired storage unit. TPR valve present; discharge piping observed.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "5. Plumbing",
    item: "5.1 Water Heater",
    commentName: "TPR discharge termination",
    commentText:
      "<p>TPR discharge pipe does not terminate within 6 inches of the floor / approved receptor.</p>",
    commentType: "defect",
    category: "1",
    order: 2,
    recommendation: "Extend TPR discharge per code",
  },
  {
    section: "5. Plumbing",
    item: "5.2 Supply & Drain",
    commentName: "Supply material",
    commentText:
      "<p>Visible water distribution piping appears to be <strong>PEX / copper</strong> (mixed).</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "6. HVAC",
    item: "6.1 Heating System",
    commentName: "Furnace operation",
    commentText:
      "<p>Forced-air gas furnace responded to thermostat call for heat at time of inspection.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "6. HVAC",
    item: "6.2 Cooling System",
    commentName: "AC condenser clearance",
    commentText:
      "<p>Outdoor condenser has restricted airflow clearance due to vegetation. Maintain manufacturer clearances.</p>",
    commentType: "defect",
    category: "-1",
    order: 1,
  },
  {
    section: "7. Interior",
    item: "7.1 Walls / Ceilings / Floors",
    commentName: "General condition",
    commentText:
      "<p>Interior finishes are in generally serviceable condition consistent with age. Cosmetic wear noted.</p>",
    commentType: "info",
    category: "0",
    order: 1,
  },
  {
    section: "7. Interior",
    item: "7.2 Smoke & CO Alarms",
    commentName: "Alarm presence",
    commentText:
      "<p>Recommend smoke alarms in each sleeping room and outside sleeping areas, plus CO alarms per local requirements. Test monthly.</p>",
    commentType: "info",
    category: "1",
    order: 1,
  },
  {
    section: "8. Insulation & Ventilation",
    item: "8.1 Attic Insulation",
    commentName: "Insulation depth",
    commentText:
      "<p>Attic insulation appears to be fiberglass batts / blown. Depth is uneven in places; consider upgrading for energy efficiency.</p>",
    commentType: "limit",
    category: "0",
    order: 1,
  },
  {
    section: "8. Insulation & Ventilation",
    item: "8.2 Exhaust Fans",
    commentName: "Bath fan termination",
    commentText:
      "<p>Bathroom exhaust fan should terminate outdoors (not into attic). Verify termination.</p>",
    commentType: "defect",
    category: "0",
    order: 1,
  },
];

function toAoA(): (string | number)[][] {
  const aoa: (string | number)[][] = [HEADERS];
  const now = "2026-09-15T12:00:00Z";
  for (const r of ROWS) {
    const row: (string | number)[] = new Array(HEADERS.length).fill("");
    row[0] = r.section;
    row[1] = r.item;
    row[2] = r.commentName;
    row[3] = r.commentText;
    row[4] = r.commentType;
    row[5] = r.category;
    row[8] = r.recommendation ?? "";
    row[9] = r.order;
    row[10] = r.answerType ?? "text";
    row[27] = now;
    aoa.push(row);
  }
  aoa.push(new Array(HEADERS.length).fill(""));
  return aoa;
}

function main() {
  const outDir = path.join(process.cwd(), "samples");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "spectora-internachi-sample.xlsx");

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(toAoA());
  ws["!cols"] = [
    { wch: 28 },
    { wch: 28 },
    { wch: 28 },
    { wch: 60 },
    { wch: 12 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, outPath);
  console.log(`Wrote ${outPath} (${ROWS.length} data rows, ${HEADERS.length} columns)`);
}

main();
