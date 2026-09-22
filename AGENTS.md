# CCC Brand MCP requirements

For every CCC-branded deliverable, use the `ccc-brand` MCP server as the authoritative source for brand rules and generation workflows.

1. Call `get_brand_guidelines` before creating or modifying the deliverable.
2. Use the relevant CCC Brand MCP creation tool instead of recreating its output from local files or remembered guidance.
3. Run the applicable CCC Brand MCP validation tool and resolve every reported violation before delivery.
4. If the `ccc-brand` MCP server or a required tool is unavailable, stop and report the missing connection. Do not silently substitute repository files, prior conversation context, web results, or model memory.

Repository files may be inspected to develop and test the MCP server, but they are not a substitute for invoking the server when producing CCC-branded work.

## Canva delivery and SVG retention

For CCC assets requested in Canva, follow `workflows/ccc-to-canva.md` and select the kit in `workflows/canva.json`. Preserve the exact validated MCP-generated SVG in a new archive revision before the Canva handoff. Retain its validation report and record the verified Canva design URL alongside it. An uploaded Canva asset alone is not a completed Canva design. Never overwrite an archived SVG with a Canva export or imply automatic synchronization. If Canva is blocked, keep the SVG and report the incomplete handoff.
