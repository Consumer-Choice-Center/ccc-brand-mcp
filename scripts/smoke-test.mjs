import assert from "node:assert/strict";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = process.cwd();
const packageMetadata = await import(resolve(root, "package.json"), {
  with: { type: "json" },
}).then((module) => module.default);

const client = new Client({ name: "ccc-brand-deployment-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [resolve(root, "dist/server.js")],
  cwd: root,
  env: {
    ...process.env,
    CCC_BRAND_WORKSPACE_DIR: root,
  },
});

await client.connect(transport);
try {
  const statusResult = await client.callTool({ name: "get_mcp_status", arguments: {} });
  assert.equal(statusResult.content.length, 1);
  assert.equal(statusResult.content[0].type, "text");
  const status = JSON.parse(statusResult.content[0].text);
  assert.equal(status.ok, true);
  assert.equal(status.server, packageMetadata.name);
  assert.equal(status.version, packageMetadata.version);
  assert.equal(status.assetHealth.ok, true);

  const assetResult = await client.callTool({ name: "audit_brand_assets", arguments: {} });
  assert.equal(assetResult.content.length, 1);
  assert.equal(assetResult.content[0].type, "text");
  const assets = JSON.parse(assetResult.content[0].text);
  assert.equal(assets.ok, true);

  console.log(
    `MCP smoke test passed: ${status.server} ${status.version} on ${status.nodeVersion}; assets healthy.`,
  );
} finally {
  await client.close();
}
