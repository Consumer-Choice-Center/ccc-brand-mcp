# CCC Brand Assets

This directory is the expected local home for official CCC logo and font assets.

The MCP ships official CCC SVG logo variants in `assets/logos`. It does not ship font binaries. Final branded output should only be rendered after the official fonts are placed here, installed on the render machine, or made available through `CCC_BRAND_ASSET_DIR`.

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

Use the MCP `audit_brand_assets` tool to verify which required files are present.
