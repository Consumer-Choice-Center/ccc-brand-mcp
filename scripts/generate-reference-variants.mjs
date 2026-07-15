import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, ".rendered_variants");
const assetBasePath = resolve(root, "assets");

const samples = [
  {
    id: "reference-1-navy-poster",
    input: {
      template: "quote",
      styleVariant: "navy_poster",
      variation: 0,
      kicker: "POLICY",
      headline: "Consumers deserve better choice",
    },
  },
  {
    id: "reference-2-statistic-card",
    input: {
      template: "statistic",
      styleVariant: "statistic_card",
      variation: 0,
      kicker: "CONSUMER VOICE",
      headline: "72% support choice",
      body: "Policy should target harm, not restrict consumer choice.",
    },
  },
  {
    id: "reference-3-petition-push",
    input: {
      template: "cta",
      styleVariant: "petition_push",
      variation: 0,
      kicker: "POLICY ALERT",
      headline: "Choice is not optional",
      body: "Push for smarter rules.",
      cta: "Sign the petition",
    },
  },
  {
    id: "reference-4-contrast-cards",
    input: {
      template: "cta",
      styleVariant: "contrast_cards",
      variation: 0,
      kicker: "POLICY",
      headline: "Bad policy vs good policy",
      comparisonLeft: "Ban first. Ask questions later.",
      comparisonRight: "Regulate risk. Protect choice.",
    },
  },
];

await mkdir(outputDirectory, { recursive: true });

for (const sample of samples) {
  const result = createSocialSvg({
    ...sample.input,
    includeLogoPlaceholder: true,
    assetBasePath,
    mode: "draft",
  });
  await writeFile(resolve(outputDirectory, `${sample.id}.svg`), result.svg, "utf8");
  await writeFile(resolve(outputDirectory, `${sample.id}.validation.json`), JSON.stringify({
    styleVariant: result.styleVariant,
    variation: result.variation,
    referenceSystem: result.referenceSystem,
    validation: result.validation,
  }, null, 2), "utf8");
}

console.log(`Wrote ${samples.length} reference-matched samples to ${outputDirectory}`);
