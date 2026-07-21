#!/usr/bin/env python3
"""Create the extended CCC quote post requested for Fabio Fernandes."""

from base64 import b64encode
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "deliverables" / "fabio-fernandes-world-cup-quote.svg"

QUOTE = (
    "World Cup fans aren't discovering that Americans are excessive or "
    "gluttonous, as they were told. They're discovering what an economy "
    "looks like when it's allowed to optimize for the consumer"
)
LINES = [
    "World Cup fans aren't",
    "discovering that Americans",
    "are excessive or",
    "gluttonous, as they were",
    "told. They're discovering",
    "what an economy looks like",
    "when it's allowed to",
    "optimize for the consumer",
]


def esc(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&apos;")


def data_uri(path: Path) -> str:
    # Quote portraits carry their approved cutout as an embedded PNG. Reuse that
    # payload directly so common SVG renderers preserve transparency reliably.
    source = path.read_text()
    embedded = re.search(r'(?:href|xlink:href)=["\'](data:image/png;base64,[^"\']+)["\']', source)
    if embedded:
        return embedded.group(1)
    return "data:image/svg+xml;base64," + b64encode(path.read_bytes()).decode("ascii")


template = (ASSETS / "post-references" / "ccc-quote-post-template.svg").read_text()
# Preserve the background, watermark, and official CCC mark while replacing its sample copy/portrait.
template = re.sub(r"<image\b[^>]*/>", "", template, flags=re.I)
template = re.sub(r"<text\b[\s\S]*?</text>", "", template, flags=re.I)
template = template.replace(
    '<g class="cls-3">',
    '<g class="cls-3" data-ccc-role="quote-watermark" data-ccc-watermark="cropped-ccc-mark">',
    1,
)

portrait = data_uri(ASSETS / "quote-people" / "fabio-fernandes.svg")
quote_svg = []
for index, line in enumerate(LINES):
    if line == "optimize for the consumer":
        line = 'optimize for the <tspan data-ccc-role="quote-emphasis" fill="#E95C1F">consumer</tspan>'
    opening = "“" if index == 0 else ""
    closing = "”" if index == len(LINES) - 1 else ""
    quote_svg.append(
        f'<text x="54.78" y="{258 + index * 54}" font-family="Anton, sans-serif" '
        f'font-weight="400" font-size="42" fill="#E7ECF4">{opening}{line}{closing}</text>'
    )

content = f'''<g data-ccc-role="quote-portrait" data-ccc-portrait-contained="true">
  <image href="{portrait}" x="380" y="350" width="700" height="1000" preserveAspectRatio="xMaxYMax meet"/>
</g>
<g data-ccc-role="reference-headline">{''.join(quote_svg)}</g>
<g data-ccc-role="quote-attribution">
  <text x="55.46" y="756.77" font-family="Montserrat, sans-serif" font-weight="700" font-size="48.08" fill="#FFFFFF">Fabio Fernandes</text>
  <text x="55.46" y="790.04" font-family="Montserrat, sans-serif" font-weight="700" font-size="20" fill="#E95C1F">Head of Communications &amp; Marketing</text>
</g>'''

metadata = (
    ' data-ccc-style="guide-social" data-ccc-layout-lock="reference-exact" '
    'data-ccc-variant="quote_post" data-ccc-reference-system="reference-5" '
    'data-ccc-quote-person="fabio" data-ccc-quote-line-count="8" '
    'data-ccc-quote-text="' + esc(QUOTE) + '" width="1080" height="1350" '
    'role="img" aria-label="CCC quote from Fabio Fernandes"'
)
template = re.sub(r"<svg\b([^>]*)>", lambda match: f"<svg{match.group(1)}{metadata}>", template, count=1, flags=re.I)
template = re.sub(r"</svg>\s*$", content + "</svg>", template, flags=re.I)

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(template)
print(OUT)
