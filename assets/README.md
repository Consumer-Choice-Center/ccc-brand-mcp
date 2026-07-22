# CCC Brand Assets

This directory contains the official CCC logo assets and the approved open-source brand font binaries used by the generator.

The MCP keeps SVG text editable and references the approved font-family names without browser-style `data:font` embedding, which Adobe Illustrator can misread as a linked asset. Install the packaged font files before editing. The font licenses are stored in `assets/fonts/licenses`. A custom `CCC_BRAND_ASSET_DIR` may still override the packaged asset directory.

Expected structure:

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
    licenses/
      Anton-OFL.txt
      Montserrat-OFL.txt
      Hind-OFL.txt
      DMMono-OFL.txt
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

`post-references/` contains the SVG layout contracts from the brand guide. The social generator preserves their coordinates, icon paths, watermark crop, type slots, CTA placement, and footer geometry while replacing copy. Do not substitute generic icons or free-form layouts inside these reference systems.

`quote-people/` contains the approved portrait SVGs used by the reference-5 quote template. Names and current CCC positions are mapped in `data/ccc-brand.json`; do not substitute an invented portrait or manually typed attribution.

`one-pager-references/` contains the two strict 1186.51×1535.49 policy-graphic templates. Preserve their complete page geometry, section boundaries, typography hierarchy, orange brush shapes, arrows, cards, source footer, and logo placement. Only fitted copy and the contextual central/supporting object illustrations may change; replacement illustrations must remain inside the original zones and be embedded as base64 raster data through SVG 1.1 `xlink:href`.

Use the MCP `audit_brand_assets` tool to verify which required files are present.
