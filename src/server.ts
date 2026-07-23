import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  asText,
  auditAssets,
  brand,
  createGenerationPrompt,
  createOnePagerBrief,
  createQuotePostSvg,
  createSocialSvg,
  getPostReferenceAssets,
  getOnePagerReferenceAssets,
  getOnePagerWorkingTemplateAssets,
  getBrandSection,
  materializeOnePagerWorkingTemplate,
  postReferencePaths,
  onePagerReferencePaths,
  onePagerTemplateIds,
  qaSocialLayout,
  quotePeople,
  quotePersonIds,
  socialStyleVariants,
  socialTemplates,
  validateSvgArtifact,
  validateIllustratorSvg,
  validateOnePagerFile,
  validateOnePagerSvg,
  validateSpec,
} from "./brand.js";
import { reviewSpelling } from "./spelling.js";

const server = new McpServer({
  name: "ccc-brand-mcp",
  version: "0.8.0",
});

const cccSpellingTerms = [
  brand.brand.name,
  brand.brand.shortName,
  brand.brand.tagline,
  "one-pager",
  "one-pagers",
  "short-term rentals",
  "consumerchoicecenter.org",
  ...quotePeople.flatMap((person) => [person.fullName, person.title, ...person.aliases]),
];

function correctTextInput<T extends Record<string, unknown>>(input: T, fields: Array<keyof T>) {
  const text = Object.fromEntries(
    fields
      .filter((field) => typeof input[field] === "string")
      .map((field) => [String(field), input[field] as string]),
  );
  const spelling = reviewSpelling(text, { extraTerms: cccSpellingTerms });
  const corrected = { ...input };
  for (const field of fields) {
    const replacement = spelling.correctedFields[String(field)];
    if (replacement !== undefined) corrected[field] = replacement as T[keyof T];
  }
  return { corrected, spelling };
}

function correctOnePagerInput<T extends {
  request: string;
  headline?: string;
  centralObject?: string;
  keyMessage?: string;
  sources: string[];
}>(input: T) {
  const fields: Record<string, string | undefined> = {
    request: input.request,
    headline: input.headline,
    centralObject: input.centralObject,
    keyMessage: input.keyMessage,
  };
  input.sources.forEach((source, index) => {
    fields[`sources[${index}]`] = source;
  });
  const spelling = reviewSpelling(fields, { extraTerms: cccSpellingTerms });
  return {
    corrected: {
      ...input,
      request: spelling.correctedFields.request,
      headline: spelling.correctedFields.headline,
      centralObject: spelling.correctedFields.centralObject,
      keyMessage: spelling.correctedFields.keyMessage,
      sources: input.sources.map((source, index) => spelling.correctedFields[`sources[${index}]`] ?? source),
    },
    spelling,
  };
}

const sectionSchema = z
  .enum([
    "all",
    "colors",
    "typography",
    "logo",
    "social",
    "video",
    "policyOutputs",
    "spelling",
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

server.resource("ccc-quote-people", "brand://ccc/quote-people", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "application/json",
      text: asText({
        usage: "Approved people for reference-5 quote posts. Match the requested person by id, full name, or alias; use the packaged portrait and verified attribution exactly.",
        sourceUrl: brand.visualSystem.socialPosts.quotePost.sourceUrl,
        verifiedOn: brand.visualSystem.socialPosts.quotePost.verifiedOn,
        people: quotePeople,
      }),
    },
  ],
}));

server.resource("ccc-one-pager-references", "brand://ccc/one-pager-references", async (uri) => {
  const references = getOnePagerReferenceAssets();
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: asText({
          usage: "Metadata for local visual references only. Never retrieve the multi-megabyte SVGs through chat. Call create_one_pager to materialize a clean working file, and inspect the returned local visualReferencePath only when visual comparison is needed.",
          canvas: brand.visualSystem.onePagers.canvas,
          lockedElements: brand.visualSystem.onePagers.lockedElements,
          mutableElements: brand.visualSystem.onePagers.mutableElements,
          illustrationRules: brand.visualSystem.onePagers.illustrationRules,
          typographyContracts: brand.visualSystem.onePagers.typographyContracts,
          componentLayoutRules: brand.visualSystem.onePagers.componentLayoutRules,
          templates: references.map(({ svg, ...reference }) => reference),
          referencePaths: onePagerReferencePaths,
        }),
      },
    ],
  };
});

server.resource("ccc-one-pager-working-templates", "brand://ccc/one-pager-working-templates", async (uri) => {
  const templates = getOnePagerWorkingTemplateAssets();
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: asText({
          usage: "Metadata only. Do not retrieve a working shell as SVG text. Call create_one_pager to materialize the complete clean shell directly into the shared workspace, then validate it by local path with validate_one_pager_file.",
          canvas: brand.visualSystem.onePagers.canvas,
          componentLayoutRules: brand.visualSystem.onePagers.componentLayoutRules,
          templates: templates.map(({ svg, ...template }) => template),
        }),
      },
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
  "Correct and visibly report spelling issues, then check whether the corrected social or lower-third copy fits CCC layout limits before generating SVG.",
  {
    template: z.enum(["policy_alert", "statistic", "quote", "cta", "lower_third"]).default("policy_alert"),
    headline: z.string().min(1).max(240),
    body: z.string().max(500).optional(),
    cta: z.string().max(160).optional(),
    mode: z.enum(["draft", "final"]).default("final"),
  },
  async (input) => {
    const { corrected, spelling } = correctTextInput(input, ["headline", "body", "cta"]);
    return {
      content: [{ type: "text", text: asText({ ...qaSocialLayout(corrected), spelling }) }],
    };
  },
);

