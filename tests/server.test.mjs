import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("one-pager MCP workflow materializes locally without returning large SVG text", async () => {
  const root = process.cwd();
  const outputFileName = `transport-safe-${process.pid}-${Date.now()}.svg`;
  const client = new Client({ name: "ccc-transport-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(root, "dist/server.js")],
    cwd: root,
  });

  await client.connect(transport);
  try {
    const status = await client.callTool({ name: "get_mcp_status", arguments: {} });
    assert.equal(status.content.length, 1);
    assert.equal(status.content[0].type, "text");
    const statusPayload = JSON.parse(status.content[0].text);
    const packageMetadata = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
    assert.equal(statusPayload.ok, true);
    assert.equal(statusPayload.version, packageMetadata.version);
    assert.equal(statusPayload.server, packageMetadata.name);
    assert.equal(statusPayload.assetHealth.ok, true);
    assert.equal(statusPayload.capabilities.includes("spelling-correction-us-uk"), true);
    assert.match(statusPayload.outputPath, /deliverables$/);

    const result = await client.callTool({
      name: "create_one_pager",
      arguments: {
        request: "Show how goverment tariffs on auto parts raise vehcile repair costs.",
        template: "material_cost_chain",
        outputFileName,
        mode: "draft",
      },
    });
    assert.equal(result.content.length, 1);
    assert.equal(result.content[0].type, "text");
    assert.equal(result.content.some((item) => item.type === "resource_link"), false);
    const payload = JSON.parse(result.content[0].text);
    assert.equal(payload.workingFile.completeSvg, true);
    assert.equal(payload.workingFile.bytes > 50_000, true);
    assert.equal(payload.workingFile.sha256.length, 64);
    assert.equal(existsSync(payload.workingFile.outputPath), true);
    const svg = readFileSync(payload.workingFile.outputPath, "utf8");
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.doesNotMatch(result.content[0].text, /<svg\b/);
    assert.match(payload.prompt, /validate_one_pager_file/);
    assert.equal(payload.spelling.hasCorrections, true);
    assert.match(payload.spelling.userNotice, /“goverment” → “government”/);
    assert.match(payload.spelling.userNotice, /“vehcile” → “vehicle”/);
    assert.match(payload.prompt, /government tariffs on auto parts raise vehicle repair costs/i);
    assert.doesNotMatch(payload.prompt, /\bgoverment\b|\bvehcile\b/i);

    const validation = await client.callTool({
      name: "validate_one_pager_file",
      arguments: {
        filePath: payload.workingFile.outputPath,
        template: "material_cost_chain",
        mode: "draft",
      },
    });
    assert.equal(validation.content.length, 1);
    assert.equal(validation.content[0].type, "text");
    assert.doesNotMatch(validation.content[0].text, /<svg\b/);
    const validationPayload = JSON.parse(validation.content[0].text);
    assert.equal(validationPayload.file.completeSvg, true);
    assert.equal(validationPayload.file.sha256, payload.workingFile.sha256);
    assert.equal(validationPayload.ok, true);
    assert.equal(validationPayload.warnings.length > 0, true);

    const social = await client.callTool({
      name: "create_social_svg",
      arguments: {
        template: "cta",
        styleVariant: "navy_poster",
        headline: "BETTER CHOIEC FOR CONSUEMRS",
        body: "The goverment should recieve feedback.",
        mode: "draft",
      },
    });
    const socialPayload = JSON.parse(social.content[0].text);
    assert.equal(socialPayload.spelling.hasCorrections, true);
    assert.match(socialPayload.spelling.highlightedCorrections.join("\n"), /~~CHOIEC~~ → \*\*CHOICE\*\*/);
    assert.equal(socialPayload.spelling.correctedFields.headline, "BETTER CHOICE FOR CONSUMERS");
    assert.equal(socialPayload.spelling.correctedFields.body, "The government should receive feedback.");
    assert.match(socialPayload.svg, /CHOICE/);
    assert.match(socialPayload.svg, /CONSUMERS/);
    assert.doesNotMatch(socialPayload.svg, /CHOIEC|CONSUEMRS|goverment|recieve/i);

    const metadata = await client.readResource({ uri: "brand://ccc/one-pager-working-templates" });
    assert.equal(metadata.contents.length, 1);
    assert.equal(metadata.contents[0].mimeType, "application/json");
    assert.equal(metadata.contents[0].text.length < 20_000, true);
    assert.doesNotMatch(metadata.contents[0].text, /<svg\b/);

    rmSync(payload.workingFile.outputPath, { force: true });
  } finally {
    await client.close();
  }
});
