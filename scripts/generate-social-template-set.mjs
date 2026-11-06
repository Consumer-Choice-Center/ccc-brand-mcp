import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, process.argv[2] || "deliverables/social-template-variants-2026-11-06");

const samples = [
  {
    id: "navy-poster",
    tool: "create_social_svg",
    arguments: {
      template: "cta",
      styleVariant: "navy_poster",
      kicker: "CONSUMER CHOICE",
      headline: "CONSUMERS DESERVE BETTER CHOICE",
      body: "Smart rules protect people without removing useful options.",
      cta: "CHOOSE BETTER RULES",
      mode: "final",
    },
  },
  {
    id: "petition-push",
    tool: "create_social_svg",
    arguments: {
      template: "cta",
      styleVariant: "petition_push",
      kicker: "POLICY ACTION",
      headline: "CHOICE IS NOT OPTIONAL",
      body: "Push for smarter rules that protect consumers.",
      cta: "SIGN THE PETITION",
      mode: "final",
    },
  },
  {
    id: "orange-alert",
    tool: "create_social_svg",
    arguments: {
      template: "policy_alert",
      styleVariant: "orange_alert",
      kicker: "POLICY ALERT",
      headline: "SMART RULES SHOULD PROTECT CHOICE",
      body: "Target real harm without taking useful options away.",
      cta: "MAKE CHOICE HEARD",
      mode: "final",
    },
  },
  {
    id: "statistic-card",
    tool: "create_social_svg",
    arguments: {
      template: "statistic",
      styleVariant: "statistic_card",
      kicker: "CONSUMER VOICE",
      headline: "72% SUPPORT MORE CHOICE",
      body: "Consumers want rules that target harm without limiting useful options.",
      mode: "final",
    },
  },
  {
    id: "contrast-cards",
    tool: "create_social_svg",
    arguments: {
      template: "cta",
      styleVariant: "contrast_cards",
      kicker: "POLICY",
      headline: "BAD POLICY VS GOOD POLICY",
      comparisonLeft: "Ban first. Ask questions later.",
      comparisonRight: "Target risk. Preserve consumer choice.",
      mode: "final",
    },
  },
  {
    id: "quote-post",
    tool: "create_quote_post",
    arguments: {
      person: "fabio",
      quote: "Consumers deserve clear information, real choices, and the freedom to decide for themselves.",
      emphasis: "real choices",
      mode: "final",
    },
  },
  {
    id: "lower-third",
    tool: "create_social_svg",
    assetType: "video",
    arguments: {
      template: "lower_third",
      styleVariant: "navy_poster",
      headline: "YAËL OSSOWSKI",
      body: "DEPUTY DIRECTOR",
      mode: "final",
    },
  },
];

function payload(result) {
  const text = result.content.find((item) => item.type === "text")?.text;
  if (!text) throw new Error("CCC Brand MCP returned no text payload.");
  return JSON.parse(text);
}

function assertValid(label, report) {
  if (report.ok) return;
  const details = [...(report.violations || []), ...(report.warnings || [])].join("\n- ");
  throw new Error(`${label} failed validation${details ? `:\n- ${details}` : "."}`);
}

const client = new Client({ name: "ccc-social-template-set", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, "dist/server.js")],
  cwd: root,
});

await client.connect(transport);
try {
  const status = payload(await client.callTool({ name: "get_mcp_status", arguments: {} }));
  if (!status.ok) throw new Error("CCC Brand MCP asset audit failed before generation.");
  const guidelines = payload(await client.callTool({
    name: "get_brand_guidelines",
    arguments: { section: "all" },
  }));

  await mkdir(outputDirectory, { recursive: true });
  const manifest = {
    generatedAt: new Date().toISOString(),
    generatedBy: `${status.server}@${status.version}`,
    guidelinesRead: Boolean(guidelines.brand && guidelines.visualSystem),
    excluded: ["one_pager"],
    outputs: [],
  };

  for (const sample of samples) {
    const creation = payload(await client.callTool({
      name: sample.tool,
      arguments: sample.arguments,
    }));
    if (!creation.svg) throw new Error(`${sample.id} did not return an SVG.`);
    assertValid(`${sample.id} design`, creation.validation);
    assertValid(`${sample.id} embedded artifact`, creation.artifactValidation);

    const brandValidation = payload(await client.callTool({
      name: "validate_svg_artifact",
      arguments: {
        svg: creation.svg,
        assetType: sample.assetType || "social",
        mode: "final",
        requiresLogo: true,
      },
    }));
    const illustratorValidation = payload(await client.callTool({
      name: "validate_illustrator_svg",
      arguments: { svg: creation.svg, mode: "final" },
    }));
    assertValid(`${sample.id} brand artifact`, brandValidation);
    assertValid(`${sample.id} Illustrator`, illustratorValidation);

    const svgPath = resolve(outputDirectory, `${sample.id}.svg`);
    const validationPath = resolve(outputDirectory, `${sample.id}.validation.json`);
    const report = {
      id: sample.id,
      tool: sample.tool,
      styleVariant: creation.styleVariant || "quote_post",
      referenceSystem: creation.referenceSystem,
      selection: creation.selection,
      spelling: creation.spelling,
      creation: creation.validation,
      artifact: brandValidation,
      illustrator: illustratorValidation,
    };
    await writeFile(svgPath, creation.svg, "utf8");
    await writeFile(validationPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    manifest.outputs.push({
      id: sample.id,
      styleVariant: report.styleVariant,
      svg: `${sample.id}.svg`,
      validation: `${sample.id}.validation.json`,
      valid: true,
    });
  }

  await writeFile(resolve(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`Generated and validated ${samples.length} CCC social template types in ${outputDirectory}\n`);
} finally {
  await client.close();
}
