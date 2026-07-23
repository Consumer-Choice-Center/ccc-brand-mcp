# CCC Brand MCP

Strict Model Context Protocol server for Consumer Choice Center brand-guided generation.

It exposes the CCC 2026 brand guide as machine-readable resources and tools so an LLM can:

- retrieve approved colors, fonts, logo rules, social/video/document constraints
- validate proposed designs before generation
- create strict brand-locked prompts for image/design models
- generate simple on-brand SVG drafts for social cards and video lower thirds
- generate strict reference contracts for CCC policy one-pagers with contextual object illustrations

## Brand Source

The initial rules were extracted from `CCC_Brand_Guide_2026_5.pdf`:

- Palette: Autumn Orange `#E95C1F`, Leila `#22264E`, Base White `#FFFFFF`, Warm White `#FFF7EF`, Cool Mist `#E7ECF4`, Slate Blue `#6F789B`, Brick Coral `#B9473A`, Marigold `#F4B544`, Sand Beige `#CDB79F`, Deep Teal `#1E6F78`, Bright Teal `#00A6A6`, Soft Mint `#9BD8C7`
- Typography: Montserrat, Anton, Hind, DM Mono
- Social default: `1080x1350`, with `consumerchoicecenter.org` footer
- Video subtitles: Montserrat Bold, 55-60pt, bottom-third safe-area placement
- Policy outputs: primer, note, memo, coalition letter rules

Official CCC SVG logo variants are included in `assets/logos`. The approved Montserrat, Anton, Hind, and DM Mono binaries and their licenses are included in `assets/fonts`. Generated SVGs keep text editable and Illustrator-safe, so install the packaged fonts before editing; browser-style base64 web-font embedding is intentionally rejected.

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
- `brand://ccc/post-references`
- `brand://ccc/quote-people`
- `brand://ccc/one-pager-references`
- `brand://ccc/one-pager-working-templates`

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

Use `outputType: "one_pager"` to include the locked one-pager reference rules automatically.

### `create_one_pager`

Creates the generation contract for a CCC policy one-pager and materializes the selected clean working SVG directly into the shared local workspace. It returns a compact `workingFile.outputPath`, byte count, SHA-256, and composition brief instead of sending the full SVG through chat. This avoids client-side truncation of large XML resources. The clean shell is derived from the visual reference but has all original text and raster illustrations removed before composition. The tool selects one of two packaged SVG templates:

- `material_cost_chain`: tariffs, costs, product components, supply chains, and material flows
- `access_barriers`: permits, approvals, restrictions, health, safety, and product-access barriers

Both templates use the exact `0 0 1186.51 1535.49` canvas. The selected clean SVG is the mandatory production shell: canvas, section heights, typography hierarchy, headline origin, navy/orange/warm-white color roles, brush shapes, normalized connectors, rules, cards, footer, and logo geometry remain fixed. New fitted wording and one embedded contextual object composite are added to the empty slots. Final SVGs must preserve `data-ccc-clean-template="mutable-content-cleared-v1"`, declare the exact `data-ccc-template-source` returned by the tool, and retain at least 90% of the selected reference's measured vector geometry.

Edit `workingFile.outputPath` in place with local filesystem operations. Never request the complete working shell or populated visual reference through an MCP resource reader, paste it through chat, or reconstruct it from a truncated response.

The central illustration must depict the physical object most directly connected to the topic. It should match the supplied photorealistic transparent-background cutout/cutaway style, remain inside the original illustration zone, avoid every text area, and be embedded as a base64 image through SVG 1.1 `xlink:href` in the final SVG.

```json
{
  "request": "Explain how repair restrictions raise the cost of fixing consumer electronics.",
  "template": "auto",
  "headline": "WHY REPAIR IS HARDER THAN IT SHOULD BE",
  "centralObject": "a cutaway smartphone showing the battery, screen, and repairable internal modules",
  "keyMessage": "Consumers should be able to repair the products they own.",
  "sources": ["European Commission right-to-repair rules", "OECD consumer repair data"],
  "outputFileName": "right-to-repair-working.svg",
  "mode": "final"
}
```

