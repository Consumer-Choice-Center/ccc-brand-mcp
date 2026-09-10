import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createHttpApp } from "../dist/http-server.js";
import { REMOTE_EXCLUDED_TOOL_NAMES, REMOTE_TOOL_NAMES } from "../dist/mcp-factory.js";

async function listen(app) {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
    async close() {
      server.close();
      await once(server, "close");
    },
  };
}

const testOptions = {
  allowedHosts: ["127.0.0.1"],
  rateLimitMax: 100,
  maxConcurrency: 10,
};

test("remote transport exposes only the safe stateless tool surface", async () => {
  const listener = await listen(createHttpApp(testOptions));
  const client = new Client({ name: "ccc-remote-test", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(`${listener.baseUrl}/mcp`));

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    assert.deepEqual(
      tools.map((tool) => tool.name).sort(),
      [...REMOTE_TOOL_NAMES].sort(),
    );
    for (const excluded of REMOTE_EXCLUDED_TOOL_NAMES) {
      assert.equal(tools.some((tool) => tool.name === excluded), false);
    }

    for (const tool of tools) {
      const properties = tool.inputSchema.properties || {};
      assert.equal("assetBasePath" in properties, false, `${tool.name} exposes assetBasePath`);
      assert.equal("basePath" in properties, false, `${tool.name} exposes basePath`);
      assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} is not marked read-only`);
    }

    const statusResult = await client.callTool({ name: "get_mcp_status", arguments: {} });
    const status = JSON.parse(statusResult.content[0].text);
    assert.equal(status.workspacePath, "hidden-in-remote-mode");
    assert.equal(status.assetBasePath, "hidden-in-remote-mode");
    assert.equal(status.outputPath, "disabled-in-remote-mode");
    assert.equal(status.capabilities.includes("one-pager-materialization"), false);

    const auditResult = await client.callTool({ name: "audit_brand_assets", arguments: {} });
    const audit = JSON.parse(auditResult.content[0].text);
    assert.equal("basePath" in audit, false);
    assert.equal(audit.ok, true);
  } finally {
    await client.close();
    await listener.close();
  }
});

test("HTTP endpoints enforce health, methods, body size, and rate limits", async () => {
  const listener = await listen(createHttpApp({
    ...testOptions,
    bodyLimit: "100b",
    rateLimitMax: 2,
  }));

  try {
    const health = await fetch(`${listener.baseUrl}/healthz`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, "ok");

    const getResponse = await fetch(`${listener.baseUrl}/mcp`);
    assert.equal(getResponse.status, 405);
    assert.equal(getResponse.headers.get("allow"), "POST");

    const deleteResponse = await fetch(`${listener.baseUrl}/mcp`, { method: "DELETE" });
    assert.equal(deleteResponse.status, 405);

    const rateLimited = await fetch(`${listener.baseUrl}/mcp`);
    assert.equal(rateLimited.status, 429);
  } finally {
    await listener.close();
  }

  const bodyListener = await listen(createHttpApp({
    ...testOptions,
    bodyLimit: "100b",
  }));
  try {
    const oversized = await fetch(`${bodyListener.baseUrl}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "x".repeat(200) }),
    });
    assert.equal(oversized.status, 413);
  } finally {
    await bodyListener.close();
  }
});
