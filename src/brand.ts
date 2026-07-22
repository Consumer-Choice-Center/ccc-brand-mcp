import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ValidationMode = "draft" | "final";
export type FontCheck = { input: string; family?: string; weight?: string; ok: boolean; message?: string };

type LogoCheck = { input?: string; ok: boolean; approvedPath?: string; exists?: boolean; message?: string };
type LogoSurface = "dark" | "orange" | "light";
export type SocialStyleVariant = "auto" | "navy_poster" | "petition_push" | "orange_alert" | "statistic_card" | "contrast_cards" | "quote_post";
export const onePagerTemplateIds = ["material_cost_chain", "access_barriers"] as const;
export type OnePagerTemplateId = (typeof onePagerTemplateIds)[number];
export type OnePagerTemplateSelection = "auto" | OnePagerTemplateId;
export const quotePersonIds = ["bill", "david", "emil", "fabio", "fred", "stephen", "yael", "zoltan"] as const;
export type QuotePersonId = (typeof quotePersonIds)[number];
export type QuotePerson = {
  id: QuotePersonId;
  fullName: string;
  title: string;
  portraitFile: string;
  portraitFit: "xMaxYMax meet";
  portraitReferenceWidth: number;
  portraitReferenceMaxWidth: number;
  aliases: string[];
};

const CCC_MARK_PATH = "M514.19,374.8a135.7,135.7,0,0,1-9.67,9.68A145,145,0,0,1,309,384.2a133.65,133.65,0,0,1-9.68-9.67,145.1,145.1,0,0,1,0-195.27,133.86,133.86,0,0,1,9.68-9.68l9.67,9.68a135.72,135.72,0,0,0-9.67,9.67,131.09,131.09,0,0,0,0,175.87,135.63,135.63,0,0,0,9.67,9.67,130.88,130.88,0,0,0,176.14.33l-18.36-18.37a105,105,0,0,1-139.41,0,89.17,89.17,0,0,1-9.67-9.67,105.12,105.12,0,0,1,.32-139.08,90.18,90.18,0,0,1,9.68-9.67,105.1,105.1,0,0,1,139.08-.33,68,68,0,0,1,9.67,9.67L476.42,217l-36.14,36.14a44.88,44.88,0,0,0-9.68-9.68,40.21,40.21,0,0,0-23.89-7.43,40.77,40.77,0,0,0-23.89,7.76,45.24,45.24,0,0,0-9.67,9.67,41.48,41.48,0,0,0-7.76,23.89,43.67,43.67,0,0,0,7.43,23.89A38.71,38.71,0,0,0,382.5,311l-9.68,9.68a68.13,68.13,0,0,1-9.68-9.68,55.48,55.48,0,0,1-11.31-33.57,53.72,53.72,0,0,1,11.59-33.56,67.54,67.54,0,0,1,9.67-9.68,54.92,54.92,0,0,1,67.14-.27l26.45-26.46a92,92,0,0,0-120,0,67.54,67.54,0,0,0-9.67,9.68,92,92,0,0,0,0,120,68,68,0,0,0,9.67,9.67,92,92,0,0,0,120.38.33,67.1,67.1,0,0,0,9.68-9.68l9.68,9.68,18.36,18.37Z";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export const brand = readJson<any>(resolve(__dirname, "../data/ccc-brand.json"));
export const assetManifest = readJson<any>(resolve(__dirname, "../assets/manifest.json"));
const quotePostConfig = brand.visualSystem.socialPosts.quotePost;
const onePagerConfig = brand.visualSystem.onePagers;
export const quotePeople: QuotePerson[] = quotePostConfig.people;
export const onePagerTemplates = onePagerConfig.templates as Array<{
  id: OnePagerTemplateId;
  label: string;
  referenceAsset: string;
  useFor: string;
  titleStyle: string;
  illustrationGrammar: string;
}>;
export const onePagerReferencePaths: string[] = assetManifest.onePagerReferences ?? [];

