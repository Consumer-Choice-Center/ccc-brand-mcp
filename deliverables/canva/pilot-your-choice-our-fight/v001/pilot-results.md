# Pilot: Your Choice Our Fight

- Brand MCP: retrieved current guidelines, audited official assets, generated `navy_poster` through `create_social_svg`, then called `validate_svg_artifact` in final mode. No violations, warnings or spelling corrections.
- Source: `source.svg` is the retained editable SVG master. `validation.json` stores the MCP validator report.
- SVG upload: succeeded through `asset_file`; Canva asset `MAHV8zoYwFo`.
- Design import: local `canva-import.html` succeeded and created design `DAHV8yEMy1U`, one 1080 × 1350 page. The HTML includes the official font files, but Canva still substituted serif fonts inside its SVG image. Do not reuse that wrapper as a verified production import.
- Editability: the design contains one image fill and no rich-text elements. This route does not create individually editable Canva text.
- Correction: `source-preview.png` uses the actual packaged Anton and DM Mono fonts. Visual inspection confirmed the expected logo, colors, watermark, four headline lines and footer. Uploaded as `MAHV860FHPA`, then applied as the page image in transaction `6355095790562609719`.
- Save state: user explicitly approved the corrected preview, and Canva confirmed the transaction was committed. The saved design now uses the font-accurate render. See manifest history for the initial failed import and successful correction.

## Renderer findings

The available NAPI canvas renderer loads explicit font files but does not correctly apply the source SVG's CSS classes. The available Sharp renderer respected the CSS but still substituted fonts in this environment. Neither first render was accepted.

The corrected preview expands the source's simple class rules into presentation attributes on a temporary render-only copy, then uses NAPI canvas with `GlobalFonts.registerFromPath` for `Anton-Regular.ttf` and `DMMono-Regular.ttf`. The retained SVG is not modified. The font and layout were visually checked before the final upload.

## Outcome

The pilot demonstrates MCP generation, source retention, plugin file upload, design import, inspection and correction. It also exposes two production constraints: imports require font checks, and this artwork route is flat in Canva. Fully editable Canva templates remain a separate, untested route. The selected brand kit is accessible; the import API itself has no brand-kit assignment parameter, so this test does not claim an applied kit association.
