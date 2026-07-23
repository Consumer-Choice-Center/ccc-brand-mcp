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
    const result = await client.callTool({
      name: "create_one_pager",
      arguments: {
        request: "Show how tariffs on auto parts raise vehicle repair costs.",
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
