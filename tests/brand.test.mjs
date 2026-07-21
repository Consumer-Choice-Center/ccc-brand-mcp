import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  auditAssets,
  brand,
  createGenerationPrompt,
  createOnePagerBrief,
  createQuotePostSvg,
  createSocialSvg,
  getPostReferenceAssets,
  getOnePagerReferenceAssets,
  parseFontDescriptor,
  postReferencePaths,
  onePagerReferencePaths,
  onePagerTemplates,
  qaSocialLayout,
  quotePeople,
  quotePersonIds,
  resolveQuotePerson,
  resolveColor,
  validateIllustratorSvg,
  validateSvgArtifact,
  validateOnePagerSvg,
  validateLogoHref,
  validateSpec,
} from "../dist/brand.js";

test("brand data uses one canonical social size", () => {
  assert.deepEqual(brand.social.canonicalSize, { widthPx: 1080, heightPx: 1350 });
  assert.deepEqual(brand.visualSystem.socialPosts.defaultFeedSize, { widthPx: 1080, heightPx: 1350 });
  assert.equal(brand.strictGenerationRules.some((rule) => rule.includes("1080x1080")), false);
});

test("color and font validation rejects off-brand values", () => {
  assert.equal(resolveColor("Autumn Orange"), "#E95C1F");
  assert.equal(resolveColor("#22264e"), "#22264E");
  assert.equal(parseFontDescriptor("Montserrat Bold").ok, true);
  assert.equal(parseFontDescriptor("Montserrat Boldish").ok, false);

  const result = validateSpec({
    colors: ["#E95C1F", "#123456"],
    fonts: ["Montserrat Bold", "Arial"],
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /#123456/);
  assert.match(result.violations.join("\n"), /Arial/);
});

test("logo references must be approved and present for final output", () => {
  const emptyAssets = join(tmpdir(), `ccc-brand-assets-empty-${Date.now()}`);
  mkdirSync(join(emptyAssets, "logos"), { recursive: true });

  const missing = validateSpec({
    mode: "final",
    usesLogo: true,
    officialLogoHref: "logos/ccc-wide-orange.svg",
    assetBasePath: emptyAssets,
  });

  assert.equal(missing.ok, false);
  assert.match(missing.violations.join("\n"), /missing/);

  const draft = validateSpec({
    mode: "draft",
    usesLogo: true,
  });

  assert.equal(draft.ok, true);
  assert.match(draft.warnings.join("\n"), /Official CCC logo asset/);

  const legacyHint = validateSpec({
    mode: "final",
    usesLogo: true,
    hasOfficialLogoAsset: true,
  });

  assert.equal(legacyHint.ok, false);
  assert.match(legacyHint.warnings.join("\n"), /legacy hint/);

  const tempAssets = join(tmpdir(), `ccc-brand-assets-${Date.now()}`);
  mkdirSync(join(tempAssets, "logos"), { recursive: true });
  writeFileSync(join(tempAssets, "logos", "ccc-wide-orange.svg"), "<svg/>");

  const present = validateLogoHref("logos/ccc-wide-orange.svg", tempAssets);
  assert.equal(present.ok, true);
  assert.equal(present.approvedPath, "logos/ccc-wide-orange.svg");
});

test("social prompts and SVGs use 1080x1350", () => {
  const prompt = createGenerationPrompt({
    request: "Create a consumer choice quote card",
    outputType: "social_post",
    includeNegativePrompt: true,
  });

  assert.match(prompt, /1080x1350/);
  assert.doesNotMatch(prompt, /1080x1080/);
  assert.match(prompt, /logos\/ccc-wide-orange\.svg/);

  const result = createSocialSvg({
    template: "quote",
    headline: "Choice matters because consumers deserve policies that protect opportunity",
    person: "yael",
    emphasis: "opportunity",
    includeLogoPlaceholder: true,
    mode: "draft",
  });

  assert.match(result.svg, /width="1080"/);
  assert.match(result.svg, /height="1350"/);
  assert.match(result.svg, /data-ccc-style="guide-social"/);
  assert.match(result.svg, /data-ccc-variant="quote_post"/);
  assert.match(result.svg, /data-ccc-reference-system="reference-5"/);
  assert.match(result.svg, /data-ccc-layout-lock="reference-exact"/);
  assert.match(result.svg, /data-ccc-variation="0"/);
  assert.match(result.svg, /data-ccc-watermark-source="packaged-reference"/);
  assert.match(result.svg, /data-ccc-role="reference-headline"/);
  assert.match(result.svg, /data-ccc-role="quote-portrait"/);
  assert.match(result.svg, /data-ccc-role="quote-attribution"/);
  assert.match(result.svg, /data-ccc-quote-person="yael"/);
  assert.match(result.svg, />Yaël Ossowski</);
  assert.match(result.svg, />Deputy Director</);
  assert.match(result.svg, /font-family="Anton"/);
  assert.doesNotMatch(result.svg, /textLength=/);
  assert.match(result.svg, /data-ccc-font-policy="editable-installed"/);
  assert.match(result.svg, /data-ccc-export="illustrator-svg-1\.1"/);
  assert.doesNotMatch(result.svg, /data:font\//);
  assert.doesNotMatch(result.svg, /CCC LOGO/);
  assert.equal(result.selectedLogoHref, "logos/ccc-wide-orange.svg");
  assert.equal(result.styleVariant, "quote_post");
  assert.equal(result.validation.ok, true);
});

test("social SVG generation varies guide style variants", () => {
  const policy = createSocialSvg({
    template: "policy_alert",
    headline: "Choice is not optional",
    body: "Protect consumer choice",
    includeLogoPlaceholder: true,
    mode: "draft",
  });
  const stat = createSocialSvg({
    template: "statistic",
    headline: "72% support choice",
    body: "Policy should target harm",
    includeLogoPlaceholder: true,
    mode: "draft",
  });
  const contrast = createSocialSvg({
    template: "cta",
    styleVariant: "contrast_cards",
    headline: "Bad policy good policy",
    body: "Regulate risk. Protect choice.",
    includeLogoPlaceholder: true,
    mode: "draft",
  });

  assert.equal(policy.styleVariant, "petition_push");
  assert.equal(stat.styleVariant, "statistic_card");
  assert.equal(contrast.styleVariant, "contrast_cards");
  assert.match(policy.svg, /data-ccc-variant="petition_push"/);
  assert.match(policy.svg, /data-ccc-density="high"/);
  assert.match(policy.svg, /data-ccc-has-action-band="true"/);
  assert.match(policy.svg, /data-ccc-has-stacked-blocks="true"/);
  assert.match(policy.svg, /data-ccc-has-petition-marker="true"/);
  assert.match(policy.svg, /data-ccc-reference-system="reference-3"/);
  assert.match(stat.svg, /font-size="159\.61"/);
  assert.doesNotMatch(stat.svg, /textLength=/);
  assert.match(stat.svg, /data-ccc-reference-system="reference-2"/);
  assert.match(stat.svg, /data-ccc-has-large-stat="true"/);
  assert.match(contrast.svg, />BAD</);
  assert.match(contrast.svg, />GOOD</);
  assert.match(contrast.svg, /data-ccc-reference-system="reference-4"/);
  assert.match(contrast.svg, /data-ccc-has-contrast-cards="true"/);
  assert.match(contrast.svg, /font-family="Anton"/);
  assert.match(policy.svg, /data-ccc-watermark-source="packaged-reference"/);
  assert.match(policy.svg, /data-ccc-role-icon="reference-megaphone"/);
  assert.equal(policy.validation.ok, true);
  assert.equal(stat.validation.ok, true);
  assert.equal(contrast.validation.ok, true);
});

test("post reference SVGs are packaged as MCP layout contracts", () => {
  assert.equal(postReferencePaths.length, 5);
  const references = getPostReferenceAssets();

  assert.equal(references.length, 5);
  for (const reference of references) {
    assert.equal(reference.exists, true);
    assert.match(reference.fileName, /^post-references\/(?:ccc-post-reference-[1-4]|ccc-quote-post-template)\.svg$/);
    assert.match(reference.role, /reference-locked layout contract/);
    assert.match(reference.svg, /<svg/i);
  }
});

test("one-pager references are packaged as strict full-page layout contracts", () => {
  assert.deepEqual(onePagerReferencePaths, [
    "one-pager-references/ccc-tariffs-american-home.svg",
    "one-pager-references/ccc-cooling-europe.svg",
  ]);
  assert.equal(onePagerTemplates.length, 2);
  const references = getOnePagerReferenceAssets();

  assert.equal(references.length, 2);
  for (const reference of references) {
    assert.equal(reference.exists, true);
    assert.match(reference.role, /strict one-pager layout contract/);
    assert.match(reference.svg, /viewBox="0 0 1186\.51 1535\.49"/i);
    assert.match(reference.svg, /data:image\/png;base64,/i);
    assert.ok(reference.svg.length > 2_000_000);
  }
});

test("one-pager briefs select a locked composition and contextual object grammar", () => {
  const material = createOnePagerBrief({
    request: "Show how tariffs on battery components raise the cost of an electric vehicle.",
    centralObject: "a cutaway electric vehicle and battery pack",
    sources: ["USITC tariff data"],
    mode: "final",
  });
  const access = createOnePagerBrief({
    request: "Explain how permits and condominium approvals block heat-pump access.",
    centralObject: "a cutaway apartment building with a heat-pump system",
    sources: ["European Environment Agency"],
    mode: "final",
  });

  assert.equal(material.ok, true);
  assert.equal(material.template.id, "material_cost_chain");
  assert.equal(access.template.id, "access_barriers");
  assert.match(material.prompt, /Start from the supplied SVG itself/);
  assert.match(material.prompt, /base64 data:image URI/);
  assert.match(material.prompt, /xlink:href/);
  assert.match(material.prompt, /Never cover headline, callout, statistic, takeaway, source, or logo text/);
  assert.match(material.prompt, /font-family, font-weight, font-style, and font-size/);
  assert.match(material.prompt, /shaft-arrowhead/);
  assert.match(material.prompt, /at least 24 reference units/);
  assert.match(material.prompt, /data-ccc-text-safe-box/);
  assert.match(material.prompt, /stroke-dasharray="6 7"/);
  assert.equal(createOnePagerBrief({ request: "A policy topic", mode: "final" }).ok, false);
});

test("one-pager SVG validation enforces the locked canvas, regions, and embedded object", () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 1186.51 1535.49" data-ccc-export="illustrator-svg-1.1" data-ccc-font-policy="editable-installed" data-ccc-asset="one-pager" data-ccc-layout-lock="one-pager-reference-exact" data-ccc-one-pager-template="material_cost_chain" data-ccc-typography-contract="material_cost_chain-reference" data-ccc-component-grid="reference-spaced">
    <rect width="1186.51" height="1000" fill="#15192E"/><rect y="1000" width="1186.51" height="535.49" fill="#FFF7EF"/><path fill="#E95C1F" d="M0 0h20v20H0z"/>
    <g data-ccc-role="one-pager-title" data-ccc-component="title" data-ccc-bounds="20 20 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="30 30 160 160">
      <text data-ccc-type-role="page-kicker" font-family="DM Mono" font-size="15" font-weight="400" fill="#FFFFFF">LABEL</text>
      <text data-ccc-type-role="display-title" font-family="Anton" font-size="72" font-weight="400" fill="#FFFFFF">TITLE</text>
    </g>
    <g data-ccc-role="one-pager-central-illustration" data-ccc-component="object" data-ccc-bounds="240 20 180 180" data-ccc-text-inset="0 0 0 0"><image xlink:href="data:image/png;base64,AAAA"/></g>
    <g data-ccc-role="one-pager-callouts" data-ccc-component="callouts" data-ccc-bounds="460 20 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="470 30 160 160">
      <text data-ccc-type-role="callout-title" font-family="Montserrat" font-size="18" font-weight="700" font-style="italic" fill="#FFFFFF">CALLOUT</text>
      <text data-ccc-type-role="callout-body" font-family="Montserrat" font-size="15" font-weight="600" fill="#FFFFFF">BODY</text>
    </g>
    <g data-ccc-role="one-pager-lead-stat" data-ccc-component="lead" data-ccc-bounds="680 20 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="690 30 160 160"><text data-ccc-type-role="lead-stat" font-family="Anton" font-size="50" font-weight="400" fill="#FFFFFF">42%</text></g>
    <g data-ccc-role="one-pager-evidence-cards" data-ccc-component="evidence" data-ccc-bounds="20 240 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="30 250 160 160">
      <text data-ccc-type-role="section-heading" font-family="Montserrat" font-size="36" font-weight="800" font-style="italic" fill="#FFFFFF">EVIDENCE</text>
      <text data-ccc-type-role="evidence-number" font-family="Anton" font-size="49" font-weight="400" fill="#FFFFFF">27</text>
      <text data-ccc-type-role="evidence-body" font-family="Montserrat" font-size="15" font-weight="600" fill="#FFFFFF">STATES</text>
    </g>
    <g data-ccc-role="one-pager-takeaway" data-ccc-component="takeaway" data-ccc-bounds="240 240 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="250 250 160 160">
      <text data-ccc-type-role="takeaway-heading" font-family="Montserrat" font-size="27" font-weight="700" fill="#FFFFFF">TAKEAWAY</text>
      <text data-ccc-type-role="takeaway-body" font-family="Montserrat" font-size="14" font-weight="400" fill="#FFFFFF">BODY</text>
    </g>
    <g data-ccc-role="one-pager-sources" data-ccc-component="sources" data-ccc-bounds="460 240 180 180" data-ccc-text-inset="10 10 10 10" data-ccc-text-safe-box="470 250 160 160"><text data-ccc-type-role="source" font-family="DM Mono" font-size="10.5" font-weight="400" fill="#FFFFFF">SOURCE</text></g>
    <g data-ccc-role="one-pager-logo" data-ccc-component="logo" data-ccc-bounds="680 240 180 180" data-ccc-text-inset="0 0 0 0"/>
    <g data-ccc-connector="shaft-arrowhead"><path d="M1 1L20 20" stroke="#FFF7EF" stroke-width="3" stroke-dasharray="6 7"/><polygon points="20,20 15,18 18,15" fill="#FFF7EF"/><polygon points="1,1 5,3 3,5" fill="#FFF7EF"/></g>
    <g data-ccc-connector="shaft-arrowhead"><path d="M1 1L20 20" stroke="#E95C1F" stroke-width="3" stroke-dasharray="6 7"/><polygon points="20,20 15,18 18,15" fill="#E95C1F"/><polygon points="1,1 5,3 3,5" fill="#E95C1F"/></g>
    <g data-ccc-connector="shaft-arrowhead"><path d="M1 1L20 20" stroke="#E95C1F" stroke-width="3" stroke-dasharray="6 7"/><polygon points="20,20 15,18 18,15" fill="#E95C1F"/><polygon points="1,1 5,3 3,5" fill="#E95C1F"/></g>
  </svg>`;
  const valid = validateOnePagerSvg({ svg, template: "material_cost_chain", mode: "final" });
  const invalid = validateOnePagerSvg({ svg: svg.replace("0 0 1186.51 1535.49", "0 0 1080 1350").replace("data:image/png;base64,AAAA", "object.png"), mode: "final" });
  const typographyInvalid = validateOnePagerSvg({ svg: svg.replace('data-ccc-type-role="callout-title" font-family="Montserrat" font-size="18"', 'data-ccc-type-role="callout-title" font-family="Anton" font-size="20"'), mode: "final" });
  const accessWithGeorgia = validateOnePagerSvg({
    svg: svg
      .replaceAll("material_cost_chain", "access_barriers")
      .replace('data-ccc-type-role="display-title" font-family="Anton"', 'data-ccc-type-role="display-title" font-family="Georgia"'),
    template: "access_barriers",
    mode: "final",
  });
  const crowded = validateOnePagerSvg({ svg: svg.replace('data-ccc-bounds="240 20 180 180"', 'data-ccc-bounds="190 20 180 180"'), mode: "final" });
  const unsafeText = validateOnePagerSvg({ svg: svg.replace('data-ccc-text-safe-box="30 30 160 160"', 'data-ccc-text-safe-box="10 10 250 250"'), mode: "final" });
  const dirtyArrow = validateOnePagerSvg({ svg: svg.replace('stroke-dasharray="6 7"', 'stroke-dasharray="8 8"'), mode: "final" });
  const markerArrow = validateOnePagerSvg({ svg: svg.replace('stroke="#FFF7EF" stroke-width="3"', 'stroke="#FFF7EF" stroke-width="3" marker-end="url(#arrow)"'), mode: "final" });

  assert.equal(valid.ok, true);
  assert.equal(valid.hasEmbeddedImages, true);
  assert.equal(invalid.ok, false);
  assert.match(invalid.violations.join("\n"), /viewBox must remain exactly/);
  assert.match(invalid.violations.join("\n"), /embedded base64/);
  assert.match(typographyInvalid.violations.join("\n"), /inconsistent roles: callout-title/);
  assert.match(accessWithGeorgia.violations.join("\n"), /inconsistent roles: display-title/);
  assert.match(accessWithGeorgia.violations.join("\n"), /fonts outside the two supplied references: Georgia/);
  assert.match(crowded.violations.join("\n"), /overlap or have less than the 24-unit reference gutter/);
  assert.match(unsafeText.violations.join("\n"), /text-safe boxes outside components: title/);
  assert.match(dirtyArrow.violations.join("\n"), /clean Illustrator-safe connector groups/);
  assert.match(markerArrow.violations.join("\n"), /must not rely on SVG markers/);
});

test("Illustrator SVG validation rejects browser-only links, embedded web fonts, and live filters", () => {
  const incompatible = validateIllustratorSvg({
    mode: "final",
    svg: `<svg xmlns="http://www.w3.org/2000/svg"><defs><style>@font-face{font-family:'Anton';src:url(data:font/ttf;base64,AAAA)}</style><filter id="shadow"><feDropShadow/></filter></defs><image href="data:image/png;base64,AAAA" filter="url(#shadow)"/></svg>`,
  });
  const compatible = validateIllustratorSvg({
    mode: "final",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" data-ccc-export="illustrator-svg-1.1" data-ccc-font-policy="editable-installed"><image xlink:href="data:image/png;base64,AAAA"/></svg>`,
  });

  assert.equal(incompatible.ok, false);
  assert.match(incompatible.violations.join("\n"), /data:font/);
  assert.match(incompatible.violations.join("\n"), /xlink:href/);
  assert.match(incompatible.violations.join("\n"), /live SVG filter/);
  assert.equal(compatible.ok, true);
});

