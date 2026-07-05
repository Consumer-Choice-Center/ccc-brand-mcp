# CCC Brand MCP

Strict Model Context Protocol server for Consumer Choice Center brand-guided generation.

It exposes the CCC 2026 brand guide as machine-readable resources and tools so an LLM can:

- retrieve approved colors, fonts, logo rules, social/video/document constraints
- validate proposed designs before generation
- create strict brand-locked prompts for image/design models
- generate simple on-brand SVG drafts for social cards and video lower thirds

## Brand Source

The initial rules were extracted from `CCC_Brand_Guide_2026_5.pdf`:

- Palette: Autumn Orange `#E95C1F`, Leila `#22264E`, Base White `#FFFFFF`, Warm White `#FFF7EF`, Cool Mist `#E7ECF4`, Slate Blue `#6F789B`, Brick Coral `#B9473A`, Marigold `#F4B544`, Sand Beige `#CDB79F`, Deep Teal `#1E6F78`, Bright Teal `#00A6A6`, Soft Mint `#9BD8C7`
- Typography: Montserrat, Anton, Hind, DM Mono
- Social default: `1080x1080`, with `consumerchoicecenter.org` footer
- Video subtitles: Montserrat Bold, 55-60pt, bottom-third safe-area placement
- Policy outputs: primer, note, memo, coalition letter rules

Official logo files are not included in this repository. The MCP deliberately warns when a generation asks for a logo without an approved asset.

## Install

```bash
pnpm install
pnpm run build
```

## Run

```bash
pnpm start
```

## MCP Client Configuration

Use this with Claude Desktop, Cursor, Codex, or any MCP-capable client:

```json
{
  "mcpServers": {
    "ccc-brand": {
      "command": "node",
      "args": ["/absolute/path/to/CCC Branding/dist/server.js"]
    }
  }
}
```

For local development, rebuild after changes and point the client at `dist/server.js`:

```bash
pnpm run build
```

## Resources

- `brand://ccc/guidelines`
- `brand://ccc/colors`
- `brand://ccc/social-templates`

## Tools

### `get_brand_guidelines`

Returns all or one section of the brand system.

Sections: `all`, `colors`, `typography`, `logo`, `social`, `video`, `policyOutputs`, `strictGenerationRules`

### `validate_design_spec`

Checks colors, fonts, social dimensions, and logo asset availability.

Example:

```json
{
  "colors": ["#E95C1F", "#22264E"],
  "fonts": ["Montserrat", "DM Mono"],
  "assetType": "social",
  "widthPx": 1080,
  "heightPx": 1080,
  "usesLogo": true,
  "hasOfficialLogoAsset": false
}
```

### `create_generation_prompt`

Creates a strict prompt for another LLM, image model, or design agent.

### `create_social_svg`

Returns an SVG draft for one of:

- `policy_alert`
- `statistic`
- `quote`
- `cta`
- `lower_third`

The SVG uses only approved colors and font family names. Install the official fonts on the rendering machine for final output.

## GitHub Setup

1. Create a new GitHub repo, for example `ccc-brand-mcp`.
2. Add this folder as the remote:

```bash
git remote add origin git@github.com:YOUR_ORG/ccc-brand-mcp.git
git branch -M main
git push -u origin main
```

3. GitHub Actions will run `pnpm install` and `pnpm run build` on pushes and PRs.

## Strictness Model

This server treats the brand guide as a contract:

- off-palette colors are violations
- unapproved fonts are violations
- missing official logo assets are warnings
- social dimensions outside `1080x1080` are warnings unless explicitly intended
- policy memo illustrations are forbidden by the guide

Keep `data/ccc-brand.json` as the single source of truth when the brand guide changes.
