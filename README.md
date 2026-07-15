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

Official CCC SVG logo variants are included in `assets/logos`. The approved Montserrat, Anton, Hind, and DM Mono binaries and their licenses are included in `assets/fonts`; generated SVGs embed the faces they use so rendering does not depend on system font installation.

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

Checks colors, fonts, social dimensions, and logo asset availability. Final logo validation requires `officialLogoHref` to reference an approved file from `assets/manifest.json` that exists in the configured asset directory. The built-in social SVG generator auto-selects approved packaged SVG logos when no logo path is supplied.

Example:

```json
{
  "colors": ["#E95C1F", "#22264E"],
  "fonts": ["Montserrat", "DM Mono"],
  "assetType": "social",
  "widthPx": 1080,
  "heightPx": 1350,
  "usesLogo": true,
  "officialLogoHref": "logos/ccc-wide-orange.svg"
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

The SVG uses approved colors, embedded packaged font binaries, official logo geometry, and the actual cropped nested-C CCC mark from the selected reference. Social layouts are reference-locked: text is fitted into the original type slots without SVG `textLength` stretching. References 1, 2, and 4 use Anton for their display slots; reference 3 preserves its Montserrat Bold headline system and real megaphone paths. It supports `styleVariant`:

- `auto`
- `navy_poster`
- `petition_push`
- `orange_alert`
- `statistic_card`
- `contrast_cards`

Use `auto` unless you need a specific reference composition. `auto` routes comparisons to `contrast_cards`, petition/policymaker/lawmaker/mandate asks to `petition_push`, statistics to `statistic_card`, policy alerts to `orange_alert`, and general posts to `navy_poster`.

The reference mapping is fixed: `navy_poster` uses reference 1, `statistic_card` uses reference 2, `petition_push` and `orange_alert` use reference 3, and `contrast_cards` uses reference 4. Reference-locked outputs preserve variation 0 geometry; select another `styleVariant` for a genuinely different composition. `leadIn` supplies the two-line reference-3 prompt above the main headline, while `comparisonLeft` and `comparisonRight` supply the two positions in `contrast_cards`.

### `brand://ccc/post-references`

Exposes the packaged SVG post references from the brand guide as MCP resources. These are layout contracts: generated wording changes, but their density, type slots, hierarchy, watermark treatment, icons, CTA placement, and official logo geometry remain fixed.

### `audit_brand_assets`

Checks whether required CCC logo and font assets are available. By default it checks `./assets`; set `CCC_BRAND_ASSET_DIR` to point at a different official asset directory.

### `qa_social_layout`

Checks headline, body, and CTA copy against CCC social layout limits before generation. In `final` mode, over-limit copy is a validation error; in `draft` mode, it is reported as a warning.

### `validate_svg_artifact`

Validates generated SVG markup after another LLM or design agent produces it. Use this as the final gate before accepting CCC-branded SVG output.

It checks:

- approved CCC font families only, with no generic fallback families
- approved CCC palette colors only
- disciplined color count and tertiary accent usage
- `1080x1350` social dimensions
- reference-system and reference-exact layout metadata
- the cropped nested-C CCC mark geometry with an approved semi-transparent gradient; concentric circles fail validation
- variant-specific structure such as `petition_push` action bands, stacked headline blocks, petition markers, large statistic markers, and compact contrast cards
- large full-height diagonal split layouts that drift away from the post guide
- weak large social headlines set in thin or regular Montserrat
- official logo asset references
- placeholder logo text or improvised logo marks

Example:

```json
{
  "mode": "final",
  "assetType": "social",
  "requiresLogo": true,
  "svg": "<svg ...>...</svg>"
}
```

Recommended loop for generated SVGs:

1. Call `create_generation_prompt`.
2. Generate the SVG in the model/design tool.
3. Call `validate_svg_artifact`.
4. Fix every violation before using the SVG.

## Assets

Final outputs require official logo and font assets. This repo ships the official SVG logo variants, approved font binaries, font licenses, and an asset manifest.

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
    ccc-wide-orange.svg
    ccc-wide-leila.svg
    ccc-wide-slate.svg
    ccc-wide-brick-coral.svg
    ccc-wide-marigold.svg
    ccc-wide-sand.svg
    ccc-wide-deep-teal.svg
    ccc-wide-bright-teal.svg
    ccc-wide-soft-mint.svg
```

Run `audit_brand_assets` before using the MCP for final production output.

## Quality Checks

```bash
pnpm run check
pnpm test
```

The test suite covers canonical social sizing, palette/font rejection, strict logo verification, prompt/SVG dimensions, generated SVG artifact linting, layout overflow, and asset manifest consistency.

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
- missing official logo assets are violations in `final` mode and warnings in `draft` mode; packaged SVG logos are used by default for generated SVGs
- SVG logo placeholders are forbidden in `final` mode
- generated SVGs must pass `validate_svg_artifact` before handoff
- social dimensions outside `1080x1350` are warnings unless explicitly intended
- final social graphics should use no more than five unique brand colors and no more than one tertiary accent color
- social posts must follow the mapped reference system with its native display font, the actual cropped CCC mark silhouette, small label, footer URL, icons, and official logo
- petition, policymaker, lawmaker, mandate, and direct advocacy asks should use `petition_push` or `orange_alert`, not a generic clean navy poster
- social outputs should vary across `navy_poster`, `petition_push`, `orange_alert`, `statistic_card`, and `contrast_cards` instead of repeatedly using the same clean navy layout
- packaged SVG post references are available through `brand://ccc/post-references` and are the locked geometry for generated social posts
- display copy must fit the native reference slots without `textLength` stretching; references 1, 2, and 4 use Anton, while reference 3 uses Montserrat Bold
- large split-screen layouts are reserved for `contrast_cards`; full-height diagonal divider wedges and serif display headlines are violations
- social copy that exceeds layout limits is a violation in `final` mode and a warning in `draft` mode
- policy memo illustrations are forbidden by the guide

Keep `data/ccc-brand.json` as the single source of truth when the brand guide changes.