test("generated SVG artifacts are linted for brand drift", () => {
  const result = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#FFF7EF"/>
      <rect width="400" height="400" fill="#22264E"/>
      <rect x="400" width="400" height="400" fill="#E95C1F"/>
      <rect y="400" width="400" height="400" fill="#E7ECF4"/>
      <rect x="400" y="400" width="400" height="400" fill="#F4B544"/>
      <rect y="800" width="400" height="400" fill="#B9473A"/>
      <text x="40" y="80" font-family="Montserrat, Arial, sans-serif" fill="#FFFFFF">CCC LOGO</text>
    </svg>`,
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /Arial/);
  assert.match(result.violations.join("\n"), /sans-serif/);
  assert.match(result.violations.join("\n"), /Color system is overloaded/);
  assert.match(result.violations.join("\n"), /logo placeholder/i);
  assert.match(result.violations.join("\n"), /verified official CCC logo/);
  assert.match(result.violations.join("\n"), /gradient CCC mark geometry/);
});

test("generated SVG artifacts reject weak large social headline type", () => {
  const result = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#22264E"/>
      <defs><linearGradient id="ccc-watermark-gradient" data-ccc-watermark-gradient="semi-transparent"><stop offset="0%" stop-color="#6F789B" stop-opacity="0.06"/><stop offset="100%" stop-color="#E95C1F" stop-opacity="0.2"/></linearGradient></defs>
      <g data-ccc-watermark="gradient-ring"><circle cx="900" cy="590" r="300" fill="none" stroke="url(#ccc-watermark-gradient)"/></g>
      <image href="logos/ccc-wide-orange.svg" data-ccc-logo-href="logos/ccc-wide-orange.svg" x="786" y="58" width="220" height="76"/>
      <text x="72" y="320" font-family="Montserrat" font-weight="400" font-size="96" fill="#FFFFFF">CHOICE ISN'T</text>
      <text x="72" y="430" font-family="Montserrat" font-weight="400" font-size="96" fill="#E95C1F">OPTIONAL</text>
    </svg>`,
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /thin or regular Montserrat/);
  assert.match(result.violations.join("\n"), /Concentric-circle watermark geometry/);
});

