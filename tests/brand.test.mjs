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
  parseFontDescriptor,
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
  assert.match(result.svg, /data-ccc-watermark="ring"/);
  assert.doesNotMatch(result.svg, /<polygon/);
  assert.doesNotMatch(result.svg, /CCC LOGO/);
  assert.equal(result.selectedLogoHref, "logos/ccc-wide-orange.svg");
  assert.equal(result.validation.ok, true);
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
  assert.match(result.violations.join("\n"), /ring watermark/);
});

test("generated SVG artifacts reject weak large social headline type", () => {
  const result = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" width="1080" height="1350">
      <rect width="1080" height="1350" fill="#22264E"/>
      <g data-ccc-watermark="ring"><circle cx="900" cy="590" r="300" fill="none" stroke="#6F789B"/></g>
      <image href="logos/ccc-wide-orange.svg" data-ccc-logo-href="logos/ccc-wide-orange.svg" x="786" y="58" width="220" height="76"/>
      <text x="72" y="320" font-family="Montserrat" font-weight="400" font-size="96" fill="#FFFFFF">CHOICE ISN'T</text>
      <text x="72" y="430" font-family="Montserrat" font-weight="400" font-size="96" fill="#E95C1F">OPTIONAL</text>
    </svg>`,
  });

  assert.equal(result.ok, false);
  assert.match(result.violations.join("\n"), /thin or regular Montserrat/);
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
  assert.match(result.violations.join("\n"), /ring watermark/);
});

test("final SVG generation embeds a verified logo asset reference", () => {
  const tempAssets = join(tmpdir(), `ccc-brand-assets-svg-${Date.now()}`);
  mkdirSync(join(tempAssets, "logos"), { recursive: true });
  writeFileSync(join(tempAssets, "logos", "ccc-wide-orange.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 76"><rect width="220" height="76" fill="#E95C1F"/></svg>`);

  const result = createSocialSvg({
    template: "quote",
    headline: "Choice matters",
    includeLogoPlaceholder: true,
    officialLogoHref: "logos/ccc-wide-orange.svg",
    assetBasePath: tempAssets,
    mode: "final",
  });

  assert.equal(result.validation.ok, true);
  assert.match(result.svg, /data-ccc-logo-href="logos\/ccc-wide-orange.svg"/);
  assert.match(result.svg, /data-ccc-style="guide-social"/);
  assert.match(result.svg, /data-ccc-watermark="ring"/);
  assert.doesNotMatch(result.svg, /CCC LOGO/);

  const artifact = validateSvgArtifact({
    mode: "final",
    assetType: "social",
    svg: result.svg,
    assetBasePath: tempAssets,
  });
  assert.equal(artifact.ok, true);
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

  assert.equal(result.ok, false);
  assert.ok(result.missingFonts.includes("Montserrat"));
  assert.deepEqual(result.missingLogos, []);
  assert.deepEqual(result.manifestMissingFromBrand.fonts, []);
  assert.deepEqual(result.manifestMissingFromBrand.logos, []);
});
