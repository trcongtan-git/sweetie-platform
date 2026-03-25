/**
 * Docxtemplater cannot add/remove table columns. The template has a fixed 3-column
 * grade header + TOTAL. We rewrite those two rows in word/document.xml to match
 * scoreColumns.length before rendering.
 *
 * Rows must be found with balanced <w:tr>…</w:tr> because the document may contain
 * nested tables (regex row matching is unsafe).
 */

const WIDTH_DXA_CYCLE = ["2017", "3108", "2070"];

/** Must stay in sync with table tblGrid column definitions for the grade table */
const GRID_COL_CYCLE_DXA = ["1914", "2902", "1961"];
const GRID_COL_TOTAL_DXA = "2573";

function isWTrOpen(xml: string, i: number): boolean {
  if (!xml.startsWith("<w:tr", i)) return false;
  const next = xml.charAt(i + 5);
  return next === " " || next === ">";
}

function nextBalancedWTr(xml: string, from: number): { row: string; end: number } | null {
  const start = xml.indexOf("<w:tr", from);
  if (start < 0 || !isWTrOpen(xml, start)) return null;
  let depth = 0;
  let i = start;
  while (i < xml.length) {
    if (isWTrOpen(xml, i)) {
      depth++;
      i = xml.indexOf(">", i) + 1;
      continue;
    }
    if (xml.startsWith("</w:tr>", i)) {
      depth--;
      if (depth === 0) {
        return { row: xml.slice(start, i + 7), end: i + 7 };
      }
      i += 7;
      continue;
    }
    i++;
  }
  return null;
}

function findWTrContaining(haystack: string, needle: string): string | null {
  let pos = 0;
  while (pos < haystack.length) {
    const hit = nextBalancedWTr(haystack, pos);
    if (!hit) return null;
    if (hit.row.includes(needle)) return hit.row;
    pos = hit.end;
  }
  return null;
}

function patchTblGridBeforeRow(
  documentXml: string,
  headerRowXml: string,
  scoreColumnCount: number
): string {
  const idx = documentXml.indexOf(headerRowXml);
  if (idx < 0) return documentXml;
  const before = documentXml.slice(0, idx);
  const gridStart = before.lastIndexOf("<w:tblGrid");
  if (gridStart < 0) return documentXml;
  const gridEnd = documentXml.indexOf("</w:tblGrid>", gridStart);
  if (gridEnd < 0) return documentXml;
  const gridCloseEnd = gridEnd + "</w:tblGrid>".length;

  const cols: string[] = [];
  for (let i = 0; i < scoreColumnCount; i++) {
    const w = GRID_COL_CYCLE_DXA[i % GRID_COL_CYCLE_DXA.length];
    cols.push(`<w:gridCol w:w="${w}"/>`);
  }
  cols.push(`<w:gridCol w:w="${GRID_COL_TOTAL_DXA}"/>`);
  const newGrid = `<w:tblGrid>${cols.join("")}</w:tblGrid>`;
  return documentXml.slice(0, gridStart) + newGrid + documentXml.slice(gridCloseEnd);
}

function extractCells(inner: string): string[] {
  const cells: string[] = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  while (i < inner.length) {
    if (inner.startsWith("<w:tc>", i)) {
      if (depth === 0) start = i;
      depth++;
      i += 6;
      continue;
    }
    if (inner.startsWith("</w:tc>", i)) {
      depth--;
      if (depth === 0 && start >= 0) {
        cells.push(inner.slice(start, i + 7));
        start = -1;
      }
      i += 7;
      continue;
    }
    i++;
  }
  return cells;
}

function trOpenTag(fullRow: string): string {
  const m = fullRow.match(/^<w:tr\b[^>]*>/);
  return m ? m[0] : "<w:tr>";
}

function headerScoreCellTemplate(headerCells: string[]): string {
  const c = headerCells.find((tc) => tc.includes(">LISTENING<"));
  if (!c) throw new Error("patchDocxGradeTable: missing LISTENING header cell");
  return c;
}

