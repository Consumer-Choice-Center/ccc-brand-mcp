import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createBrandMcpServer } from "./mcp-factory.js";

const server = createBrandMcpServer("stdio");
const transport = new StdioServerTransport();
await server.connect(transport);
