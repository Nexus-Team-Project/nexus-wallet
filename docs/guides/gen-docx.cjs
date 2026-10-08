// Build the Nexus user-guide portal Word document from _portal_combined.md
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  TableOfContents, PageBreak, LevelFormat, BorderStyle, Bookmark, InternalHyperlink, TabStopType, TabStopPosition,
} = require('docx');

let md = fs.readFileSync('_portal_combined.md', 'utf-8');
md = md.replace(/^---[\s\S]*?---\n/, '');            // yaml header
md = md.replace(/^\\newpage$/gm, '@@PAGEBREAK@@');

const FONT = 'Arial';

// ---------- inline parser: **bold**, *italic*, [text](url) ----------
function inlineRuns(text, base = {}) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g;
  let last = 0, m;
  const mk = (t, extra = {}) =>
    new TextRun({ text: t, font: FONT, rightToLeft: true, ...base, ...extra });
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(mk(text.slice(last, m.index)));
    if (m[2] !== undefined) runs.push(mk(m[2], { bold: true }));
    else if (m[4] !== undefined) runs.push(mk(m[4], { italics: true }));
    else {
      runs.push(new ExternalHyperlink({
        link: m[7],
        children: [new TextRun({ text: m[6], font: FONT, rightToLeft: true, style: 'Hyperlink', ...base })],
      }));
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(mk(text.slice(last)));
  return runs.length ? runs : [mk('')];
}

const P = (opts) => new Paragraph({ bidirectional: true, ...opts });

// ---------- numbering ----------
const numberingConfigs = [{
  reference: 'bullets',
  levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.RIGHT,
    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
}];
let olCount = 0;
function newOrderedRef() {
  olCount++;
  const ref = `ol-${olCount}`;
  numberingConfigs.push({
    reference: ref,
    levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.RIGHT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
  });
  return ref;
}

// ---------- block parser ----------
const lines = md.split('\n');
const children = [];

