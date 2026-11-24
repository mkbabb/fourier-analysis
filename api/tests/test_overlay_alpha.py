"""The overlay keeps its picture's transparency, as the thumbnail does.

The stage draws the overlay under a drawing. Flattened to RGB, a portrait with
its ground cut away (the gallery's Fourier and Cauchy engravings) came out on a
black box, which the stage's wash drew as a grey slab around the figure in
light and a dark one in dark.
"""

import io

from PIL import Image

from api.routers.images import overlay_image


def _encoded(img: Image.Image, fmt: str) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_a_cut_away_ground_stays_clear_in_the_overlay():
    portrait = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
    portrait.paste((250, 250, 250, 255), (200, 200, 600, 600))
    portrait.paste((10, 10, 10, 255), (380, 200, 420, 600))
    raw, kind, size = overlay_image(_encoded(portrait, "PNG"), 400)
    assert kind == "image/avif"
    assert size == (400, 400), "the overlay is still the picture at the extraction's size"
    out = Image.open(io.BytesIO(raw))
    assert out.mode == "RGBA"
    assert out.getpixel((4, 4))[3] == 0, "the cut-away ground is not painted black"
    r, g, b, a = out.getpixel((150, 200))
    assert a == 255 and min(r, g, b) > 220, "the figure's paper stays"


def test_a_palette_picture_keeps_its_clear_index():
    drawing = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
    drawing.paste((230, 150, 40, 255), (150, 150, 250, 250))
    palette = drawing.convert("P", palette=Image.Palette.ADAPTIVE)
    palette.info["transparency"] = palette.getpixel((0, 0))
    out = Image.open(io.BytesIO(overlay_image(_encoded(palette, "PNG"), 200)[0]))
    assert out.getpixel((2, 2))[3] == 0


def test_an_opaque_photograph_overlay_stays_opaque():
    raw, _, size = overlay_image(_encoded(Image.new("RGB", (640, 480), (40, 120, 200)), "JPEG"), 400)
    out = Image.open(io.BytesIO(raw))
    assert out.mode == "RGB"
    assert size == (400, 300)
