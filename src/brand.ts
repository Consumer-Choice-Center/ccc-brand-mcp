import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export type ValidationMode = "draft" | "final";

export type FontCheck = {
  input: string;
  family?: string;
  weight?: string;
  ok: boolean;
  message?: string;
};

type LogoCheck = {
  input?: string;
  ok: boolean;
  approvedPath?: string;
  exists?: boolean;
  message?: string;
};

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

const brandDataSchema = z.object({
  brand: z.object({
    name: z.string(),
    shortName: z.string(),
    tagline: z.string(),
    source: z.string().optional(),
    positioning: z.object({
      archetype: z.string(),
      voice: z.array(z.string()),
      audienceAppeal: z.string(),
    }),
  }),
  colors: z.record(z.string(), z.record(z.string(), hexColorSchema)),
  typography: z.record(z.string(), z.unknown()),
  logo: z.record(z.string(), z.unknown()),
  social: z.object({
    canonicalSize: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }),
    requiredFooter: z.string(),
    commonPatterns: z.array(z.string()),
    guidance: z.array(z.string()),
  }),
  video: z.record(z.string(), z.unknown()),
  visualSystem: z.object({
    sourceReview: z.record(z.string(), z.unknown()).optional(),
    colorUse: z
      .object({
        maxUniqueColorsFinal: z.number().int().positive(),
        maxTertiaryColorsFinal: z.number().int().nonnegative(),
        socialRecipes: z.array(
          z.object({
            name: z.string(),
            useFor: z.string(),
            background: z.string(),
            primary: z.string(),
            accent: z.string(),
            neutral: z.string(),
            optionalTertiary: z.string().optional(),
            avoid: z.array(z.string()).default([]),
          }),
        ),
      })
      .optional(),
    socialPosts: z.object({
      defaultFeedSize: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }),
      safeMarginPx: z.number().int().nonnegative(),
      footerHeightPx: z.number().int().positive(),
      maxHeadlineLines: z.number().int().positive(),
      maxBodyLines: z.number().int().positive(),
      headlineMaxCharactersPerLine: z.number().int().positive(),
      bodyMaxCharactersPerLine: z.number().int().positive(),
      ctaMaxCharactersPerLine: z.number().int().positive(),
      requiredElements: z.array(z.string()).optional(),
      composition: z.array(z.string()).optional(),
      forbiddenComposition: z.array(z.string()).optional(),
    }),
    videoGraphics: z.object({
      horizontalSize: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }),
      verticalSize: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }),
      lowerThird: z.record(z.string(), z.unknown()),
    }),
  }),
  assets: z.object({
    assetBaseEnvironmentVariable: z.string(),
    defaultAssetDirectory: z.string(),
    policy: z.array(z.string()),
    requiredFonts: z.array(
      z.object({
        family: z.string(),
        weights: z.array(z.string()),
        fileNames: z.array(z.string()),
      }),
    ),
    requiredLogos: z.array(
      z.object({
        id: z.string(),
        usage: z.string(),
        fileNames: z.array(z.string()),
      }),
    ),
  }),
  policyOutputs: z.record(z.string(), z.unknown()),
  strictGenerationRules: z.array(z.string()),
});

const assetManifestSchema = z.object({
  assetBaseEnvironmentVariable: z.string(),
  defaultAssetDirectory: z.string(),
  requiredFonts: z.array(z.string()),
  requiredLogos: z.array(z.string()),
});

export type BrandData = z.infer<typeof brandDataSchema>;
export type AssetManifest = z.infer<typeof assetManifestSchema>;

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandPath = resolve(__dirname, "../data/ccc-brand.json");
const assetManifestPath = resolve(__dirname, "../assets/manifest.json");

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

export const brand = brandDataSchema.parse(readJson(brandPath));
export const assetManifest = assetManifestSchema.parse(readJson(assetManifestPath));

export const socialTemplates = {
  policy_alert: {
    label: "POLICY ALERT",
    background: "leila",
    accent: "autumnOrange",
    text: "baseWhite",
  },
  statistic: {
    label: "DATA CARD",
    background: "coolMist",
    accent: "autumnOrange",
    text: "leila",
  },
  quote: {
    label: "QUOTE",
    background: "warmWhite",
    accent: "autumnOrange",
    text: "leila",
  },
  cta: {
    label: "CONSUMER VOICE",
    background: "leila",
    accent: "autumnOrange",
    text: "baseWhite",
  },
  lower_third: {
    label: "LIVE INTERVIEW",
    background: "coolMist",
    accent: "autumnOrange",
    text: "leila",
  },
} as const;