// pre-scan H1/H2 for the static TOC
const tocEntries = [];
{
  let n = 0;
  for (const l of lines) {
    const m = /^(#{1,2})\s+(.*)$/.exec(l.trim());
    if (m) { n++; tocEntries.push({ level: m[1].length, text: m[2], id: 'toc' + n }); }
  }
}
let bookmarkIdx = 0;

// title page
children.push(
  P({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'פורטל המדריכים של נקסוס', font: FONT, rightToLeft: true, bold: true, size: 72 })] }),
  P({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'הארנק של נקסוס · מדריך למשתמש', font: FONT, rightToLeft: true, size: 40, color: '555555' })] }),
  P({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ספטמבר 2026 · טיוטת עבודה', font: FONT, rightToLeft: true, size: 24, color: '888888' })] }),
  P({ children: [new PageBreak()] }),
  P({ spacing: { after: 240 }, children: [new TextRun({ text: 'תוכן עניינים', font: FONT, rightToLeft: true, bold: true, size: 36 })] }),
);
for (const e of tocEntries) {
  children.push(P({
    spacing: { after: e.level === 1 ? 100 : 40, before: e.level === 1 ? 160 : 0 },
    indent: e.level === 2 ? { left: 480 } : undefined,
    children: [new InternalHyperlink({
      anchor: e.id,
      children: [new TextRun({ text: e.text, font: FONT, rightToLeft: true,
        bold: e.level === 1, size: e.level === 1 ? 26 : 22,
        color: e.level === 1 ? '1a1a2e' : '333366' })],
    })],
  }));
}
children.push(P({ children: [new PageBreak()] }));

let i = 0;
let currentOl = null;   // active ordered-list reference
let firstH1 = true;

function flushParagraphText(text, extra = {}) {
  children.push(P({ spacing: { after: 120 }, children: inlineRuns(text), ...extra }));
}

while (i < lines.length) {
  const raw = lines[i];
  const line = raw.replace(/\s+$/, '');
  const trimmed = line.trim();

  if (trimmed === '' ) { i++; continue; }
  if (trimmed === '@@PAGEBREAK@@') { children.push(P({ children: [new PageBreak()] })); currentOl = null; i++; continue; }
  if (trimmed === '---') { currentOl = null; i++; continue; }

  // headings
  let hm = /^(#{1,3})\s+(.*)$/.exec(trimmed);
  if (hm) {
    currentOl = null;
    const lvl = hm[1].length;
    const txt = hm[2];
    const heading = lvl === 1 ? HeadingLevel.HEADING_1 : lvl === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
    const size = lvl === 1 ? 40 : lvl === 2 ? 30 : 24;
    const headingRun = new TextRun({ text: txt, font: FONT, rightToLeft: true, bold: true, size, color: lvl === 3 ? '444444' : '1a1a2e' });
    let headingChildren;
    if (lvl <= 2 && bookmarkIdx < tocEntries.length && tocEntries[bookmarkIdx].text === txt) {
      headingChildren = [new Bookmark({ id: tocEntries[bookmarkIdx].id, children: [headingRun] })];
      bookmarkIdx++;
    } else {
      headingChildren = [headingRun];
    }
    children.push(P({
      heading,
      pageBreakBefore: lvl === 1 && !firstH1,
      spacing: { before: lvl === 1 ? 0 : 240, after: 120 },
      children: headingChildren,
    }));
    if (lvl === 1) firstH1 = false;
    i++; continue;
  }

  // table block
  if (trimmed.startsWith('|')) {
    const tblLines = [];
    while (i < lines.length && lines[i].trim().startsWith('|')) { tblLines.push(lines[i].trim()); i++; }
    const rows = tblLines
      .filter(l => !/^\|[\s:\-|]+\|$/.test(l))
      .map(l => l.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    const nCols = Math.max(...rows.map(r => r.length));
    const colW = Math.floor(9360 / nCols);
    const tableRows = rows.map((cells, ri) => new TableRow({
      children: Array.from({ length: nCols }, (_, ci) => new TableCell({
        width: { size: colW, type: WidthType.DXA },
        shading: ri === 0 ? { type: ShadingType.CLEAR, fill: 'EDEDF4' } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [P({ children: inlineRuns(cells[ci] || '', ri === 0 ? { bold: true } : {}) })],
      })),
    }));
    children.push(new Table({
      visuallyRightToLeft: true,
      columnWidths: Array(nCols).fill(colW),
      width: { size: colW * nCols, type: WidthType.DXA },
      rows: tableRows,
    }));
    children.push(P({ children: [] }));
    currentOl = null;
    continue;
  }

  // ordered list item
  let om = /^(\d+)\.\s+(.*)$/.exec(trimmed);
  if (om && /^\d+\.\s/.test(line)) {
    if (!currentOl || om[1] === '1') currentOl = newOrderedRef();
    children.push(P({
      numbering: { reference: currentOl, level: 0 },
      spacing: { after: 100 },
      children: inlineRuns(om[2]),
    }));
    i++; continue;
  }

  // bullet item
  if (/^-\s+/.test(trimmed) && /^-\s/.test(line)) {
    currentOl = null;
    children.push(P({
      numbering: { reference: 'bullets', level: 0 },
      spacing: { after: 100 },
      children: inlineRuns(trimmed.replace(/^-\s+/, '')),
    }));
    i++; continue;
  }

  // indented continuation (screenshot placeholders, 💡 tips) — keep list context
  if (/^\s{2,}/.test(raw)) {
    const isPlaceholder = /^\*\[.*\]\*$/.test(trimmed);
    children.push(P({
      indent: { left: 720 },
      spacing: { after: 100 },
      children: inlineRuns(trimmed, isPlaceholder ? { color: '8888AA' } : {}),
    }));
    i++; continue;
  }

  // plain paragraph
  currentOl = null;
  flushParagraphText(trimmed);
  i++;
}

const doc = new Document({
  numbering: { config: numberingConfigs },
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
  },
  features: { updateFields: true },
  sections: [{
    properties: {
      page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('מדריך-למשתמש-נקסוס.docx', buf);
  console.log('written', buf.length, 'bytes,', children.length, 'blocks,', olCount, 'ordered lists');
});
