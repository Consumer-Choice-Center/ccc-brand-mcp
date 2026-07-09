import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ValidationMode = "draft" | "final";
export type FontCheck = { input: string; family?: string; weight?: string; ok: boolean; message?: string };

type LogoCheck = { input?: string; ok: boolean; approvedPath?: string; exists?: boolean; message?: string };
type LogoSurface = "dark" | "orange" | "light";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export const brand = readJson<any>(resolve(__dirname, "../data/ccc-brand.json"));
export const assetManifest = readJson<any>(resolve(__dirname, "../assets/manifest.json"));

export const socialTemplates = {
  policy_alert: { label: "POLICY ALERT", background: "autumnOrange", accent: "autumnOrange", text: "baseWhite" },
  statistic: { label: "DATA CARD", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  quote: { label: "QUOTE", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  cta: { label: "CONSUMER VOICE", background: "leila", accent: "autumnOrange", text: "baseWhite" },
  lower_third: { label: "LIVE INTERVIEW", background: "coolMist", accent: "autumnOrange", text: "leila" },
} as const;

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
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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
  const headline = analyzeCopy(input.headline, isLowerThird ? 34 : rules.headlineMaxCharactersPerLine, rules.maxHeadlineLines);
  const body = analyzeCopy(input.body, isLowerThird ? 68 : rules.bodyMaxCharactersPerLine, rules.maxBodyLines);
  const cta = analyzeCopy(input.cta ?? brand.social.requiredFooter, rules.ctaMaxCharactersPerLine, 1);
  const violations: string[] = [];
  const warnings: string[] = [];
  if (headline.overLimit) severityPush(input.mode, violations, warnings, "Headline exceeds CCC social layout limits and may be clipped or overcrowded.");
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
  const manifestMissingFromBrand = {
    fonts: assetManifest.requiredFonts.filter((fileName: string) => !brand.assets.requiredFonts.some((font: any) => font.fileNames.includes(fileName))),
    logos: assetManifest.requiredLogos.filter((fileName: string) => !brand.assets.requiredLogos.some((logo: any) => logo.fileNames.includes(fileName))),
  };
  return { ok: missingFonts.length === 0 && missingLogos.length === 0 && manifestMissingFromBrand.fonts.length === 0 && manifestMissingFromBrand.logos.length === 0, basePath: base, missingFonts, missingLogos, manifestMissingFromBrand, fonts, logos };
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

export function validateSpec(input: { colors?: string[]; fonts?: string[]; assetType?: string; mode?: ValidationMode; widthPx?: number; heightPx?: number; usesLogo?: boolean; hasOfficialLogoAsset?: boolean; officialLogoHref?: string; assetBasePath?: string; usesDecorativeElements?: boolean }) {
  const mode = input.mode ?? "final";
  const violations: string[] = [];
  const warnings: string[] = [];
  for (const color of input.colors ?? []) if (!resolveColor(color)) violations.push(`Color "${color}" is not in the CCC 2026 brand palette.`);
  const colorHarmony = validateColorHarmony(input.colors ?? [], mode);
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
  for (const pattern of [/\bdata-ccc-logo-href\s*=\s*["']([^"']+)["']/gi, /\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi]) for (const match of svg.matchAll(pattern)) if (!match[1].startsWith("data:")) refs.add(match[1].trim());
  return [...refs];
}

function svgDimension(svg: string, name: "width" | "height") {
  return Number(svg.match(new RegExp(`\\b${name}\\s*=\\s*["']([0-9.]+)(?:px)?["']`, "i"))?.[1]) || undefined;
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
    return { family, size, weight };
  });
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
  if (!input.svg.trim().startsWith("<svg")) violations.push("Artifact is not a standalone SVG document.");
  const fonts = svgFontFamilies(input.svg);
  for (const check of fonts.map(parseFontDescriptor)) if (!check.ok && check.message) violations.push(check.message);
  if (fonts.length === 0 && /<text[\s>]/i.test(input.svg)) severityPush(mode, violations, warnings, `SVG text must declare an approved CCC font family. Approved families: ${[...allowedFontFamilies].join(", ")}.`);
  const colors = svgColors(input.svg);
  for (const color of colors) if (!resolveColor(color)) violations.push(`SVG color "${color}" is not in the CCC 2026 brand palette.`);
  const colorHarmony = validateColorHarmony(colors, mode);
  violations.push(...colorHarmony.violations);
  warnings.push(...colorHarmony.warnings);
  const widthPx = svgDimension(input.svg, "width");
  const heightPx = svgDimension(input.svg, "height");
  const guideStyleWatermark = /data-ccc-style=["']guide-social["']|data-ccc-watermark=["']ring["']|CCC ring watermark/i.test(input.svg);
  const placeholderLogo = /CCC LOGO|USE OFFICIAL ASSET|logo placeholder|placeholder/i.test(input.svg);
  const logoRefs = svgLogoRefs(input.svg);
  const logoChecks = logoRefs.map((ref) => validateLogoHref(ref, input.assetBasePath));
  const styles = svgTextStyles(input.svg);
  const posterScaleHeadline = assetType === "social" && styles.some((style) => (style.family === "Anton" && style.size >= 84) || (style.size >= 56 && style.weight >= 700));
  const weakLargeSocialType = assetType === "social" && styles.some((style) => style.family === "Montserrat" && style.size >= 72 && style.weight < 700);
  const badSocialSplitComposition = assetType === "social" && hasBadSplit(input.svg, widthPx ?? brand.social.canonicalSize.widthPx, heightPx ?? brand.social.canonicalSize.heightPx);
  if (assetType === "social") {
    const expected = brand.social.canonicalSize;
    if (widthPx !== expected.widthPx || heightPx !== expected.heightPx) severityPush(mode, violations, warnings, `SVG social dimensions are ${widthPx ?? "missing"}x${heightPx ?? "missing"}; CCC social output must be ${expected.widthPx}x${expected.heightPx}.`);
    if (!guideStyleWatermark) severityPush(mode, violations, warnings, "SVG social output must include the CCC guide-style ring watermark or mark motif.");
    if (badSocialSplitComposition) severityPush(mode, violations, warnings, "SVG uses a large full-height diagonal split composition; CCC social posts must follow the guide-style poster system with one dominant field, stacked text blocks, labels, footer, logo, and subtle ring watermark.");
    if (!posterScaleHeadline) severityPush(mode, violations, warnings, "SVG social output must use guide-style poster typography: oversized Anton uppercase or bold Montserrat headline blocks.");
    if (weakLargeSocialType) severityPush(mode, violations, warnings, "Large social headline text must not use thin or regular Montserrat. Use Anton Regular or Montserrat Bold blocks for guide-style posts.");
  }
  if (placeholderLogo) severityPush(mode, violations, warnings, "SVG contains a logo placeholder. Final CCC output must use an approved official logo asset.");
  if (input.requiresLogo ?? true) if (!logoChecks.some((check) => check.ok)) severityPush(mode, violations, warnings, "SVG does not reference a verified official CCC logo asset.");
  return { ok: violations.length === 0, mode, violations, warnings, widthPx, heightPx, fonts, colors, colorHarmony, placeholderLogo, logoRefs, logoChecks, guideStyleWatermark, badSocialSplitComposition, posterScaleHeadline, weakLargeSocialType };
}

function logoToHref(check: LogoCheck, basePath?: string) {
  if (!check.ok || !check.approvedPath) return undefined;
  const path = resolve(getAssetBase(basePath), check.approvedPath);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(readFileSync(path, "utf8"))}`;
}

export function createGenerationPrompt(input: { request: string; outputType: "social_post" | "video_graphic" | "policy_document" | "website_section" | "ad" | "general"; includeNegativePrompt: boolean }) {
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
    "Typography: Montserrat Bold headlines, Anton Regular social H1, approved Montserrat/Hind subheads, Montserrat body, DM Mono labels.",
    "Visual composition: guide-style poster field, oversized uppercase type, issue label, official logo, footer URL, subtle CCC ring watermark.",
    "Large social headlines must never be thin or regular Montserrat; use Anton Regular or Montserrat Bold.",
    "Do not use large split-screen infographic panels, full-height diagonal dividers, serif display type, off-palette colors, gradients, or invented logos.",
    "Use packaged official logo SVG assets for final output. Default dark-field logo: logos/ccc-wide-orange.svg. Default orange/light-field logo: logos/ccc-wide-leila.svg.",
  ];
  if (input.outputType === "social_post") lines.push("", `Social format: ${brand.social.canonicalSize.widthPx}x${brand.social.canonicalSize.heightPx}px.`, `Footer must include: ${brand.social.requiredFooter}.`);
  if (input.includeNegativePrompt) lines.push("", "Negative prompt: serif typography, Times/Georgia-style headlines, large left/right split-screen composition, full-height diagonal divider wedges, policy comparison infographic layout, off-palette colors, unapproved fonts, soft gradients, invented logo marks, distorted logo, generic corporate stock style, dense infographic clutter.");
  return lines.join("\n");
}

export function createSocialSvg(input: { template: keyof typeof socialTemplates; headline: string; kicker?: string; body?: string; cta?: string; includeLogoPlaceholder: boolean; officialLogoHref?: string; assetBasePath?: string; mode: ValidationMode }) {
  const isLowerThird = input.template === "lower_third";
  const width = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.widthPx : brand.social.canonicalSize.widthPx;
  const height = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.heightPx : brand.social.canonicalSize.heightPx;
  const bg = input.template === "policy_alert" ? getColor("autumnOrange") : getColor("leila");
  const accent = getColor("autumnOrange");
  const selectedLogoHref = input.officialLogoHref ?? selectDefaultLogoHref(input.template === "policy_alert" ? "orange" : "dark", input.assetBasePath);
  const logoCheck = validateLogoHref(selectedLogoHref, input.assetBasePath);
  const logoHref = logoToHref(logoCheck, input.assetBasePath) ?? selectedLogoHref ?? "";
  const logo = logoCheck.ok && logoCheck.approvedPath
    ? `<image href="${escapeXml(logoHref)}" data-ccc-logo-href="${escapeXml(logoCheck.approvedPath)}" x="${width - 294}" y="58" width="220" height="76" preserveAspectRatio="xMidYMid meet"/>`
    : input.includeLogoPlaceholder && input.mode !== "final"
      ? `<g aria-label="Official CCC logo placeholder"><rect x="${width - 294}" y="58" width="220" height="76" fill="none" stroke="${accent}" stroke-width="4"/></g>`
      : "";
  const layout = qaSocialLayout({ template: input.template, headline: input.headline, body: input.body ?? "", cta: input.cta, mode: input.mode });
  const headlineLines = (layout.headline.lines.length ? layout.headline.lines : wrapWords(input.headline, 14)).slice(0, 4);
  const bodyLines = layout.body.lines;
  const ring = `<g data-ccc-watermark="ring" aria-label="CCC ring watermark" opacity="0.2" fill="none" stroke="${input.template === "policy_alert" ? getColor("marigold") : getColor("slateBlue")}" stroke-width="28"><circle cx="900" cy="590" r="150"/><circle cx="900" cy="590" r="225"/><circle cx="900" cy="590" r="300"/></g>`;
  const headlineSvg = input.template === "policy_alert"
    ? headlineLines.map((line, index) => `<rect x="72" y="${220 + index * 86}" width="${Math.min(830, Math.max(420, line.length * 44))}" height="74" fill="${getColor("leila")}"/><text x="96" y="${274 + index * 86}" font-family="Montserrat" font-weight="700" font-size="58" fill="${index % 2 === 0 ? getColor("baseWhite") : accent}">${escapeXml(line.toUpperCase())}</text>`).join("\n")
    : headlineLines.map((line, index) => `<text x="72" y="${310 + index * 106}" font-family="Anton" font-weight="400" font-size="104" fill="${index === headlineLines.length - 1 ? accent : getColor("baseWhite")}">${escapeXml(line.toUpperCase())}</text>`).join("\n");
  const bodySvg = bodyLines.map((line, index) => `<text x="${input.template === "policy_alert" ? 178 : 112}" y="${input.template === "policy_alert" ? 760 + index * 36 : 780 + index * 40}" font-family="Montserrat" font-weight="${index === 0 ? 700 : 400}" font-size="${input.template === "policy_alert" ? 30 : 32}" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`).join("\n");
  const footerY = height - brand.visualSystem.socialPosts.footerHeightPx;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  ${ring}
  ${logo}
  <text x="72" y="78" font-family="DM Mono" font-size="18" fill="${input.template === "policy_alert" ? getColor("leila") : getColor("baseWhite")}">${escapeXml(input.kicker || socialTemplates[input.template].label).toUpperCase()}</text>
  <rect x="72" y="96" width="42" height="14" fill="${accent}"/>
  ${headlineSvg}
  <rect x="72" y="730" width="8" height="94" fill="${accent}"/>
  ${bodySvg}
  <path d="M72 952 C260 934 430 934 620 952" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <line x1="72" y1="${footerY - 34}" x2="${width - 72}" y2="${footerY - 34}" stroke="${getColor("softMint")}" stroke-width="3" opacity="0.8"/>
  <text x="72" y="${height - 54}" font-family="DM Mono" font-weight="400" font-size="18" fill="${getColor("baseWhite")}">${escapeXml(input.cta || brand.social.requiredFooter)}</text>
</svg>`;
  const validation = validateSpec({ colors: [bg, accent, getColor("baseWhite")], fonts: ["Montserrat", "DM Mono"], assetType: isLowerThird ? "video" : "social", mode: input.mode, widthPx: width, heightPx: height, usesLogo: true, hasOfficialLogoAsset: logoCheck.ok, officialLogoHref: selectedLogoHref, assetBasePath: input.assetBasePath });
  validation.violations.push(...layout.violations);
  validation.warnings.push(...layout.warnings);
  const artifactValidation = validateSvgArtifact({ svg, assetType: isLowerThird ? "video" : "social", mode: input.mode, assetBasePath: input.assetBasePath });
  validation.violations.push(...artifactValidation.violations);
  validation.warnings.push(...artifactValidation.warnings);
  validation.ok = validation.violations.length === 0;
  return { validation, layout, artifactValidation, selectedLogoHref, svg };
}
