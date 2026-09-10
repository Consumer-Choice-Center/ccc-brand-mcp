import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = new URL(process.env.CCC_MCP_URL || "https://mcp.consumerchoicecenter.org/mcp");
const client = new Client({ name: "ccc-brand-http-smoke", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(endpoint);

await client.connect(transport);
try {
  const { tools } = await client.listTools();
  const toolNames = tools.map((tool) => tool.name);
  assert.equal(toolNames.includes("get_mcp_status"), true);
  assert.equal(toolNames.includes("get_brand_guidelines"), true);
  assert.equal(toolNames.includes("create_one_pager"), false);
  assert.equal(toolNames.includes("validate_one_pager_file"), false);

  const statusResult = await client.callTool({ name: "get_mcp_status", arguments: {} });
  assert.equal(statusResult.content.length, 1);
  assert.equal(statusResult.content[0].type, "text");
  const status = JSON.parse(statusResult.content[0].text);
  assert.equal(status.ok, true);
  assert.equal(status.workspacePath, "hidden-in-remote-mode");

  const guidelinesResult = await client.callTool({
    name: "get_brand_guidelines",
    arguments: { section: "colors" },
  });
  assert.equal(JSON.parse(guidelinesResult.content[0].text).primary.autumnOrange, "#E95C1F");

  const socialResult = await client.callTool({
    name: "create_social_svg",
    arguments: {
      template: "cta",
      headline: "MORE CHOICE FOR CONSUMERS",
      body: "A remote MCP deployment smoke test.",
      mode: "draft",
    },
  });
  const social = JSON.parse(socialResult.content[0].text);
  assert.match(social.svg, /^<svg\b/);
  assert.equal(social.spelling.correctedFields.headline, "MORE CHOICE FOR CONSUMERS");

  console.log(
    `Remote MCP smoke test passed: ${status.server} ${status.version}; ${tools.length} safe tools at ${endpoint}.`,
  );
} finally {
  await client.close();
}
