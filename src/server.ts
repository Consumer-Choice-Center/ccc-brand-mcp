import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type BrandData = {
  brand: {
    name: string;
    shortName: string;
    tagline: string;
    positioning: {
      archetype: string;
      voice: string[];
      audienceAppeal: string;
    };
  };
  colors: Record<string, Record<string, string>>;
  typography: Record<string, unknown>;
  logo: Record<string, unknown>;
  social: {
    canonicalSize: { widthPx: number; heightPx: number };
    requiredFooter: string;
    commonPatterns: string[];
    guidance: string[];
  };
  video: Record<string, unknown>;
  visualSystem: {
    socialPosts: {
      defaultFeedSize: { widthPx: number; heightPx: number };
      safeMarginPx: number;
      footerHeightPx: number;
      maxHeadlineLines: number;
      maxBodyLines: number;
      headlineMaxCharactersPerLine: number;
      bodyMaxCharactersPerLine: number;
      ctaMaxCharactersPerLine: number;
    };
    videoGraphics: {
      horizontalSize: { widthPx: number; heightPx: number };
      verticalSize: { widthPx: number; heightPx: number };
      lowerThird: Record<string, unknown>;
    };
  };
  assets: {
    assetBaseEnvironmentVariable: string;
    defaultAssetDirectory: string;
    policy: string[];
    requiredFonts: Array<{
      family: string;
      weights: string[];
      fileNames: string[];
    }>;
    requiredLogos: Array<{
      id: string;
      usage: string;
      fileNames: string[];
    }>;
  };
  policyOutputs: Record<string, unknown>;
  strictGenerationRules: string[];
};

type ValidationMode = "draft" | "final";

type FontCheck = {
  input: string;
  family?: string;
  weight?: string;
  ok: boolean;
  message?: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandPath = resolve(__dirname, "../data/ccc-brand.json");
const brand = JSON.parse(readFileSync(brandPath, "utf8")) as BrandData;

const server = new McpServer({
  name: "ccc-brand-mcp",
  version: "0.1.0",
});

const sectionSchema = z
  .enum([
    "all",
    "colors",
    "typography",
    "logo",
    "social",
    "video",
    "policyOutputs",
    "strictGenerationRules",
  ])
  .default("all");

const colorEntries = Object.entries(brand.colors).flatMap(([group, colors]) =>
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

const socialTemplates = {
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

function asText(data: unknown) {
  return JSON.stringify(data, null, 2);
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

function resolveColor(value: string) {
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

function parseFontDescriptor(input: string): FontCheck {
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
    .find((candidate) => remainder.toLowerCase().startsWith(candidate.toLowerCase()));

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

function qaSocialLayout(input: {
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

function auditAssets(basePath?: string) {
  const base = getAssetBase(basePath);
  const fonts = brand.assets.requiredFonts.map((font) => {
    const files = font.fileNames.map((fileName) => ({
      fileName,
      path: resolve(base, fileName),
      exists: existsSync(resolve(base, fileName)),
    }));
    return {
      family: font.family,
      weights: font.weights,
      files,
      ok: files.every((file) => file.exists),
    };
  });
  const logos = brand.assets.requiredLogos.map((logo) => {
    const files = logo.fileNames.map((fileName) => ({
      fileName,
      path: resolve(base, fileName),
      exists: existsSync(resolve(base, fileName)),
    }));
    return {
      id: logo.id,
      usage: logo.usage,
      files,
      ok: files.some((file) => file.exists),
    };
  });

  const missingFonts = fonts.filter((font) => !font.ok).map((font) => font.family);
  const missingLogos = logos.filter((logo) => !logo.ok).map((logo) => logo.id);
  return {
    ok: missingFonts.length === 0 && missingLogos.length === 0,
    basePath: base,
    missingFonts,
    missingLogos,
    fonts,
    logos,
  };
}

function validateSpec(input: {
  colors?: string[];
  fonts?: string[];
  assetType?: string;
  mode?: ValidationMode;
  widthPx?: number;
  heightPx?: number;
  usesLogo?: boolean;
  hasOfficialLogoAsset?: boolean;
  usesDecorativeElements?: boolean;
}) {
  const violations: string[] = [];
  const warnings: string[] = [];
  const mode = input.mode ?? "final";
  const fontChecks: FontCheck[] = [];

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

  if (input.usesLogo && !input.hasOfficialLogoAsset) {
    severityPush(mode, violations, warnings, "Official CCC logo asset was not provided. Final output must use an approved logo file.");
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
  };
}

server.resource("ccc-brand-guidelines", "brand://ccc/guidelines", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: asText(brand),
    },
  ],
}));

server.resource("ccc-brand-colors", "brand://ccc/colors", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: asText(brand.colors),
    },
  ],
}));