function headerTotalCellTemplate(headerCells: string[]): string {
  const c = headerCells.find((tc) => tc.includes(">TOTAL SCORE<"));
  if (!c) throw new Error("patchDocxGradeTable: missing TOTAL SCORE header cell");
  return c;
}

function dataScoreCellTemplate(dataCells: string[]): string {
  const c = dataCells.find((tc) => tc.includes(">{listening}<"));
  if (!c) throw new Error("patchDocxGradeTable: missing {listening} data cell");
  return c;
}

function dataTotalCellTemplate(dataCells: string[]): string {
  const c = dataCells.find((tc) => tc.includes(">{totalScore}<"));
  if (!c) throw new Error("patchDocxGradeTable: missing {totalScore} data cell");
  return c;
}

function buildHeaderScoreCell(base: string, index: number): string {
  const w = WIDTH_DXA_CYCLE[index % WIDTH_DXA_CYCLE.length];
  return base
    .replace(/<w:tcW w:w="\d+"/, `<w:tcW w:w="${w}"`)
    .replace("<w:t>LISTENING</w:t>", `<w:t>{gradeHdr${index}}</w:t>`);
}

function buildDataScoreCell(base: string, index: number): string {
  const w = WIDTH_DXA_CYCLE[index % WIDTH_DXA_CYCLE.length];
  return base
    .replace(/<w:tcW w:w="\d+"/, `<w:tcW w:w="${w}"`)
    .replace("<w:t>{listening}</w:t>", `<w:t>{gradeVal${index}}</w:t>`)
    .replace(/<w:t>25<\/w:t>/, `<w:t>{gradeMax${index}}</w:t>`);
}

function buildDataTotalCell(base: string): string {
  return base.replace(/<w:t>100<\/w:t>/, "<w:t>{gradeTotalMax}</w:t>");
}

function buildPatchedRows(
  headerRowFull: string,
  dataRowFull: string,
  columnCount: number
): { headerRow: string; dataRow: string } {
  const headerInner = headerRowFull.replace(/^<w:tr\b[^>]*>/, "").replace(/<\/w:tr>$/, "");
  const dataInner = dataRowFull.replace(/^<w:tr\b[^>]*>/, "").replace(/<\/w:tr>$/, "");
  const headerCells = extractCells(headerInner);
  const dataCells = extractCells(dataInner);
  const hScore = headerScoreCellTemplate(headerCells);
  const hTotal = headerTotalCellTemplate(headerCells);
  const dScore = dataScoreCellTemplate(dataCells);
  const dTotal = dataTotalCellTemplate(dataCells);

  const headerParts: string[] = [];
  const dataParts: string[] = [];
  for (let i = 0; i < columnCount; i++) {
    headerParts.push(buildHeaderScoreCell(hScore, i));
    dataParts.push(buildDataScoreCell(dScore, i));
  }
  headerParts.push(hTotal);
  dataParts.push(buildDataTotalCell(dTotal));

  const openH = trOpenTag(headerRowFull);
  const openD = trOpenTag(dataRowFull);
  return {
    headerRow: `${openH}${headerParts.join("")}</w:tr>`,
    dataRow: `${openD}${dataParts.join("")}</w:tr>`,
  };
}

/** @returns Patched XML, or original if markers are missing or columnCount &lt; 1 */
export function patchDocumentXmlForGradeColumns(
  documentXml: string,
  columnCount: number
): string {
  if (columnCount < 1) return documentXml;

  const headerOriginal = findWTrContaining(documentXml, "<w:t>LISTENING</w:t>");
  const dataOriginal = findWTrContaining(documentXml, "<w:t>{listening}</w:t>");
  if (!headerOriginal || !dataOriginal) return documentXml;
  if (!headerOriginal.includes("TOTAL SCORE") || !dataOriginal.includes("{totalScore}")) {
    return documentXml;
  }

  const { headerRow, dataRow } = buildPatchedRows(headerOriginal, dataOriginal, columnCount);
  let next = patchTblGridBeforeRow(documentXml, headerOriginal, columnCount);
  next = next.replace(headerOriginal, headerRow);
  if (!next.includes(dataOriginal)) return documentXml;
  next = next.replace(dataOriginal, dataRow);
  return next;
}
