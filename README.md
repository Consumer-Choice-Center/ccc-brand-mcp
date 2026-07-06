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
- Social default: `1080x1350`, with `consumerchoicecenter.org` footer
- Video subtitles: Montserrat Bold, 55-60pt, bottom-third safe-area placement
- Policy outputs: primer, note, memo, coalition letter rules

Official logo files are not included in this repository. The MCP deliberately warns when a generation asks for a logo without an approved asset.

## Install

```bash
corepack enable
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

Checks colors, fonts, social dimensions, and logo asset availability. Final logo validation requires `officialLogoHref` to reference an approved file from `assets/manifest.json` that exists in the configured asset directory.

Example:

```json
{
  "colors": ["#E95C1F", "#22264E"],
  "fonts": ["Montserrat", "DM Mono"],
  "assetType": "social",
  "widthPx": 1080,
  "heightPx": 1350,
  "usesLogo": true,
  "officialLogoHref": "logos/ccc-wide-primary.svg"
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

### `audit_brand_assets`

Checks whether required CCC logo and font assets are available. By default it checks `./assets`; set `CCC_BRAND_ASSET_DIR` to point at a different official asset directory.

### `qa_social_layout`

Checks headline, body, and CTA copy against CCC social layout limits before generation. In `final` mode, over-limit copy is a validation error; in `draft` mode, it is reported as a warning.

## Assets

Final outputs require official logo and font assets. This repo includes an asset manifest and expected directory structure, but it does not ship logo files or font binaries.

Expected local structure:

```text
assets/
  fonts/
    Montserrat-Regular.ttf
    Montserrat-Italic.ttf
    Montserrat-Medium.ttf
    Montserrat-MediumItalic.ttf
    Montserrat-SemiBold.ttf
    Montserrat-Bold.ttf
    Anton-Regular.ttf
    Hind-Medium.ttf
    DMMono-Regular.ttf
  logos/
    ccc-wide-primary.svg
    ccc-wide-primary.png
    ccc-icon-primary.svg
    ccc-icon-primary.png
    ccc-wide-reversed.svg
    ccc-wide-reversed.png
```

Run `audit_brand_assets` before using the MCP for final production output.

## Quality Checks

```bash
pnpm run check
pnpm test
```

The test suite covers canonical social sizing, palette/font rejection, strict logo verification, prompt/SVG dimensions, layout overflow, and asset manifest consistency.

## GitHub Setup

1. Create a new GitHub repo, for example `ccc-brand-mcp`.
2. Add this folder as the remote:

```bash
git remote add origin git@github.com:YOUR_ORG/ccc-brand-mcp.git
git branch -M main
git push -u origin main
```

3. GitHub Actions will run `pnpm install --frozen-lockfile`, `pnpm run check`, and `pnpm run build` on pushes and PRs.

## Strictness Model

This server treats the brand guide as a contract:

- off-palette colors are violations
- unapproved fonts are violations
- missing official logo assets are violations in `final` mode and warnings in `draft` mode
- social dimensions outside `1080x1350` are warnings unless explicitly intended
- social copy that exceeds layout limits is a violation in `final` mode and a warning in `draft` mode
- policy memo illustrations are forbidden by the guide

Keep `data/ccc-brand.json` as the single source of truth when the brand guide changes.
