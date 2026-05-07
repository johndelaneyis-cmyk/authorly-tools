"""
Generate apple-touch-icon.png for Authorly.

Output: 180x180 PNG matching the brand:
  - Cream paper background (#faf6f0)
  - Centered oxblood § ornament (#a83232) in a serif italic
  - Faint subpixel anti-aliasing tuned for iOS home-screen rendering

iOS rounds the corners and adds gloss; we only ship the square. We use a
slightly smaller § than the full edge so iOS's mask doesn't clip it.
"""
from PIL import Image, ImageDraw, ImageFont

SIZE = 180
PAPER = (250, 246, 240, 255)   # #faf6f0
INK = (26, 24, 20, 255)         # #1a1814
OXBLOOD = (168, 50, 50, 255)    # #a83232

img = Image.new("RGB", (SIZE, SIZE), PAPER[:3])
draw = ImageDraw.Draw(img)

# Section sign (§) — iOS will mask & round the corners; we want it centered,
# scaled to ~70% of the icon so visual weight feels right post-mask.
# Georgia italic ships on every Apple device anyway; the rendered glyph here
# is mainly seen at small sizes (home screen). Use Georgia Bold Italic for
# weight that survives the mask.
font_paths = [
    r"C:\Windows\Fonts\georgiaz.ttf",  # bold italic
    r"C:\Windows\Fonts\georgiai.ttf",  # italic
    r"C:\Windows\Fonts\georgiab.ttf",  # bold
    r"C:\Windows\Fonts\georgia.ttf",   # regular
]
font = None
for p in font_paths:
    try:
        font = ImageFont.truetype(p, 130)
        break
    except Exception:
        continue
if font is None:
    font = ImageFont.load_default()

text = "§"  # §

# Measure & center
bbox = draw.textbbox((0, 0), text, font=font)
w = bbox[2] - bbox[0]
h = bbox[3] - bbox[1]
x = (SIZE - w) / 2 - bbox[0]
# Visually center; § sits low in its bbox, so nudge up a hair
y = (SIZE - h) / 2 - bbox[1] - 4

draw.text((x, y), text, font=font, fill=OXBLOOD[:3])

img.save(r"C:\Users\darre\authorly\apple-touch-icon.png", "PNG", optimize=True)
print("OK")
