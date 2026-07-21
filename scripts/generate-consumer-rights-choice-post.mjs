import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createLegacySocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const assets = resolve(root, "assets");
const deliverables = resolve(root, "deliverables");

const result = createLegacySocialSvg({
  template: "cta",
  styleVariant: "navy_poster",
  variation: 0,
  kicker: "US OR EU",
  headline: "CONSUMER RIGHTS SHOULD PROTECT CHOICE",
  body: "Protection should empower consumers, not decide for them.",
  cta: "PROTECT CONSUMERS. PRESERVE CHOICE",
  includeLogoPlaceholder: false,
  assetBasePath: assets,
  mode: "final",
});

if (!result.validation.ok) throw new Error(result.validation.violations.join("\n"));

await mkdir(deliverables, { recursive: true });
const artifact = "ccc-consumer-rights-preserve-choice.svg";
const validation = "ccc-consumer-rights-preserve-choice.validation.json";
await writeFile(resolve(deliverables, artifact), result.svg, "utf8");
await writeFile(resolve(deliverables, validation), JSON.stringify({
  styleVariant: result.styleVariant,
  referenceSystem: result.referenceSystem,
  validation: result.validation,
  artifactValidation: result.artifactValidation,
}, null, 2));

console.log(`Created deliverables/${artifact}`);
