import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createSocialSvg } from "../dist/brand.js";

const root = resolve(import.meta.dirname, "..");
const assets = resolve(root, "assets");
const outputs = resolve(root, "outputs");

const result = createSocialSvg({
  template: "cta",
  styleVariant: "petition_push",
  kicker: "UPCOMING VOTE",
  leadIn: "VOTE IS COMING:",
  headline: "Stop Chat Controls",
  body: "Protect private messages.",
  cta: "SPEAK UP NOW",
  includeLogoPlaceholder: false,
  assetBasePath: assets,
  // Preserve the packaged petition reference exactly; record its legacy palette as draft QA.
  mode: "draft",
});

if (!result.validation.ok) throw new Error(result.validation.violations.join("\n"));

await mkdir(outputs, { recursive: true });
await writeFile(resolve(outputs, "chat-controls-upcoming-vote-cta.svg"), result.svg, "utf8");
await writeFile(resolve(outputs, "chat-controls-upcoming-vote-cta.validation.json"), JSON.stringify({
  styleVariant: result.styleVariant,
  referenceSystem: result.referenceSystem,
  layoutLock: result.layoutLock,
  validation: result.validation,
}, null, 2));

console.log("Created outputs/chat-controls-upcoming-vote-cta.svg");
