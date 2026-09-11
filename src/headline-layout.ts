import { getFontVerticalMetricsEm, measureTextWidthEm } from "./font-metrics.js";

export type HeadlineSlot = {
  /** Reference system this slot belongs to, e.g. "reference-1". */
  referenceSystem: string;
  fontFile: string;
  xPx: number;
  firstLineYPx: number;
  lineHeightPx: number;
  maxLines: number;
  slotWidthPx: number;
  /** Baseline the last line must stay above (its descender included). */
  slotBottomPx: number;
  baseFontSizePx: number;
  minFontSizePx: number;
};

export type HeadlineLayoutLine = {
  text: string;
  widthPx: number;
  fontSizePx: number;
  x: number;
  y: number;
};

export type HeadlineLayout = {
  lines: HeadlineLayoutLine[];
  fontSizePx: number;
  slotWidthPx: number;
  slotHeightPx: number;
  fits: boolean;
  overflowReason?: string;
};

/** Optimal (minimum possible maximum-line-width) partition of `words` into exactly `lineCount` ordered, non-empty groups. */
function bestPartition(wordWidthsEm: number[], spaceWidthEm: number, lineCount: number) {
  const n = wordWidthsEm.length;
  const prefix = [0];
  for (const width of wordWidthsEm) prefix.push(prefix.at(-1)! + width);
  const groupWidthEm = (start: number, end: number) => prefix[end] - prefix[start] + spaceWidthEm * (end - start - 1);

  // dp[k][i] = best (minimum) possible max-group-width using words[0..i) split into k groups.
  const dp: number[][] = Array.from({ length: lineCount + 1 }, () => new Array(n + 1).fill(Infinity));
  const split: number[][] = Array.from({ length: lineCount + 1 }, () => new Array(n + 1).fill(0));
  dp[0][0] = 0;
  for (let k = 1; k <= lineCount; k += 1) {
    for (let i = 1; i <= n; i += 1) {
      for (let j = k - 1; j < i; j += 1) {
        if (dp[k - 1][j] === Infinity) continue;
        const candidate = Math.max(dp[k - 1][j], groupWidthEm(j, i));
        if (candidate < dp[k][i]) {
          dp[k][i] = candidate;
          split[k][i] = j;
        }
      }
    }
  }
  if (dp[lineCount][n] === Infinity) return undefined;
  const boundaries: number[] = [n];
  let i = n;
  for (let k = lineCount; k > 0; k -= 1) {
    const j = split[k][i];
    boundaries.push(j);
    i = j;
  }
  boundaries.reverse();
  const groups: Array<[number, number]> = [];
  for (let k = 0; k < lineCount; k += 1) groups.push([boundaries[k], boundaries[k + 1]]);
  return { maxWidthEm: dp[lineCount][n], groups };
}

/**
 * Compute the final, render-ready line breaks and font size for a headline inside a fixed
 * reference-locked slot, measuring every candidate against the real packaged font's glyph
 * widths. This is the single source of truth: both qa_social_layout and create_social_svg
 * call it so they can never disagree about how a headline will actually be set.
 */
export function layoutHeadline(text: string, slot: HeadlineSlot, fontDir: string): HeadlineLayout {
  const words = text.trim().split(/\s+/).filter(Boolean).map((word) => word.toUpperCase());
  const slotHeightPx = slot.lineHeightPx * (slot.maxLines - 1) + slot.baseFontSizePx;
  if (words.length === 0) {
    return { lines: [], fontSizePx: slot.baseFontSizePx, slotWidthPx: slot.slotWidthPx, slotHeightPx, fits: true };
  }

  const wordWidthsEm = words.map((word) => measureTextWidthEm(fontDir, slot.fontFile, word));
  const spaceWidthEm = measureTextWidthEm(fontDir, slot.fontFile, " ");
  const slotWidthEm = slot.slotWidthPx / slot.baseFontSizePx;
  const minScale = slot.minFontSizePx / slot.baseFontSizePx;

  type Candidate = { lineCount: number; groups: Array<[number, number]>; scale: number };
  let best: Candidate | undefined;
  for (let lineCount = 1; lineCount <= Math.min(slot.maxLines, words.length); lineCount += 1) {
    const partition = bestPartition(wordWidthsEm, spaceWidthEm, lineCount);
    if (!partition) continue;
    const scale = partition.maxWidthEm <= 0 ? 1 : Math.min(1, slotWidthEm / partition.maxWidthEm);
    if (scale < minScale) continue; // even at the smallest allowed size this line count would overflow
    if (!best || scale > best.scale || (scale === best.scale && lineCount < best.lineCount)) {
      best = { lineCount, groups: partition.groups, scale };
    }
  }

  const { descenderEm } = getFontVerticalMetricsEm(fontDir, slot.fontFile);
  const buildLines = (groups: Array<[number, number]>, fontSizePx: number) => groups.map(([start, end], index) => {
    const lineText = words.slice(start, end).join(" ");
    return {
      text: lineText,
      widthPx: measureTextWidthEm(fontDir, slot.fontFile, lineText) * fontSizePx,
      fontSizePx,
      x: slot.xPx,
      y: slot.firstLineYPx + index * slot.lineHeightPx,
    };
  });

  if (best) {
    const fontSizePx = Math.round(slot.baseFontSizePx * best.scale * 100) / 100;
    const lines = buildLines(best.groups, fontSizePx);
    const lastLine = lines.at(-1)!;
    const bottomEdge = lastLine.y + descenderEm * -1 * fontSizePx; // descenderEm is negative; distance below baseline
    const verticalFits = bottomEdge <= slot.slotBottomPx;
    return {
      lines,
      fontSizePx,
      slotWidthPx: slot.slotWidthPx,
      slotHeightPx,
      fits: verticalFits,
      overflowReason: verticalFits ? undefined : "headline_does_not_fit: last line descends past the locked slot's bottom boundary",
    };
  }

  // Nothing fit within the allowed shrink range even at the maximum line count: report the
  // best-effort (smallest max-width) layout at the minimum font size so the overflow is visible
  // and measurable rather than silently clipped.
  const maxLineCount = Math.min(slot.maxLines, words.length);
  const fallback = bestPartition(wordWidthsEm, spaceWidthEm, maxLineCount)!;
  const fontSizePx = Math.round(slot.minFontSizePx * 100) / 100;
  return {
    lines: buildLines(fallback.groups, fontSizePx),
    fontSizePx,
    slotWidthPx: slot.slotWidthPx,
    slotHeightPx,
    fits: false,
    overflowReason: "headline_does_not_fit: no line arrangement fits within the locked slot at the minimum permitted font size",
  };
}
