# CCC Brand Assets

This directory is the expected local home for official CCC logo and font assets.

The MCP does not ship logo files or font binaries. Final branded output should only be generated after the official assets are placed here or after `CCC_BRAND_ASSET_DIR` points to an equivalent directory.

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
    ccc-wide-primary.svg
    ccc-wide-primary.png
    ccc-icon-primary.svg
    ccc-icon-primary.png
    ccc-wide-reversed.svg
    ccc-wide-reversed.png
```

Use the MCP `audit_brand_assets` tool to verify which required files are present.
