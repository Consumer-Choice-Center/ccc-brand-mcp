import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
    background: "autumnOrange",
    accent: "leila",
    text: "leila",
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
  };
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
    "",
    "Visual composition:",
    "- Use hard-edged geometric panels, bands, and blocks.",
    "- Keep message hierarchy bold, direct, and uncluttered.",
    "- Use official CCC logo assets for final output; placeholders are draft-only.",
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
      "Negative prompt: off-palette colors, unapproved fonts, soft gradients, invented logo marks, distorted logo, generic corporate stock style, dense infographic clutter, decorative effects outside the guide, policy memo illustrations.",
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
  const logo = hasOfficialLogoAsset && input.officialLogoHref
    ? `<image href="${escapeXml(input.officialLogoHref)}" x="${width - 294}" y="58" width="220" height="76" preserveAspectRatio="xMidYMid meet"/>`
    : input.includeLogoPlaceholder
    ? `<g aria-label="Official CCC logo placeholder"><rect x="${width - 294}" y="58" width="220" height="76" fill="none" stroke="${accent}" stroke-width="4"/><text x="${width - 274}" y="91" font-family="Montserrat" font-weight="700" font-size="24" fill="${inverseText}">CCC LOGO</text><text x="${width - 274}" y="119" font-family="Montserrat" font-weight="500" font-size="13" fill="${inverseText}">USE OFFICIAL ASSET</text></g>`
    : "";

  const layout = qaSocialLayout({ template: input.template, headline: input.headline, body: bodyText, cta: input.cta, mode: input.mode });
  const headlineLines = layout.headline.lines;
  const bodyLines = layout.body.lines;
  const headlineSvg = headlineLines
    .map((line, index) => `<text x="${isLowerThird ? 90 : 72}" y="${isLowerThird ? 840 + index * 62 : 390 + index * 82}" font-family="Montserrat" font-weight="700" font-size="${isLowerThird ? 54 : 72}" fill="${isLowerThird ? getColor("baseWhite") : inverseText}">${escapeXml(line)}</text>`)
    .join("\n");
  const bodySvg = bodyLines
    .map((line, index) => `<text x="${isLowerThird ? 90 : 76}" y="${isLowerThird ? 970 + index * 42 : 790 + index * 44}" font-family="Montserrat" font-weight="400" font-size="${isLowerThird ? 32 : 32}" fill="${isLowerThird ? text : inverseText}">${escapeXml(line)}</text>`)
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
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <polygon points="650,0 ${width},0 ${width},${height} 505,${height}" fill="${accent}"/>
  <rect x="0" y="${footerY}" width="${width}" height="${footerHeight}" fill="${preset.background === "leila" ? getColor("warmWhite") : getColor("leila")}"/>
  ${logo}
  <rect x="72" y="158" width="360" height="58" fill="${input.template === "statistic" ? getColor("leila") : getColor("marigold")}"/>
  <text x="96" y="196" font-family="DM Mono" font-size="24" fill="${input.template === "statistic" ? getColor("baseWhite") : getColor("leila")}">${escapeXml(input.kicker || preset.label)}</text>
  ${headlineSvg}
  ${bodySvg}
  <text x="72" y="${height - 54}" font-family="Montserrat" font-weight="600" font-size="28" fill="${preset.background === "leila" ? getColor("leila") : getColor("baseWhite")}">${escapeXml(input.cta || brand.social.requiredFooter)}</text>
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
  validation.ok = validation.violations.length === 0;

  return { validation, layout, svg };
}