server.tool(
  "validate_svg_artifact",
  "Validate a generated SVG artifact against CCC brand rules and the Illustrator-safe SVG 1.1 export contract, including approved fonts, palette discipline, social dimensions, embedded raster compatibility, and official logo usage.",
  {
    svg: z.string().min(1).max(4_000_000).describe("Full standalone SVG markup to validate."),
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
  "validate_illustrator_svg",
  "Reject browser-only SVG features that commonly trigger missing-link or plug-in warnings in Adobe Illustrator. Requires SVG 1.1, xlink:href base64 raster embedding, editable installed fonts, inline vector logos, and no live SVG filters.",
  {
    svg: z.string().min(1).max(12_000_000).describe("Full standalone SVG markup to check for Adobe Illustrator compatibility."),
    mode: z.enum(["draft", "final"]).default("final"),
  },
  async (input) => ({
    content: [{ type: "text", text: asText(validateIllustratorSvg(input)) }],
  }),
);

server.tool(
  "create_generation_prompt",
  "Correct and visibly report spelling issues, then create a strict brand-locked prompt for another LLM or image/design model using the corrected request.",
  {
    request: z.string().min(1),
    outputType: z.enum(["social_post", "one_pager", "video_graphic", "policy_document", "website_section", "ad", "general"]).default("general"),
    includeNegativePrompt: z.boolean().default(true),
  },
  async (input) => {
    const { corrected, spelling } = correctTextInput(input, ["request"]);
    const prompt = createGenerationPrompt(corrected);
    const spellingHeader = spelling.hasCorrections
      ? `${spelling.userNotice}\n${spelling.highlightedCorrections.join("\n")}`
      : spelling.userNotice;
    return {
      content: [{ type: "text", text: `${spellingHeader}\n\n${prompt}` }],
    };
  },
);

server.tool(
  "create_one_pager",
  "Correct and visibly report spelling issues in the request and supplied copy, then materialize a complete clean CCC one-pager working SVG directly into the shared local workspace. Returns a compact file path and SHA-256 instead of transferring the SVG through chat, preventing resource truncation. Edit that file in place, never append content to the populated visual reference, and validate by path with validate_one_pager_file.",
  {
    request: z.string().min(1).max(4000).describe("The policy topic, argument, audience, and evidence the one-pager must communicate."),
    template: z.enum(["auto", ...onePagerTemplateIds]).default("auto").describe("Use auto unless the request explicitly calls for the material/cost-chain or access/barriers composition."),
    headline: z.string().max(120).optional().describe("Optional final headline. It must fit the selected reference title slot."),
    centralObject: z.string().max(240).optional().describe("The physical object, product, device, building, or cutaway composite that should replace the source house/AC illustration."),
    keyMessage: z.string().max(280).optional().describe("Concise closing consumer-choice takeaway for the locked bottom navy panel."),
    sources: z.array(z.string().min(1).max(300)).max(12).default([]).describe("Named source citations for the locked footer source line. At least one is required in final mode."),
    outputFileName: z.string().min(5).max(140).regex(/^[a-z0-9][a-z0-9._-]*\.svg$/i).optional().describe("Optional plain SVG file name for the materialized shell. It is always written inside the configured CCC output directory."),
    mode: z.enum(["draft", "final"]).default("draft"),
  },
  async (input) => {
    const { corrected, spelling } = correctOnePagerInput(input);
    const workingFile = materializeOnePagerWorkingTemplate(corrected);
    const brief = createOnePagerBrief({
      ...corrected,
      workingFilePath: workingFile.outputPath,
      workingFileSha256: workingFile.sha256,
    });
    return {
      content: [
        { type: "text" as const, text: asText({ ...brief, spelling, workingFile }) },
      ],
    };
  },
);

server.tool(
  "validate_one_pager_file",
  "Validate a completed CCC one-pager directly from its local workspace file path. The MCP reads the SVG server-side and returns only a compact validation report, avoiding truncation of large SVG or embedded-image payloads. This includes both strict one-pager and Adobe Illustrator validation.",
  {
    filePath: z.string().min(1).max(1000).describe("Absolute path or CCC-workspace-relative path to the completed SVG file."),
    template: z.enum(onePagerTemplateIds).optional().describe("Expected locked one-pager template id."),
    mode: z.enum(["draft", "final"]).default("final"),
  },
  async (input) => ({
    content: [{ type: "text", text: asText(validateOnePagerFile(input)) }],
  }),
);

server.tool(
  "validate_one_pager_svg",
  "Compatibility validator for callers that already hold complete SVG markup. For normal one-pager workflows use validate_one_pager_file so large SVG and embedded-image payloads never pass through chat.",
  {
    svg: z.string().min(1).max(12_000_000).describe("Full standalone one-pager SVG markup."),
    template: z.enum(onePagerTemplateIds).optional().describe("Expected locked one-pager template id."),
    mode: z.enum(["draft", "final"]).default("final"),
  },
  async (input) => ({
    content: [{ type: "text", text: asText(validateOnePagerSvg(input)) }],
  }),
);

server.tool(
  "create_quote_post",
  "Correct and visibly report spelling issues in the supplied quote, then create a download-ready, Illustrator-safe SVG 1.1 CCC quote post for an approved team member using corrected text. Keeps text and portrait in protected non-overlapping zones, scales portrait prominence proportionally to quote length, contains the full uncropped portrait, embeds it through xlink:href, keeps text editable with packaged installed fonts, verifies the name/title, and always applies Autumn Orange emphasis.",
  {
    quote: z.string().min(1).max(150).describe("Exact quote text without surrounding quotation marks."),
    person: z.enum(quotePersonIds).describe("Approved quoted person. Read brand://ccc/quote-people when the user's name or role needs resolving."),
    emphasis: z.string().max(40).optional().describe("Optional word or short phrase from the quote. The generator highlights one matching meaningful word in Autumn Orange; if omitted or invalid, it selects one automatically so emphasis is never missing."),
    officialLogoHref: z.string().optional().describe("Optional approved CCC logo reference. Defaults to the packaged orange wide logo used on dark fields."),
    assetBasePath: z.string().optional().describe("Optional asset directory containing the template, portraits, logo, and fonts."),
    mode: z.enum(["draft", "final"]).default("draft"),
  },
  async (input) => {
    const { corrected, spelling } = correctTextInput(input, ["quote", "emphasis"]);
    return {
      content: [{ type: "text", text: asText({ ...createQuotePostSvg(corrected), spelling }) }],
    };
  },
);

server.tool(
  "create_social_svg",
  "Correct and visibly report spelling issues in all supplied copy, then generate an Illustrator-safe SVG 1.1 CCC artwork from the reference-locked social templates using only corrected text. This is the only supported social-post renderer: never recreate its SVG through a legacy or freeform generator. Outputs use editable packaged CCC fonts, native unscaled headline glyphs, inline vector logos, and xlink:href for embedded rasters. Any PNG preview must be rendered with the packaged files in assets/fonts; never accept a system-font fallback preview. For template=quote, provide person and put the quote in headline; the generator uses reference 5 with a non-overlapping, uncropped, fully embedded approved portrait, verified attribution, and mandatory orange emphasis.",
  {
    template: z.enum(["policy_alert", "statistic", "quote", "cta", "lower_third"]).default("policy_alert"),
    styleVariant: z.enum(["auto", "navy_poster", "petition_push", "orange_alert", "statistic_card", "contrast_cards", "quote_post"]).default("auto").describe("Optional CCC guide variant. auto maps quote posts to quote_post, petition/lawmaker asks to petition_push, policy alerts to orange_alert, statistics to statistic_card, and most other posts to navy_poster."),
    headline: z.string().min(1).max(150),
    leadIn: z.string().max(60).optional().describe("Optional reference-3 lead-in above the main headline, for example 'TELL YOUR LAWMAKERS:'. Omit to use that reference-locked default."),
    kicker: z.string().max(40).optional(),
    body: z.string().max(220).optional(),
    cta: z.string().max(80).optional(),
    comparisonLeft: z.string().max(120).optional().describe("Optional left-side copy for contrast_cards. Use for the BAD/NO policy position."),
    comparisonRight: z.string().max(120).optional().describe("Optional right-side copy for contrast_cards. Use for the GOOD/YES policy position."),
    person: z.enum(quotePersonIds).optional().describe("Required for template=quote. The approved person whose packaged portrait, full name, and current CCC title will be used."),
    emphasis: z.string().max(40).optional().describe("Optional exact quote word or phrase to emphasize in Autumn Orange."),
    variation: z.number().int().min(0).max(2).optional().describe("Compatibility field. Reference-locked social outputs preserve variation 0 geometry; choose another styleVariant for genuine layout variety."),
    includeLogoPlaceholder: z.boolean().default(true),
    officialLogoHref: z.string().optional().describe("Optional href/path for an approved logo file listed in assets/manifest.json. Defaults to a packaged official SVG logo chosen for the background."),
    assetBasePath: z.string().optional().describe("Optional asset directory used to verify officialLogoHref and default logo assets."),
    mode: z.enum(["draft", "final"]).default("draft"),
  },
  async (input) => {
    const { corrected, spelling } = correctTextInput(input, [
      "headline",
      "leadIn",
      "kicker",
      "body",
      "cta",
      "comparisonLeft",
      "comparisonRight",
      "emphasis",
    ]);
    return {
      content: [
        {
          type: "text",
          text: asText({ ...createSocialSvg(corrected), spelling }),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
