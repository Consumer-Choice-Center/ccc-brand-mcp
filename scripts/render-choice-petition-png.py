from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs"
FONT_DIR = Path("/Users/lukadzagania/Library/Fonts")

COLORS = {
    "leila": "#22264E",
    "orange": "#E95C1F",
    "white": "#FFFFFF",
    "slate": "#6F789B",
    "mint": "#9BD8C7",
}


def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


def crop_non_white(img):
    rgb = img.convert("RGB")
    px = rgb.load()
    w, h = rgb.size
    xs = []
    ys = []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if not (r > 248 and g > 248 and b > 248):
                xs.append(x)
                ys.append(y)
    if not xs:
        return img
    return img.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1))


def white_to_alpha(img):
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r > 248 and g > 248 and b > 248:
                pixels[x, y] = (255, 255, 255, 0)
            else:
                pixels[x, y] = (r, g, b, a)
    return rgba


def rgba(hex_color, alpha):
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16),
        int(value[2:4], 16),
        int(value[4:6], 16),
        alpha,
    )


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def draw_gradient_ring(base, center, radii):
    overlay = Image.new("RGBA", base.size, (255, 255, 255, 0))
    ring = ImageDraw.Draw(overlay)
    slate = rgba(COLORS["slate"], 52)
    orange = rgba(COLORS["orange"], 68)
    for radius in radii:
        box = (
            center[0] - radius,
            center[1] - radius,
            center[0] + radius,
            center[1] + radius,
        )
        for start in range(0, 360, 3):
            phase = start / 359
            t = phase / 0.52 if phase <= 0.52 else (1 - phase) / 0.48
            t = max(0, min(1, t))
            rgb = mix(slate, orange, t)
            alpha = round(slate[3] + (orange[3] - slate[3]) * t)
            ring.arc(box, start=start, end=start + 4, fill=(*rgb, alpha), width=28)
    return Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGB")


img = Image.new("RGB", (1080, 1350), COLORS["leila"])
img = draw_gradient_ring(img, (892, 604), (150, 225, 300))
draw = ImageDraw.Draw(img)

logo_path = Path("/private/tmp/ccc-logo-wrapper.svg.png")
if logo_path.exists():
    logo = white_to_alpha(crop_non_white(Image.open(logo_path).convert("RGBA")))
    logo.thumbnail((246, 84), Image.Resampling.LANCZOS)
    img.paste(logo, (762, 56), logo)

draw.text((72, 64), "TELL POLICYMAKERS", font=font("Montserrat-Bold.ttf", 18), fill=COLORS["white"])
draw.rectangle((72, 96, 114, 110), fill=COLORS["orange"])

draw.text((72, 220), "CHOICE ISN'T", font=font("Montserrat-Bold.ttf", 94), fill=COLORS["white"])
draw.text((72, 326), "OPTIONAL", font=font("Montserrat-Bold.ttf", 94), fill=COLORS["orange"])

draw.rectangle((72, 704, 80, 808), fill=COLORS["orange"])
draw.text((112, 724), "Policymakers: protect consumer", font=font("Montserrat-Bold.ttf", 32), fill=COLORS["white"])
draw.text((112, 766), "choice. Do not restrict it.", font=font("Montserrat-Regular.ttf", 32), fill=COLORS["white"])

draw.rectangle((72, 908, 762, 1034), fill=COLORS["orange"])
draw.text((112, 944), "SIGN THE PETITION", font=font("Montserrat-Bold.ttf", 44), fill=COLORS["white"])

draw.arc((72, 1040, 620, 1156), 198, 342, fill=COLORS["orange"], width=18)
draw.line((72, 1184, 1008, 1184), fill=COLORS["mint"], width=3)

draw.text((72, 1276), "consumerchoicecenter.org", font=font("Montserrat-Medium.ttf", 18), fill=COLORS["white"])
draw.text((682, 1276), "YOUR CHOICE OUR FIGHT", font=font("Montserrat-Medium.ttf", 18), fill=COLORS["white"])

OUT.mkdir(exist_ok=True)
img.save(OUT / "choice-isnt-optional-petition-final.png")
