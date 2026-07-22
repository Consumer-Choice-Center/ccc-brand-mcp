import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "outputs");
const svgPath = resolve(outDir, "choice-isnt-optional-petition-final.svg");
const validationPath = resolve(outDir, "choice-isnt-optional-petition-final.validation.json");
const promptPath = resolve(outDir, "choice-isnt-optional-petition-final.prompt.txt");

const client = new Client({ name: "ccc-social-generator", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, "dist/server.js")],
  cwd: root,
});

function textFrom(result) {
  return result.content.find((item) => item.type === "text")?.text ?? "";
}

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

await mkdir(outDir, { recursive: true });
await client.connect(transport);

const prompt = textFrom(
  await client.callTool({
    name: "create_generation_prompt",
    arguments: {
      request:
        "Create a CCC social post for policymakers saying choice is not optional and calling people to sign the petition.",
      outputType: "social_post",
      includeNegativePrompt: true,
    },
  }),
);

const layout = JSON.parse(
  textFrom(
    await client.callTool({
      name: "qa_social_layout",
      arguments: {
        template: "cta",
        headline: "Choice isn't optional",
        body: "Policymakers: protect consumer choice. Do not restrict it.",
        cta: "Sign the petition",
        mode: "final",
      },
    }),
  ),
);

if (!layout.ok) {
  throw new Error(`Layout failed CCC QA:\n${JSON.stringify(layout, null, 2)}`);
}

const logo = await readFile(resolve(root, "assets/logos/ccc-wide-orange.svg"), "utf8");
const logoHref = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logo)}`;

const colors = {
  leila: "#22264E",
  orange: "#E95C1F",
  white: "#FFFFFF",
  slate: "#6F789B",
  mint: "#9BD8C7",
};

const headline = ["CHOICE ISN'T", "OPTIONAL"];
const body = ["Policymakers: protect consumer", "choice. Do not restrict it."];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" data-ccc-style="guide-social" data-ccc-variant="navy_poster" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-labelledby="title desc">
  <title id="title">CCC social post calling policymakers to protect choice</title>
  <desc id="desc">A Consumer Choice Center social post telling policymakers that choice is not optional and calling viewers to sign the petition.</desc>
  <defs>
    <linearGradient id="ccc-watermark-gradient" data-ccc-watermark-gradient="semi-transparent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.slate}" stop-opacity="0.06"/>
      <stop offset="52%" stop-color="${colors.orange}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="${colors.slate}" stop-opacity="0.03"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1350" fill="${colors.leila}"/>

  <g data-ccc-watermark="gradient-ring" aria-label="CCC gradient ring watermark" fill="none" stroke="url(#ccc-watermark-gradient)" stroke-width="28">
    <circle cx="892" cy="604" r="150"/>
    <circle cx="892" cy="604" r="225"/>
    <circle cx="892" cy="604" r="300"/>
  </g>

  <image href="${esc(logoHref)}" data-ccc-logo-href="logos/ccc-wide-orange.svg" x="762" y="56" width="246" height="84" preserveAspectRatio="xMidYMid meet"/>

  <text x="72" y="78" font-family="Montserrat" font-weight="700" font-size="18" fill="${colors.white}">TELL POLICYMAKERS</text>
  <rect x="72" y="96" width="42" height="14" fill="${colors.orange}"/>

  <text x="72" y="310" font-family="Montserrat" font-weight="700" font-size="94" fill="${colors.white}">${headline[0]}</text>
  <text x="72" y="416" font-family="Montserrat" font-weight="700" font-size="94" fill="${colors.orange}">${headline[1]}</text>

  <rect x="72" y="704" width="8" height="104" fill="${colors.orange}"/>
  <text x="112" y="754" font-family="Montserrat" font-weight="700" font-size="32" fill="${colors.white}">${body[0]}</text>
  <text x="112" y="796" font-family="Montserrat" font-weight="400" font-size="32" fill="${colors.white}">${body[1]}</text>

  <g aria-label="Petition call to action">
    <rect x="72" y="908" width="690" height="126" fill="${colors.orange}"/>
    <text x="112" y="985" font-family="Montserrat" font-weight="700" font-size="44" fill="${colors.white}">SIGN THE PETITION</text>
  </g>

  <path d="M72 1098 C260 1080 430 1080 620 1098" fill="none" stroke="${colors.orange}" stroke-width="18" stroke-linecap="round"/>
  <line x1="72" y1="1184" x2="1008" y2="1184" stroke="${colors.mint}" stroke-width="3" opacity="0.8"/>

  <text x="72" y="1296" font-family="Montserrat" font-weight="500" font-size="18" fill="${colors.white}">consumerchoicecenter.org</text>
  <text x="682" y="1296" font-family="Montserrat" font-weight="500" font-size="18" fill="${colors.white}">YOUR CHOICE OUR FIGHT</text>
</svg>
`;

const artifactValidation = JSON.parse(
  textFrom(
    await client.callTool({
      name: "validate_svg_artifact",
      arguments: {
        svg,
        assetType: "social",
        mode: "final",
        requiresLogo: true,
        assetBasePath: resolve(root, "assets"),
      },
    }),
  ),
);

await writeFile(svgPath, svg, "utf8");
await writeFile(promptPath, prompt, "utf8");
await writeFile(validationPath, JSON.stringify({ layout, artifactValidation }, null, 2), "utf8");

await client.close();

if (!artifactValidation.ok) {
  throw new Error(`Artifact failed CCC validation:\n${JSON.stringify(artifactValidation, null, 2)}`);
}

console.log(`Wrote ${svgPath}`);
console.log(`Wrote ${promptPath}`);
console.log(`Wrote ${validationPath}`);