export const socialTemplates = {
  policy_alert: { label: "POLICY ALERT", background: "autumnOrange", accent: "autumnOrange", text: "baseWhite" },
  statistic: { label: "DATA CARD", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  quote: { label: "QUOTE", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  cta: { label: "CONSUMER VOICE", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  lower_third: { label: "LIVE INTERVIEW", background: "coolMist", accent: "autumnOrange", text: "leila" },
} as const;

export const socialStyleVariants = {
  navy_poster: "Reference 1 system: Leila field, edge-to-edge Anton headline rhythm, orange emphasis and underline, compact footer, official orange logo, cropped gradient CCC mark.",
  petition_push: "Reference 3 system: Autumn Orange field, oversized Anton headline blocks, dark petition band and footer, official orange logo, cropped gradient CCC mark.",
  orange_alert: "Reference 3 system: Autumn Orange field, tilted issue label, oversized Anton hierarchy, dark action band and footer, official orange logo, cropped gradient CCC mark.",
  statistic_card: "Reference 2 system: Leila field, monumental Anton statistic, bold supporting statement, compact evidence callout, bottom logo, cropped gradient CCC mark.",
  contrast_cards: "Reference 4 system: controlled Leila/Warm White split, paired Anton BAD/GOOD or NO/YES headlines, compact comparison cards, official logo, cropped gradient CCC marks.",
  quote_post: "Reference 5 system: supplied 1080x1350 quote template with its exact deep-night field, visible cropped CCC watermark, original Anton line rhythm, mandatory Autumn Orange emphasis, and one fully embedded approved portrait shown at a verified person-specific scale without distortion or cropping.",
} as const;
export const postReferencePaths: string[] = assetManifest.postReferences ?? [];

export const colorEntries = Object.entries(brand.colors).flatMap(([group, colors]) =>
  Object.entries(colors as Record<string, string>).map(([name, hex]) => ({ group, name, hex: hex.toUpperCase() })),
);

const colorByName = new Map(colorEntries.map((entry) => [entry.name, entry.hex]));
const colorByHex = new Map(colorEntries.map((entry) => [entry.hex, entry.name]));
const colorByAlias = new Map(colorEntries.flatMap((entry) => [
  [norm(entry.name), entry.hex],
  [norm(entry.name.replace(/([A-Z])/g, " $1")), entry.hex],
  [norm(entry.hex), entry.hex],
]));
const allowedFontWeights = new Map<string, Set<string>>(brand.assets.requiredFonts.map((font: any) => [font.family, new Set<string>(font.weights)]));
const allowedFontFamilies = new Set<string>(brand.assets.requiredFonts.map((font: any) => font.family));
const approvedLogoPaths = new Set<string>(assetManifest.requiredLogos);

export function asText(data: unknown) {
  return JSON.stringify(data, null, 2);
}

export function getBrandSection(section: string) {
  return section === "all" ? brand : brand[section];
}

function norm(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveQuotePerson(value: string) {
  const key = norm(value);
  return quotePeople.find((person) => [person.id, person.fullName, ...person.aliases].some((alias) => norm(alias) === key));
}

function normalizeHex(value: string) {
  const trimmed = value.trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(trimmed) ? `#${trimmed}` : trimmed;
}

export function resolveColor(value: string) {
  const normalized = normalizeHex(value);
  return colorByName.get(value) ?? (colorByHex.has(normalized) ? normalized : colorByAlias.get(norm(value)));
}

function getColor(name: string) {
  const color = colorByName.get(name);
  if (!color) throw new Error(`Unknown CCC brand color: ${name}`);
  return color;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function wrapWords(text = "", maxChars: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (test.length <= maxChars) line = test;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function severityPush(mode: ValidationMode, violations: string[], warnings: string[], message: string) {
  (mode === "final" ? violations : warnings).push(message);
}

export function parseFontDescriptor(input: string): FontCheck {
  const clean = input.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  const family = [...allowedFontFamilies].sort((a, b) => b.length - a.length).find((candidate) => clean.toLowerCase().startsWith(candidate.toLowerCase()));
  if (!family) return { input, ok: false, message: `Font "${input}" is not approved. Use Montserrat, Anton, Hind, or DM Mono only.` };
  const remainder = clean.slice(family.length).trim();
  if (!remainder) return { input, family, ok: true };
  const weights = allowedFontWeights.get(family) ?? new Set<string>();
  const weight = [...weights].find((candidate) => candidate.toLowerCase() === remainder.toLowerCase());
  return weight
    ? { input, family, weight, ok: true }
    : { input, family, ok: false, message: `Weight "${remainder}" is not approved for ${family}. Approved weights: ${[...weights].join(", ")}.` };
}

function analyzeCopy(text: string | undefined, maxChars: number, maxLines: number) {
  const allLines = wrapWords(text ?? "", maxChars);
  const longWords = (text ?? "").split(/\s+/).filter((word) => word.length > maxChars);
  return { lines: allLines.slice(0, maxLines), allLineCount: allLines.length, omittedLines: allLines.slice(maxLines), maxChars, maxLines, longWords, overLimit: allLines.length > maxLines || longWords.length > 0 };
}

export function qaSocialLayout(input: { template: keyof typeof socialTemplates; headline: string; body?: string; cta?: string; mode: ValidationMode }) {
  const rules = brand.visualSystem.socialPosts;
  const isLowerThird = input.template === "lower_third";
  const isQuote = input.template === "quote";
  const headline = analyzeCopy(
    input.headline,
    isLowerThird ? 34 : isQuote ? 22 : rules.headlineMaxCharactersPerLine,
    isQuote ? quotePostConfig.quoteMaxLines : rules.maxHeadlineLines,
  );
  const body = analyzeCopy(input.body, isLowerThird ? 68 : rules.bodyMaxCharactersPerLine, rules.maxBodyLines);
  const cta = analyzeCopy(input.cta ?? brand.social.requiredFooter, rules.ctaMaxCharactersPerLine, 1);
  const violations: string[] = [];
  const warnings: string[] = [];
  if (headline.overLimit) severityPush(input.mode, violations, warnings, "Headline exceeds CCC social layout limits and may be clipped or overcrowded.");
  if (isQuote && input.headline.trim().length > quotePostConfig.quoteMaxCharacters) severityPush(input.mode, violations, warnings, `Quote exceeds the ${quotePostConfig.quoteMaxCharacters}-character quote-template limit.`);
  if (body.overLimit) severityPush(input.mode, violations, warnings, "Body copy exceeds CCC social layout limits and may be clipped or overcrowded.");
  if (!isLowerThird && cta.overLimit) severityPush(input.mode, violations, warnings, "CTA/footer exceeds the one-line footer limit.");
  return { ok: violations.length === 0, violations, warnings, headline, body, cta };
}

function getAssetBase(basePath?: string) {
  return basePath || process.env[brand.assets.assetBaseEnvironmentVariable] || resolve(__dirname, "..", brand.assets.defaultAssetDirectory);
}

function cleanAssetRef(ref: string) {
  return ref.replace(/^file:\/\//, "").split(/[?#]/, 1)[0].replaceAll("\\", "/");
}

export function validateLogoHref(input?: string, basePath?: string): LogoCheck {
  if (!input) return { ok: false, message: "Official CCC logo asset was not provided." };
  const base = getAssetBase(basePath);
  const cleaned = cleanAssetRef(input);
  const approvedPath = approvedLogoPaths.has(cleaned) ? cleaned : assetManifest.requiredLogos.find((fileName: string) => resolve(base, fileName) === resolve(cleaned));
  if (!approvedPath) return { input, ok: false, message: `Logo reference "${input}" is not listed in assets/manifest.json.` };
  const exists = existsSync(resolve(base, approvedPath));
  return { input, ok: exists, approvedPath, exists, message: exists ? undefined : `Approved logo "${approvedPath}" is missing from ${base}.` };
}

const defaultLogoPriority: Record<LogoSurface, string[]> = {
  dark: ["logos/ccc-wide-orange.svg", "logos/ccc-wide-soft-mint.svg", "logos/ccc-wide-marigold.svg"],
  orange: ["logos/ccc-wide-leila.svg", "logos/ccc-wide-deep-teal.svg", "logos/ccc-wide-slate.svg"],
  light: ["logos/ccc-wide-leila.svg", "logos/ccc-wide-orange.svg", "logos/ccc-wide-deep-teal.svg"],
};

export function selectDefaultLogoHref(surface: LogoSurface = "dark", basePath?: string) {
  return [...defaultLogoPriority[surface], ...assetManifest.requiredLogos].find((path) => validateLogoHref(path, basePath).ok);
}

export function auditAssets(basePath?: string) {
  const base = getAssetBase(basePath);
  const fonts = brand.assets.requiredFonts.map((font: any) => {
    const files = font.fileNames.map((fileName: string) => ({ fileName, manifestListed: assetManifest.requiredFonts.includes(fileName), path: resolve(base, fileName), exists: existsSync(resolve(base, fileName)) }));
    return { family: font.family, weights: font.weights, files, ok: files.every((file: any) => file.manifestListed && file.exists) };
  });
  const logos = brand.assets.requiredLogos.map((logo: any) => {
    const files = logo.fileNames.map((fileName: string) => ({ fileName, manifestListed: assetManifest.requiredLogos.includes(fileName), path: resolve(base, fileName), exists: existsSync(resolve(base, fileName)) }));
    return { id: logo.id, usage: logo.usage, files, ok: files.some((file: any) => file.manifestListed && file.exists) };
  });
  const missingFonts = fonts.filter((font: any) => !font.ok).map((font: any) => font.family);
  const missingLogos = logos.filter((logo: any) => !logo.ok).map((logo: any) => logo.id);
  const quoteTemplate = {
    fileName: quotePostConfig.templateAsset,
    manifestListed: assetManifest.postReferences.includes(quotePostConfig.templateAsset),
    path: resolve(base, quotePostConfig.templateAsset),
    exists: existsSync(resolve(base, quotePostConfig.templateAsset)),
  };
  const quotePortraits = quotePeople.map((person) => ({
    id: person.id,
    fullName: person.fullName,
    fileName: person.portraitFile,
    manifestListed: assetManifest.quotePeoplePortraits?.includes(person.portraitFile) ?? false,
    path: resolve(base, person.portraitFile),
    exists: existsSync(resolve(base, person.portraitFile)),
  }));
  const missingQuotePeople = quotePortraits.filter((portrait) => !portrait.manifestListed || !portrait.exists).map((portrait) => portrait.id);
  const onePagerReferences = onePagerTemplates.map((template) => ({
    id: template.id,
    fileName: template.referenceAsset,
    manifestListed: onePagerReferencePaths.includes(template.referenceAsset),
    path: resolve(base, template.referenceAsset),
    exists: existsSync(resolve(base, template.referenceAsset)),
  }));
  const missingOnePagerReferences = onePagerReferences.filter((reference) => !reference.manifestListed || !reference.exists).map((reference) => reference.id);
  const manifestMissingFromBrand = {
    fonts: assetManifest.requiredFonts.filter((fileName: string) => !brand.assets.requiredFonts.some((font: any) => font.fileNames.includes(fileName))),
    logos: assetManifest.requiredLogos.filter((fileName: string) => !brand.assets.requiredLogos.some((logo: any) => logo.fileNames.includes(fileName))),
    quotePeople: (assetManifest.quotePeoplePortraits ?? []).filter((fileName: string) => !quotePeople.some((person) => person.portraitFile === fileName)),
    onePagers: onePagerReferencePaths.filter((fileName: string) => !onePagerTemplates.some((template) => template.referenceAsset === fileName)),
  };
  return {
    ok: missingFonts.length === 0 && missingLogos.length === 0 && missingQuotePeople.length === 0 && missingOnePagerReferences.length === 0 && quoteTemplate.manifestListed && quoteTemplate.exists && manifestMissingFromBrand.fonts.length === 0 && manifestMissingFromBrand.logos.length === 0 && manifestMissingFromBrand.quotePeople.length === 0 && manifestMissingFromBrand.onePagers.length === 0,
    basePath: base,
    missingFonts,
    missingLogos,
    missingQuotePeople,
    missingOnePagerReferences,
    manifestMissingFromBrand,
    fonts,
    logos,
    quoteTemplate,
    quotePortraits,
    onePagerReferences,
  };
}

export function getPostReferenceAssets(basePath?: string) {
  const base = getAssetBase(basePath);
  return postReferencePaths.map((fileName) => {
    const path = resolve(base, fileName);
    const exists = existsSync(path);
    return {
      fileName,
      path,
      exists,
      role: "reference-locked layout contract; preserve its geometry while replacing copy",
      svg: exists ? readFileSync(path, "utf8") : undefined,
    };
  });
}

export function getOnePagerReferenceAssets(basePath?: string) {
  const base = getAssetBase(basePath);
  return onePagerTemplates.map((template) => {
    const path = resolve(base, template.referenceAsset);
    const exists = existsSync(path);
    return {
      ...template,
      path,
      exists,
      role: "strict one-pager layout contract; preserve every fixed region while replacing copy and contextual illustrations only",
      svg: exists ? readFileSync(path, "utf8") : undefined,
    };
  });
}

function validateColorHarmony(colors: string[], mode: ValidationMode) {
  const violations: string[] = [];
  const warnings: string[] = [];
  const uniqueColors = [...new Set(colors.map(resolveColor).filter((color): color is string => Boolean(color)))];
  const maxUnique = brand.visualSystem.colorUse?.maxUniqueColorsFinal ?? 5;
  const maxTertiary = brand.visualSystem.colorUse?.maxTertiaryColorsFinal ?? 1;
  const tertiaryColors = uniqueColors.filter((color) => Object.values(brand.colors.tertiary ?? {}).some((entry: any) => String(entry).toUpperCase() === color));
  if (uniqueColors.length > maxUnique) severityPush(mode, violations, warnings, `Color system is overloaded: ${uniqueColors.length} brand colors are used. Use ${maxUnique} or fewer for final CCC social graphics.`);
  if (tertiaryColors.length > maxTertiary) severityPush(mode, violations, warnings, `Too many tertiary accent colors are used: ${tertiaryColors.join(", ")}. Use at most ${maxTertiary} tertiary accent color for final layouts.`);
  const primaryColors = new Set(Object.values(brand.colors.primary).map((color: any) => String(color).toUpperCase()));
  if (uniqueColors.length > 0 && !uniqueColors.some((color) => primaryColors.has(color))) severityPush(mode, violations, warnings, "CCC layouts must anchor the palette in Autumn Orange and/or Leila.");
  return { ok: violations.length === 0, violations, warnings, uniqueColors, tertiaryColors };
}

export function validateSpec(input: { colors?: string[]; fonts?: string[]; assetType?: string; mode?: ValidationMode; widthPx?: number; heightPx?: number; usesLogo?: boolean; hasOfficialLogoAsset?: boolean; officialLogoHref?: string; assetBasePath?: string; usesDecorativeElements?: boolean; referenceExact?: boolean }) {
  const mode = input.mode ?? "final";
  const violations: string[] = [];
  const warnings: string[] = [];
  for (const color of input.colors ?? []) if (!resolveColor(color)) violations.push(`Color "${color}" is not in the CCC 2026 brand palette.`);
  const colorHarmony = validateColorHarmony(input.colors ?? [], mode);
  if (input.referenceExact && colorHarmony.uniqueColors.length <= 6) {
    colorHarmony.violations = colorHarmony.violations.filter((message) => !message.startsWith("Color system is overloaded:"));
    colorHarmony.ok = colorHarmony.violations.length === 0;
  }
  violations.push(...colorHarmony.violations);
  warnings.push(...colorHarmony.warnings);
  const fontChecks = (input.fonts ?? []).map(parseFontDescriptor);
  for (const check of fontChecks) if (!check.ok && check.message) violations.push(check.message);
  if (input.assetType === "social") {
    const expected = brand.social.canonicalSize;
    if (input.widthPx && input.widthPx !== expected.widthPx) warnings.push(`Social width is ${input.widthPx}px; CCC default social size is ${expected.widthPx}px.`);
    if (input.heightPx && input.heightPx !== expected.heightPx) warnings.push(`Social height is ${input.heightPx}px; CCC default social size is ${expected.heightPx}px.`);
  }
  let logoCheck: LogoCheck | undefined;
  if (input.usesLogo) {
    if (input.hasOfficialLogoAsset && !input.officialLogoHref) warnings.push("hasOfficialLogoAsset is only a legacy hint; final validation requires officialLogoHref to verify an approved logo file.");
    logoCheck = input.officialLogoHref ? validateLogoHref(input.officialLogoHref, input.assetBasePath) : undefined;
    if (!logoCheck?.ok) severityPush(mode, violations, warnings, logoCheck?.message ?? "Official CCC logo asset was not provided. Final output must use an approved logo file.");
  }
  if (input.assetType === "policyMemo" && input.usesDecorativeElements) violations.push("Policy memos must not use decorative or topic visual elements.");
  return { ok: violations.length === 0, mode, violations, warnings, fontChecks, logoCheck, colorHarmony };
}

function svgFontFamilies(svg: string) {
  const families = new Set<string>();
  for (const match of svg.matchAll(/\bfont-family\s*=\s*["']([^"']+)["']/gi)) for (const family of match[1].split(",")) families.add(family.trim().replace(/^['"]|['"]$/g, ""));
  for (const match of svg.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)) for (const family of match[1].split(",")) families.add(family.trim().replace(/^['"]|['"]$/g, ""));
  return [...families].filter(Boolean);
}

function svgColors(svg: string) {
  const values = new Set<string>();
  for (const pattern of [/\b(?:fill|stroke|stop-color)\s*=\s*["']([^"']+)["']/gi, /(?:fill|stroke|stop-color)\s*:\s*([^;"'}]+)/gi]) for (const match of svg.matchAll(pattern)) values.add(match[1].trim());
  return [...values].filter((color) => !["none", "transparent", "currentcolor"].includes(color.toLowerCase()) && !color.toLowerCase().startsWith("url("));
}

function svgLogoRefs(svg: string) {
  const refs = new Set<string>();
  for (const pattern of [/\bdata-ccc-logo-href\s*=\s*["']([^"']+)["']/gi, /\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi]) for (const match of svg.matchAll(pattern)) if (!match[1].startsWith("data:") && !match[1].startsWith("#")) refs.add(match[1].trim());
  return [...refs];
}

function svgDimension(svg: string, name: "width" | "height") {
  const rootTag = svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  return Number(rootTag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([0-9.]+)(?:px)?["']`, "i"))?.[1]) || undefined;
}

function attr(attrs: string, name: string) {
  return attrs.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? attrs.match(new RegExp(`${name}\\s*:\\s*([^;"'}]+)`, "i"))?.[1];
}

function svgTextStyles(svg: string) {
  return [...svg.matchAll(/<text\b([^>]*)>/gi)].map((match) => {
    const attrs = match[1];
    const family = attr(attrs, "font-family")?.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "");
    const size = Number(attr(attrs, "font-size")?.match(/[0-9.]+/)?.[0]);
    const raw = (attr(attrs, "font-weight") ?? "").toLowerCase();
    const weight = /^\d+$/.test(raw) ? Number(raw) : raw === "bold" ? 700 : raw === "semibold" ? 600 : raw === "medium" ? 500 : 400;
    const textLength = Number(attr(attrs, "textLength")?.match(/[0-9.]+/)?.[0]);
    return { family, size, weight, textLength };
  });
}

function referenceHeadlineStyles(svg: string) {
  const block = svg.match(/<g\b[^>]*data-ccc-role=["']reference-headline["'][^>]*>[\s\S]*?<\/g>/i)?.[0] ?? "";
  return svgTextStyles(block);
}

function hasBadSplit(svg: string, width: number, height: number) {
  return [...svg.matchAll(/<polygon\b[^>]*\bpoints\s*=\s*["']([^"']+)["'][^>]*>/gi)].some((match) => {
    const nums = match[1].split(/[\s,]+/).map(Number).filter(Number.isFinite);
    const xs = nums.filter((_, index) => index % 2 === 0);
    const ys = nums.filter((_, index) => index % 2 === 1);
    return Math.max(...xs) - Math.min(...xs) >= width * 0.38 && Math.max(...ys) - Math.min(...ys) >= height * 0.72;
  });
}

export function validateSvgArtifact(input: { svg: string; assetType?: "social" | "video" | "other"; mode?: ValidationMode; requiresLogo?: boolean; assetBasePath?: string }) {
  const mode = input.mode ?? "final";
  const assetType = input.assetType ?? "social";
  const violations: string[] = [];
  const warnings: string[] = [];
  const referenceExact = /data-ccc-layout-lock=["']reference-exact["']/i.test(input.svg);
  if (!input.svg.trim().startsWith("<svg")) violations.push("Artifact is not a standalone SVG document.");
  const illustratorCompatibility = validateIllustratorSvg({ svg: input.svg, mode });
  violations.push(...illustratorCompatibility.violations);
  warnings.push(...illustratorCompatibility.warnings);
  const fonts = svgFontFamilies(input.svg);
  for (const check of fonts.map(parseFontDescriptor)) if (!check.ok && check.message) violations.push(check.message);
  if (fonts.length === 0 && /<text[\s>]/i.test(input.svg)) severityPush(mode, violations, warnings, `SVG text must declare an approved CCC font family. Approved families: ${[...allowedFontFamilies].join(", ")}.`);
  const colors = svgColors(input.svg);
  for (const color of colors) if (!resolveColor(color)) violations.push(`SVG color "${color}" is not in the CCC 2026 brand palette.`);
  const colorHarmony = validateColorHarmony(colors, mode);
  if (referenceExact && colorHarmony.uniqueColors.length <= 6) {
    colorHarmony.violations = colorHarmony.violations.filter((message) => !message.startsWith("Color system is overloaded:"));
    colorHarmony.ok = colorHarmony.violations.length === 0;
  }
  violations.push(...colorHarmony.violations);
  warnings.push(...colorHarmony.warnings);
  const widthPx = svgDimension(input.svg, "width");
  const heightPx = svgDimension(input.svg, "height");
  const appearsToBeOnePager = assetType === "other" && (
    /data-ccc-asset=["'](?:one-pager|one-page-explainer)["']/i.test(input.svg)
    || /viewBox=["']0 0 1186\.51 1535\.49["']/i.test(input.svg)
    || (widthPx === onePagerConfig.canvas.widthPx && heightPx === onePagerConfig.canvas.heightPx)
  );
  const guideStyleWatermark = (referenceExact && /data-ccc-watermark-source=["']packaged-reference["']/i.test(input.svg)) || (/data-ccc-watermark=["']gradient-ccc-mark["']/i.test(input.svg) && /data-ccc-watermark-gradient=["']semi-transparent["']/i.test(input.svg) && /href=["']#ccc-watermark-mark["']/i.test(input.svg));
  const legacyCircleWatermark = /data-ccc-watermark=["']gradient-ring["']|CCC gradient ring watermark/i.test(input.svg);
  const styleVariant = input.svg.match(/data-ccc-variant=["'](navy_poster|petition_push|orange_alert|statistic_card|contrast_cards|quote_post)["']/i)?.[1];
  const guideStyleVariant = Boolean(styleVariant);
  const referenceSystem = input.svg.match(/data-ccc-reference-system=["'](reference-[1-5])["']/i)?.[1];
  const variation = Number(input.svg.match(/data-ccc-variation=["']([0-2])["']/i)?.[1]);
  const density = input.svg.match(/data-ccc-density=["']([^"']+)["']/i)?.[1];
  const validDensity = Boolean(density && ["medium", "dense", "high"].includes(density));
  const hasActionBand = /data-ccc-has-action-band=["']true["']|data-ccc-role=["']action-band["']/i.test(input.svg);
  const hasStackedBlocks = /data-ccc-has-stacked-blocks=["']true["']|data-ccc-role=["']stacked-headline["']/i.test(input.svg);
  const hasPetitionMarker = /data-ccc-has-petition-marker=["']true["']|data-ccc-role=["']petition-marker["']/i.test(input.svg);
  const hasLargeStat = /data-ccc-has-large-stat=["']true["']/i.test(input.svg);
  const hasContrastCards = /data-ccc-has-contrast-cards=["']true["']|data-ccc-role=["']contrast-cards["']/i.test(input.svg);
  const hasQuotePortrait = /data-ccc-has-quote-portrait=["']true["']|data-ccc-role=["']quote-portrait["']/i.test(input.svg);
  const hasQuoteAttribution = /data-ccc-role=["']quote-attribution["']/i.test(input.svg);
  const hasQuoteWatermark = /data-ccc-role=["']quote-watermark["'][^>]*data-ccc-watermark=["']cropped-ccc-mark["']/i.test(input.svg);
  const hasQuoteReferencePalette = /(?:fill\s*:\s*|fill\s*=\s*["'])#15192e/i.test(input.svg) && /(?:stop-color\s*:\s*|stop-color\s*=\s*["'])#22274e/i.test(input.svg);
  const quotePortraitBlock = input.svg.match(/<g\b[^>]*data-ccc-role=["']quote-portrait["'][^>]*>[\s\S]*?<\/g>/i)?.[0] ?? "";
  const hasEmbeddedQuotePortrait = /\b(?:href|xlink:href)\s*=\s*["']data:image\/(?:png|jpe?g|webp);base64,/i.test(quotePortraitBlock) && /data-ccc-portrait-embedded=["']true["']/i.test(input.svg);
  const hasUncroppedQuotePortrait = /preserveAspectRatio=["']xMaxYMax meet["']/i.test(quotePortraitBlock) && !/\bclip-path\s*=/i.test(quotePortraitBlock) && /data-ccc-portrait-policy=["']contain-no-crop["']/i.test(input.svg);
  const quoteTextBottom = Number(input.svg.match(/data-ccc-quote-text-bottom=["']([0-9.]+)["']/i)?.[1]);
  const portraitSafeTop = Number(input.svg.match(/data-ccc-portrait-safe-top=["']([0-9.]+)["']/i)?.[1]);
  const quoteTextColumnRight = Number(input.svg.match(/data-ccc-quote-text-column-right=["']([0-9.]+)["']/i)?.[1]);
  const portraitFaceSafeLeft = Number(input.svg.match(/data-ccc-portrait-face-safe-left=["']([0-9.]+)["']/i)?.[1]);
  const portraitHeight = Number(input.svg.match(/data-ccc-portrait-height=["']([0-9.]+)["']/i)?.[1]);
  const portraitWidth = Number(input.svg.match(/data-ccc-portrait-width=["']([0-9.]+)["']/i)?.[1]);
  const hasSeparatedQuoteZones = /data-ccc-quote-safe-zones=["']reference-columns["']/i.test(input.svg) && Number.isFinite(quoteTextBottom) && quoteTextBottom <= 647.2 && Number.isFinite(quoteTextColumnRight) && quoteTextColumnRight === 520 && Number.isFinite(portraitFaceSafeLeft) && portraitFaceSafeLeft >= 490;
  const hasProportionalQuotePortrait = /data-ccc-portrait-scale=["']reference-proportional["']/i.test(input.svg) && Number.isFinite(portraitSafeTop) && portraitSafeTop === 350 && Number.isFinite(portraitHeight) && portraitHeight === 1000 && Number.isFinite(portraitWidth) && portraitWidth >= 650 && portraitWidth <= 813;
  const hasQuoteOrangeEmphasis = /<tspan\b[^>]*data-ccc-role=["']quote-emphasis["'][^>]*fill=["']#e95c1f["']/i.test(input.svg);
  const placeholderLogo = /CCC LOGO|USE OFFICIAL ASSET|logo placeholder|placeholder/i.test(input.svg);
  const logoRefs = svgLogoRefs(input.svg);
  const logoChecks = logoRefs.map((ref) => validateLogoHref(ref, input.assetBasePath));
  const styles = svgTextStyles(input.svg);
  const antonStyles = styles.filter((style) => style.family === "Anton");
  const referenceScale = referenceExact && referenceSystem !== "reference-5" ? (widthPx ?? brand.social.canonicalSize.widthPx) / 385.85 : 1;
  const posterScaleHeadline = assetType === "social" && (styleVariant === "quote_post"
    ? styles.some((style) => style.family === "Anton" && style.size >= 48)
    : referenceExact
    ? styles.some((style) => (style.family === "Anton" || (referenceSystem === "reference-3" && style.family === "Montserrat" && style.weight >= 700)) && style.size * referenceScale >= 110)
    : antonStyles.some((style) => style.size >= 110));
  const frameFillingAnton = assetType === "social" && (referenceExact
    ? /data-ccc-role=["']reference-headline["']/i.test(input.svg)
    : styleVariant === "contrast_cards"
    ? antonStyles.filter((style) => style.size >= 96 && (style.textLength ?? 0) >= 340).length >= 2
    : antonStyles.some((style) => style.size >= 110 && (style.textLength ?? 0) >= (widthPx ?? brand.social.canonicalSize.widthPx) * 0.58));
  const headlineStyles = referenceHeadlineStyles(input.svg);
  const expectedDisplayFamily = referenceSystem === "reference-3" ? "Montserrat" : "Anton";
  const nativeReferenceTypography = !referenceExact || (headlineStyles.length > 0 && headlineStyles.every((style) =>
    style.family === expectedDisplayFamily && (expectedDisplayFamily !== "Montserrat" || style.weight >= 700)
  ));
  const artificialTextStretch = assetType === "social" && (
    /\btextLength\s*=/i.test(input.svg)
    || /\blengthAdjust\s*=\s*["']spacingAndGlyphs["']/i.test(input.svg)
    || /\bfont-stretch\s*(?:=|:)\s*["']?(?:condensed|expanded|[0-9.]+%)/i.test(input.svg)
    || /<text\b[^>]*\btransform\s*=\s*["'][^"']*\bscale\s*\(\s*([0-9.]+)[ ,]+(?!\1\b)[0-9.]+/i.test(input.svg)
  );
  const weakLargeSocialType = assetType === "social" && styles.some((style) => style.family === "Montserrat" && style.size >= 72 && style.weight < 700);
  const badSocialSplitComposition = assetType === "social" && styleVariant !== "contrast_cards" && hasBadSplit(input.svg, widthPx ?? brand.social.canonicalSize.widthPx, heightPx ?? brand.social.canonicalSize.heightPx);
  const onePagerValidation = appearsToBeOnePager ? validateOnePagerSvg({ svg: input.svg, mode }) : undefined;
  if (assetType === "social") {
    const expected = brand.social.canonicalSize;
    if (widthPx !== expected.widthPx || heightPx !== expected.heightPx) severityPush(mode, violations, warnings, `SVG social dimensions are ${widthPx ?? "missing"}x${heightPx ?? "missing"}; CCC social output must be ${expected.widthPx}x${expected.heightPx}.`);
    if (!referenceExact) severityPush(mode, violations, warnings, "Final CCC social output must be generated from the mapped packaged reference and declare data-ccc-layout-lock=\"reference-exact\". Freeform and legacy social renderers are not accepted.");
    if (!guideStyleVariant) severityPush(mode, violations, warnings, "SVG social output must declare a CCC guide style variant: navy_poster, petition_push, orange_alert, statistic_card, contrast_cards, or quote_post.");
    if (!validDensity) severityPush(mode, violations, warnings, "SVG social output must declare CCC composition density metadata: medium, dense, or high.");
    if (!guideStyleWatermark) severityPush(mode, violations, warnings, "SVG social output must use the cropped semi-transparent gradient CCC mark geometry from the reference system; concentric-circle substitutes are not accepted.");
    if (legacyCircleWatermark) severityPush(mode, violations, warnings, "Concentric-circle watermark geometry is not the CCC mark. Use the official nested-C silhouette with an approved transparent brand gradient.");
    const expectedReference = styleVariant === "navy_poster" ? "reference-1" : styleVariant === "statistic_card" ? "reference-2" : styleVariant === "contrast_cards" ? "reference-4" : styleVariant === "quote_post" ? "reference-5" : "reference-3";
    if (referenceSystem !== expectedReference) severityPush(mode, violations, warnings, `SVG ${styleVariant ?? "social"} output must declare data-ccc-reference-system="${expectedReference}" to preserve the matching reference composition grammar.`);
    if (!Number.isInteger(variation) || variation < 0 || variation > 2) severityPush(mode, violations, warnings, "SVG social output must declare a controlled composition variation from 0 to 2.");
    if (styleVariant === "petition_push" && (!hasActionBand || !hasStackedBlocks || !hasPetitionMarker)) severityPush(mode, violations, warnings, "petition_push social output must include stacked headline blocks, a dark action band, and a petition marker.");
    if (styleVariant === "orange_alert" && (!hasActionBand || !hasStackedBlocks)) severityPush(mode, violations, warnings, "orange_alert social output must include stacked headline blocks and a dark action band.");
    if (styleVariant === "statistic_card" && !(hasLargeStat || styles.some((style) => style.size >= 160))) severityPush(mode, violations, warnings, "statistic_card social output must include one large statistic or lead number at poster scale.");
    if (styleVariant === "contrast_cards" && !(hasContrastCards || (/(?:>|;)(?:NO|BAD)(?:<|&)/i.test(input.svg) && /(?:>|;)(?:YES|GOOD)(?:<|&)/i.test(input.svg)))) severityPush(mode, violations, warnings, "contrast_cards social output must include compact internal NO/YES or BAD/GOOD cards.");
    if (styleVariant === "quote_post" && (!hasQuotePortrait || !hasQuoteAttribution)) severityPush(mode, violations, warnings, "quote_post output must include one approved team portrait and the matching verified name/title attribution.");
    if (styleVariant === "quote_post" && (!hasQuoteWatermark || !hasQuoteReferencePalette)) severityPush(mode, violations, warnings, "quote_post output must preserve the supplied reference-5 deep-night background (#15192E) and visible cropped CCC watermark (#22274E)." );
    if (styleVariant === "quote_post" && !hasSeparatedQuoteZones) severityPush(mode, violations, warnings, "quote_post output must preserve the reference text column and keep the portrait's measured face boundary clear of it.");
    if (styleVariant === "quote_post" && !hasProportionalQuotePortrait) severityPush(mode, violations, warnings, "quote_post output must use the reference-sized 1000px portrait field and a verified person-specific width between 650px and 813px.");
    if (styleVariant === "quote_post" && !hasUncroppedQuotePortrait) severityPush(mode, violations, warnings, "quote_post portraits must use xMaxYMax meet inside the canvas without clip-path cropping.");
    if (styleVariant === "quote_post" && !hasEmbeddedQuotePortrait) severityPush(mode, violations, warnings, "quote_post portraits must be embedded as a base64 data:image URI so downloaded SVGs remain self-contained.");
    if (styleVariant === "quote_post" && !hasQuoteOrangeEmphasis) severityPush(mode, violations, warnings, "quote_post output must highlight at least one quote word in Autumn Orange (#E95C1F).");
    if (badSocialSplitComposition) severityPush(mode, violations, warnings, "SVG uses a large full-height diagonal split composition; CCC social posts must follow the mapped reference system with a dominant field, stacked text blocks, labels, footer, logo, and cropped CCC mark watermark.");
    if (!posterScaleHeadline) severityPush(mode, violations, warnings, "SVG social output must use the mapped reference's native display face at poster scale: Anton for references 1, 2, and 4; Montserrat Bold for reference 3.");
    if (!frameFillingAnton) severityPush(mode, violations, warnings, "Dominant display typography must occupy the reference headline slots and preserve the supplied CCC composition geometry.");
    if (!nativeReferenceTypography) severityPush(mode, violations, warnings, `Reference-locked headline text must use the native ${expectedDisplayFamily}${expectedDisplayFamily === "Montserrat" ? " Bold" : " Regular"} display face on every line.`);
    if (artificialTextStretch) severityPush(mode, violations, warnings, "Reference-locked layouts must not use SVG textLength stretching because it creates viewer-dependent letter spacing. Fit copy with the reference font sizes and line slots instead.");
    if (weakLargeSocialType) severityPush(mode, violations, warnings, "Large social headline text must not use thin or regular Montserrat. Use Anton Regular or Montserrat Bold blocks for guide-style posts.");
  }
  if (placeholderLogo) severityPush(mode, violations, warnings, "SVG contains a logo placeholder. Final CCC output must use an approved official logo asset.");
  if (onePagerValidation && !onePagerValidation.ok) {
    for (const message of onePagerValidation.violations) if (!violations.includes(message)) violations.push(`One-pager gate: ${message}`);
    for (const message of onePagerValidation.warnings) if (!warnings.includes(message)) warnings.push(`One-pager gate: ${message}`);
  }
  if (input.requiresLogo ?? true) if (!logoChecks.some((check) => check.ok)) severityPush(mode, violations, warnings, "SVG does not reference a verified official CCC logo asset.");
  return { ok: violations.length === 0, mode, violations, warnings, widthPx, heightPx, fonts, colors, colorHarmony, illustratorCompatibility, placeholderLogo, logoRefs, logoChecks, referenceExact, guideStyleWatermark, legacyCircleWatermark, guideStyleVariant, styleVariant, referenceSystem, variation, density, validDensity, hasActionBand, hasStackedBlocks, hasPetitionMarker, hasLargeStat, hasContrastCards, hasQuotePortrait, hasQuoteAttribution, hasQuoteWatermark, hasQuoteReferencePalette, hasSeparatedQuoteZones, hasProportionalQuotePortrait, hasUncroppedQuotePortrait, hasEmbeddedQuotePortrait, hasQuoteOrangeEmphasis, badSocialSplitComposition, posterScaleHeadline, frameFillingAnton, nativeReferenceTypography, artificialTextStretch, weakLargeSocialType, appearsToBeOnePager, onePagerValidation };
}

function illustratorFontPolicy(includeAnton = true) {
  const families = [...(includeAnton ? ["Anton"] : []), "Montserrat", "DM Mono"];
  return `<metadata data-ccc-font-policy="editable-installed" data-ccc-required-fonts="${families.join(", ")}">Install the packaged CCC fonts before editing. Browser-style base64 web-font embedding is intentionally omitted for Adobe Illustrator compatibility.</metadata>`;
}

function inlineLogoSvg(check: LogoCheck, x: number, y: number, width: number, height: number, basePath?: string) {
  if (!check.ok || !check.approvedPath) return undefined;
  const source = readFileSync(resolve(getAssetBase(basePath), check.approvedPath), "utf8");
  const viewBox = source.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1] ?? `0 0 ${width} ${height}`;
  const inner = source.replace(/^\s*<svg\b[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${escapeXml(viewBox)}" preserveAspectRatio="xMidYMid meet" data-ccc-logo-href="${escapeXml(check.approvedPath)}">${inner}</svg>`;
}

function makeIllustratorSafeSvg(svg: string) {
  let safe = svg
    .replace(/<style\b[^>]*data-ccc-embedded-fonts=["']true["'][^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<filter\b[\s\S]*?<\/filter>/gi, "")
    .replace(/\sfilter\s*=\s*["']url\(#[^)]+\)["']/gi, "")
    .replace(/<image\b([^>]*?)\shref\s*=/gi, "<image$1 xlink:href=");
  safe = safe.replace(/<svg\b([^>]*)>/i, (root, attrs: string) => {
    let next = attrs;
    if (!/\bversion\s*=/.test(next)) next += ` version="1.1"`;
    if (!/\bxmlns:xlink\s*=/.test(next)) next += ` xmlns:xlink="http://www.w3.org/1999/xlink"`;
    if (!/\bdata-ccc-export\s*=/.test(next)) next += ` data-ccc-export="illustrator-svg-1.1"`;
    if (!/\bdata-ccc-font-policy\s*=/.test(next)) next += ` data-ccc-font-policy="editable-installed"`;
    return `<svg${next}>`;
  });
  return safe;
}

export function validateIllustratorSvg(input: { svg: string; mode?: ValidationMode }) {
  const mode = input.mode ?? "final";
  const violations: string[] = [];
  const warnings: string[] = [];
  const root = input.svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const imageTags = [...input.svg.matchAll(/<image\b[^>]*>/gi)].map((match) => match[0]);
  const hasSvg11 = /\bversion\s*=\s*["']1\.1["']/i.test(root);
  const hasXlinkNamespace = /\bxmlns:xlink\s*=\s*["']http:\/\/www\.w3\.org\/1999\/xlink["']/i.test(root);
  const hasExportContract = /\bdata-ccc-export\s*=\s*["']illustrator-svg-1\.1["']/i.test(root);
  const hasEmbeddedWebFonts = /@font-face[\s\S]*?url\(\s*["']?data:font\//i.test(input.svg);
  const svg2ImageHrefs = imageTags.filter((tag) => /\shref\s*=/i.test(tag) && !/\bxlink:href\s*=/i.test(tag));
  const nonEmbeddedImages = imageTags.filter((tag) => {
    const href = tag.match(/\bxlink:href\s*=\s*["']([^"']+)["']/i)?.[1];
    return !href || !/^data:image\/(?:png|jpe?g|webp);base64,/i.test(href);
  });
  const embeddedSvgImages = imageTags.filter((tag) => /\bxlink:href\s*=\s*["']data:image\/svg\+xml/i.test(tag));
  const liveFilters = /<filter\b|\sfilter\s*=\s*["']url\(/i.test(input.svg);
  if (!hasSvg11 || !hasXlinkNamespace || !hasExportContract) severityPush(mode, violations, warnings, "SVG must declare the Illustrator SVG 1.1 export contract, including version=\"1.1\", xmlns:xlink, and data-ccc-export=\"illustrator-svg-1.1\".");
  if (hasEmbeddedWebFonts) severityPush(mode, violations, warnings, "Illustrator-safe SVG must not embed fonts through CSS data:font URLs. Keep editable text with packaged fonts installed, or convert final text to outlines.");
  if (svg2ImageHrefs.length) severityPush(mode, violations, warnings, "Illustrator-safe raster images must use SVG 1.1 xlink:href, not the browser-oriented SVG 2 href attribute.");
  if (nonEmbeddedImages.length) severityPush(mode, violations, warnings, "Every Illustrator-safe raster image must remain self-contained as an xlink:href base64 PNG, JPEG, or WebP data URI.");
  if (embeddedSvgImages.length) severityPush(mode, violations, warnings, "Do not place an SVG inside another SVG as a data:image/svg+xml link. Inline official vector logo markup instead.");
  if (liveFilters) severityPush(mode, violations, warnings, "Illustrator-safe SVG must not use live SVG filter effects. Replace them with ordinary vector shapes or flatten the effect before handoff.");
  return { ok: violations.length === 0, mode, violations, warnings, hasSvg11, hasXlinkNamespace, hasExportContract, hasEmbeddedWebFonts, imageCount: imageTags.length, svg2ImageHrefs: svg2ImageHrefs.length, nonEmbeddedImages: nonEmbeddedImages.length, embeddedSvgImages: embeddedSvgImages.length, liveFilters };
}

export function selectOnePagerTemplate(request: string, requested: OnePagerTemplateSelection = "auto") {
  if (requested !== "auto") return onePagerTemplates.find((template) => template.id === requested)!;
  const normalized = request.toLocaleLowerCase();
  const materialSignals = /\b(tariffs?|tax|costs?|prices?|materials?|components?|supply chain|manufactur|imports?|exports?|construction|product breakdown|where .* goes)\b/i;
  const accessSignals = /\b(access|permits?|permissions?|approval|regulation|barriers?|restrictions?|health|safety|availability|condo|heritage|inspection|bureaucracy)\b/i;
  const id: OnePagerTemplateId = materialSignals.test(normalized) && !accessSignals.test(normalized) ? "material_cost_chain" : "access_barriers";
  return onePagerTemplates.find((template) => template.id === id)!;
}

const onePagerGeometryAttributes: Record<string, string[]> = {
  path: ["d", "transform"],
  rect: ["x", "y", "width", "height", "rx", "ry", "transform"],
  line: ["x1", "y1", "x2", "y2", "transform"],
  polyline: ["points", "transform"],
  polygon: ["points", "transform"],
  circle: ["cx", "cy", "r", "transform"],
  ellipse: ["cx", "cy", "rx", "ry", "transform"],
};

function onePagerGeometryCounts(svg: string) {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(/<(path|rect|line|polyline|polygon|circle|ellipse)\b([^>]*)>/gi)) {
    const type = match[1].toLowerCase();
    const values = onePagerGeometryAttributes[type]
      .map((name) => {
        const value = attr(match[2], name)?.trim().replace(/\s+/g, " ");
        return value ? `${name}=${value}` : "";
      })
      .filter(Boolean);
    if (!values.length) continue;
    const signature = `${type}|${values.join("|")}`;
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  return counts;
}

export function validateOnePagerTemplateIntegrity(input: { svg: string; template: OnePagerTemplateId; assetBasePath?: string }) {
  const template = onePagerTemplates.find((entry) => entry.id === input.template)!;
  const referencePath = resolve(getAssetBase(input.assetBasePath), template.referenceAsset);
  const minimumRetention = Number(onePagerConfig.minimumGeometryRetention ?? 0.9);
  const declaredSource = input.svg.match(/data-ccc-template-source=["']([^"']+)["']/i)?.[1];
  if (!existsSync(referencePath)) {
    return { ok: false, templateId: template.id, referenceAsset: template.referenceAsset, declaredSource, sourceMatches: false, minimumRetention, referenceShapes: 0, matchedShapes: 0, retainedRatio: 0, message: `Selected one-pager reference is missing: ${template.referenceAsset}.` };
  }
  const referenceCounts = onePagerGeometryCounts(readFileSync(referencePath, "utf8"));
  const outputCounts = onePagerGeometryCounts(input.svg);
  let referenceShapes = 0;
  let matchedShapes = 0;
  for (const [signature, count] of referenceCounts) {
    referenceShapes += count;
    matchedShapes += Math.min(count, outputCounts.get(signature) ?? 0);
  }
  const retainedRatio = referenceShapes ? matchedShapes / referenceShapes : 0;
  const sourceMatches = declaredSource === template.referenceAsset;
  const ok = sourceMatches && retainedRatio >= minimumRetention;
  return {
    ok,
    templateId: template.id,
    referenceAsset: template.referenceAsset,
    declaredSource,
    sourceMatches,
    minimumRetention,
    referenceShapes,
    matchedShapes,
    retainedRatio: Math.round(retainedRatio * 10_000) / 10_000,
    message: ok ? undefined : `One-pager does not retain enough geometry from ${template.referenceAsset}: ${Math.round(retainedRatio * 100)}% retained; at least ${Math.round(minimumRetention * 100)}% is required. Start from the linked SVG itself instead of recreating the page.`,
  };
}

export function createOnePagerBrief(input: {
  request: string;
  template?: OnePagerTemplateSelection;
  headline?: string;
  centralObject?: string;
  keyMessage?: string;
  sources?: string[];
  mode?: ValidationMode;
}) {
  const mode = input.mode ?? "draft";
  const template = selectOnePagerTemplate(input.request, input.template ?? "auto");
  const typographyContract = onePagerConfig.typographyContracts[template.id];
  const referenceResourceUri = `brand://ccc/one-pager-references/${template.referenceAsset.split("/").pop()}`;
  const referencePath = resolve(getAssetBase(), template.referenceAsset);
  const referenceShapes = existsSync(referencePath) ? [...onePagerGeometryCounts(readFileSync(referencePath, "utf8")).values()].reduce((sum, count) => sum + count, 0) : 0;
  const centralObject = input.centralObject?.trim() || "the single physical object that best explains the policy issue";
  const sources = (input.sources ?? []).map((source) => source.trim()).filter(Boolean);
  const warnings: string[] = [];
  const violations: string[] = [];
  if (mode === "final" && sources.length === 0) violations.push("Final one-pagers require at least one named source citation for the locked footer source line.");
  if (!input.headline?.trim()) warnings.push("No headline was supplied; the generating model must write a concise uppercase headline that fits the reference title slot without moving or shrinking the layout.");
  if (!input.keyMessage?.trim()) warnings.push("No closing takeaway was supplied; the generating model must write one concise consumer-choice conclusion for the locked bottom navy panel.");
  const prompt = [
    `Create one CCC policy one-pager using the strict ${template.id} reference template.`,
    `User request: ${input.request}`,
    `Reference SVG: ${referenceResourceUri}`,
    "Open and duplicate the linked reference SVG before writing or drawing anything. The reference resource is a required source file, not optional inspiration.",
    `Canvas: ${onePagerConfig.canvas.viewBox} (${onePagerConfig.canvas.widthPx} x ${onePagerConfig.canvas.heightPx} reference units).`,
    "Start from the supplied SVG itself. Do not recreate, reinterpret, simplify, stretch, or rearrange the page.",
    `Preserve the template's ${template.titleStyle}, navy/orange/warm-white color roles, section heights, headline origin, brush labels, arrows, dividers, cards, footer, source line, and logo geometry exactly.`,
    `Typography contract: display title = ${typographyContract.displayTitle}; repeated component headings = ${typographyContract.componentHeadings}; repeated component body = ${typographyContract.componentBody}; statistics = ${typographyContract.statistics}; labels and sources = ${typographyContract.labelsAndSources}. Match the reference font style and size for every slot; never mix families, weights, styles, or sizes within a repeated component role.`,
    "The only illustration change is the contextual object system: replace the source house/AC imagery with a subject-specific central object and related supporting cutouts while preserving the same illustration boxes, scale relationships, transparent backgrounds, edge treatment, and arrow connections.",
    `Central object: ${centralObject}.`,
    `Illustration grammar: ${template.illustrationGrammar}`,
    "Generate a clean editorial photomontage/cutaway object on transparent background, with crisp realistic edges and no scene background. Do not use a generic AI illustration, painterly rendering, 3D blob, floating circle decoration, or stock-photo rectangle.",
    "Keep every illustration fully inside its assigned reference zone. Never cover headline, callout, statistic, takeaway, source, or logo text. Embed every raster illustration as a base64 data:image URI in the final SVG.",
    "Export for Adobe Illustrator as SVG 1.1: declare version=\"1.1\", xmlns:xlink=\"http://www.w3.org/1999/xlink\", and data-ccc-export=\"illustrator-svg-1.1\". Every embedded raster must use xlink:href, never SVG 2 href.",
    "Do not embed fonts with @font-face or data:font URLs. Keep editable text assigned to the packaged CCC fonts and add data-ccc-font-policy=\"editable-installed\"; users install the packaged fonts before editing. Do not use live SVG filters. Inline official vector logos instead of linking data:image/svg+xml files.",
    "Replace wording only within the existing text slots. Match the source line count, hierarchy, alignment, and approximate character density; shorten copy instead of moving elements or reducing type below the reference scale.",
    "Required content structure: one dominant headline and deck; three policy callouts around the central object; one orange lead-stat brush panel; one dark bridge statement; the reference lower-section heading; three or four evidence cards according to the selected template; one bottom consumer-choice conclusion; source footer; official CCC logo.",
    "Component alignment contract: every text-bearing group must declare data-ccc-component, data-ccc-bounds=\"x y width height\", data-ccc-text-inset, and a measured data-ccc-text-safe-box=\"x y width height\" contained inside its component bounds. Keep at least 24 reference units between component bounds. Use one shared left inset, top inset, baseline interval, font family, weight, style, and size for equivalent callouts or cards. Text may not touch a panel edge, leave its text-safe box, or enter another component.",
    "Arrow contract: include exactly three data-ccc-connector=\"shaft-arrowhead\" groups. Each must contain one visible 3-unit stroked path with stroke-dasharray=\"6 7\" plus two compact filled polygon/path arrowheads, tangent-aligned and physically touching the two shaft endpoints. Do not cross a text-safe box. Do not use marker-start, marker-mid, or marker-end because Illustrator can import a marker without its shaft.",
    `Headline: ${input.headline?.trim() || "write from the request"}`,
    `Closing takeaway: ${input.keyMessage?.trim() || "write from the request"}`,
    `Sources: ${sources.length ? sources.join(" • ") : "required before final output"}`,
    `Add data-ccc-asset="one-pager", data-ccc-layout-lock="one-pager-reference-exact", data-ccc-template-source="${template.referenceAsset}", data-ccc-typography-contract="${template.id}-reference", data-ccc-component-grid="reference-spaced", the selected template id, and data-ccc-role markers for title, central illustration, callouts, lead statistic, evidence cards, takeaway, sources, and logo. Add data-ccc-type-role plus direct font-family, font-weight, font-style, and font-size attributes to every required typography role; do not rely on inherited or class-only font declarations. Run validate_one_pager_svg and validate_illustrator_svg; fix every violation before handoff. Generic validate_svg_artifact is not a substitute for the dedicated one-pager validator.`,
  ].join("\n");
  return {
    ok: violations.length === 0,
    mode,
    template,
    referenceAsset: template.referenceAsset,
    referenceResourceUri,
    templateIntegrity: {
      required: true,
      referenceShapes,
      minimumGeometryRetention: Number(onePagerConfig.minimumGeometryRetention ?? 0.9),
      requiredRootAttribute: `data-ccc-template-source="${template.referenceAsset}"`,
    },
    canvas: onePagerConfig.canvas,
    lockedElements: onePagerConfig.lockedElements,
    mutableElements: onePagerConfig.mutableElements,
    centralObject,
    sources,
    violations,
    warnings,
    prompt,
  };
}

export function validateOnePagerSvg(input: { svg: string; template?: OnePagerTemplateId; mode?: ValidationMode }) {
  const mode = input.mode ?? "final";
  const violations: string[] = [];
  const warnings: string[] = [];
  const rootTag = input.svg.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const viewBox = rootTag.match(/\bviewBox\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().replace(/\s+/g, " ");
  const templateId = input.svg.match(/data-ccc-one-pager-template=["'](material_cost_chain|access_barriers)["']/i)?.[1] as OnePagerTemplateId | undefined;
  const colors = svgColors(input.svg);
  const offPaletteColors = colors.filter((color) => !resolveColor(color));
  const fontFamilies = svgFontFamilies(input.svg);
  const allowedReferenceFamilies = new Set(["Montserrat", "Anton", "DM Mono", "Hind"]);
  const offReferenceFonts = fontFamilies.filter((family) => !allowedReferenceFamilies.has(family));
  const images = [...input.svg.matchAll(/<image\b[^>]*(?:href|xlink:href)\s*=\s*["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  const hasEmbeddedImages = images.length > 0 && images.every((href) => /^data:image\/(?:png|jpe?g|webp);base64,/i.test(href));
  const requiredRoles = ["one-pager-title", "one-pager-central-illustration", "one-pager-callouts", "one-pager-lead-stat", "one-pager-evidence-cards", "one-pager-takeaway", "one-pager-sources", "one-pager-logo"];
  const missingRoles = requiredRoles.filter((role) => !new RegExp(`data-ccc-role=["']${role}["']`, "i").test(input.svg));
  const hasPaletteAnchors = /#15192e/i.test(input.svg) && /#fff7(?:ef|f0)/i.test(input.svg) && /#e(?:95c1f|95d20|b5c20)/i.test(input.svg);
  const locked = /data-ccc-asset=["']one-pager["']/i.test(input.svg) && /data-ccc-layout-lock=["']one-pager-reference-exact["']/i.test(input.svg);
  const integrityTemplateId = templateId ?? input.template;
  const templateIntegrity = integrityTemplateId ? validateOnePagerTemplateIntegrity({ svg: input.svg, template: integrityTemplateId }) : undefined;
  const illustratorCompatibility = validateIllustratorSvg({ svg: input.svg, mode });
  const typographyContract = input.svg.match(/data-ccc-typography-contract=["']([^"']+)["']/i)?.[1];
  const componentGrid = /data-ccc-component-grid=["']reference-spaced["']/i.test(input.svg);
  const expectedTypeSpecs: Record<string, { family: string; weight: string; style: "normal" | "italic" }> = {
    "page-kicker": { family: "DM Mono", weight: "400", style: "normal" },
    "display-title": { family: "Anton", weight: "400", style: "normal" },
    "callout-title": { family: "Montserrat", weight: "700", style: "italic" },
    "callout-body": { family: "Montserrat", weight: "600", style: "normal" },
    "lead-stat": { family: "Anton", weight: "400", style: "normal" },
    "section-heading": { family: "Montserrat", weight: "800", style: "italic" },
    "evidence-number": { family: "Anton", weight: "400", style: "normal" },
    "evidence-body": { family: "Montserrat", weight: "600", style: "normal" },
    "takeaway-heading": { family: "Montserrat", weight: "700", style: "normal" },
    "takeaway-body": { family: "Montserrat", weight: "400", style: "normal" },
    source: { family: "DM Mono", weight: "400", style: "normal" },
  };
  const typeTags = [...input.svg.matchAll(/<text\b[^>]*data-ccc-type-role=["']([^"']+)["'][^>]*>/gi)].map((match) => ({ role: match[1], tag: match[0] }));
  const missingTypeRoles = Object.keys(expectedTypeSpecs).filter((role) => !typeTags.some((entry) => entry.role === role));
  const inconsistentTypeRoles: string[] = [];
  for (const [role, expected] of Object.entries(expectedTypeSpecs)) {
    const entries = typeTags.filter((entry) => entry.role === role);
    if (!entries.length) continue;
    const families = new Set(entries.map((entry) => attr(entry.tag, "font-family")?.split(",")[0]?.trim().replace(/^['"]|['"]$/g, "")));
    const weights = new Set(entries.map((entry) => (attr(entry.tag, "font-weight") ?? "400").toLowerCase()));
    const styles = new Set(entries.map((entry) => (attr(entry.tag, "font-style") ?? "normal").toLowerCase()));
    const sizes = new Set(entries.map((entry) => attr(entry.tag, "font-size")?.trim().toLowerCase().replace(/px$/, "")));
    if ([...families].some((family) => family !== expected.family) || families.size !== 1 || [...weights].some((weight) => weight !== expected.weight) || weights.size !== 1 || [...styles].some((style) => style !== expected.style) || styles.size !== 1 || sizes.has(undefined) || sizes.size !== 1) inconsistentTypeRoles.push(role);
  }
  const componentTags = [...input.svg.matchAll(/<g\b[^>]*data-ccc-component=["']([^"']+)["'][^>]*>/gi)].map((match) => {
    const bounds = attr(match[0], "data-ccc-bounds")?.split(/\s+/).map(Number) ?? [];
    const insets = attr(match[0], "data-ccc-text-inset")?.split(/\s+/).map(Number) ?? [];
    const textSafeBounds = attr(match[0], "data-ccc-text-safe-box")?.split(/\s+/).map(Number) ?? [];
    return { id: match[1], tag: match[0], bounds, insets, textSafeBounds };
  });
  const malformedComponents = componentTags.filter((entry) => entry.bounds.length !== 4 || !entry.bounds.every(Number.isFinite) || entry.insets.length !== 4 || !entry.insets.every(Number.isFinite) || (entry.insets.some((value) => value !== 0) && (entry.textSafeBounds.length !== 4 || !entry.textSafeBounds.every(Number.isFinite)))).map((entry) => entry.id);
  const unsafeTextComponents = componentTags.filter((entry) => {
    if (entry.textSafeBounds.length !== 4 || entry.bounds.length !== 4) return false;
    const [x, y, width, height] = entry.bounds;
    const [textX, textY, textWidth, textHeight] = entry.textSafeBounds;
    return textX < x || textY < y || textX + textWidth > x + width || textY + textHeight > y + height;
  }).map((entry) => entry.id);
  const crowdedComponents: string[] = [];
  for (let leftIndex = 0; leftIndex < componentTags.length; leftIndex += 1) {
    const left = componentTags[leftIndex];
    if (left.bounds.length !== 4) continue;
    const [lx, ly, lw, lh] = left.bounds;
    for (let rightIndex = leftIndex + 1; rightIndex < componentTags.length; rightIndex += 1) {
      const right = componentTags[rightIndex];
      if (right.bounds.length !== 4) continue;
      const [rx, ry, rw, rh] = right.bounds;
      const xOverlap = Math.min(lx + lw, rx + rw) - Math.max(lx, rx);
      const yOverlap = Math.min(ly + lh, ry + rh) - Math.max(ly, ry);
      const horizontalGap = Math.max(rx - (lx + lw), lx - (rx + rw));
      const verticalGap = Math.max(ry - (ly + lh), ly - (ry + rh));
      if ((xOverlap > 0 && yOverlap > 0) || (yOverlap > 0 && horizontalGap >= 0 && horizontalGap < 24) || (xOverlap > 0 && verticalGap >= 0 && verticalGap < 24)) crowdedComponents.push(`${left.id}/${right.id}`);
    }
  }
  const connectorBlocks = [...input.svg.matchAll(/<g\b[^>]*data-ccc-connector=["']shaft-arrowhead["'][^>]*>[\s\S]*?<\/g>/gi)].map((match) => match[0]);
  const badConnectors = connectorBlocks.filter((block) => {
    const shaft = block.match(/<path\b[^>]*stroke=["'](?:#(?:FFF7EF|E95C1F)|#(?:fff7ef|e95c1f))["'][^>]*>/i)?.[0] ?? "";
    const arrowheads = [...block.matchAll(/<(?:polygon|path)\b[^>]*fill=["'](?:#(?:FFF7EF|E95C1F)|#(?:fff7ef|e95c1f))["'][^>]*>/gi)];
    return !shaft || attr(shaft, "stroke-width") !== "3" || attr(shaft, "stroke-dasharray")?.trim() !== "6 7" || arrowheads.length !== 2;
  });
  if (!input.svg.trim().startsWith("<svg")) violations.push("One-pager is not a standalone SVG document.");
  if (viewBox !== onePagerConfig.canvas.viewBox) severityPush(mode, violations, warnings, `One-pager viewBox must remain exactly ${onePagerConfig.canvas.viewBox}; received ${viewBox || "missing"}.`);
  if (!templateId || (input.template && templateId !== input.template)) severityPush(mode, violations, warnings, "One-pager must declare the selected material_cost_chain or access_barriers template id.");
  if (!locked) severityPush(mode, violations, warnings, "One-pager must declare the strict one-pager reference layout lock.");
  if (!templateIntegrity?.ok) severityPush(mode, violations, warnings, templateIntegrity?.message ?? "One-pager must preserve the selected reference SVG geometry and declare its exact data-ccc-template-source.");
  if (typographyContract !== `${templateId}-reference`) severityPush(mode, violations, warnings, "One-pager must declare and follow the selected template-specific typography contract.");
  if (missingTypeRoles.length || inconsistentTypeRoles.length) severityPush(mode, violations, warnings, `One-pager typography roles must declare and use the reference font, weight, style, and one consistent size per repeated component${missingTypeRoles.length ? `; missing roles: ${missingTypeRoles.join(", ")}` : ""}${inconsistentTypeRoles.length ? `; inconsistent roles: ${inconsistentTypeRoles.join(", ")}` : ""}.`);
  if (!componentGrid || componentTags.length < 8 || malformedComponents.length || unsafeTextComponents.length) severityPush(mode, violations, warnings, `One-pager components must use the reference-spaced grid with explicit bounds, text insets, and contained text-safe boxes${malformedComponents.length ? `; malformed components: ${malformedComponents.join(", ")}` : ""}${unsafeTextComponents.length ? `; text-safe boxes outside components: ${unsafeTextComponents.join(", ")}` : ""}.`);
  if (crowdedComponents.length) severityPush(mode, violations, warnings, `One-pager components overlap or have less than the 24-unit reference gutter: ${[...new Set(crowdedComponents)].join(", ")}.`);
  if (connectorBlocks.length !== 3 || badConnectors.length) severityPush(mode, violations, warnings, "One-pager must include exactly three clean Illustrator-safe connector groups, each built from one 3-unit shaft with a 6 7 dash rhythm plus two compact vector arrowheads. SVG marker-only, detached, oversized, or inconsistent arrows are not accepted.");
  if (/\bmarker-(?:start|mid|end)\s*=/i.test(input.svg)) severityPush(mode, violations, warnings, "One-pager connectors must not rely on SVG markers; Illustrator can import the arrowhead without its guide line. Use explicit shaft and arrowhead geometry.");
  if (!hasPaletteAnchors || offPaletteColors.length) severityPush(mode, violations, warnings, `One-pager must preserve the CCC navy/orange/warm-white palette${offPaletteColors.length ? `; off-palette colors: ${offPaletteColors.join(", ")}` : ""}.`);
  if (offReferenceFonts.length) severityPush(mode, violations, warnings, `One-pager uses fonts outside the two supplied references: ${offReferenceFonts.join(", ")}.`);
  if (missingRoles.length) severityPush(mode, violations, warnings, `One-pager is missing locked content regions: ${missingRoles.join(", ")}.`);
  if (!hasEmbeddedImages) severityPush(mode, violations, warnings, "All contextual one-pager illustrations must be embedded base64 data:image assets; external or missing images are not accepted.");
  violations.push(...illustratorCompatibility.violations);
  warnings.push(...illustratorCompatibility.warnings);
  return { ok: violations.length === 0, mode, violations, warnings, templateId, viewBox, colors, fontFamilies, images: images.length, hasEmbeddedImages, hasPaletteAnchors, locked, templateIntegrity, missingRoles, illustratorCompatibility, typographyContract, missingTypeRoles, inconsistentTypeRoles, componentGrid, components: componentTags.length, malformedComponents, unsafeTextComponents, crowdedComponents: [...new Set(crowdedComponents)], connectors: connectorBlocks.length, badConnectors: badConnectors.length };
}

export function createGenerationPrompt(input: { request: string; outputType: "social_post" | "one_pager" | "video_graphic" | "policy_document" | "website_section" | "ad" | "general"; includeNegativePrompt: boolean }) {
  const lines = [
    `Create a ${input.outputType.replaceAll("_", " ")} for ${brand.brand.name}.`,
    `User request: ${input.request}`,
    "",
    "Strict CCC brand constraints:",
    ...brand.strictGenerationRules.map((rule: string) => `- ${rule}`),
    "",
    "Use only this palette:",
    ...colorEntries.map((entry) => `- ${entry.name}: ${entry.hex} (${entry.group})`),
    "",
    "Before composing social artwork, inspect brand://ccc/post-references. Treat those five files as the layout grammar, not merely as inspiration.",
    "Reference mapping: navy_poster -> reference 1; statistic_card -> reference 2; petition_push/orange_alert -> reference 3; contrast_cards -> reference 4; quote_post -> reference 5.",
    "Typography: preserve the native display face and type slots of the mapped reference. References 1, 2, 4, and 5 use Anton Regular; reference 3 uses Montserrat Bold. Never use SVG textLength/lengthAdjust because it creates viewer-dependent letter spacing. Montserrat supports statements, attributions, and body copy; DM Mono is for small labels and footer text.",
    "Visual composition: choose a CCC guide variant rather than reusing one generic template: navy_poster, petition_push, orange_alert, statistic_card, contrast_cards, or quote_post. Preserve the selected reference's coordinates, crop, headline rhythm, block treatment, icon paths, mark position, and footer placement.",
    "Watermark: use the actual nested-C CCC mark silhouette, cropped at the frame edge and filled with a subtle transparent brand-color gradient. Do not approximate it with circles or generic rings.",
    ...Object.entries(socialStyleVariants).map(([id, description]) => `- ${id}: ${description}`),
    "Large social headlines must use the mapped reference's native display face: Anton Regular for references 1, 2, and 4; Montserrat Bold for reference 3.",
    "A controlled two-field split is allowed only for contrast_cards because reference 4 explicitly uses it. Do not apply that split to other variants.",
    "Do not use full-height diagonal dividers, serif display type, off-palette colors, decorative gradients outside the CCC mark, invented logos, or generic iconography.",
    "Every downloadable SVG must use the Adobe Illustrator SVG 1.1 export contract: version=\"1.1\", xmlns:xlink, data-ccc-export=\"illustrator-svg-1.1\", xlink:href for embedded base64 raster images, installed editable CCC fonts instead of data:font web-font embedding, no nested data:image/svg+xml links, and no live SVG filters.",
    "Use packaged official logo SVG assets for final output. Default dark-field logo: logos/ccc-wide-orange.svg. Default orange/light-field logo: logos/ccc-wide-leila.svg.",
    "For quote_post, always use create_quote_post with one approved person from brand://ccc/quote-people. Preserve the supplied 1080x1350 template, its Anton font sizes, and its original 100/82/68px line rhythm. Keep copy in the left reference column and the measured face/body silhouette to its right; never place text over a person. Use the verified person-specific portrait width with only a small quote-length adjustment. Portraits must use xMaxYMax meet placement, remain fully visible without distortion, clipping, or source cropping, and be embedded directly in the SVG as a base64 data:image URI. Every quote must highlight at least one meaningful word in Autumn Orange. Never invent a portrait, name, title, or attribution.",
  ];
  if (input.outputType === "social_post") lines.push("", `Social format: ${brand.social.canonicalSize.widthPx}x${brand.social.canonicalSize.heightPx}px.`, `Footer must include: ${brand.social.requiredFooter}.`);
  if (input.outputType === "one_pager") lines.push("", createOnePagerBrief({ request: input.request }).prompt);
  if (input.includeNegativePrompt) lines.push("", "Negative prompt: AI-template look, small timid headline, unused empty frame, serif typography, Times/Georgia-style headlines, repeated generic clean navy composition, concentric circle watermark, generic rings, bubble decoration, full-height diagonal divider wedges, off-palette colors, unapproved fonts, decorative gradients outside the CCC mark, invented logo marks, distorted logo, stock iconography, generic corporate styling, dense infographic clutter.");
  return lines.join("\n");
}

function isPetitionAsk(input: { template: keyof typeof socialTemplates; headline: string; kicker?: string; body?: string; cta?: string }) {
  const copy = [input.template, input.headline, input.kicker, input.body, input.cta].filter(Boolean).join(" ");
  return /\b(petition|policymakers?|policy makers?|lawmakers?|legislators?|representatives?|mandates?|tell|sign|choice is not optional|protect consumer choice|do not restrict)\b/i.test(copy);
}

function isContrastAsk(input: { headline: string; kicker?: string; body?: string }) {
  const copy = [input.headline, input.kicker, input.body].filter(Boolean).join(" ");
  return /\b(vs\.?|versus|bad policy|good policy|compare|comparison|ban first|no mandates|yes to choice)\b/i.test(copy);
}

function selectSocialStyleVariant(input: { template: keyof typeof socialTemplates; headline: string; kicker?: string; body?: string; cta?: string }, requested?: SocialStyleVariant): Exclude<SocialStyleVariant, "auto"> {
  if (requested && requested !== "auto") return requested;
  if (input.template === "quote") return "quote_post";
  if (input.template === "statistic") return "statistic_card";
  if (isContrastAsk(input)) return "contrast_cards";
  if (isPetitionAsk(input)) return "petition_push";
  if (input.template === "policy_alert") return "orange_alert";
  return "navy_poster";
}

function stableVariation(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % 3;
}

function displayUnits(value: string) {
  return [...value.toUpperCase()].reduce((total, character) => total + (character === " " ? 0.32 : /[MW]/.test(character) ? 0.88 : /[I1'.:,]/.test(character) ? 0.3 : 0.58), 0);
}

function wrapDisplayWords(text: string, maxLines: number, maxUnits: number, minLines = 1) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || displayUnits(candidate) <= maxUnits || lines.length >= maxLines - 1) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  while (lines.length < Math.min(minLines, maxLines)) {
    let splitIndex = -1;
    let largestWordCount = 1;
    for (let index = 0; index < lines.length; index += 1) {
      const wordCount = lines[index].split(/\s+/).length;
      if (wordCount > largestWordCount) {
        largestWordCount = wordCount;
        splitIndex = index;
      }
    }
    if (splitIndex < 0) break;
    const words = lines[splitIndex].split(/\s+/);
    const midpoint = Math.ceil(words.length / 2);
    lines.splice(splitIndex, 1, words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" "));
  }
  return lines.slice(0, maxLines);
}

function antonLine(text: string, x: number, y: number, _width: number, size: number, fill: string, role = "display-line") {
  return `<text data-ccc-role="${role}" x="${Math.round(x)}" y="${Math.round(y)}" font-family="Anton" font-weight="400" font-size="${Math.round(size)}" fill="${fill}">${escapeXml(text.toUpperCase())}</text>`;
}

function referenceForVariant(variant: Exclude<SocialStyleVariant, "auto">) {
  if (variant === "navy_poster") return "reference-1";
  if (variant === "statistic_card") return "reference-2";
  if (variant === "contrast_cards") return "reference-4";
  if (variant === "quote_post") return "reference-5";
  return "reference-3";
}

function gradientWatermark(variant: Exclude<SocialStyleVariant, "auto">, variation: number) {
  const placements: Record<Exclude<SocialStyleVariant, "auto">, Array<{ x: number; y: number; width: number; height: number }>> = {
    navy_poster: [{ x: 650, y: 350, width: 650, height: 760 }, { x: -150, y: 620, width: 670, height: 790 }, { x: 590, y: 110, width: 720, height: 850 }],
    statistic_card: [{ x: 650, y: 120, width: 700, height: 830 }, { x: 520, y: 470, width: 760, height: 900 }, { x: -180, y: 520, width: 710, height: 840 }],
    petition_push: [{ x: 500, y: 80, width: 820, height: 970 }, { x: -260, y: 230, width: 760, height: 900 }, { x: 620, y: 390, width: 720, height: 850 }],
    orange_alert: [{ x: 500, y: 80, width: 820, height: 970 }, { x: -260, y: 230, width: 760, height: 900 }, { x: 620, y: 390, width: 720, height: 850 }],
    contrast_cards: [{ x: -220, y: 560, width: 720, height: 850 }, { x: 680, y: 30, width: 610, height: 720 }, { x: 240, y: 620, width: 690, height: 815 }],
    quote_post: [{ x: -120, y: 140, width: 720, height: 850 }, { x: -120, y: 140, width: 720, height: 850 }, { x: -120, y: 140, width: 720, height: 850 }],
  };
  const placement = placements[variant][variation];
  const isOrange = variant === "orange_alert" || variant === "petition_push";
  const start = isOrange ? getColor("marigold") : variant === "contrast_cards" ? getColor("brightTeal") : getColor("slateBlue");
  const end = isOrange ? getColor("autumnOrange") : getColor("leila");
  return `<defs>
    <linearGradient id="ccc-watermark-gradient" data-ccc-watermark-gradient="semi-transparent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${start}" stop-opacity="0.32"/>
      <stop offset="58%" stop-color="${end}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${end}" stop-opacity="0"/>
    </linearGradient>
    <symbol id="ccc-watermark-mark" viewBox="0 0 216 254">
      <path d="${CCC_MARK_PATH}" transform="translate(-299 -169)"/>
    </symbol>
  </defs>
  <g data-ccc-watermark="gradient-ccc-mark" data-ccc-watermark-gradient="semi-transparent" aria-label="Cropped gradient CCC mark watermark">
    <use href="#ccc-watermark-mark" x="${placement.x}" y="${placement.y}" width="${placement.width}" height="${placement.height}" fill="url(#ccc-watermark-gradient)" preserveAspectRatio="xMidYMid meet"/>
  </g>`;
}

type SocialSvgInput = {
  template: keyof typeof socialTemplates;
  headline: string;
  leadIn?: string;
  kicker?: string;
  body?: string;
  cta?: string;
  comparisonLeft?: string;
  comparisonRight?: string;
  person?: string;
  emphasis?: string;
  variation?: number;
  includeLogoPlaceholder: boolean;
  officialLogoHref?: string;
  assetBasePath?: string;
  mode: ValidationMode;
  styleVariant?: SocialStyleVariant;
};

function normalizeReferencePalette(svg: string) {
  const replacements: Array<[RegExp, string]> = [
    [/#161a2e/gi, "#22264E"],
    [/#15192e/gi, "#22264E"],
    [/#22274e/gi, "#22264E"],
    [/#21284e/gi, "#6F789B"],
    [/#e75e1f/gi, "#E95C1F"],
    [/#ea5c20/gi, "#E95C1F"],
    [/#eb5c20/gi, "#E95C1F"],
    [/#e95d20/gi, "#E95C1F"],
    [/#f07e25/gi, "#F4B544"],
    [/#fff7ef/gi, "#FFF7EF"],
    [/#fff7f0/gi, "#FFF7EF"],
    [/#e6ebf5/gi, "#E7ECF4"],
    [/#e8ecf5/gi, "#E7ECF4"],
    [/#9dd2c4/gi, "#9BD8C7"],
    [/#9ed2c4/gi, "#9BD8C7"],
    [/#04a8a8/gi, "#00A6A6"],
    [/#fff\b/gi, "#FFF7EF"],
  ];
  return replacements
    .reduce((result, [pattern, color]) => result.replace(pattern, color), svg)
    .replace(/stop-color="#F4B544"(?![^>]*stop-opacity)/g, 'stop-color="#F4B544" stop-opacity="0.42"')
    .replace(/stop-color="#6F789B"(?![^>]*stop-opacity)/g, 'stop-color="#6F789B" stop-opacity="0.3"')
    .replace(/DMMono-(?:Regular|Medium)/g, "DM Mono")
    .replace(/Montserrat-(?:Bold|Medium)/g, "Montserrat")
    .replace(/Anton-Regular/g, "Anton");
}

function normalizeQuoteReferencePalette(svg: string) {
  const quoteNight = getColor(quotePostConfig.backgroundColor);
  const quoteWatermark = getColor(quotePostConfig.watermarkColor);
  return normalizeReferencePalette(svg
    .replace(/#15192e/gi, "__CCC_QUOTE_NIGHT__")
    .replace(/#22274e/gi, "__CCC_QUOTE_WATERMARK__"))
    .replaceAll("__CCC_QUOTE_NIGHT__", quoteNight)
    .replaceAll("__CCC_QUOTE_WATERMARK__", quoteWatermark);
}

function fitReferenceSize(value: string, baseSize: number, maxUnits: number, minimumScale = 0.76) {
  const units = Math.max(0.1, displayUnits(value));
  return Math.round(baseSize * Math.max(minimumScale, Math.min(1, maxUnits / units)) * 100) / 100;
}

function referenceText(value: string, x: number, y: number, family: "Anton" | "Montserrat" | "DM Mono", size: number, fill: string, weight = 400, role?: string) {
  return `<text${role ? ` data-ccc-role="${role}"` : ""} x="${x}" y="${y}" font-family="${family}" font-weight="${weight}" font-size="${size}" fill="${fill}">${escapeXml(value)}</text>`;
}

function splitReferenceThreeLineHeadline(value: string) {
  const words = value.trim().replace(/\.$/, "").split(/\s+/).filter(Boolean);
  if (words.length === 4 && words[1]?.toLowerCase() === "is" && /^(?:not|never)$/i.test(words[2] ?? "")) return [words[0], `${words[1]} ${words[2]}`, `${words[3]}.`];
  const lines = wrapDisplayWords(value, 3, 5.25, Math.min(3, words.length));
  if (lines.length) lines[lines.length - 1] = lines[lines.length - 1].replace(/\.?$/, ".");
  return lines;
}

function referenceOverlay(input: SocialSvgInput, variant: Exclude<SocialStyleVariant, "auto">) {
  const white = getColor("warmWhite");
  const baseWhite = white;
  const orange = getColor("autumnOrange");
  const navy = getColor("leila");
  const mint = getColor("softMint");
  if (variant === "navy_poster") {
    const words = input.headline.trim().split(/\s+/).filter(Boolean).length;
    const lines = wrapDisplayWords(input.headline, 4, 5.3, Math.min(4, words));
    const emphasis = Math.max(0, lines.findIndex((line) => /better|choice|freedom|protect|win/i.test(line)));
    return `<g data-ccc-role="reference-headline">${lines.map((line, index) => referenceText(line.toUpperCase(), 19.57, 147.7 + index * 76.69, "Anton", fitReferenceSize(line, 71.54, 5.3), index === emphasis ? orange : white, 400)).join("")}</g>
      ${referenceText((input.kicker || "POLICY").toUpperCase(), 19.57, 26.59, "DM Mono", 8.7, mint)}
      ${referenceText(brand.social.requiredFooter, 21.53, 452.02, "DM Mono", 8.7, white)}`;
  }
  if (variant === "statistic_card") {
    const match = input.headline.trim().match(/^(\$?\d[\d.,]*[%+A-Za-z]?)(?:\s+(.+))?$/);
    const statistic = match?.[1] ?? input.headline.trim().split(/\s+/)[0];
    const statement = match?.[2] ?? "of consumers say regulation limits choice";
    const statementLines = wrapWords(statement, 29).slice(0, 2);
    const bodyLines = wrapWords(input.body || "Policy should target harm, not restrict consumer choice.", 28).slice(0, 2);
    return `${referenceText((input.kicker || "CONSUMER VOICE").toUpperCase(), 19.57, 26.59, "DM Mono", 8.7, mint)}
      <g data-ccc-role="reference-headline">${referenceText(statistic.toUpperCase(), 24.99, 240.63, "Anton", fitReferenceSize(statistic, 159.61, 3.15), orange, 400)}</g>
      ${statementLines.map((line, index) => referenceText(line, 26.08, 284.87 + index * 29.34, "Montserrat", fitReferenceSize(line, 27.37, 16.4), baseWhite, 700)).join("")}
      ${bodyLines.map((line, index) => referenceText(line, 40.18, 364.92 + index * 18.8, "Montserrat", fitReferenceSize(line, 15.67, 15.3), getColor("coolMist"), 500)).join("")}
      ${referenceText(brand.social.requiredFooter, 21.53, 452.02, "DM Mono", 8.7, white)}`;
  }
  if (variant === "petition_push" || variant === "orange_alert") {
    let mainHeadline = input.headline.trim();
    let leadIn = input.leadIn?.trim();
    if (!leadIn && mainHeadline.includes(":")) {
      const [candidate, ...rest] = mainHeadline.split(":");
      if (candidate.trim().split(/\s+/).length <= 4 && rest.join(":").trim()) {
        leadIn = `${candidate.trim()}:`;
        mainHeadline = rest.join(":").trim();
      }
    }
    leadIn ||= "TELL YOUR LAWMAKERS:";
    const leadLines = wrapDisplayWords(leadIn, 2, 6.7, 2);
    const headlineLines = splitReferenceThreeLineHeadline(mainHeadline);
    const actionCopy = wrapWords(input.body || (variant === "petition_push" ? "Push for smarter rules." : "Make consumer choice heard."), 29).slice(0, 1);
    return `${referenceText((input.kicker || "POLICY ALERT").toUpperCase(), 37.19, 77.1, "DM Mono", 21.88, orange, 400)}
      <g data-ccc-role="reference-headline">${leadLines.map((line, index) => referenceText(line.toUpperCase(), 25.18, 143.38 + index * 45.21, "Montserrat", fitReferenceSize(line, 42.18, 6.7), baseWhite, 700)).join("")}
      ${headlineLines.map((line, index) => referenceText(line.toUpperCase(), 25.18, 240.63 + index * 47.52, "Montserrat", fitReferenceSize(line, 50.79, index === 2 ? 5.65 : 4.8), index === 1 ? orange : baseWhite, 700)).join("")}</g>
      <g data-ccc-role="action-band" data-ccc-role-icon="reference-megaphone">${referenceText(input.cta || (variant === "petition_push" ? "Sign the petition" : "Take action"), 85.18, 378.91, "Montserrat", 15.67, getColor("coolMist"), 500)}
      ${actionCopy.map((line, index) => referenceText(line, 85.18, 397.71 + index * 18.8, "Montserrat", fitReferenceSize(line, 15.67, 13.2), getColor("coolMist"), 500)).join("")}</g>
      ${referenceText(brand.social.requiredFooter, 21.53, 457.49, "DM Mono", 8.7, white)}`;
  }
  const leftCopy = wrapWords(input.comparisonLeft || input.body?.split("|")[0] || "Ban first. Ask questions later.", 12).slice(0, 4);
  const rightCopy = wrapWords(input.comparisonRight || input.body?.split("|")[1] || "Regulate risk. Protect choice.", 12).slice(0, 3);
  return `${referenceText((input.kicker || "POLICY").toUpperCase(), 19.57, 26.59, "DM Mono", 8.7, mint)}
    <g data-ccc-role="reference-headline">${referenceText("BAD", 16.01, 137.15, "Anton", 89.32, white)}${referenceText("POLICY", 16.01, 213.84, "Anton", 64.31, orange)}${referenceText("GOOD", 202.3, 137.15, "Anton", 89.32, getColor("brightTeal"))}${referenceText("POLICY", 202.3, 213.84, "Anton", 64.31, navy)}</g>
    <g data-ccc-role="contrast-cards">${leftCopy.map((line, index) => referenceText(line, 76.55, 286.12 + index * 15.07, "Montserrat", 14.06, white, 500)).join("")}${rightCopy.map((line, index) => referenceText(line, 264.38, 292.99 + index * 15.07, "Montserrat", 14.06, navy, 500)).join("")}</g>
    ${referenceText("WE KNOW", 83.68, 407.26, "Anton", 28.54, white)}${referenceText((input.cta || "OUR CHOICE").toUpperCase(), 63.22, 440.19, "Anton", 28.54, orange)}${referenceText("DO", 201.56, 407.49, "Anton", 28.54, navy)}${referenceText("YOU?", 201.56, 440.42, "Anton", 28.54, getColor("brightTeal"))}
    ${referenceText(brand.social.requiredFooter, 226.76, 463.18, "DM Mono", 8.7, getColor("brightTeal"))}`;
}

function svgAssetToHref(fileName: string, basePath?: string) {
  const path = resolve(getAssetBase(basePath), fileName);
  if (!existsSync(path)) return undefined;
  const svg = readFileSync(path, "utf8");
  const embeddedRaster = svg.match(/(?:href|xlink:href)=["'](data:image\/(?:png|jpe?g|webp);base64,[^"']+)["']/i)?.[1];
  return embeddedRaster ?? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const quoteEmphasisIgnored = new Set(["about", "after", "again", "against", "because", "before", "being", "choice", "could", "every", "from", "have", "into", "make", "more", "not", "should", "that", "their", "them", "there", "these", "they", "this", "those", "through", "under", "when", "where", "which", "while", "with", "would"]);

function defaultQuoteEmphasis(quote: string) {
  const words = quote.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  return [...words].reverse().find((word) => word.length >= 5 && !quoteEmphasisIgnored.has(word.toLowerCase())) ?? words.at(-1) ?? "";
}

function resolveQuoteEmphasis(quote: string, requested?: string) {
  const quoteLower = quote.toLocaleLowerCase();
  const requestedPhrase = requested?.trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "") ?? "";
  const phraseIndex = requestedPhrase ? quoteLower.indexOf(requestedPhrase.toLocaleLowerCase()) : -1;
  if (phraseIndex >= 0 && requestedPhrase.split(/\s+/).length <= 4 && requestedPhrase.length >= 4) {
    return quote.slice(phraseIndex, phraseIndex + requestedPhrase.length);
  }
  const requestedWords = requested?.match(/[\p{L}\p{N}'’-]+/gu) ?? [];
  const requestedWord = [...requestedWords]
    .sort((left, right) => right.length - left.length)
    .find((word) => word.length >= 4 && !quoteEmphasisIgnored.has(word.toLocaleLowerCase()) && quoteLower.includes(word.toLocaleLowerCase()));
  return requestedWord ?? defaultQuoteEmphasis(quote);
}

function quoteLayout(quote: string) {
  const length = quote.length;
  const settings = length <= 88
    ? { maxChars: 23, fontSize: 65, lineGap: 100, firstY: 347.2 }
    : length <= 118
      ? { maxChars: 22, fontSize: 56, lineGap: 82, firstY: 320 }
      : { maxChars: 22, fontSize: 49, lineGap: 68, firstY: 302 };
  const lines = wrapWords(quote, settings.maxChars);
  if (lines.length > quotePostConfig.quoteMaxLines) throw new Error(`Quote does not fit the supplied template. Use ${quotePostConfig.quoteMaxLines} lines or fewer and no more than ${quotePostConfig.quoteMaxCharacters} characters.`);
  const lineGap = settings.lineGap;
  const firstY = Math.min(settings.firstY, 647.2 - (lines.length - 1) * lineGap);
  if (firstY < 230) throw new Error(`Quote does not fit the supplied template's Anton line rhythm. Shorten the quote or use fewer than ${quotePostConfig.quoteMaxLines} lines.`);
  const lastY = firstY + (lines.length - 1) * lineGap;
  const attributionNameY = Math.min(756.77, lastY + 109.57);
  const attributionTitleY = attributionNameY + 33.27;
  return { ...settings, firstY, lineGap, lastY, lines, attributionNameY, attributionTitleY };
}

function quoteLineMarkup(line: string, emphasis: string) {
  if (!emphasis) return escapeXml(line);
  const index = line.toLocaleLowerCase().indexOf(emphasis.toLocaleLowerCase());
  if (index < 0) return escapeXml(line);
  const before = line.slice(0, index);
  const match = line.slice(index, index + emphasis.length);
  const after = line.slice(index + emphasis.length);
  return `${escapeXml(before)}<tspan data-ccc-role="quote-emphasis" fill="${getColor("autumnOrange")}">${escapeXml(match)}</tspan>${escapeXml(after)}`;
}

export function createQuotePostSvg(input: {
  quote: string;
  person: string;
  emphasis?: string;
  officialLogoHref?: string;
  assetBasePath?: string;
  mode?: ValidationMode;
}) {
  const mode = input.mode ?? "draft";
  const cleanQuote = input.quote.trim().replace(/^[“”"']+|[“”"']+$/g, "").trim();
  if (!cleanQuote) throw new Error("Quote text is required.");
  if (cleanQuote.length > quotePostConfig.quoteMaxCharacters) throw new Error(`Quote is ${cleanQuote.length} characters; the supplied template supports at most ${quotePostConfig.quoteMaxCharacters}.`);
  const person = resolveQuotePerson(input.person);
  if (!person) throw new Error(`Unknown CCC quote person "${input.person}". Choose one of: ${quotePeople.map((entry) => `${entry.id} (${entry.fullName})`).join(", ")}.`);

  const templatePath = resolve(getAssetBase(input.assetBasePath), quotePostConfig.templateAsset);
  if (!existsSync(templatePath)) throw new Error(`Quote post template is missing: ${quotePostConfig.templateAsset}.`);
  const portraitHref = svgAssetToHref(person.portraitFile, input.assetBasePath);
  const selectedLogoHref = input.officialLogoHref ?? selectDefaultLogoHref("dark", input.assetBasePath);
  const logoCheck = validateLogoHref(selectedLogoHref, input.assetBasePath);
  const fontPolicy = illustratorFontPolicy(true);
  const requiredRenderFonts = ["fonts/Anton-Regular.ttf", "fonts/Montserrat-Bold.ttf", "fonts/Montserrat-Medium.ttf", "fonts/DMMono-Regular.ttf"];
  const missingRenderFonts = requiredRenderFonts.filter((fileName) => !existsSync(resolve(getAssetBase(input.assetBasePath), fileName)));
  const layoutSpec = quoteLayout(cleanQuote);
  const selectedEmphasis = resolveQuoteEmphasis(cleanQuote, input.emphasis).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  if (!selectedEmphasis) throw new Error("Quote posts require at least one word that can be highlighted in Autumn Orange.");
  const quoteLines = layoutSpec.lines.map((line, index) => {
    const opening = index === 0 ? "“" : "";
    const closing = index === layoutSpec.lines.length - 1 ? "”" : "";
    return `<text x="54.78" y="${Math.round((layoutSpec.firstY + index * layoutSpec.lineGap) * 100) / 100}" font-family="Anton" font-weight="400" font-size="${layoutSpec.fontSize}" fill="${getColor("coolMist")}">${opening}${quoteLineMarkup(line, selectedEmphasis)}${closing}</text>`;
  }).join("");
  if (!/data-ccc-role="quote-emphasis"/.test(quoteLines)) throw new Error("Quote emphasis could not be placed. Supply a word that appears in the quote.");
  const titleSize = Math.round(Math.max(20, Math.min(31.33, 31.33 * (28 / person.title.length))) * 100) / 100;
  const { attributionNameY, attributionTitleY } = layoutSpec;
  const portraitWidth = Math.min(person.portraitReferenceMaxWidth, person.portraitReferenceWidth + Math.max(0, 7 - layoutSpec.lines.length) * 12);
  const portraitBox = { x: 1080 - portraitWidth, y: 350, width: portraitWidth, height: 1000 };
  const portrait = portraitHref
    ? `<g data-ccc-role="quote-portrait" data-ccc-portrait-contained="true" data-ccc-portrait-embedded="true" data-ccc-portrait-href-kind="embedded-data-uri" data-ccc-portrait-scale="reference-proportional"><image xlink:href="${escapeXml(portraitHref)}" x="${portraitBox.x}" y="${portraitBox.y}" width="${portraitBox.width}" height="${portraitBox.height}" preserveAspectRatio="${person.portraitFit}"/></g>`
    : "";

  const quoteNight = getColor(quotePostConfig.backgroundColor);
  const quoteWatermark = getColor(quotePostConfig.watermarkColor);
  let svg = normalizeQuoteReferencePalette(readFileSync(templatePath, "utf8"))
    .replace(/<image\b[^>]*\/>/gi, "")
    .replace(/<text\b[\s\S]*?<\/text>/gi, "");
  const rootMetadata = ` data-ccc-style="guide-social" data-ccc-layout-lock="reference-exact" data-ccc-variant="quote_post" data-ccc-reference-system="reference-5" data-ccc-variation="0" data-ccc-density="medium" data-ccc-watermark-source="packaged-reference" data-ccc-quote-background="${quoteNight}" data-ccc-quote-watermark-color="${quoteWatermark}" data-ccc-quote-safe-zones="reference-columns" data-ccc-quote-line-count="${layoutSpec.lines.length}" data-ccc-quote-text-bottom="${layoutSpec.lastY}" data-ccc-quote-text-column-right="520" data-ccc-portrait-face-safe-left="490" data-ccc-portrait-safe-top="${portraitBox.y}" data-ccc-portrait-width="${portraitBox.width}" data-ccc-portrait-height="${portraitBox.height}" data-ccc-portrait-policy="contain-no-crop" data-ccc-portrait-scale="reference-proportional" data-ccc-portrait-embedded="true" data-ccc-emphasis-required="true" data-ccc-has-action-band="false" data-ccc-has-stacked-blocks="false" data-ccc-has-petition-marker="false" data-ccc-has-large-stat="false" data-ccc-has-contrast-cards="false" data-ccc-has-quote-portrait="true" data-ccc-quote-person="${person.id}" data-ccc-portrait-file="${escapeXml(person.portraitFile)}" data-ccc-logo-href="${escapeXml(logoCheck.approvedPath || selectedLogoHref || "")}" width="1080" height="1350" role="img" aria-label="CCC quote from ${escapeXml(person.fullName)}"`;
  svg = svg.replace(/<svg\b([^>]*)>/i, `<svg$1${rootMetadata}>`);
  svg = svg.replace(/<g class="cls-3">/i, `<g class="cls-3" data-ccc-role="quote-watermark" data-ccc-watermark="cropped-ccc-mark">`);
  svg = svg.replace(/<\/svg>\s*$/i, `${fontPolicy}${portrait}<g data-ccc-role="reference-headline">${quoteLines}</g><g data-ccc-role="quote-attribution"><text x="55.46" y="${attributionNameY}" font-family="Montserrat" font-weight="700" font-size="48.08" fill="${getColor("baseWhite")}">${escapeXml(person.fullName)}</text><text x="55.46" y="${attributionTitleY}" font-family="Montserrat" font-weight="700" font-size="${titleSize}" fill="${getColor("autumnOrange")}">${escapeXml(person.title)}</text></g></svg>`);
  svg = makeIllustratorSafeSvg(svg);

  const layout = qaSocialLayout({ template: "quote", headline: cleanQuote, mode });
  const validation = validateSpec({
    colors: [quoteNight, quoteWatermark, getColor("autumnOrange"), getColor("warmWhite"), getColor("baseWhite"), getColor("coolMist")],
    fonts: ["Anton Regular", "Montserrat Bold", "Montserrat Medium", "DM Mono Regular"],
    assetType: "social",
    mode,
    widthPx: 1080,
    heightPx: 1350,
    usesLogo: true,
    officialLogoHref: selectedLogoHref,
    assetBasePath: input.assetBasePath,
    referenceExact: true,
  });
  if (!portraitHref || !(assetManifest.quotePeoplePortraits ?? []).includes(person.portraitFile)) severityPush(mode, validation.violations, validation.warnings, `Approved quote portrait is missing or not listed in assets/manifest.json: ${person.portraitFile}.`);
  if (missingRenderFonts.length) severityPush(mode, validation.violations, validation.warnings, `Required packaged editable fonts are missing: ${missingRenderFonts.join(", ")}.`);
  validation.violations.push(...layout.violations);
  validation.warnings.push(...layout.warnings);
  const artifactValidation = validateSvgArtifact({ svg, assetType: "social", mode, assetBasePath: input.assetBasePath });
  validation.violations.push(...artifactValidation.violations);
  validation.warnings.push(...artifactValidation.warnings);
  validation.ok = validation.violations.length === 0;
  return { validation, layout, artifactValidation, selectedLogoHref, styleVariant: "quote_post" as const, variation: 0, referenceSystem: "reference-5" as const, layoutLock: "reference-exact" as const, person, emphasis: selectedEmphasis, svg };
}

function referenceLockedSocialSvg(input: SocialSvgInput) {
  const styleVariant = selectSocialStyleVariant(input, input.styleVariant);
  if (styleVariant === "quote_post") {
    if (!input.person) throw new Error(`Quote posts require a person. Choose one of: ${quotePersonIds.join(", ")}.`);
    return createQuotePostSvg({ quote: input.headline, person: input.person, emphasis: input.emphasis, officialLogoHref: input.officialLogoHref, assetBasePath: input.assetBasePath, mode: input.mode });
  }
  const referenceSystem = referenceForVariant(styleVariant);
  const referenceNumber = Number(referenceSystem.slice(-1));
  const referencePath = resolve(__dirname, `../assets/post-references/ccc-post-reference-${referenceNumber}.svg`);
  const selectedLogoHref = input.officialLogoHref ?? selectDefaultLogoHref("dark", input.assetBasePath);
  const logoCheck = validateLogoHref(selectedLogoHref, input.assetBasePath);
  const fontPolicy = illustratorFontPolicy(true);
  const requiredRenderFonts = ["fonts/Anton-Regular.ttf", "fonts/Montserrat-Bold.ttf", "fonts/Montserrat-Medium.ttf", "fonts/DMMono-Regular.ttf"];
  const missingRenderFonts = requiredRenderFonts.filter((fileName) => !existsSync(resolve(getAssetBase(input.assetBasePath), fileName)));
  const density = styleVariant === "petition_push" ? "high" : styleVariant === "navy_poster" ? "medium" : "dense";
  let svg = normalizeReferencePalette(readFileSync(referencePath, "utf8")).replace(/<text\b[\s\S]*?<\/text>/gi, "");
  const rootMetadata = ` data-ccc-style="guide-social" data-ccc-layout-lock="reference-exact" data-ccc-variant="${styleVariant}" data-ccc-reference-system="${referenceSystem}" data-ccc-variation="0" data-ccc-density="${density}" data-ccc-watermark-source="packaged-reference" data-ccc-has-action-band="${styleVariant === "petition_push" || styleVariant === "orange_alert"}" data-ccc-has-stacked-blocks="${styleVariant === "petition_push" || styleVariant === "orange_alert"}" data-ccc-has-petition-marker="${styleVariant === "petition_push"}" data-ccc-has-large-stat="${styleVariant === "statistic_card"}" data-ccc-has-contrast-cards="${styleVariant === "contrast_cards"}" data-ccc-logo-href="${escapeXml(logoCheck.approvedPath || selectedLogoHref || "")}" width="1080" height="1350"`;
  svg = svg.replace(/<svg\b([^>]*)>/i, `<svg$1${rootMetadata}>`);
  svg = svg.replace(/<\/svg>\s*$/i, `${fontPolicy}${referenceOverlay(input, styleVariant)}</svg>`);
  svg = makeIllustratorSafeSvg(svg);
  const layout = qaSocialLayout({ template: input.template, headline: input.headline, body: input.body ?? "", cta: input.cta, mode: input.mode });
  const palette = styleVariant === "contrast_cards"
    ? [getColor("leila"), getColor("warmWhite"), getColor("autumnOrange"), getColor("brightTeal"), getColor("baseWhite")]
    : [getColor("leila"), getColor("autumnOrange"), getColor("warmWhite"), getColor("baseWhite"), styleVariant === "statistic_card" ? getColor("softMint") : getColor("coolMist")];
  const validation = validateSpec({ colors: palette, fonts: ["Anton Regular", "Montserrat Bold", "Montserrat Medium", "DM Mono Regular"], assetType: "social", mode: input.mode, widthPx: 1080, heightPx: 1350, usesLogo: true, officialLogoHref: selectedLogoHref, assetBasePath: input.assetBasePath });
  if (missingRenderFonts.length) severityPush(input.mode, validation.violations, validation.warnings, `Required packaged editable fonts are missing: ${missingRenderFonts.join(", ")}.`);
  validation.violations.push(...layout.violations);
  validation.warnings.push(...layout.warnings);
  const artifactValidation = validateSvgArtifact({ svg, assetType: "social", mode: input.mode, assetBasePath: input.assetBasePath });
  validation.violations.push(...artifactValidation.violations);
  validation.warnings.push(...artifactValidation.warnings);
  validation.ok = validation.violations.length === 0;
  return { validation, layout, artifactValidation, selectedLogoHref, styleVariant, variation: 0, referenceSystem, layoutLock: "reference-exact", svg };
}

function createLegacySocialRenderer(input: SocialSvgInput) {
  const isLowerThird = input.template === "lower_third";
  const width = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.widthPx : brand.social.canonicalSize.widthPx;
  const height = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.heightPx : brand.social.canonicalSize.heightPx;
  const styleVariant = selectSocialStyleVariant(input, input.styleVariant);
  const variation = input.variation === undefined ? stableVariation([input.headline, input.kicker, input.body, input.cta].filter(Boolean).join("|")) : Math.max(0, Math.min(2, Math.trunc(input.variation)));
  const referenceSystem = referenceForVariant(styleVariant);
  const isAlert = styleVariant === "orange_alert" || styleVariant === "petition_push";
  const bg = isAlert ? getColor("autumnOrange") : getColor("leila");
  const accent = getColor("autumnOrange");
  const selectedLogoHref = input.officialLogoHref ?? selectDefaultLogoHref(isLowerThird ? "light" : "dark", input.assetBasePath);
  const logoCheck = validateLogoHref(selectedLogoHref, input.assetBasePath);
  const fontPolicy = illustratorFontPolicy(!isLowerThird);
  const requiredRenderFonts = [
    ...(!isLowerThird ? ["fonts/Anton-Regular.ttf"] : []),
    "fonts/Montserrat-Bold.ttf",
    "fonts/Montserrat-Medium.ttf",
    "fonts/DMMono-Regular.ttf",
  ];
  const missingRenderFonts = requiredRenderFonts.filter((fileName) => !existsSync(resolve(getAssetBase(input.assetBasePath), fileName)));
  const renderLogo = (x: number, y: number, logoWidth = 230, logoHeight = 82) => logoCheck.ok && logoCheck.approvedPath
    ? inlineLogoSvg(logoCheck, x, y, logoWidth, logoHeight, input.assetBasePath) ?? ""
    : input.includeLogoPlaceholder && input.mode !== "final"
      ? `<g aria-label="Official CCC logo placeholder"><rect x="${x}" y="${y}" width="${logoWidth}" height="${logoHeight}" fill="none" stroke="${accent}" stroke-width="4"/></g>`
      : "";
  const layout = qaSocialLayout({ template: input.template, headline: input.headline, body: input.body ?? "", cta: input.cta, mode: input.mode });
  if (isLowerThird) {
    const lowerLines = wrapWords(input.headline, 34).slice(0, 2);
    const lowerSvg = makeIllustratorSafeSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC lower third">
      ${fontPolicy}
      <rect width="${width}" height="${height}" fill="${getColor("coolMist")}"/>
      <rect x="0" y="760" width="${width}" height="320" fill="${getColor("leila")}"/>
      <rect x="0" y="760" width="28" height="320" fill="${accent}"/>
      <text x="96" y="830" font-family="DM Mono" font-size="24" fill="${getColor("softMint")}">${escapeXml(input.kicker || socialTemplates.lower_third.label).toUpperCase()}</text>
      ${lowerLines.map((line, index) => `<text x="96" y="${910 + index * 76}" font-family="Montserrat" font-weight="700" font-size="64" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n")}
      ${renderLogo(width - 360, 830, 270, 94)}
    </svg>`);
    const validation = validateSpec({ colors: [getColor("coolMist"), getColor("leila"), accent, getColor("baseWhite"), getColor("softMint")], fonts: ["Montserrat Bold", "DM Mono Regular"], assetType: "video", mode: input.mode, widthPx: width, heightPx: height, usesLogo: true, officialLogoHref: selectedLogoHref, assetBasePath: input.assetBasePath });
    if (missingRenderFonts.length) severityPush(input.mode, validation.violations, validation.warnings, `Required packaged editable fonts are missing: ${missingRenderFonts.join(", ")}.`);
    validation.violations.push(...layout.violations);
    validation.warnings.push(...layout.warnings);
    const artifactValidation = validateSvgArtifact({ svg: lowerSvg, assetType: "video", mode: input.mode, assetBasePath: input.assetBasePath });
    validation.violations.push(...artifactValidation.violations);
    validation.warnings.push(...artifactValidation.warnings);
    validation.ok = validation.violations.length === 0;
    return { validation, layout, artifactValidation, selectedLogoHref, styleVariant, variation, referenceSystem, svg: lowerSvg };
  }

  const headlineWordCount = input.headline.trim().split(/\s+/).filter(Boolean).length;
  const minimumDisplayLines = styleVariant === "navy_poster" || isAlert ? Math.min(4, headlineWordCount) : 1;
  let headlineLines = wrapDisplayWords(input.headline, 4, isAlert ? 11.5 : styleVariant === "navy_poster" ? 10.8 : 13.5, minimumDisplayLines);
  const headlineWords = input.headline.trim().split(/\s+/).filter(Boolean);
  if (isAlert && headlineWords.length === 4 && headlineWords[1].toLowerCase() === "is" && headlineWords[2].toLowerCase() === "not") {
    headlineLines = [headlineWords[0], `${headlineWords[1]} ${headlineWords[2]}`, headlineWords[3]];
  }
  const bodyLines = wrapWords(input.body ?? "", 38).slice(0, 4);
  const watermark = gradientWatermark(styleVariant, variation);
  const hasActionBand = isAlert;
  const hasStackedBlocks = ["petition_push", "orange_alert"].includes(styleVariant);
  const density = styleVariant === "petition_push" ? "high" : styleVariant === "navy_poster" ? "medium" : "dense";
  let backgroundSvg = `<rect width="${width}" height="${height}" fill="${bg}"/>`;
  let contentSvg = "";
  let palette = [bg, accent, getColor("baseWhite")];

  if (styleVariant === "navy_poster") {
    const displaySize = headlineLines.length >= 4 ? 146 : 164;
    const lineGap = headlineLines.length >= 4 ? 164 : 184;
    const firstY = headlineLines.length >= 4 ? 270 : 330;
    const widths = [936, 872, 936, 820];
    const display = headlineLines.map((line, index) => {
      const x = variation === 2 && index % 2 === 1 ? 118 : 72;
      const maxWidth = width - x - 54;
      return antonLine(line, x, firstY + index * lineGap, Math.min(maxWidth, widths[(index + variation) % widths.length]), displaySize, index === headlineLines.length - 1 ? accent : getColor("warmWhite"), "frame-filling-headline");
    }).join("\n");
    const lastY = firstY + Math.max(0, headlineLines.length - 1) * lineGap;
    const copyY = Math.min(1000, lastY + 104);
    const support = bodyLines.slice(0, headlineLines.length >= 4 ? 2 : 3).map((line, index) => `<text x="96" y="${copyY + index * 44}" font-family="Montserrat" font-weight="${index === 0 ? 700 : 500}" font-size="34" fill="${getColor("warmWhite")}">${escapeXml(line)}</text>`).join("\n");
    const ctaY = copyY + Math.max(1, Math.min(bodyLines.length, 3)) * 44 + 34;
    const cta = input.cta && ctaY < 1140 ? `<text x="72" y="${ctaY}" font-family="Montserrat" font-weight="700" font-size="34" fill="${accent}">${escapeXml(input.cta).toUpperCase()}</text>` : "";
    contentSvg = `${renderLogo(width - 316, 48, 244, 86)}
      <text x="72" y="72" font-family="DM Mono" font-size="19" fill="${getColor("softMint")}">${escapeXml(input.kicker || socialTemplates[input.template].label).toUpperCase()}</text>
      <rect x="72" y="94" width="48" height="8" fill="${accent}"/>
      <g data-ccc-role="reference-headline">${display}</g>
      <path d="M72 ${lastY + 34} C310 ${lastY + 12} 530 ${lastY + 16} 720 ${lastY + 34}" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
      ${support ? `<rect x="72" y="${copyY - 30}" width="8" height="${Math.max(76, Math.min(bodyLines.length, 3) * 44)}" fill="${accent}"/>${support}` : ""}
      ${cta}
      <line x1="72" y1="1206" x2="1008" y2="1206" stroke="${getColor("softMint")}" stroke-width="3"/>
      <text x="72" y="1280" font-family="DM Mono" font-size="18" fill="${getColor("warmWhite")}">${brand.social.requiredFooter}</text>`;
    palette = [bg, accent, getColor("warmWhite"), getColor("softMint"), getColor("slateBlue")];
  } else if (styleVariant === "statistic_card") {
    const normalized = input.headline.trim();
    const leadMatch = normalized.match(/^(\$?\d[\d.,]*[%+A-Za-z]?)(?:\s+(.+))?$/);
    const lead = leadMatch?.[1] ?? headlineLines[0] ?? normalized;
    const statement = leadMatch?.[2] ?? headlineLines.slice(1).join(" ");
    const statementLines = wrapWords(statement, 29).slice(0, 3);
    const leadWidth = variation === 1 ? 920 : variation === 2 ? 760 : 840;
    const statementY = 650;
    const supportY = 870;
    contentSvg = `<text x="72" y="72" font-family="DM Mono" font-size="19" fill="${getColor("baseWhite")}">${escapeXml(input.kicker || socialTemplates[input.template].label).toUpperCase()}</text>
      ${antonLine(lead, 72, 560, leadWidth, 344, accent, "frame-filling-statistic")}
      ${statementLines.map((line, index) => `<text x="78" y="${statementY + index * 72}" font-family="Montserrat" font-weight="700" font-size="62" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n")}
      ${bodyLines.length ? `<rect x="72" y="${supportY - 34}" width="9" height="${Math.max(92, bodyLines.slice(0, 3).length * 44)}" fill="${accent}"/>${bodyLines.slice(0, 3).map((line, index) => `<text x="112" y="${supportY + index * 44}" font-family="Montserrat" font-weight="500" font-size="34" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n")}` : ""}
      ${input.cta ? `<text x="72" y="1090" font-family="Montserrat" font-weight="700" font-size="32" fill="${accent}">${escapeXml(input.cta).toUpperCase()}</text>` : ""}
      <line x1="72" y1="1198" x2="1008" y2="1198" stroke="${getColor("softMint")}" stroke-width="3"/>
      <text x="72" y="1278" font-family="DM Mono" font-size="18" fill="${getColor("baseWhite")}">${brand.social.requiredFooter}</text>
      ${renderLogo(width - 316, 1218, 244, 86)}`;
    palette.push(getColor("softMint"), getColor("slateBlue"));
  } else if (isAlert) {
    const displaySize = headlineLines.length >= 4 ? 124 : headlineLines.length === 3 ? 142 : 166;
    const lineGap = displaySize + 20;
    const firstY = headlineLines.length >= 4 ? 280 : 350;
    const widths = [900, 936, 824, 936];
    const blockStart = variation === 1 ? 1 : Math.max(1, headlineLines.length - 2);
    const display = headlineLines.map((line, index) => {
      const baseWidth = Math.min(936, widths[(index + variation) % widths.length]);
      const units = displayUnits(line);
      const lineWidth = units < 1.6 ? Math.min(baseWidth, 420) : units < 3 ? Math.min(baseWidth, 640) : baseWidth;
      const hasBlock = index >= blockStart;
      const rect = hasBlock ? `<rect x="54" y="${firstY + index * lineGap - displaySize + 18}" width="${Math.min(1008, lineWidth + 72)}" height="${displaySize + 12}" fill="${getColor("leila")}"/>` : "";
      return `${rect}${antonLine(line, 72, firstY + index * lineGap, lineWidth, displaySize, hasBlock && index % 2 === 1 ? accent : getColor("baseWhite"), "frame-filling-headline")}`;
    }).join("\n");
    const lastY = firstY + Math.max(0, headlineLines.length - 1) * lineGap;
    const actionY = Math.min(930, Math.max(760, lastY + 82));
    const actionLines = (bodyLines.length ? bodyLines : [styleVariant === "petition_push" ? "Push for smarter rules." : "Make consumer choice heard."]).slice(0, 2);
    contentSvg = `<g transform="rotate(${variation === 1 ? 5 : -6} 268 116)">
        <rect x="70" y="74" width="420" height="82" rx="12" fill="${getColor("leila")}"/>
        <text x="104" y="130" font-family="DM Mono" font-size="24" fill="${accent}">${escapeXml(input.kicker || socialTemplates[input.template].label).toUpperCase()}</text>
      </g>
      <g data-ccc-role="stacked-headline">${display}</g>
      <g data-ccc-role="action-band">
        <rect x="0" y="${actionY}" width="${width}" height="184" fill="${getColor("leila")}"/>
        <g ${styleVariant === "petition_push" ? "data-ccc-role=\"petition-marker\"" : "data-ccc-role=\"alert-marker\""}>
          <circle cx="116" cy="${actionY + 92}" r="46" fill="none" stroke="${accent}" stroke-width="6"/>
          <path d="M89 ${actionY + 96} L125 ${actionY + 70} L137 ${actionY + 116} Z M137 ${actionY + 81} L158 ${actionY + 68} M143 ${actionY + 96} L166 ${actionY + 96} M137 ${actionY + 111} L158 ${actionY + 124}" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
        <text x="190" y="${actionY + 76}" font-family="Montserrat" font-weight="700" font-size="36" fill="${getColor("baseWhite")}">${escapeXml(input.cta || (styleVariant === "petition_push" ? "SIGN THE PETITION" : "TAKE ACTION")).toUpperCase()}</text>
        ${actionLines.map((line, index) => `<text x="190" y="${actionY + 124 + index * 38}" font-family="Montserrat" font-weight="500" font-size="30" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n")}
        <path d="M846 ${actionY + 18} L798 ${actionY + 166} M884 ${actionY + 18} L836 ${actionY + 166} M922 ${actionY + 18} L874 ${actionY + 166}" stroke="${accent}" stroke-width="6"/>
      </g>
      <rect x="0" y="1168" width="${width}" height="182" fill="${getColor("leila")}"/>
      <text x="72" y="1280" font-family="DM Mono" font-size="18" fill="${getColor("baseWhite")}">${brand.social.requiredFooter}</text>
      ${renderLogo(width - 316, 1208, 244, 86)}`;
    palette.push(getColor("marigold"));
  } else {
    const splitX = [540, 600, 500][variation];
    const rightWidth = width - splitX;
    backgroundSvg = `<rect width="${splitX}" height="${height}" fill="${getColor("leila")}"/><rect x="${splitX}" width="${rightWidth}" height="${height}" fill="${getColor("warmWhite")}"/>`;
    const lowerHeadline = input.headline.toLowerCase();
    const leftTitle = lowerHeadline.includes("usa") ? "USA" : lowerHeadline.includes("bad") ? "BAD" : lowerHeadline.includes("no") ? "NO" : "BAD";
    const rightTitle = lowerHeadline.includes("eu") ? "EU" : lowerHeadline.includes("good") ? "GOOD" : lowerHeadline.includes("yes") ? "YES" : "GOOD";
    const bodyParts = (input.body ?? "").split("|").map((part) => part.trim()).filter(Boolean);
    const leftCopy = wrapWords(input.comparisonLeft ?? bodyParts[0] ?? "Ban first. Ask questions later.", 16).slice(0, 4);
    const rightCopy = wrapWords(input.comparisonRight ?? bodyParts[1] ?? "Regulate risk. Protect choice.", 16).slice(0, 4);
    const leftTextWidth = Math.max(340, splitX - 108);
    const rightTextWidth = Math.max(340, rightWidth - 108);
    const leftCardWidth = splitX - 120;
    const rightCardWidth = rightWidth - 120;
    contentSvg = `<text x="72" y="72" font-family="DM Mono" font-size="19" fill="${getColor("baseWhite")}">${escapeXml(input.kicker || socialTemplates[input.template].label).toUpperCase()}</text>
      ${renderLogo(width - 286, 44, 214, 76)}
      ${antonLine(leftTitle, 54, 360, leftTextWidth, 178, getColor("warmWhite"), "frame-filling-contrast-title")}
      ${antonLine(rightTitle, splitX + 54, 360, rightTextWidth, 178, getColor("brightTeal"), "frame-filling-contrast-title")}
      ${antonLine("POLICY", 54, 520, leftTextWidth, 128, accent, "contrast-subtitle")}
      ${antonLine("POLICY", splitX + 54, 520, rightTextWidth, 128, getColor("leila"), "contrast-subtitle")}
      <g data-ccc-role="contrast-cards">
        <rect x="60" y="650" width="${leftCardWidth}" height="260" rx="24" fill="none" stroke="${accent}" stroke-width="7"/>
        <circle cx="126" cy="746" r="42" fill="${accent}"/>
        <path d="M105 725 L147 767 M147 725 L105 767" stroke="${getColor("leila")}" stroke-width="11"/>
        ${leftCopy.map((line, index) => `<text x="188" y="${710 + index * 43}" font-family="Montserrat" font-weight="500" font-size="31" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n")}
        <rect x="${splitX + 60}" y="650" width="${rightCardWidth}" height="260" rx="24" fill="none" stroke="${getColor("brightTeal")}" stroke-width="7"/>
        <circle cx="${splitX + 126}" cy="746" r="42" fill="${getColor("brightTeal")}"/>
        <path d="M${splitX + 104} 746 L${splitX + 120} 762 L${splitX + 151} 724" fill="none" stroke="${getColor("baseWhite")}" stroke-width="11"/>
        ${rightCopy.map((line, index) => `<text x="${splitX + 188}" y="${710 + index * 43}" font-family="Montserrat" font-weight="500" font-size="31" fill="${getColor("leila")}">${escapeXml(line)}</text>`).join("\n")}
      </g>
      <text x="72" y="1074" font-family="Anton" font-size="72" fill="${getColor("warmWhite")}">${escapeXml((input.cta || "WE KNOW OUR CHOICE").toUpperCase())}</text>
      <text x="${splitX + 72}" y="1142" font-family="Anton" font-size="72" fill="${getColor("brightTeal")}">DO YOU?</text>
      <text x="${splitX + 72}" y="1280" font-family="DM Mono" font-size="18" fill="${getColor("brightTeal")}">${brand.social.requiredFooter}</text>`;
    palette = [getColor("leila"), getColor("warmWhite"), accent, getColor("brightTeal"), getColor("baseWhite")];
  }

  const svg = makeIllustratorSafeSvg(`<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" data-ccc-variant="${styleVariant}" data-ccc-reference-system="${referenceSystem}" data-ccc-variation="${variation}" data-ccc-density="${density}" data-ccc-has-action-band="${hasActionBand}" data-ccc-has-stacked-blocks="${hasStackedBlocks}" data-ccc-has-petition-marker="${styleVariant === "petition_push"}" data-ccc-has-large-stat="${styleVariant === "statistic_card"}" data-ccc-has-contrast-cards="${styleVariant === "contrast_cards"}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
    ${fontPolicy}
    ${backgroundSvg}
    ${watermark}
    ${contentSvg}
  </svg>`);
  const validation = validateSpec({ colors: [...new Set(palette)], fonts: ["Anton Regular", "Montserrat Bold", "Montserrat Medium", "DM Mono Regular"], assetType: "social", mode: input.mode, widthPx: width, heightPx: height, usesLogo: true, hasOfficialLogoAsset: logoCheck.ok, officialLogoHref: selectedLogoHref, assetBasePath: input.assetBasePath });
  if (missingRenderFonts.length) severityPush(input.mode, validation.violations, validation.warnings, `Required packaged editable fonts are missing: ${missingRenderFonts.join(", ")}.`);
  validation.violations.push(...layout.violations);
  validation.warnings.push(...layout.warnings);
  const artifactValidation = validateSvgArtifact({ svg, assetType: "social", mode: input.mode, assetBasePath: input.assetBasePath });
  validation.violations.push(...artifactValidation.violations);
  validation.warnings.push(...artifactValidation.warnings);
  validation.ok = validation.violations.length === 0;
  return { validation, layout, artifactValidation, selectedLogoHref, styleVariant, variation, referenceSystem, svg };
}

export function createSocialSvg(input: SocialSvgInput) {
  return input.template === "lower_third" ? createLegacySocialRenderer(input) : referenceLockedSocialSvg(input);
}

/**
 * Backward-compatible entrypoint for older local scripts. Social posts are
 * deliberately routed through the same reference-locked renderer exposed by
 * the MCP so legacy callers cannot reintroduce forced-width display text.
 */
export function createLegacySocialSvg(input: SocialSvgInput) {
  return createSocialSvg(input);
}