### `validate_one_pager_file`

Validates a completed one-pager by local file path. The MCP reads the file server-side and returns only a compact report containing the file checksum, strict one-pager results, and Illustrator compatibility results. This is the required production validator because it avoids transferring large SVG markup and embedded images through chat.

Validation is template-aware rather than based on a generic social-post palette. It accepts the selected reference's native colors plus official CCC colors, canonicalizes Illustrator/PostScript aliases such as `Anton-Regular`, `Montserrat-BoldItalic`, and `DMMono-Medium`, and checks visible text only so unused Illustrator style definitions cannot trigger false palette or font failures. Text roles are checked against the template-native Anton, Montserrat, and DM Mono hierarchy. Component spacing uses a 16-unit minimum gutter, supports standard one-to-four-value SVG inset shorthand, and permits the reference-native source/logo footer relationship.

```json
{
  "filePath": "/absolute/path/to/right-to-repair-working.svg",
  "template": "material_cost_chain",
  "mode": "final"
}
```

### `validate_one_pager_svg`

Compatibility validator for callers that already hold complete SVG markup. Normal one-pager workflows must use `validate_one_pager_file`. Both validators compare paths, panels, dividers, brush shapes, and connector geometry to the declared packaged source template; reject populated-source content, unsafe text, and collisions; and enforce one uncropped illustration plus three clean connectors.

### `brand://ccc/one-pager-references`

Exposes compact metadata and local paths for the populated visual references. It no longer transfers the multi-megabyte SVGs through chat.

### `brand://ccc/one-pager-working-templates`

Exposes compact metadata for the two clean production shells. Call `create_one_pager` to materialize the selected complete SVG directly into the workspace.

### `create_social_svg`

Returns an SVG draft for one of:

- `policy_alert`
- `statistic`
- `quote`
- `cta`
- `lower_third`

The SVG uses approved colors, editable installed CCC fonts, inline official logo geometry, and the actual cropped nested-C CCC mark from the selected reference. Social layouts are reference-locked: text is fitted into the original type slots without SVG `textLength`, `lengthAdjust`, `font-stretch`, or non-uniform scale transforms. References 1, 2, 4, and 5 use Anton for their display slots; reference 3 preserves its Montserrat Bold headline system and real megaphone paths. `create_social_svg` is the only supported social renderer; older local code calling `createLegacySocialSvg` is safely routed back through the same reference-locked path. It supports `styleVariant`:

- `auto`
- `navy_poster`
- `petition_push`
- `orange_alert`
- `statistic_card`
- `contrast_cards`
- `quote_post`

Use `auto` unless you need a specific reference composition. `auto` routes quotes to `quote_post`, comparisons to `contrast_cards`, petition/policymaker/lawmaker/mandate asks to `petition_push`, statistics to `statistic_card`, policy alerts to `orange_alert`, and general posts to `navy_poster`.

The reference mapping is fixed: `navy_poster` uses reference 1, `statistic_card` uses reference 2, `petition_push` and `orange_alert` use reference 3, `contrast_cards` uses reference 4, and `quote_post` uses the supplied reference-5 quote template. Quote posts preserve that SVG's exact 1080x1350 dimensions, `#15192E` background, visible `#22274E` cropped CCC watermark, logo geometry, Anton sizes, and 100/82/68px line rhythm. Copy stays in the left reference column while each portrait uses a verified person-specific bottom-right scale; portraits are contained in full with `xMaxYMax meet`, embedded as base64 `data:image` URIs, and paired with at least one Autumn Orange quote emphasis. Reference-locked outputs preserve variation 0 geometry; select another `styleVariant` for a genuinely different composition. `leadIn` supplies the two-line reference-3 prompt above the main headline, while `comparisonLeft` and `comparisonRight` supply the two positions in `contrast_cards`. For `template: "quote"`, provide `person` and place the quote in `headline`.

For PNG previews, the rasterizer must explicitly load `assets/fonts/Anton-Regular.ttf`, the required Montserrat weights, and `assets/fonts/DMMono-Regular.ttf`. Do not use Quick Look or another system-fallback renderer as production output: a PNG is invalid if its headline silently falls back to a serif or generic system face. Keep the SVG as the Illustrator-editable master and validate it before rasterization.