test("petition push SVGs require dense guide structure", () => {
  const result = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" data-ccc-variant="petition_push" data-ccc-density="high" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#E95C1F"/>
      <defs><linearGradient id="ccc-watermark-gradient" data-ccc-watermark-gradient="semi-transparent"><stop offset="0%" stop-color="#F4B544" stop-opacity="0.06"/><stop offset="100%" stop-color="#E95C1F" stop-opacity="0.2"/></linearGradient></defs>
      <g data-ccc-watermark="gradient-ring"><circle cx="900" cy="590" r="300" fill="none" stroke="url(#ccc-watermark-gradient)"/></g>
      <image href="logos/ccc-wide-leila.svg" data-ccc-logo-href="logos/ccc-wide-leila.svg" x="786" y="58" width="220" height="76"/>
      <text x="72" y="320" font-family="Montserrat" font-weight="700" font-size="96" fill="#FFFFFF">CHOICE ISN'T</text>
      <text x="72" y="430" font-family="Montserrat" font-weight="700" font-size="96" fill="#22264E">OPTIONAL</text>
    </svg>`,
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /petition_push.*stacked headline blocks.*action band.*petition marker/);
});

test("generated SVG artifacts reject old split-panel serif style", () => {
  const result = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#22264E"/>
      <polygon points="480,0 1080,0 1080,1350 420,1350" fill="#E95C1F"/>
      <text x="72" y="360" font-family="Georgia" font-size="96" fill="#FFFFFF">CHOICE</text>
      <text x="72" y="1280" font-family="DM Mono" fill="#FFFFFF">consumerchoicecenter.org</text>
    </svg>`,
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /Georgia/);
  assert.match(result.violations.join("\n"), /large full-height diagonal split composition/);
  assert.match(result.violations.join("\n"), /gradient CCC mark geometry/);
});

