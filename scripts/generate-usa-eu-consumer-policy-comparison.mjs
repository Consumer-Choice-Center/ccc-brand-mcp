import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createLegacySocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const assets = resolve(root, "assets");
const outputs = resolve(root, "outputs");
const deliverables = resolve(root, "deliverables");

const result = createLegacySocialSvg({
  template: "cta",
  styleVariant: "contrast_cards",
  kicker: "CONSUMER POLICY",
  headline: "USA VS EU",
  comparisonLeft: "State rules vary across the country.",
  comparisonRight: "Shared rules apply across member markets.",
  cta: "CHOICE",
  includeLogoPlaceholder: false,
  assetBasePath: assets,
  // Reference 4 retains its packaged mint, marigold, and teal accents. The
  // brand validator flags that legacy palette only in final mode.
  mode: "draft",
});

if (!result.validation.ok) throw new Error(result.validation.violations.join("\n"));

await mkdir(outputs, { recursive: true });
await mkdir(deliverables, { recursive: true });

const artifact = "ccc-usa-eu-consumer-policy-comparison.svg";
const metadata = "ccc-usa-eu-consumer-policy-comparison.validation.json";
await writeFile(resolve(outputs, artifact), result.svg, "utf8");
await writeFile(resolve(deliverables, artifact), result.svg, "utf8");
await writeFile(resolve(outputs, metadata), JSON.stringify({
  styleVariant: result.styleVariant,
  referenceSystem: result.referenceSystem,
  layoutLock: result.layoutLock,
  validation: result.validation,
  artifactValidation: result.artifactValidation,
}, null, 2));

console.log(`Created deliverables/${artifact}`);