### `create_quote_post`

Creates a self-contained quote post directly from the supplied reference-5 template. The tool selects an approved CCC person, embeds the matching packaged portrait directly in the SVG, contains the entire portrait without cropping, keeps it outside the text safe zone, inserts the verified full name and current title, fits the quote into the protected Anton slots, and always applies one Autumn Orange emphasis.

Approved person ids: `bill`, `david`, `emil`, `fabio`, `fred`, `stephen`, `yael`, `zoltan`.

```json
{
  "quote": "Prohibition does not make products disappear. It makes them unregulated.",
  "person": "yael",
  "emphasis": "unregulated",
  "mode": "final"
}
```

Use `brand://ccc/quote-people` to retrieve approved ids, full names, current titles, aliases, and portrait paths. The team metadata was verified against `https://consumerchoicecenter.org/team/` on 2026-07-21.

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
- Illustrator-safe SVG 1.1 metadata, `xlink:href` raster embedding, installed editable fonts, inline vector logos, and absence of live SVG filters

### `validate_illustrator_svg`

Runs the Illustrator compatibility gate independently of the broader brand checks. It rejects CSS `data:font` web-font embedding, SVG 2 image `href`, nested `data:image/svg+xml` links, external raster links, and live filters—the constructs most likely to be treated as missing links or unsupported plug-ins when the downloaded SVG is opened in Illustrator.

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
  post-references/
    ccc-post-reference-1.svg
    ccc-post-reference-2.svg
    ccc-post-reference-3.svg
    ccc-post-reference-4.svg
    ccc-quote-post-template.svg
  quote-people/
    bill-wirtz.svg
    david-clement.svg
    emil-panzaru.svg
    fabio-fernandes.svg
    fred-roeder.svg
    stephen-kent.svg
    yael-ossowski.svg
    zoltan-kesz.svg
  one-pager-references/
    ccc-tariffs-american-home.svg
    ccc-cooling-europe.svg
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
- one-pager-sized or one-pager-labelled SVGs are automatically routed through the strict one-pager gate; production workflows use `validate_one_pager_file` so complete SVG markup never passes through chat
- all social SVGs must declare `data-ccc-layout-lock="reference-exact"`; freeform and legacy-rendered social files are rejected
- social dimensions outside `1080x1350` are warnings unless explicitly intended
- final social graphics should use no more than five unique brand colors and no more than one tertiary accent color
- social posts must follow the mapped reference system with its native display font, the actual cropped CCC mark silhouette, small label, footer URL, icons, and official logo
- petition, policymaker, lawmaker, mandate, and direct advocacy asks should use `petition_push` or `orange_alert`, not a generic clean navy poster
- social outputs should vary across `navy_poster`, `petition_push`, `orange_alert`, `statistic_card`, `contrast_cards`, and `quote_post` instead of repeatedly using the same clean navy layout
- packaged SVG post references are available through `brand://ccc/post-references` and are the locked geometry for generated social posts
- `create_one_pager` materializes a checksummed clean working file with source copy/images removed; generated one-pagers must edit that local file in place, preserve the clean-template marker, retain at least 90% of the exact reference geometry, and pass `validate_one_pager_file`
- quote posts must use reference 5 through `create_quote_post`, an approved packaged portrait, and the verified name/title from `brand://ccc/quote-people`
- display copy must fit the native reference slots without `textLength`, `lengthAdjust`, `font-stretch`, or non-uniform scale transforms; references 1, 2, 4, and 5 use Anton, while reference 3 uses Montserrat Bold
- raster previews must load the packaged CCC font files explicitly; silent serif or system-font fallback renders are invalid
- large split-screen layouts are reserved for `contrast_cards`; full-height diagonal divider wedges and serif display headlines are violations
- social copy that exceeds layout limits is a violation in `final` mode and a warning in `draft` mode
- policy memo illustrations are forbidden by the guide

Keep `data/ccc-brand.json` as the single source of truth when the brand guide changes.
