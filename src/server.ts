import { readFileSync } from "node:fs";
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
  policyOutputs: Record<string, unknown>;
  strictGenerationRules: string[];
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

const allowedFontFamilies = new Set([
  "Montserrat",
  "Anton",
  "Hind",
  "DM Mono",
]);

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

function normalizeHex(value: string) {
  const trimmed = value.trim().toUpperCase();
  if (/^[0-9A-F]{6}$/.test(trimmed)) return `#${trimmed}`;
  return trimmed;
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

function validateSpec(input: {
  colors?: string[];
  fonts?: string[];
  assetType?: string;
  widthPx?: number;
  heightPx?: number;
  usesLogo?: boolean;
  hasOfficialLogoAsset?: boolean;
}) {
  const violations: string[] = [];
  const warnings: string[] = [];

  for (const color of input.colors ?? []) {
    const normalized = normalizeHex(color);
    const isNamed = colorByName.has(color);
    const isHex = colorByHex.has(normalized);
    if (!isNamed && !isHex) {
      violations.push(`Color "${color}" is not in the CCC 2026 brand palette.`);
    }
  }

  for (const font of input.fonts ?? []) {
    const family = font.split(/[-,]/)[0]?.trim();
    if (!allowedFontFamilies.has(family)) {
      violations.push(`Font "${font}" is not approved. Use Montserrat, Anton, Hind, or DM Mono only.`);
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
    warnings.push("Official CCC logo asset was not provided. Leave a placeholder or request the approved logo file; do not redraw it.");
  }

  return {
    ok: violations.length === 0,
    violations,
    warnings,
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
    widthPx: z.number().int().positive().optional(),
    heightPx: z.number().int().positive().optional(),
    usesLogo: z.boolean().default(false),
    hasOfficialLogoAsset: z.boolean().default(false),
  },
  async (input) => {
    const result = validateSpec(input);
    return {
      content: [{ type: "text", text: asText(result) }],
    };
  },
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
      "- Subheads: Montserrat Medium, Montserrat Medium Italic, or Hind Medium",
      "- Body: Montserrat Regular or Montserrat Italic",
      "- Technical labels: DM Mono Regular",
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
  },
  async ({ template, headline, kicker, body, cta, includeLogoPlaceholder }) => {
    const preset = socialTemplates[template];
    const isLowerThird = template === "lower_third";
    const width = isLowerThird ? 1920 : brand.social.canonicalSize.widthPx;
    const height = isLowerThird ? 1080 : brand.social.canonicalSize.heightPx;
    const bg = getColor(preset.background);
    const accent = getColor(preset.accent);
    const text = getColor(preset.text);
    const inverseText = preset.background === "leila" ? getColor("baseWhite") : getColor("leila");
    const bodyText = body ?? "";
    const logo = includeLogoPlaceholder
      ? `<g aria-label="Official CCC logo placeholder"><rect x="${width - 294}" y="58" width="220" height="76" fill="none" stroke="${accent}" stroke-width="4"/><text x="${width - 274}" y="91" font-family="Montserrat" font-weight="700" font-size="24" fill="${inverseText}">CCC LOGO</text><text x="${width - 274}" y="119" font-family="Montserrat" font-weight="500" font-size="13" fill="${inverseText}">USE OFFICIAL ASSET</text></g>`
      : "";

    const headlineLines = wrapWords(headline, isLowerThird ? 34 : 18).slice(0, 4);
    const bodyLines = wrapWords(bodyText, isLowerThird ? 68 : 34).slice(0, 4);
    const headlineSvg = headlineLines
      .map((line, index) => `<text x="${isLowerThird ? 90 : 72}" y="${isLowerThird ? 840 + index * 62 : 346 + index * 82}" font-family="Montserrat" font-weight="700" font-size="${isLowerThird ? 54 : 72}" fill="${isLowerThird ? getColor("baseWhite") : inverseText}">${escapeXml(line)}</text>`)
      .join("\n");
    const bodySvg = bodyLines
      .map((line, index) => `<text x="${isLowerThird ? 90 : 76}" y="${isLowerThird ? 970 + index * 42 : 720 + index * 44}" font-family="Montserrat" font-weight="400" font-size="${isLowerThird ? 32 : 32}" fill="${isLowerThird ? text : inverseText}">${escapeXml(line)}</text>`)
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
  <polygon points="650,0 1080,0 1080,1080 505,1080" fill="${accent}"/>
  <rect x="0" y="948" width="${width}" height="132" fill="${preset.background === "leila" ? getColor("warmWhite") : getColor("leila")}"/>
  ${logo}
  <rect x="72" y="158" width="360" height="58" fill="${template === "statistic" ? getColor("leila") : getColor("marigold")}"/>
  <text x="96" y="196" font-family="DM Mono" font-size="24" fill="${template === "statistic" ? getColor("baseWhite") : getColor("leila")}">${escapeXml(kicker || preset.label)}</text>
  ${headlineSvg}
  ${bodySvg}
  <text x="72" y="1026" font-family="Montserrat" font-weight="600" font-size="28" fill="${preset.background === "leila" ? getColor("leila") : getColor("baseWhite")}">${escapeXml(cta || brand.social.requiredFooter)}</text>
</svg>`;

    const validation = validateSpec({
      colors: [bg, accent, text],
      fonts: ["Montserrat", "DM Mono"],
      assetType: isLowerThird ? "video" : "social",
      widthPx: width,
      heightPx: height,
      usesLogo: includeLogoPlaceholder,
      hasOfficialLogoAsset: false,
    });

    return {
      content: [
        { type: "text", text: asText({ validation, svg }) },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
