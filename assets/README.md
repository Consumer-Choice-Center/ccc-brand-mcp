# CCC Brand Assets

This directory contains the official CCC logo assets and the approved open-source brand font binaries used by the generator.

The MCP embeds the required font faces into generated SVGs for deterministic rendering. The font licenses are stored in `assets/fonts/licenses`. A custom `CCC_BRAND_ASSET_DIR` may still override the packaged asset directory.

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
```

`post-references/` contains the SVG layout contracts from the brand guide. The social generator preserves their coordinates, icon paths, watermark crop, type slots, CTA placement, and footer geometry while replacing copy. Do not substitute generic icons or free-form layouts inside these reference systems.

Use the MCP `audit_brand_assets` tool to verify which required files are present.