test("final SVG generation embeds a verified logo asset reference", () => {
  const packagedAssets = join(process.cwd(), "assets");

  const result = createSocialSvg({
    template: "quote",
    headline: "Choice matters because consumers deserve opportunity",
    person: "bill",
    includeLogoPlaceholder: true,
    officialLogoHref: "logos/ccc-wide-orange.svg",
    assetBasePath: packagedAssets,
    mode: "final",
  });

  assert.equal(result.validation.ok, true);
  assert.match(result.svg, /data-ccc-logo-href="logos\/ccc-wide-orange.svg"/);
  assert.match(result.svg, /data-ccc-style="guide-social"/);
  assert.match(result.svg, /data-ccc-layout-lock="reference-exact"/);
  assert.match(result.svg, /data-ccc-watermark-source="packaged-reference"/);
  assert.match(result.svg, /data-ccc-reference-system="reference-5"/);
  assert.match(result.svg, /data-ccc-quote-person="bill"/);
  assert.doesNotMatch(result.svg, /CCC LOGO/);

  const artifact = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: result.svg,
    assetBasePath: packagedAssets,
  });
  assert.equal(artifact.ok, true);
});

test("final SVG generation fails when packaged editable fonts are missing", () => {
  const tempAssets = join(tmpdir(), `ccc-brand-assets-no-fonts-${Date.now()}`);
  mkdirSync(join(tempAssets, "logos"), { recursive: true });
  writeFileSync(join(tempAssets, "logos", "ccc-wide-orange.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 76"/>`);

  const result = createSocialSvg({
    template: "cta",
    headline: "Choice matters",
    includeLogoPlaceholder: true,
    officialLogoHref: "logos/ccc-wide-orange.svg",
    assetBasePath: tempAssets,
    mode: "final",
  });

  assert.equal(result.validation.ok, false);
  assert.match(result.validation.violations.join("\n"), /Required packaged editable fonts are missing/);
  assert.match(result.validation.violations.join("\n"), /Anton-Regular\.ttf/);
});

test("layout QA escalates overflow in final mode", () => {
  const result = qaSocialLayout({
    template: "policy_alert",
    headline: "This headline is intentionally far too long for the strict social media layout rules",
    mode: "final",
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /Headline exceeds/);
});

test("asset audit cross-checks manifest and expected files", () => {
  const result = auditAssets();

  assert.equal(result.ok, true);
  assert.deepEqual(result.missingFonts, []);
  assert.deepEqual(result.missingLogos, []);
  assert.deepEqual(result.missingQuotePeople, []);
  assert.deepEqual(result.missingOnePagerReferences, []);
  assert.deepEqual(result.manifestMissingFromBrand.fonts, []);
  assert.deepEqual(result.manifestMissingFromBrand.logos, []);
  assert.deepEqual(result.manifestMissingFromBrand.quotePeople, []);
  assert.deepEqual(result.manifestMissingFromBrand.onePagers, []);
});

test("quote people resolve from ids, names, aliases, and diacritics", () => {
  assert.deepEqual(quotePersonIds, ["bill", "david", "emil", "fabio", "fred", "stephen", "yael", "zoltan"]);
  assert.equal(quotePeople.length, 8);
  assert.equal(resolveQuotePerson("Yaël Ossowski")?.id, "yael");
  assert.equal(resolveQuotePerson("yael")?.fullName, "Yaël Ossowski");
  assert.equal(resolveQuotePerson("Zoltan Kesz")?.fullName, "Zoltán Kész");
  assert.equal(resolveQuotePerson("Stephen Kent")?.title, "Media Director");
  assert.equal(resolveQuotePerson("not a team member"), undefined);
  assert.equal(quotePeople.every((person) => person.portraitFit === "xMaxYMax meet"), true);
  assert.equal(quotePeople.every((person) => person.portraitReferenceWidth >= 650 && person.portraitReferenceWidth <= 813), true);
  assert.equal(quotePeople.every((person) => person.portraitReferenceMaxWidth >= person.portraitReferenceWidth && person.portraitReferenceMaxWidth <= 813), true);
});

test("dedicated quote generator uses the supplied template and matching portrait", () => {
  const result = createQuotePostSvg({
    quote: "Smart policy protects consumers without eliminating their choices.",
    person: "David Clement",
    emphasis: "choices",
    mode: "final",
  });

  assert.equal(result.validation.ok, true);
  assert.equal(result.artifactValidation.ok, true);
  assert.equal(result.person.id, "david");
  assert.equal(result.person.fullName, "David Clement");
  assert.equal(result.person.title, "Policy Director");
  assert.equal(result.referenceSystem, "reference-5");
  assert.equal(result.styleVariant, "quote_post");
  assert.equal(result.artifactValidation.hasQuoteWatermark, true);
  assert.equal(result.artifactValidation.hasQuoteReferencePalette, true);
  assert.equal(result.artifactValidation.hasSeparatedQuoteZones, true);
  assert.equal(result.artifactValidation.hasProportionalQuotePortrait, true);
  assert.equal(result.artifactValidation.hasUncroppedQuotePortrait, true);
  assert.equal(result.artifactValidation.hasEmbeddedQuotePortrait, true);
  assert.equal(result.artifactValidation.hasQuoteOrangeEmphasis, true);
  assert.match(result.svg, /data-ccc-portrait-file="quote-people\/david-clement\.svg"/);
  assert.match(result.svg, /data:image\/png;base64,/);
  assert.match(result.svg, /data-ccc-quote-safe-zones="reference-columns"/);
  assert.match(result.svg, /data-ccc-portrait-policy="contain-no-crop"/);
  assert.match(result.svg, /data-ccc-portrait-embedded="true"/);
  assert.match(result.svg, /preserveAspectRatio="xMaxYMax meet"/);
  assert.doesNotMatch(result.svg, /data-ccc-role="quote-portrait"[^>]*clip-path=/);
  assert.doesNotMatch(result.svg, /<image[^>]+href="quote-people\//);
  assert.match(result.svg, /data-ccc-quote-background="#15192E"/i);
  assert.match(result.svg, /data-ccc-quote-watermark-color="#22274E"/i);
  assert.match(result.svg, /data-ccc-role="quote-watermark"/i);
  assert.match(result.svg, /\.cls-2\{fill:#15192E;\}/i);
  assert.match(result.svg, /stop-color="#22274E"/i);
  assert.match(result.svg, /<tspan data-ccc-role="quote-emphasis" fill="#E95C1F">choices<\/tspan>/i);
  assert.doesNotMatch(result.svg, /Prohibition doesn/);
  assert.doesNotMatch(result.svg, /textLength=/);
});

test("long quote posts separate text from a full embedded portrait and always emphasize copy", () => {
  const result = createQuotePostSvg({
    quote: "New York's housing crisis is fundamentally a supply problem caused by restrictive zoning and burdensome permitting, not pricing software.",
    person: "david",
    emphasis: "word not present",
    mode: "final",
  });

  assert.equal(result.validation.ok, true);
  assert.equal(result.emphasis, "software");
  const portraitTop = Number(result.svg.match(/data-ccc-portrait-safe-top="([0-9.]+)"/)?.[1]);
  const portraitWidth = Number(result.svg.match(/data-ccc-portrait-width="([0-9.]+)"/)?.[1]);
  const portraitHeight = Number(result.svg.match(/data-ccc-portrait-height="([0-9.]+)"/)?.[1]);
  const quoteBaselines = [...result.svg.matchAll(/<text x="54\.78" y="([0-9.]+)"/g)].map((match) => Number(match[1]));
  assert.equal(quoteBaselines.length, 7);
  assert.deepEqual(quoteBaselines, [239.2, 307.2, 375.2, 443.2, 511.2, 579.2, 647.2]);
  assert.equal(portraitTop, 350);
  assert.equal(portraitWidth, 800);
  assert.equal(portraitHeight, 1000);
  assert.match(result.svg, /<tspan data-ccc-role="quote-emphasis" fill="#E95C1F">software<\/tspan>/i);
  const portraitData = result.svg.match(/<g\b[^>]*data-ccc-role="quote-portrait"[^>]*>[\s\S]*?xlink:href="data:image\/png;base64,([^"']+)"/i)?.[1];
  assert.ok(portraitData);
  assert.ok(Buffer.from(portraitData, "base64").byteLength > 100_000);
  assert.match(result.svg, /data-ccc-portrait-scale="reference-proportional"/i);
  assert.match(result.svg, /<image[^>]+x="280"[^>]+y="350"[^>]+width="800"[^>]+height="1000"[^>]+preserveAspectRatio="xMaxYMax meet"/i);
});

test("quote portrait prominence scales with quote length", () => {
  const short = createQuotePostSvg({ quote: "Consumers deserve choice.", person: "david", mode: "final" });
  const long = createQuotePostSvg({
    quote: "New York's housing crisis is fundamentally a supply problem caused by restrictive zoning and burdensome permitting, not pricing software.",
    person: "david",
    mode: "final",
  });
  const portraitWidth = (svg) => Number(svg.match(/data-ccc-portrait-width="([0-9.]+)"/)?.[1]);

  assert.equal(short.validation.ok, true);
  assert.equal(long.validation.ok, true);
  assert.equal(portraitWidth(short.svg), 813);
  assert.equal(portraitWidth(long.svg), 800);
  assert.ok(portraitWidth(short.svg) > portraitWidth(long.svg));
});

test("every approved quote portrait stays undistorted inside the reference right column", () => {
  for (const person of quotePeople) {
    const result = createQuotePostSvg({
      quote: "Consumers deserve rules that protect choice without restricting responsible innovation.",
      person: person.id,
      emphasis: "choice",
      mode: "final",
    });
    const portrait = result.svg.match(/<image[^>]+x="([0-9.]+)"[^>]+y="([0-9.]+)"[^>]+width="([0-9.]+)"[^>]+height="([0-9.]+)"[^>]+preserveAspectRatio="xMaxYMax meet"/i);

    assert.equal(result.validation.ok, true, person.id);
    assert.ok(portrait, person.id);
    const [, x, y, width, height] = portrait.map(Number);
    assert.equal(x + width, 1080, person.id);
    assert.equal(y, 350, person.id);
    assert.equal(height, 1000, person.id);
    assert.ok(width >= 650 && width <= person.portraitReferenceMaxWidth, person.id);
    assert.doesNotMatch(result.svg, /data-ccc-role="quote-portrait"[^>]*clip-path=/i);
  }
});

test("quote emphasis can cover a meaningful phrase in official CCC orange", () => {
  const result = createQuotePostSvg({
    quote: "Consumers deserve clear information, real choices, and the freedom to decide for themselves.",
    person: "fabio",
    emphasis: "real choices",
    mode: "final",
  });

  assert.equal(result.validation.ok, true);
  assert.equal(result.emphasis, "real choices");
  assert.match(result.svg, /<tspan data-ccc-role="quote-emphasis" fill="#E95C1F">real choices<\/tspan>/i);
  assert.match(result.svg, /data-ccc-quote-line-count="5"/i);
  assert.match(result.svg, /data-ccc-portrait-width="720"/i);
});

test("quote generator rejects unknown people and overlong copy", () => {
  assert.throws(() => createQuotePostSvg({ quote: "Choice matters.", person: "Unknown Person" }), /Unknown CCC quote person/);
  assert.throws(() => createQuotePostSvg({ quote: "x".repeat(151), person: "fred" }), /at most 150/);
});

test("reference-locked layouts ignore loose crop variations", () => {
  const base = {
    template: "quote",
    styleVariant: "navy_poster",
    headline: "Consumers deserve better choice",
    includeLogoPlaceholder: true,
    mode: "draft",
  };
  const first = createSocialSvg({ ...base, variation: 0 });
  const second = createSocialSvg({ ...base, variation: 1 });

  assert.equal(first.referenceSystem, "reference-1");
  assert.equal(second.referenceSystem, "reference-1");
  assert.equal(first.variation, 0);
  assert.equal(second.variation, 0);
  assert.equal(first.svg, second.svg);
  assert.match(first.svg, /data-ccc-variation="0"/);
  assert.match(second.svg, /data-ccc-variation="0"/);
});