server.resource("ccc-social-templates", "brand://ccc/social-templates", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: asText({
        canonicalSize: brand.social.canonicalSize,
        requiredFooter: brand.social.requiredFooter,
        templates: socialTemplates,
      }),
    },
  ],
}));

server.tool(
  "get_brand_guidelines",
  "Return CCC brand guidelines from the 2026 guide. Use this before generating any CCC-branded output.",
  {
    section: sectionSchema,
  },
  async ({ section }) => {
    const payload = section === "all" ? brand : brand[section];
    return {
      content: [{ type: "text", text: asText(payload) }],
    };
  },
);

server.tool(
  "validate_design_spec",
  "Validate a proposed design against the strict CCC 2026 brand palette, typography, logo, and format rules.",
  {
    colors: z.array(z.string()).default([]).describe("Color names or hex values used by the design."),
    fonts: z.array(z.string()).default([]).describe("Font families or font descriptors used by the design."),
    assetType: z.enum(["social", "video", "policyPrimer", "policyNote", "policyMemo", "coalitionLetter", "website", "ad", "other"]).default("other"),
    mode: z.enum(["draft", "final"]).default("final"),
    widthPx: z.number().int().positive().optional(),
    heightPx: z.number().int().positive().optional(),
    usesLogo: z.boolean().default(false),
    hasOfficialLogoAsset: z.boolean().default(false),
    usesDecorativeElements: z.boolean().default(false),
  },
  async (input) => {
    const result = validateSpec(input);
    return {
      content: [{ type: "text", text: asText(result) }],
    };
  },
);

server.tool(
  "audit_brand_assets",
  "Check whether required CCC logo and font assets are available for final branded output.",
  {
    basePath: z.string().optional().describe("Optional asset directory. Defaults to CCC_BRAND_ASSET_DIR or ./assets."),
  },
  async ({ basePath }) => ({
    content: [{ type: "text", text: asText(auditAssets(basePath)) }],
  }),
);

server.tool(
  "qa_social_layout",
  "Check whether social or lower-third copy fits CCC layout limits before generating SVG.",
  {
    template: z.enum(["policy_alert", "statistic", "quote", "cta", "lower_third"]).default("policy_alert"),
    headline: z.string().min(1).max(240),
    body: z.string().max(500).optional(),
    cta: z.string().max(160).optional(),
    mode: z.enum(["draft", "final"]).default("final"),
  },
  async ({ template, headline, body, cta, mode }) => ({
    content: [{ type: "text", text: asText(qaSocialLayout({ template, headline, body, cta, mode })) }],
  }),
);

