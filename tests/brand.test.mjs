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
  const missing = validateSpec({
    mode: "final",
    usesLogo: true,
    officialLogoHref: "logos/ccc-wide-primary.svg",
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
  writeFileSync(join(tempAssets, "logos", "ccc-wide-primary.svg"), "<svg/>");

  const present = validateLogoHref("logos/ccc-wide-primary.svg", tempAssets);
  assert.equal(present.ok, true);
  assert.equal(present.approvedPath, "logos/ccc-wide-primary.svg");
});

test("social prompts and SVGs use 1080x1350", () => {
  const prompt = createGenerationPrompt({
    request: "Create a consumer choice quote card",
    outputType: "social_post",
    includeNegativePrompt: true,
  });

  assert.match(prompt, /1080x1350/);
  assert.doesNotMatch(prompt, /1080x1080/);

  const result = createSocialSvg({
    template: "quote",
    headline: "Choice matters",
    includeLogoPlaceholder: true,
    mode: "draft",
  });

  assert.match(result.svg, /width="1080"/);
  assert.match(result.svg, /height="1350"/);
  assert.equal(result.validation.ok, true);
  assert.match(result.validation.warnings.join("\n"), /Official CCC logo asset/);
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
  assert.ok(result.missingLogos.includes("ccc-wide-primary"));
  assert.deepEqual(result.manifestMissingFromBrand.fonts, []);
  assert.deepEqual(result.manifestMissingFromBrand.logos, []);
});
