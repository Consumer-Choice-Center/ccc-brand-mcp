import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  asText,
  auditAssets,
  brand,
  createGenerationPrompt,
  createSocialSvg,
  getPostReferenceAssets,
  getBrandSection,
  postReferencePaths,
  qaSocialLayout,
  socialStyleVariants,
  socialTemplates,
  validateSvgArtifact,
  validateSpec,
} from "./brand.js";

const server = new McpServer({
  name: "ccc-brand-mcp",
  version: "0.3.0",
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
        styleVariants: socialStyleVariants,
        postReferences: postReferencePaths,
      }),
    },
  ],
}));

server.resource("ccc-post-references", "brand://ccc/post-references", async (uri) => {
  const references = getPostReferenceAssets();
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: asText({
          usage: "Reference-locked layout contracts. Preserve their geometry, typography slots, icons, watermark crop, CTA placement, and footer structure while replacing the wording.",
          references: references.map(({ svg, ...reference }) => reference),
        }),
      },
      ...references
        .filter((reference) => reference.exists && reference.svg)
        .map((reference) => ({
          uri: `${uri.href}/${reference.fileName.split("/").pop()}`,
          mimeType: "image/svg+xml",
          text: reference.svg ?? "",
        })),
    ],
  };
});

server.tool(
  "get_brand_guidelines",
  "Return CCC brand guidelines from the 2026 guide. Use this before generating any CCC-branded output.",
  {
    section: sectionSchema,
  },
  async ({ section }) => ({
    content: [{ type: "text", text: asText(getBrandSection(section)) }],
  }),
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
    hasOfficialLogoAsset: z.boolean().default(false).describe("Legacy hint only. Final validation requires officialLogoHref."),
    officialLogoHref: z.string().optional().describe("Optional href/path for an approved logo file listed in assets/manifest.json. If omitted, create_social_svg auto-selects a packaged official SVG logo."),
    assetBasePath: z.string().optional().describe("Optional asset directory used to verify officialLogoHref."),
    usesDecorativeElements: z.boolean().default(false),
  },
  async (input) => ({
    content: [{ type: "text", text: asText(validateSpec(input)) }],
  }),
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
  "validate_svg_artifact",
  "Validate a generated SVG artifact against CCC brand rules, including approved fonts, palette discipline, social dimensions, and official logo usage.",
  {
    svg: z.string().min(1).max(2_000_000).describe("Full standalone SVG markup to validate."),
    assetType: z.enum(["social", "video", "other"]).default("social"),
    mode: z.enum(["draft", "final"]).default("final"),
    requiresLogo: z.boolean().default(true),
    assetBasePath: z.string().optional().describe("Optional asset directory used to verify official logo references."),
  },
  async (input) => ({
    content: [{ type: "text", text: asText(validateSvgArtifact(input)) }],
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
  async ({ request, outputType, includeNegativePrompt }) => ({
    content: [{ type: "text", text: createGenerationPrompt({ request, outputType, includeNegativePrompt }) }],
  }),
);

server.tool(
  "create_social_svg",
  "Generate a CCC-branded SVG from one of four reference-locked social templates. The tool preserves the supplied reference geometry, real icon paths, watermark crop, type slots, action band, and footer; it replaces copy without textLength stretching.",
  {
    template: z.enum(["policy_alert", "statistic", "quote", "cta", "lower_third"]).default("policy_alert"),
    styleVariant: z.enum(["auto", "navy_poster", "petition_push", "orange_alert", "statistic_card", "contrast_cards"]).default("auto").describe("Optional CCC guide variant. auto maps petition/lawmaker asks to petition_push, policy alerts to orange_alert, statistics to statistic_card, and most other posts to navy_poster."),
    headline: z.string().min(1).max(120),
    leadIn: z.string().max(60).optional().describe("Optional reference-3 lead-in above the main headline, for example 'TELL YOUR LAWMAKERS:'. Omit to use that reference-locked default."),
    kicker: z.string().max(40).optional(),
    body: z.string().max(220).optional(),
    cta: z.string().max(80).optional(),
    comparisonLeft: z.string().max(120).optional().describe("Optional left-side copy for contrast_cards. Use for the BAD/NO policy position."),
    comparisonRight: z.string().max(120).optional().describe("Optional right-side copy for contrast_cards. Use for the GOOD/YES policy position."),
    variation: z.number().int().min(0).max(2).optional().describe("Compatibility field. Reference-locked social outputs preserve variation 0 geometry; choose another styleVariant for genuine layout variety."),
    includeLogoPlaceholder: z.boolean().default(true),
    officialLogoHref: z.string().optional().describe("Optional href/path for an approved logo file listed in assets/manifest.json. Defaults to a packaged official SVG logo chosen for the background."),
    assetBasePath: z.string().optional().describe("Optional asset directory used to verify officialLogoHref and default logo assets."),
    mode: z.enum(["draft", "final"]).default("draft"),
  },
  async ({ template, styleVariant, headline, leadIn, kicker, body, cta, comparisonLeft, comparisonRight, variation, includeLogoPlaceholder, officialLogoHref, assetBasePath, mode }) => ({
    content: [
      {
        type: "text",
        text: asText(createSocialSvg({ template, styleVariant, headline, leadIn, kicker, body, cta, comparisonLeft, comparisonRight, variation, includeLogoPlaceholder, officialLogoHref, assetBasePath, mode })),
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);