server.tool(
  "create_generation_prompt",
  "Create a strict brand-locked prompt for another LLM or image/design model.",
  {
    request: z.string().min(1),
    outputType: z.enum(["social_post", "video_graphic", "policy_document", "website_section", "ad", "general"]).default("general"),
    includeNegativePrompt: z.boolean().default(true),
  },
  async ({ request, outputType, includeNegativePrompt }) => {
    const prompt = [
      `Create a ${outputType.replaceAll("_", " ")} for ${brand.brand.name}.`,
      `User request: ${request}`,
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

    if (outputType === "social_post") {
      prompt.push(
        "",
        `Social format: ${brand.social.canonicalSize.widthPx}x${brand.social.canonicalSize.heightPx}px.`,
        `Footer must include: ${brand.social.requiredFooter}.`,
      );
    }

    if (includeNegativePrompt) {
      prompt.push(
        "",
        "Negative prompt: off-palette colors, unapproved fonts, soft gradients, invented logo marks, distorted logo, generic corporate stock style, dense infographic clutter, decorative effects outside the guide, policy memo illustrations.",
      );
    }

    return {
      content: [{ type: "text", text: prompt.join("\n") }],
    };
  },
);

server.tool(
  "create_social_svg",
  "Generate a strict CCC-branded SVG layout for quick social or lower-third design drafts.",
  {
    template: z.enum(["policy_alert", "statistic", "quote", "cta", "lower_third"]).default("policy_alert"),
    headline: z.string().min(1).max(120),
    kicker: z.string().max(40).optional(),
    body: z.string().max(220).optional(),
    cta: z.string().max(80).optional(),
    includeLogoPlaceholder: z.boolean().default(true),
    officialLogoHref: z.string().optional().describe("Optional href/path for an official logo asset to place in the SVG."),
    mode: z.enum(["draft", "final"]).default("draft"),
  },
  async ({ template, headline, kicker, body, cta, includeLogoPlaceholder, officialLogoHref, mode }) => {
    const preset = socialTemplates[template];
    const isLowerThird = template === "lower_third";
    const width = isLowerThird ? 1920 : brand.social.canonicalSize.widthPx;
    const height = isLowerThird ? 1080 : brand.social.canonicalSize.heightPx;
    const footerHeight = brand.visualSystem.socialPosts.footerHeightPx;
    const footerY = height - footerHeight;
    const bg = getColor(preset.background);
    const accent = getColor(preset.accent);
    const text = getColor(preset.text);
    const inverseText = preset.background === "leila" ? getColor("baseWhite") : getColor("leila");
    const bodyText = body ?? "";
    const hasOfficialLogoAsset = Boolean(officialLogoHref);
    const logo = officialLogoHref
      ? `<image href="${escapeXml(officialLogoHref)}" x="${width - 294}" y="58" width="220" height="76" preserveAspectRatio="xMidYMid meet"/>`
      : includeLogoPlaceholder
      ? `<g aria-label="Official CCC logo placeholder"><rect x="${width - 294}" y="58" width="220" height="76" fill="none" stroke="${accent}" stroke-width="4"/><text x="${width - 274}" y="91" font-family="Montserrat" font-weight="700" font-size="24" fill="${inverseText}">CCC LOGO</text><text x="${width - 274}" y="119" font-family="Montserrat" font-weight="500" font-size="13" fill="${inverseText}">USE OFFICIAL ASSET</text></g>`
      : "";

    const layout = qaSocialLayout({ template, headline, body: bodyText, cta, mode });
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
  <text x="1430" y="846" font-family="DM Mono" font-size="24" fill="${getColor("leila")}">${escapeXml(kicker || preset.label)}</text>
  ${headlineSvg}
  ${bodySvg}
</svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CCC social post">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <polygon points="650,0 ${width},0 ${width},${height} 505,${height}" fill="${accent}"/>
  <rect x="0" y="${footerY}" width="${width}" height="${footerHeight}" fill="${preset.background === "leila" ? getColor("warmWhite") : getColor("leila")}"/>
  ${logo}
  <rect x="72" y="158" width="360" height="58" fill="${template === "statistic" ? getColor("leila") : getColor("marigold")}"/>
  <text x="96" y="196" font-family="DM Mono" font-size="24" fill="${template === "statistic" ? getColor("baseWhite") : getColor("leila")}">${escapeXml(kicker || preset.label)}</text>
  ${headlineSvg}
  ${bodySvg}
  <text x="72" y="${height - 54}" font-family="Montserrat" font-weight="600" font-size="28" fill="${preset.background === "leila" ? getColor("leila") : getColor("baseWhite")}">${escapeXml(cta || brand.social.requiredFooter)}</text>
</svg>`;

    const validation = validateSpec({
      colors: [bg, accent, text],
      fonts: ["Montserrat", "DM Mono"],
      assetType: isLowerThird ? "video" : "social",
      mode,
      widthPx: width,
      heightPx: height,
      usesLogo: true,
      hasOfficialLogoAsset,
    });
    validation.violations.push(...layout.violations);
    validation.warnings.push(...layout.warnings);
    validation.ok = validation.violations.length === 0;

    return {
      content: [
        { type: "text", text: asText({ validation, layout, svg }) },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
