# CCC SVG and Canva workflow

Use this workflow when the user requests a CCC asset in Canva. The assistant coordinates two separately authenticated MCP connections; this document is not a background service or an automatic trigger in Canva. A client outside this repository must load these instructions and connect both tools explicitly.

## Required connections

- `ccc-brand`: guidelines, generation, asset audit and validation.
- Canva: brand kit discovery, asset upload, template/design creation and inspection.
- Read `workflows/canva.json` for the selected kit and verified template IDs. The empty template map means no reusable templates have been registered yet; never invent IDs.
- Verify the selected kit is accessible through `list_brand_kits`. If it is missing, stop the Canva step and report the account/connection issue. Do not select a similarly named kit.

## Generate and preserve the source

1. Retrieve `get_brand_guidelines` and run `audit_brand_assets`. Stop if a required MCP tool or official asset is unavailable.
2. Get the brief and supplied copy from the user. Do not invent quotations or attribution. Use `create_quote_post`, `create_social_svg`, or `create_one_pager` as applicable. For other formats, use `create_generation_prompt` and follow its returned contract. Report spelling corrections.
3. For one-pagers, complete the local working SVG returned by the MCP before archiving; the initial shell is not a finished deliverable.
4. Run `validate_svg_artifact` on the exact final social/video SVG, or `validate_one_pager_file` on the completed one-pager. Resolve every violation. Save the parsed final validator result as JSON with top-level `ok: true`, `mode: "final"`, and an empty `violations` array. Keep any warnings visible. Do not substitute the local archive helper for MCP validation.
5. Save the complete SVG as a real local file. Archive its exact bytes and validator report before contacting Canva:

   ```sh
   node scripts/canva-artifact.mjs archive --slug campaign-name --svg /absolute/path/final.svg --report /absolute/path/final-validation.json
   ```

   This creates `deliverables/canva/campaign-name/v001/` (then `v002`, etc.) containing `source.svg`, `validation.json`, and `manifest.json`. The checksum records the bytes archived; it is not proof that a supplied report came from the MCP. The assistant must invoke the real validator on those same bytes. Never replace an older revision or delete its SVG after upload.

## Create the Canva counterpart

Read the current connector schema rather than assuming file support or brand-kit parameters.

- **Editable template route:** use a verified template from the configuration. Inspect its autofill dataset and only autofill a nonempty supported schema. Otherwise copy/create from the template and use supported editing operations. Map the same corrected content used in the SVG. The archived SVG remains a separate source deliverable.
- **Artwork route:** use `upload_asset_from_url` with `asset_file` for a file generated in the current task, if supported by the client. An uploaded asset is not a Canva design. Place it in a design through supported tools or the signed-in Canva UI. If direct file transfer fails, use Canva's direct upload UI; never publish files to a public hosting service to manufacture an import URL.
- `import_design_from_url` currently accepts local HTML/ZIP artifacts via `design_file`; do not assume it accepts a local SVG. A supported import wrapper may be used without changing the retained SVG. Inspect the resulting design before claiming success.
- Applying a brand kit does not enforce exact MCP layouts. Do not claim individually editable Canva elements for an imported SVG without checking them.
- If no route succeeds, keep the SVG archive and report the blocked Canva step. Do not mark an upload as a completed design.

## Verify and record

Inspect the actual Canva design/thumbnail for font substitutions, colors, logo geometry, clipping, line breaks and text overflow against the MCP result. Use applicable MCP validation on any extracted design specification, but do not describe source-SVG validation as a complete Canva audit. Correct visible issues. Record the verified Canva design URL and asset ID (if available):

```sh
node scripts/canva-artifact.mjs link --revision deliverables/canva/campaign-name/v001 --design-url https://www.canva.com/design/DESIGN_ID/edit --review passed --notes "Compared the Canva preview with the retained SVG; no visible differences."
```

Use `--review pending` or `--review failed` when appropriate. An asset-only upload can be recorded using `--asset-id` without `--design-url`; it remains incomplete. The helper appends handoff history and checks that the source checksum still matches. It never uploads or validates artwork itself.

Return both the retained SVG link and the Canva design link, describe actual editability, and disclose unresolved warnings. Later Canva edits do not update the SVG automatically; create and validate a new MCP revision when a source update is requested.

## GitHub retention

Commit the SVG, validation report and manifest together when saving a completed asset to GitHub is in scope. Commit only the intended asset directory and workflow changes, never unrelated deliverables. Check that the content is appropriate for the repository's visibility before publishing. No tokens, cookies, API keys or connector credentials belong here. A local archive is not a GitHub backup until its commit has been pushed successfully.
