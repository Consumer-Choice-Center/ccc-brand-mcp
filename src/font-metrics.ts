import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Minimal TrueType metrics reader. Only the tables needed to measure advance
 * widths are parsed (head, hhea, maxp, hmtx, cmap format 4/12). No glyph
 * outlines, hinting, or GPOS kerning are read: widths are the sum of each
 * glyph's own advance, which is exact for CCC's tracked-out Anton/Montserrat
 * display usage and accurate to a pixel or two elsewhere.
 */
type ParsedFont = {
  unitsPerEm: number;
  ascenderEm: number;
  descenderEm: number;
  advanceWidthByGlyphId: Uint16Array;
  glyphIdByCodepoint: Map<number, number>;
};

const fontCache = new Map<string, ParsedFont>();

function readTableDirectory(buf: Buffer) {
  const numTables = buf.readUInt16BE(4);
  const tables = new Map<string, { offset: number; length: number }>();
  for (let i = 0; i < numTables; i += 1) {
    const recordOffset = 12 + i * 16;
    const tag = buf.toString("ascii", recordOffset, recordOffset + 4);
    tables.set(tag, {
      offset: buf.readUInt32BE(recordOffset + 8),
      length: buf.readUInt32BE(recordOffset + 12),
    });
  }
  return tables;
}

function parseCmapFormat4(buf: Buffer, subtableOffset: number, glyphIdByCodepoint: Map<number, number>) {
  const segCountX2 = buf.readUInt16BE(subtableOffset + 6);
  const segCount = segCountX2 / 2;
  const endCodesOffset = subtableOffset + 14;
  const startCodesOffset = endCodesOffset + segCountX2 + 2;
  const idDeltaOffset = startCodesOffset + segCountX2;
  const idRangeOffset = idDeltaOffset + segCountX2;
  for (let segment = 0; segment < segCount; segment += 1) {
    const endCode = buf.readUInt16BE(endCodesOffset + segment * 2);
    const startCode = buf.readUInt16BE(startCodesOffset + segment * 2);
    const idDelta = buf.readInt16BE(idDeltaOffset + segment * 2);
    const idRangeOffsetValue = buf.readUInt16BE(idRangeOffset + segment * 2);
    if (startCode === 0xffff && endCode === 0xffff) continue;
    for (let codepoint = startCode; codepoint <= endCode && codepoint !== 0xffff; codepoint += 1) {
      let glyphId: number;
      if (idRangeOffsetValue === 0) {
        glyphId = (codepoint + idDelta) & 0xffff;
      } else {
        const glyphIndexAddress = idRangeOffset + segment * 2 + idRangeOffsetValue + (codepoint - startCode) * 2;
        const rawGlyphId = buf.readUInt16BE(glyphIndexAddress);
        glyphId = rawGlyphId === 0 ? 0 : (rawGlyphId + idDelta) & 0xffff;
      }
      if (glyphId !== 0) glyphIdByCodepoint.set(codepoint, glyphId);
    }
  }
}

function parseCmapFormat12(buf: Buffer, subtableOffset: number, glyphIdByCodepoint: Map<number, number>) {
  const numGroups = buf.readUInt32BE(subtableOffset + 12);
  for (let group = 0; group < numGroups; group += 1) {
    const groupOffset = subtableOffset + 16 + group * 12;
    const startCharCode = buf.readUInt32BE(groupOffset);
    const endCharCode = buf.readUInt32BE(groupOffset + 4);
    const startGlyphId = buf.readUInt32BE(groupOffset + 8);
    for (let codepoint = startCharCode; codepoint <= endCharCode; codepoint += 1) {
      glyphIdByCodepoint.set(codepoint, startGlyphId + (codepoint - startCharCode));
    }
  }
}

