import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const DATA_RAW = path.resolve(__dirname, '../../data/raw');
const DATA_INTERMEDIATE = path.resolve(__dirname, '../../data/intermediate');

export async function ingest(sourcePath: string): Promise<string> {
  const filename = path.basename(sourcePath);
  const destDocx = path.join(DATA_RAW, filename);
  const destJson = path.join(DATA_INTERMEDIATE, 'document.parsed.json');

  fs.mkdirSync(DATA_RAW, { recursive: true });
  fs.mkdirSync(DATA_INTERMEDIATE, { recursive: true });

  // Copy source docx into data/raw/ without touching it
  fs.copyFileSync(sourcePath, destDocx);
  console.log(`[ingest] copied → ${destDocx}`);

  // Unzip and extract word/document.xml
  const zipBuf = fs.readFileSync(destDocx);
  const zip = await JSZip.loadAsync(zipBuf);

  const xmlEntry = zip.file('word/document.xml');
  if (!xmlEntry) throw new Error('word/document.xml not found inside docx');

  const xmlStr = await xmlEntry.async('string');
  console.log(`[ingest] extracted word/document.xml (${xmlStr.length} chars)`);

  // Parse XML → JS object preserving attributes and arrays
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Treat these as always-array so downstream code can rely on array semantics
    isArray: (tagName) =>
      ['w:tr', 'w:tc', 'w:tbl', 'w:p', 'w:r', 'w:t', 'w:rPr', 'w:pPr',
       'w:tcPr', 'w:trPr', 'w:tblPr', 'w:tblGrid', 'w:gridCol',
       'w:shd', 'w:rFonts', 'w:sz', 'w:color', 'w:ind', 'w:spacing',
       'w:jc', 'w:vertAlign', 'w:highlight', 'w:lang', 'w:b', 'w:i',
       'w:u', 'w:strike', 'w:dstrike', 'w:vanish', 'w:webHidden',
       'w:bookmarkStart', 'w:bookmarkEnd', 'w:hyperlink',
       'w:proofErr', 'w:lastRenderedPageBreak',
      ].includes(tagName),
  });

  const parsed = parser.parse(xmlStr);
  fs.writeFileSync(destJson, JSON.stringify(parsed, null, 2), 'utf8');
  console.log(`[ingest] wrote → ${destJson}`);

  return destJson;
}
