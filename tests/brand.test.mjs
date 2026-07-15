import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  auditAssets,
  brand,
  createGenerationPrompt,
  createSocialSvg,
  getPostReferenceAssets,
  parseFontDescriptor,
  postReferencePaths,
  qaSocialLayout,
  resolveColor,
  validateSvgArtifact,
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
    headline: "Choice matters",
    includeLogoPlaceholder: true,
    mode: "draft",
  });

  assert.match(result.svg, /width="1080"/);
  assert.match(result.svg, /height="1350"/);
  assert.match(result.svg, /data-ccc-style="guide-social"/);
  assert.match(result.svg, /data-ccc-variant="navy_poster"/);
  assert.match(result.svg, /data-ccc-reference-system="reference-1"/);
  assert.match(result.svg, /data-ccc-layout-lock="reference-exact"/);
  assert.match(result.svg, /data-ccc-variation="0"/);
  assert.match(result.svg, /data-ccc-watermark-source="packaged-reference"/);
  assert.match(result.svg, /data-ccc-role="reference-headline"/);
  assert.match(result.svg, /font-family="Anton"/);
  assert.doesNotMatch(result.svg, /textLength=/);
  assert.match(result.svg, /data-ccc-embedded-fonts="true"/);
  assert.doesNotMatch(result.svg, /CCC LOGO/);
  assert.equal(result.selectedLogoHref, "logos/ccc-wide-orange.svg");
  assert.equal(result.styleVariant, "navy_poster");
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
  assert.equal(postReferencePaths.length, 4);
  const references = getPostReferenceAssets();

  assert.equal(references.length, 4);
  for (const reference of references) {
    assert.equal(reference.exists, true);
    assert.match(reference.fileName, /^post-references\/ccc-post-reference-[1-4]\.svg$/);
    assert.match(reference.role, /reference-locked layout contract/);
    assert.match(reference.svg, /<svg/i);
  }
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
    headline: "Choice matters",
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
  assert.doesNotMatch(result.svg, /CCC LOGO/);

  const artifact = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: result.svg,
    assetBasePath: packagedAssets,
  });
  assert.equal(artifact.ok, true);
});

test("final SVG generation fails when render fonts cannot be embedded", () => {
  const tempAssets = join(tmpdir(), `ccc-brand-assets-no-fonts-${Date.now()}`);
  mkdirSync(join(tempAssets, "logos"), { recursive: true });
  writeFileSync(join(tempAssets, "logos", "ccc-wide-orange.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 76"/>`);

  const result = createSocialSvg({
    template: "quote",
    headline: "Choice matters",
    includeLogoPlaceholder: true,
    officialLogoHref: "logos/ccc-wide-orange.svg",
    assetBasePath: tempAssets,
    mode: "final",
  });

  assert.equal(result.validation.ok, false);
  assert.match(result.validation.violations.join("\n"), /Required embedded render fonts are missing/);
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
  assert.deepEqual(result.manifestMissingFromBrand.fonts, []);
  assert.deepEqual(result.manifestMissingFromBrand.logos, []);
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