function parseCmap(buf: Buffer, cmapOffset: number) {
  const glyphIdByCodepoint = new Map<number, number>();
  const numSubtables = buf.readUInt16BE(cmapOffset + 2);
  let best: { platformID: number; encodingID: number; offset: number; format: number } | undefined;
  for (let i = 0; i < numSubtables; i += 1) {
    const recordOffset = cmapOffset + 4 + i * 8;
    const platformID = buf.readUInt16BE(recordOffset);
    const encodingID = buf.readUInt16BE(recordOffset + 2);
    const subtableOffset = cmapOffset + buf.readUInt32BE(recordOffset + 4);
    const format = buf.readUInt16BE(subtableOffset);
    if (format !== 4 && format !== 12) continue;
    const rank = platformID === 3 && encodingID === 10 ? 4
      : platformID === 0 && encodingID >= 4 ? 3
      : platformID === 3 && encodingID === 1 ? 2
      : platformID === 0 ? 1
      : 0;
    const bestRank = best ? (best.platformID === 3 && best.encodingID === 10 ? 4
      : best.platformID === 0 && best.encodingID >= 4 ? 3
      : best.platformID === 3 && best.encodingID === 1 ? 2
      : best.platformID === 0 ? 1
      : 0) : -1;
    if (rank > bestRank) best = { platformID, encodingID, offset: subtableOffset, format };
  }
  if (!best) throw new Error("No usable cmap subtable (format 4 or 12) found in font.");
  if (best.format === 4) parseCmapFormat4(buf, best.offset, glyphIdByCodepoint);
  else parseCmapFormat12(buf, best.offset, glyphIdByCodepoint);
  return glyphIdByCodepoint;
}

function parseFont(path: string): ParsedFont {
  const buf = readFileSync(path);
  const tables = readTableDirectory(buf);
  const head = tables.get("head");
  const hhea = tables.get("hhea");
  const maxp = tables.get("maxp");
  const hmtx = tables.get("hmtx");
  const cmap = tables.get("cmap");
  if (!head || !hhea || !maxp || !hmtx || !cmap) {
    throw new Error(`Font at ${path} is missing a required sfnt table (head/hhea/maxp/hmtx/cmap).`);
  }
  const unitsPerEm = buf.readUInt16BE(head.offset + 18);
  const ascender = buf.readInt16BE(hhea.offset + 4);
  const descender = buf.readInt16BE(hhea.offset + 6);
  const numberOfHMetrics = buf.readUInt16BE(hhea.offset + 34);
  const numGlyphs = buf.readUInt16BE(maxp.offset + 4);
  const advanceWidthByGlyphId = new Uint16Array(numGlyphs);
  let lastWidth = 0;
  for (let glyphId = 0; glyphId < numGlyphs; glyphId += 1) {
    if (glyphId < numberOfHMetrics) {
      lastWidth = buf.readUInt16BE(hmtx.offset + glyphId * 4);
    }
    advanceWidthByGlyphId[glyphId] = lastWidth;
  }
  const glyphIdByCodepoint = parseCmap(buf, cmap.offset);
  return {
    unitsPerEm,
    ascenderEm: ascender / unitsPerEm,
    descenderEm: descender / unitsPerEm,
    advanceWidthByGlyphId,
    glyphIdByCodepoint,
  };
}

function loadFont(fontDir: string, fileName: string) {
  const path = resolve(fontDir, fileName);
  const cached = fontCache.get(path);
  if (cached) return cached;
  const parsed = parseFont(path);
  fontCache.set(path, parsed);
  return parsed;
}

/** Width of `text` in the font's own em-square units (1.0 = one em). Multiply by a font-size in px to get pixel width. */
export function measureTextWidthEm(fontDir: string, fileName: string, text: string) {
  const font = loadFont(fontDir, fileName);
  const notdefWidth = font.advanceWidthByGlyphId[0] ?? font.unitsPerEm * 0.6;
  let totalUnits = 0;
  for (const codepoint of text) {
    const scalar = codepoint.codePointAt(0) ?? 0;
    const glyphId = font.glyphIdByCodepoint.get(scalar);
    totalUnits += glyphId !== undefined ? font.advanceWidthByGlyphId[glyphId] : notdefWidth;
  }
  return totalUnits / font.unitsPerEm;
}

/** Pixel width of `text` set in `fileName` at `fontSizePx`, measured from the actual packaged font's glyph advance widths. */
export function measureTextWidthPx(fontDir: string, fileName: string, text: string, fontSizePx: number) {
  return measureTextWidthEm(fontDir, fileName, text) * fontSizePx;
}

/** Ascender/descender in em units (1.0 = one em) read from the font's own hhea table. */
export function getFontVerticalMetricsEm(fontDir: string, fileName: string) {
  const font = loadFont(fontDir, fileName);
  return { ascenderEm: font.ascenderEm, descenderEm: font.descenderEm };
}