export const colorEntries = Object.entries(brand.colors).flatMap(([group, colors]) =>
  Object.entries(colors).map(([name, hex]) => ({
    group,
    name,
    hex: hex.toUpperCase(),
  })),
);

const colorByName = new Map(colorEntries.map((entry) => [entry.name, entry.hex]));
const colorByHex = new Map(colorEntries.map((entry) => [entry.hex, entry.name]));
const colorByAlias = new Map(
  colorEntries.flatMap((entry) => [
    [normalizeToken(entry.name), entry.hex],
    [normalizeToken(toDisplayName(entry.name)), entry.hex],
    [normalizeToken(entry.hex), entry.hex],
  ]),
);

const allowedFontWeights = new Map(
  brand.assets.requiredFonts.map((font) => [font.family, new Set(font.weights)]),
);
const allowedFontFamilies = new Set(brand.assets.requiredFonts.map((font) => font.family));
const allowedFontFamilyList = [...allowedFontFamilies].join(", ");
const approvedLogoPaths = new Set(assetManifest.requiredLogos);

export function asText(data: unknown) {
  return JSON.stringify(data, null, 2);
}

export function getBrandSection(section: string) {
  return section === "all" ? brand : brand[section as keyof BrandData];
}

function normalizeToken(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toDisplayName(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function normalizeHex(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (/^[0-9A-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

export function resolveColor(value: string) {
  const normalized = normalizeHex(value);
  const named = colorByName.get(value);
  if (named) return named;
  if (colorByHex.has(normalized)) return normalized;
  return colorByAlias.get(normalizeToken(value));
}

function getColor(name: string) {
  const color = colorByName.get(name);
  if (!color) {
    throw new Error(`Unknown CCC brand color: ${name}`);
  }
  return color;
}

function getColorName(hex: string) {
  return colorByHex.get(normalizeHex(hex));
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length <= maxChars) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function parseFontDescriptor(input: string): FontCheck {
  const normalized = input.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  const family = [...allowedFontFamilies]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => normalized.toLowerCase().startsWith(candidate.toLowerCase()));

  if (!family) {
    return {
      input,
      ok: false,
      message: `Font "${input}" is not approved. Use Montserrat, Anton, Hind, or DM Mono only.`,
    };
  }

  const remainder = normalized.slice(family.length).trim();
  if (!remainder) {
    return { input, family, ok: true };
  }

  const allowedWeights = allowedFontWeights.get(family) ?? new Set<string>();
  const weight = [...allowedWeights]
    .sort((a, b) => b.length - a.length)
    .find((candidate) => remainder.toLowerCase() === candidate.toLowerCase());

  if (!weight) {
    return {
      input,
      family,
      ok: false,
      message: `Weight "${remainder}" is not approved for ${family}. Approved weights: ${[...allowedWeights].join(", ")}.`,
    };
  }

  return { input, family, weight, ok: true };
}

function analyzeCopy(text: string | undefined, maxChars: number, maxLines: number) {
  const value = text ?? "";
  const allLines = wrapWords(value, maxChars);
  const longWords = value.split(/\s+/).filter((word) => word.length > maxChars);
  return {
    lines: allLines.slice(0, maxLines),
    allLineCount: allLines.length,
    omittedLines: allLines.slice(maxLines),
    maxChars,
    maxLines,
    longWords,
    overLimit: allLines.length > maxLines || longWords.length > 0,
  };
}

function severityPush(mode: ValidationMode, violations: string[], warnings: string[], message: string) {
  if (mode === "final") {
    violations.push(message);
  } else {
    warnings.push(message);
  }
}

export function qaSocialLayout(input: {
  template: keyof typeof socialTemplates;
  headline: string;
  body?: string;
  cta?: string;
  mode: ValidationMode;
}) {
  const isLowerThird = input.template === "lower_third";
  const visualRules = brand.visualSystem.socialPosts;
  const headline = analyzeCopy(
    input.headline,
    isLowerThird ? 34 : visualRules.headlineMaxCharactersPerLine,
    visualRules.maxHeadlineLines,
  );
  const body = analyzeCopy(
    input.body,
    isLowerThird ? 68 : visualRules.bodyMaxCharactersPerLine,
    visualRules.maxBodyLines,
  );
  const cta = analyzeCopy(input.cta ?? brand.social.requiredFooter, visualRules.ctaMaxCharactersPerLine, 1);
  const violations: string[] = [];
  const warnings: string[] = [];

  if (headline.overLimit) {
    severityPush(input.mode, violations, warnings, "Headline exceeds CCC social layout limits and may be clipped or overcrowded.");
  }
  if (body.overLimit) {
    severityPush(input.mode, violations, warnings, "Body copy exceeds CCC social layout limits and may be clipped or overcrowded.");
  }
  if (!isLowerThird && cta.overLimit) {
    severityPush(input.mode, violations, warnings, "CTA/footer exceeds the one-line footer limit.");
  }

  return {
    ok: violations.length === 0,
    violations,
    warnings,
    headline,
    body,
    cta,
  };
}

function getAssetBase(basePath?: string) {
  return basePath || process.env[brand.assets.assetBaseEnvironmentVariable] || resolve(__dirname, "..", brand.assets.defaultAssetDirectory);
}

function cleanAssetRef(ref: string) {
  return ref.replace(/^file:\/\//, "").split(/[?#]/, 1)[0].replaceAll("\\", "/");
}

export function validateLogoHref(input?: string, basePath?: string): LogoCheck {
  if (!input) {
    return {
      ok: false,
      message: "Official CCC logo asset was not provided.",
    };
  }

  const base = getAssetBase(basePath);
  const cleaned = cleanAssetRef(input);
  const approvedPath = approvedLogoPaths.has(cleaned)
    ? cleaned
    : assetManifest.requiredLogos.find((fileName) => resolve(base, fileName) === resolve(cleaned));

  if (!approvedPath) {
    return {
      input,
      ok: false,
      message: `Logo reference "${input}" is not listed in assets/manifest.json.`,
    };
  }

  const absolutePath = resolve(base, approvedPath);
  const exists = existsSync(absolutePath);
  return {
    input,
    ok: exists,
    approvedPath,
    exists,
    message: exists ? undefined : `Approved logo "${approvedPath}" is missing from ${base}.`,
  };
}

export function auditAssets(basePath?: string) {
  const base = getAssetBase(basePath);
  const fonts = brand.assets.requiredFonts.map((font) => {
    const files = font.fileNames.map((fileName) => ({
      fileName,
      manifestListed: assetManifest.requiredFonts.includes(fileName),
      path: resolve(base, fileName),
      exists: existsSync(resolve(base, fileName)),
    }));
    return {
      family: font.family,
      weights: font.weights,
      files,
      ok: files.every((file) => file.manifestListed && file.exists),
    };
  });
  const logos = brand.assets.requiredLogos.map((logo) => {
    const files = logo.fileNames.map((fileName) => ({
      fileName,
      manifestListed: assetManifest.requiredLogos.includes(fileName),
      path: resolve(base, fileName),
      exists: existsSync(resolve(base, fileName)),
    }));
    return {
      id: logo.id,
      usage: logo.usage,
      files,
      ok: files.some((file) => file.manifestListed && file.exists),
    };
  });

  const missingFonts = fonts.filter((font) => !font.ok).map((font) => font.family);
  const missingLogos = logos.filter((logo) => !logo.ok).map((logo) => logo.id);
  const manifestMissingFromBrand = {
    fonts: assetManifest.requiredFonts.filter((fileName) => !brand.assets.requiredFonts.some((font) => font.fileNames.includes(fileName))),
    logos: assetManifest.requiredLogos.filter((fileName) => !brand.assets.requiredLogos.some((logo) => logo.fileNames.includes(fileName))),
  };

  return {
    ok: missingFonts.length === 0 && missingLogos.length === 0 && manifestMissingFromBrand.fonts.length === 0 && manifestMissingFromBrand.logos.length === 0,
    basePath: base,
    missingFonts,
    missingLogos,
    manifestMissingFromBrand,
    fonts,
    logos,
  };
}

function validateColorHarmony(colors: string[], mode: ValidationMode) {
  const violations: string[] = [];
  const warnings: string[] = [];
  const resolvedColors = colors
    .map((color) => resolveColor(color))
    .filter((color): color is string => Boolean(color));
  const uniqueColors = [...new Set(resolvedColors)];
  const colorUse = brand.visualSystem.colorUse;
  const maxUniqueColorsFinal = colorUse?.maxUniqueColorsFinal ?? 5;
  const maxTertiaryColorsFinal = colorUse?.maxTertiaryColorsFinal ?? 1;
  const tertiaryColors = uniqueColors.filter((color) =>
    Object.values(brand.colors.tertiary ?? {}).some((tertiaryColor) => tertiaryColor.toUpperCase() === color),
  );

  if (uniqueColors.length > maxUniqueColorsFinal) {
    severityPush(
      mode,
      violations,
      warnings,
      `Color system is overloaded: ${uniqueColors.length} brand colors are used. Use ${maxUniqueColorsFinal} or fewer for final CCC social graphics.`,
    );
  }

  if (tertiaryColors.length > maxTertiaryColorsFinal) {
    severityPush(
      mode,
      violations,
      warnings,
      `Too many tertiary accent colors are used: ${tertiaryColors.map((color) => getColorName(color) ?? color).join(", ")}. Use at most ${maxTertiaryColorsFinal} tertiary accent color for final layouts.`,
    );
  }

  const primaryColors = new Set(Object.values(brand.colors.primary).map((color) => color.toUpperCase()));
  if (uniqueColors.length > 0 && !uniqueColors.some((color) => primaryColors.has(color))) {
    severityPush(mode, violations, warnings, "CCC layouts must anchor the palette in Autumn Orange and/or Leila.");
  }

  return {
    ok: violations.length === 0,
    violations,
    warnings,
    uniqueColors,
    tertiaryColors,
  };
}

export function validateSpec(input: {
  colors?: string[];
  fonts?: string[];
  assetType?: string;
  mode?: ValidationMode;
  widthPx?: number;
  heightPx?: number;
  usesLogo?: boolean;
  hasOfficialLogoAsset?: boolean;
  officialLogoHref?: string;
  assetBasePath?: string;
  usesDecorativeElements?: boolean;
}) {
  const violations: string[] = [];
  const warnings: string[] = [];
  const mode = input.mode ?? "final";
  const fontChecks: FontCheck[] = [];
  let logoCheck: LogoCheck | undefined;

  for (const color of input.colors ?? []) {
    if (!resolveColor(color)) {
      violations.push(`Color "${color}" is not in the CCC 2026 brand palette.`);
    }
  }

  const harmony = validateColorHarmony(input.colors ?? [], mode);
  violations.push(...harmony.violations);
  warnings.push(...harmony.warnings);

  for (const font of input.fonts ?? []) {
    const check = parseFontDescriptor(font);
    fontChecks.push(check);
    if (!check.ok && check.message) {
      violations.push(check.message);
    }
  }

  if (input.assetType === "social") {
    const { widthPx, heightPx } = brand.social.canonicalSize;
    if (input.widthPx && input.widthPx !== widthPx) {
      warnings.push(`Social width is ${input.widthPx}px; CCC default social size is ${widthPx}px.`);
    }
    if (input.heightPx && input.heightPx !== heightPx) {
      warnings.push(`Social height is ${input.heightPx}px; CCC default social size is ${heightPx}px.`);
    }
  }

  if (input.usesLogo) {
    if (input.hasOfficialLogoAsset && !input.officialLogoHref) {
      warnings.push("hasOfficialLogoAsset is only a legacy hint; final validation requires officialLogoHref to verify an approved logo file.");
    }
    logoCheck = input.officialLogoHref ? validateLogoHref(input.officialLogoHref, input.assetBasePath) : undefined;
    if (!logoCheck?.ok) {
      severityPush(mode, violations, warnings, logoCheck?.message ?? "Official CCC logo asset was not provided. Final output must use an approved logo file.");
    }
  }

  if (input.assetType === "policyMemo" && input.usesDecorativeElements) {
    violations.push("Policy memos must not use decorative or topic visual elements.");
  }

  return {
    ok: violations.length === 0,
    mode,
    violations,
    warnings,
    fontChecks,
    logoCheck,
    colorHarmony: harmony,
  };
}

function cssFamilyName(value: string) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}

function extractSvgFontFamilies(svg: string) {
  const families = new Set<string>();
  for (const match of svg.matchAll(/\bfont-family\s*=\s*["']([^"']+)["']/gi)) {
    for (const family of match[1].split(",")) {
      if (cssFamilyName(family)) families.add(cssFamilyName(family));
    }
  }
  for (const match of svg.matchAll(/font-family\s*:\s*([^;"'}]+)/gi)) {
    for (const family of match[1].split(",")) {
      if (cssFamilyName(family)) families.add(cssFamilyName(family));
    }
  }
  return [...families];
}

function extractSvgColorValues(svg: string) {
  const colorValues = new Set<string>();
  const attrPattern = /\b(?:fill|stroke|stop-color)\s*=\s*["']([^"']+)["']/gi;
  const stylePattern = /(?:fill|stroke|stop-color)\s*:\s*([^;"'}]+)/gi;
  for (const match of svg.matchAll(attrPattern)) colorValues.add(match[1].trim());
  for (const match of svg.matchAll(stylePattern)) colorValues.add(match[1].trim());
  return [...colorValues].filter((color) => {
    const normalized = color.toLowerCase();
    return normalized !== "none" && normalized !== "transparent" && normalized !== "currentcolor" && !normalized.startsWith("url(");
  });
}

function extractSvgLogoRefs(svg: string) {
  const refs = new Set<string>();
  const patterns = [
    /\bdata-ccc-logo-href\s*=\s*["']([^"']+)["']/gi,
    /\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    for (const match of svg.matchAll(pattern)) {
      const ref = match[1].trim();
      if (ref && !ref.startsWith("data:")) refs.add(ref);
    }
  }
  return [...refs];
}

function extractPolygonPointBoxes(svg: string) {
  const boxes: Array<{ minX: number; maxX: number; minY: number; maxY: number; width: number; height: number }> = [];
  for (const match of svg.matchAll(/<polygon\b[^>]*\bpoints\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const numbers = match[1]
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const xs: number[] = [];
    const ys: number[] = [];
    for (let index = 0; index < numbers.length - 1; index += 2) {
      xs.push(numbers[index]);
      ys.push(numbers[index + 1]);
    }
    if (xs.length === 0 || ys.length === 0) continue;
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    boxes.push({ minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY });
  }
  return boxes;
}

function parseSvgDimension(svg: string, name: "width" | "height") {
  const match = svg.match(new RegExp(`\\b${name}\\s*=\\s*["']([0-9.]+)(?:px)?["']`, "i"));
  if (!match) return undefined;
  return Number(match[1]);
}

function hasLogoPlaceholder(svg: string) {
  return /CCC LOGO|USE OFFICIAL ASSET|logo placeholder|placeholder/i.test(svg);
}

function hasGuideStyleWatermark(svg: string) {
  return /data-ccc-style=["']guide-social["']|data-ccc-watermark=["']ring["']|aria-label=["'][^"']*CCC ring watermark/i.test(svg);
}

function hasBadSocialSplitComposition(svg: string, widthPx?: number, heightPx?: number) {
  const width = widthPx ?? brand.social.canonicalSize.widthPx;
  const height = heightPx ?? brand.social.canonicalSize.heightPx;
  return extractPolygonPointBoxes(svg).some((box) => box.width >= width * 0.38 && box.height >= height * 0.72);
}

export function validateSvgArtifact(input: {
  svg: string;
  assetType?: "social" | "video" | "other";
  mode?: ValidationMode;
  requiresLogo?: boolean;
  assetBasePath?: string;
}) {
  const mode = input.mode ?? "final";
  const assetType = input.assetType ?? "social";
  const violations: string[] = [];
  const warnings: string[] = [];
  const fonts = extractSvgFontFamilies(input.svg);
  const colors = extractSvgColorValues(input.svg);
  const logoRefs = extractSvgLogoRefs(input.svg);
  const fontChecks = fonts.map((font) => parseFontDescriptor(font));
  const placeholderLogo = hasLogoPlaceholder(input.svg);
  const logoChecks = logoRefs.map((ref) => validateLogoHref(ref, input.assetBasePath));
  const widthPx = parseSvgDimension(input.svg, "width");
  const heightPx = parseSvgDimension(input.svg, "height");
  const guideStyleWatermark = hasGuideStyleWatermark(input.svg);
  const badSocialSplitComposition = assetType === "social" && hasBadSocialSplitComposition(input.svg, widthPx, heightPx);

  if (!input.svg.trim().startsWith("<svg")) {
    violations.push("Artifact is not a standalone SVG document.");
  }

  for (const check of fontChecks) {
    if (!check.ok && check.message) {
      violations.push(check.message);
    }
  }

  if (fonts.length === 0 && /<text[\s>]/i.test(input.svg)) {
    severityPush(mode, violations, warnings, `SVG text must declare an approved CCC font family. Approved families: ${allowedFontFamilyList}.`);
  }

  for (const color of colors) {
    if (!resolveColor(color)) {
      violations.push(`SVG color "${color}" is not in the CCC 2026 brand palette.`);
    }
  }

  const harmony = validateColorHarmony(colors, mode);
  violations.push(...harmony.violations);
  warnings.push(...harmony.warnings);

  if (assetType === "social") {
    const expected = brand.social.canonicalSize;
    if (widthPx !== expected.widthPx || heightPx !== expected.heightPx) {
      severityPush(mode, violations, warnings, `SVG social dimensions are ${widthPx ?? "missing"}x${heightPx ?? "missing"}; CCC social output must be ${expected.widthPx}x${expected.heightPx}.`);
    }
    if (!guideStyleWatermark) {
      severityPush(mode, violations, warnings, "SVG social output must include the CCC guide-style ring watermark or mark motif.");
    }
    if (badSocialSplitComposition) {
      severityPush(mode, violations, warnings, "SVG uses a large full-height diagonal split composition; CCC social posts must follow the guide-style poster system with one dominant field, stacked text blocks, labels, footer, logo, and subtle ring watermark.");
    }
  }

  if (placeholderLogo) {
    severityPush(mode, violations, warnings, "SVG contains a logo placeholder. Final CCC output must use an approved official logo asset.");
  }

  if (input.requiresLogo ?? true) {
    const hasOfficialLogo = logoChecks.some((check) => check.ok);
    if (!hasOfficialLogo) {
      severityPush(mode, violations, warnings, "SVG does not reference a verified official CCC logo asset.");
    }
  }

  return {
    ok: violations.length === 0,
    mode,
    violations,
    warnings,
    widthPx,
    heightPx,
    fonts,
    colors,
    colorHarmony: harmony,
    placeholderLogo,
    logoRefs,
    logoChecks,
    guideStyleWatermark,
    badSocialSplitComposition,
  };
}

function logoHrefToImageData(logoCheck: LogoCheck, basePath?: string) {
  if (!logoCheck.ok || !logoCheck.approvedPath) return undefined;
  const absolutePath = resolve(getAssetBase(basePath), logoCheck.approvedPath);
  const ext = extname(absolutePath).toLowerCase();
  if (ext === ".svg") {
    const svg = readFileSync(absolutePath, "utf8");
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  if (ext === ".png") {
    return `data:image/png;base64,${readFileSync(absolutePath).toString("base64")}`;
  }
  return undefined;
}

export function createGenerationPrompt(input: {
  request: string;
  outputType: "social_post" | "video_graphic" | "policy_document" | "website_section" | "ad" | "general";
  includeNegativePrompt: boolean;
}) {
  const prompt = [
    `Create a ${input.outputType.replaceAll("_", " ")} for ${brand.brand.name}.`,
    `User request: ${input.request}`,
    "",
    "Strict CCC brand constraints:",
    ...brand.strictGenerationRules.map((rule) => `- ${rule}`),
    "",
    "Use only this palette:",
    ...colorEntries.map((entry) => `- ${entry.name}: ${entry.hex} (${entry.group})`),
    "",
    "Typography:",
    "- Headlines: Montserrat Bold",
    "- Social H1: Anton Regular",
    "- Subheads: Montserrat Medium, Montserrat Medium Italic, Montserrat SemiBold, or Hind Medium",
    "- Body: Montserrat Regular or Montserrat Italic",
    "- Technical labels: DM Mono Regular",
    `- SVG/CSS font-family values must be exactly one of: ${allowedFontFamilyList}. Do not add generic fallbacks such as Arial, Helvetica, or sans-serif.`,
    "",
    "Color discipline:",
    `- Use ${brand.visualSystem.colorUse?.maxUniqueColorsFinal ?? 5} or fewer unique brand colors in final social graphics.`,
    `- Use at most ${brand.visualSystem.colorUse?.maxTertiaryColorsFinal ?? 1} tertiary accent color in final social graphics.`,
    ...(brand.visualSystem.colorUse?.socialRecipes.map(
      (recipe) => `- ${recipe.name}: ${recipe.useFor}; background ${recipe.background}, primary ${recipe.primary}, accent ${recipe.accent}, neutral ${recipe.neutral}${recipe.optionalTertiary ? `, optional tertiary ${recipe.optionalTertiary}` : ""}.`,
    ) ?? []),
    "",
    "Visual composition:",
    "- Match the CCC social post visual guide: one dominant navy or orange poster field, oversized condensed uppercase typography, orange emphasis, small issue label, official logo, footer URL, and subtle CCC ring watermark.",
    "- Use stacked dark text blocks and compact callout strips for emphasis, especially on orange policy-alert layouts.",
    "- Use Leila navy backgrounds with Base White headlines and Autumn Orange word emphasis for most social posts.",
    "- Use Autumn Orange backgrounds with Leila stacked headline blocks only for alert/petition layouts.",
    "- Keep message hierarchy bold, direct, and uncluttered.",
    "- Do not use serif display typography; social headlines must be Anton Regular or Montserrat Bold.",
    "- Do not use large left/right split-screen infographic panels or full-height diagonal divider wedges.",
    "- Use official CCC logo assets for final output; placeholders are draft-only.",
    "- Final SVG deliverables must pass the validate_svg_artifact MCP tool before handoff.",
    "",
    `Brand voice: ${brand.brand.positioning.voice.join(", ")}.`,
  ];

  if (input.outputType === "social_post") {
    prompt.push(
      "",
      `Social format: ${brand.social.canonicalSize.widthPx}x${brand.social.canonicalSize.heightPx}px.`,
      `Footer must include: ${brand.social.requiredFooter}.`,
    );
  }

  if (input.includeNegativePrompt) {
    prompt.push(
      "",
      "Negative prompt: serif typography, Times/Georgia-style headlines, large left/right split-screen composition, full-height diagonal divider wedges, policy comparison infographic layout, off-palette colors, unapproved fonts, soft gradients, invented logo marks, distorted logo, generic corporate stock style, dense infographic clutter, decorative effects outside the guide, policy memo illustrations.",
    );
  }

  return prompt.join("\n");
}

export function createSocialSvg(input: {
  template: keyof typeof socialTemplates;
  headline: string;
  kicker?: string;
  body?: string;
  cta?: string;
  includeLogoPlaceholder: boolean;
  officialLogoHref?: string;
  assetBasePath?: string;
  mode: ValidationMode;
}) {
  const preset = socialTemplates[input.template];
  const isLowerThird = input.template === "lower_third";
  const width = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.widthPx : brand.social.canonicalSize.widthPx;
  const height = isLowerThird ? brand.visualSystem.videoGraphics.horizontalSize.heightPx : brand.social.canonicalSize.heightPx;
  const footerHeight = brand.visualSystem.socialPosts.footerHeightPx;
  const footerY = height - footerHeight;
  const bg = getColor(preset.background);
  const accent = getColor(preset.accent);
  const text = getColor(preset.text);
  const inverseText = preset.background === "leila" ? getColor("baseWhite") : getColor("leila");
  const bodyText = input.body ?? "";
  const logoCheck = validateLogoHref(input.officialLogoHref, input.assetBasePath);
  const hasOfficialLogoAsset = logoCheck.ok;
  const logoImageHref = logoHrefToImageData(logoCheck, input.assetBasePath);
  const logo = hasOfficialLogoAsset && logoCheck.approvedPath
    ? `<image href="${escapeXml(logoImageHref ?? input.officialLogoHref ?? logoCheck.approvedPath)}" data-ccc-logo-href="${escapeXml(logoCheck.approvedPath)}" x="${width - 294}" y="58" width="220" height="76" preserveAspectRatio="xMidYMid meet"/>`
    : input.includeLogoPlaceholder && input.mode !== "final"
    ? `<g aria-label="Official CCC logo placeholder"><rect x="${width - 294}" y="58" width="220" height="76" fill="none" stroke="${accent}" stroke-width="4"/><text x="${width - 274}" y="91" font-family="Montserrat" font-weight="700" font-size="24" fill="${inverseText}">CCC LOGO</text><text x="${width - 274}" y="119" font-family="Montserrat" font-weight="500" font-size="13" fill="${inverseText}">USE OFFICIAL ASSET</text></g>`
    : "";

  const layout = qaSocialLayout({ template: input.template, headline: input.headline, body: bodyText, cta: input.cta, mode: input.mode });
  const headlineLines = layout.headline.lines;
  const bodyLines = layout.body.lines;
  const socialHeadlineLines = headlineLines.length > 0 ? headlineLines : wrapWords(input.headline, 14).slice(0, 4);
  const headlineSvg = isLowerThird
    ? headlineLines
      .map((line, index) => `<text x="90" y="${840 + index * 62}" font-family="Montserrat" font-weight="700" font-size="54" fill="${getColor("baseWhite")}">${escapeXml(line.toUpperCase())}</text>`)
      .join("\n")
    : "";
  const bodySvg = isLowerThird
    ? bodyLines
      .map((line, index) => `<text x="90" y="${970 + index * 42}" font-family="Montserrat" font-weight="400" font-size="32" fill="${text}">${escapeXml(line)}</text>`)
      .join("\n")
    : "";
  const guideWatermark = (cx: number, cy: number, stroke: string, opacity = 0.22) => `<g data-ccc-watermark="ring" aria-label="CCC ring watermark" opacity="${opacity}" fill="none" stroke="${stroke}" stroke-width="28">
  <circle cx="${cx}" cy="${cy}" r="150"/>
  <circle cx="${cx}" cy="${cy}" r="225"/>
  <circle cx="${cx}" cy="${cy}" r="300"/>
</g>`;
  const darkSocialHeadline = socialHeadlineLines
    .map((line, index) => `<text x="72" y="${310 + index * 106}" font-family="Anton" font-weight="400" font-size="104" fill="${index === socialHeadlineLines.length - 1 ? accent : getColor("baseWhite")}">${escapeXml(line.toUpperCase())}</text>`)
    .join("\n");
  const darkBody = bodyLines
    .map((line, index) => `<text x="112" y="${780 + index * 40}" font-family="Montserrat" font-weight="${index === 0 ? 700 : 400}" font-size="32" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`)
    .join("\n");
  const orangeBlocks = socialHeadlineLines
    .map((line, index) => {
      const y = 270 + index * 86;
      const widthEstimate = Math.min(790, Math.max(440, line.length * 44));
      const fill = index % 2 === 0 ? getColor("baseWhite") : accent;
      return `<rect x="72" y="${y - 62}" width="${widthEstimate}" height="74" fill="${getColor("leila")}"/>
  <text x="96" y="${y - 8}" font-family="Montserrat" font-weight="700" font-size="58" fill="${fill}">${escapeXml(line.toUpperCase())}</text>`;
    })
    .join("\n");
  const orangeBody = bodyLines
    .map((line, index) => `<text x="178" y="${760 + index * 36}" font-family="Montserrat" font-weight="${index === 0 ? 700 : 400}" font-size="30" fill="${getColor("baseWhite")}">${escapeXml(line)}</text>`)
    .join("\n");

  const svg = isLowerThird
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC lower third">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <rect x="0" y="760" width="${width}" height="176" fill="${getColor("leila")}"/>
  <rect x="0" y="936" width="${width}" height="72" fill="${accent}"/>
  ${logo}
  <rect x="1400" y="808" width="360" height="58" fill="${getColor("marigold")}"/>
  <text x="1430" y="846" font-family="DM Mono" font-size="24" fill="${getColor("leila")}">${escapeXml(input.kicker || preset.label)}</text>
  ${headlineSvg}
  ${bodySvg}
</svg>`
    : input.template === "policy_alert"
    ? `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
  <rect width="${width}" height="${height}" fill="${getColor("autumnOrange")}"/>
  ${guideWatermark(845, 360, getColor("marigold"), 0.26)}
  ${logo}
  <rect x="72" y="74" width="300" height="56" rx="8" fill="${getColor("leila")}" transform="rotate(-7 72 74)"/>
  <text x="102" y="119" font-family="DM Mono" font-size="28" fill="${accent}" transform="rotate(-7 102 119)">${escapeXml(input.kicker || preset.label).toUpperCase()}</text>
  ${orangeBlocks}
  <rect x="0" y="700" width="${width}" height="150" fill="${getColor("leila")}"/>
  <circle cx="116" cy="775" r="42" fill="none" stroke="${accent}" stroke-width="5"/>
  ${orangeBody}
  <rect x="0" y="${footerY}" width="${width}" height="${footerHeight}" fill="${getColor("leila")}"/>
  <text x="72" y="${height - 54}" font-family="DM Mono" font-weight="400" font-size="18" fill="${getColor("baseWhite")}">${escapeXml(input.cta || brand.social.requiredFooter)}</text>
</svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
  <rect width="${width}" height="${height}" fill="${getColor("leila")}"/>
  ${guideWatermark(900, 590, getColor("slateBlue"), 0.20)}
  ${logo}
  <text x="72" y="78" font-family="DM Mono" font-size="18" fill="${input.template === "statistic" ? getColor("softMint") : getColor("baseWhite")}">${escapeXml(input.kicker || preset.label).toUpperCase()}</text>
  <rect x="72" y="96" width="42" height="14" fill="${accent}"/>
  ${darkSocialHeadline}
  <rect x="72" y="730" width="8" height="94" fill="${accent}"/>
  ${darkBody}
  <path d="M72 952 C260 934 430 934 620 952" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <line x1="72" y1="${footerY - 34}" x2="${width - 72}" y2="${footerY - 34}" stroke="${getColor("softMint")}" stroke-width="3" opacity="0.8"/>
  <text x="72" y="${height - 54}" font-family="DM Mono" font-weight="400" font-size="18" fill="${getColor("baseWhite")}">${escapeXml(input.cta || brand.social.requiredFooter)}</text>
</svg>`;

  const validation = validateSpec({
    colors: [bg, accent, text],
    fonts: ["Montserrat", "DM Mono"],
    assetType: isLowerThird ? "video" : "social",
    mode: input.mode,
    widthPx: width,
    heightPx: height,
    usesLogo: true,
    hasOfficialLogoAsset,
    officialLogoHref: input.officialLogoHref,
    assetBasePath: input.assetBasePath,
  });
  validation.violations.push(...layout.violations);
  validation.warnings.push(...layout.warnings);
  const artifactValidation = validateSvgArtifact({
    svg,
    assetType: isLowerThird ? "video" : "social",
    mode: input.mode,
    assetBasePath: input.assetBasePath,
  });
  validation.violations.push(...artifactValidation.violations);
  validation.warnings.push(...artifactValidation.warnings);
  validation.ok = validation.violations.length === 0;

  return { validation, layout, artifactValidation, svg };
}
