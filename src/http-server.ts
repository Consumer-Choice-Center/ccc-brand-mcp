import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { hostHeaderValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { pathToFileURL } from "node:url";
import { createBrandMcpServer } from "./mcp-factory.js";

const jsonRpcMethodNotAllowed = {
  jsonrpc: "2.0",
  error: { code: -32000, message: "Method not allowed in stateless mode." },
  id: null,
};

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export interface HttpAppOptions {
  bodyLimit?: string;
  rateLimitMax?: number;
  maxConcurrency?: number;
  allowedHosts?: string[];
}

export function createHttpApp(options: HttpAppOptions = {}) {
  const app = express();
  const allowedHosts = options.allowedHosts ?? (process.env.CCC_MCP_ALLOWED_HOSTS?.split(",")
    .map((host) => host.trim())
    .filter(Boolean) || ["mcp.consumerchoicecenter.org", "ccc-brand-mcp", "localhost", "127.0.0.1", "[::1]"]);
  const maxConcurrency = options.maxConcurrency
    ?? positiveInteger(process.env.CCC_MCP_MAX_CONCURRENCY, 20);

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hostHeaderValidation(allowedHosts));

  app.use((req, res, next) => {
    if (req.path === "/healthz") {
      next();
      return;
    }
    const startedAt = process.hrtime.bigint();
    res.once("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl.split("?", 1)[0],
        status: res.statusCode,
        durationMs: Math.round(durationMs),
        ip: req.ip,
      }));
    });
    next();
  });

  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", uptimeSeconds: Math.floor(process.uptime()) });
  });

  app.use("/mcp", rateLimit({
    windowMs: 60_000,
    limit: options.rateLimitMax ?? positiveInteger(process.env.CCC_MCP_RATE_LIMIT_MAX, 120),
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  app.use("/mcp", express.json({
    limit: options.bodyLimit ?? process.env.CCC_MCP_HTTP_BODY_LIMIT ?? "16mb",
    type: ["application/json", "application/*+json"],
  }));

  let inFlight = 0;
  app.use("/mcp", (_req, res, next) => {
    if (inFlight >= maxConcurrency) {
      res.set("Retry-After", "1").status(503).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Server is busy. Try again shortly." },
        id: null,
      });
      return;
    }

    inFlight += 1;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      inFlight -= 1;
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  });

  app.post("/mcp", async (req, res) => {
    const server = createBrandMcpServer("remote");
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    let closed = false;
    const close = async () => {
      if (closed) return;
      closed = true;
      await Promise.allSettled([transport.close(), server.close()]);
    };
    res.once("close", () => void close());

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
      await close();
    }
  });

  app.get("/mcp", (_req, res) => {
    res.set("Allow", "POST").status(405).json(jsonRpcMethodNotAllowed);
  });
  app.delete("/mcp", (_req, res) => {
    res.set("Allow", "POST").status(405).json(jsonRpcMethodNotAllowed);
  });

  app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 500;
    res.status(status === 413 ? 413 : 400).json({
      jsonrpc: "2.0",
      error: {
        code: -32700,
        message: status === 413 ? "Request body is too large." : "Invalid JSON request body.",
      },
      id: null,
    });
  });

  return app;
}

export function startHttpServer() {
  const host = process.env.HOST || "0.0.0.0";
  const port = positiveInteger(process.env.PORT, 8080);
  const app = createHttpApp();
  const httpServer = app.listen(port, host, () => {
    console.log(`CCC Brand MCP HTTP server listening on ${host}:${port}`);
  });

  httpServer.requestTimeout = positiveInteger(process.env.CCC_MCP_REQUEST_TIMEOUT_MS, 30_000);
  httpServer.headersTimeout = positiveInteger(process.env.CCC_MCP_HEADERS_TIMEOUT_MS, 15_000);
  httpServer.keepAliveTimeout = positiveInteger(process.env.CCC_MCP_KEEP_ALIVE_TIMEOUT_MS, 5_000);

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}; shutting down.`);
    httpServer.close(() => process.exit(0));
    setTimeout(() => {
      httpServer.closeAllConnections();
      process.exit(1);
    }, 10_000).unref();
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return httpServer;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  startHttpServer();
}
