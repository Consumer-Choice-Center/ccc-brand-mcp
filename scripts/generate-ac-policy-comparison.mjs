import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const assets = resolve(root, "assets");
const outputs = resolve(root, "outputs");

const result = createSocialSvg({
  template: "cta",
  styleVariant: "contrast_cards",
  kicker: "AIR CONDITIONING",
  headline: "Bad policy vs good policy",
  comparisonLeft: "Limit AC with regulations.",
  comparisonRight: "Make AC easy to choose.",
  cta: "KEEP CHOICE COOL",
  includeLogoPlaceholder: false,
  assetBasePath: assets,
  // The packaged reference uses several legacy accent colors; retain it verbatim
  // as required by the layout contract and record palette findings as draft QA.
  mode: "draft",
});

if (!result.validation.ok) throw new Error(result.validation.violations.join("\n"));

await mkdir(outputs, { recursive: true });
await writeFile(resolve(outputs, "ac-policy-choice-comparison.svg"), result.svg, "utf8");
await writeFile(resolve(outputs, "ac-policy-choice-comparison.validation.json"), JSON.stringify({
  styleVariant: result.styleVariant,
  referenceSystem: result.referenceSystem,
  layoutLock: result.layoutLock,
  validation: result.validation,
}, null, 2));

console.log("Created outputs/ac-policy-choice-comparison.svg");
