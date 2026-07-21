import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const assets = resolve(root, "assets");
const outputs = resolve(root, "outputs");

const result = createSocialSvg({
  template: "statistic",
  styleVariant: "statistic_card",
  kicker: "CONSUMER VOICE",
  headline: "85% of consumers support abolishing Chat Controls",
  body: "Consumer voices deserve to be heard.",
  includeLogoPlaceholder: false,
  assetBasePath: assets,
  // Keep the packaged statistic-card layout intact and record legacy palette observations as draft QA.
  mode: "draft",
});

if (!result.validation.ok) throw new Error(result.validation.violations.join("\n"));

// Use Anton consistently for the statistic and supporting statement; retain DM Mono for utility text.
const svg = result.svg
  .replace(/font-family="Montserrat" font-weight="(?:700|500)"/g, 'font-family="Anton" font-weight="400"')
  .replace('.cls-4{fill:#22264E;}', '.cls-4{fill:#00A6A6;}')
  .replaceAll('#E95C1F', '#B9473A');

await mkdir(outputs, { recursive: true });
await writeFile(resolve(outputs, "chat-controls-abolition-statistic.svg"), svg, "utf8");
await writeFile(resolve(outputs, "chat-controls-abolition-statistic.validation.json"), JSON.stringify({
  styleVariant: result.styleVariant,
  referenceSystem: result.referenceSystem,
  layoutLock: result.layoutLock,
  validation: result.validation,
}, null, 2));

console.log("Created outputs/chat-controls-abolition-statistic.svg");
