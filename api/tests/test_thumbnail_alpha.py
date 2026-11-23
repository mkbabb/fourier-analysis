"""A thumbnail keeps its picture's transparency.

The card shows the thumbnail. Flattened to RGB, a picture's clear ground came
out black, so a drawing on a clear ground (the gallery's sun and moon) showed in
its card as a black square.
"""

import io

from PIL import Image

from api.services.image_storage import _generate_thumbnail


def _png(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_a_clear_ground_stays_clear_in_the_thumbnail():
    drawing = Image.new("RGBA", (800, 800), (0, 0, 0, 0))
    drawing.paste((230, 150, 40, 255), (300, 300, 500, 500))
    thumb, kind = _generate_thumbnail(_png(drawing), "image/png")
    assert kind == "image/avif"
    out = Image.open(io.BytesIO(thumb))
    assert out.mode == "RGBA"
    assert out.getpixel((2, 2))[3] == 0, "the clear ground is not painted black"
    r, g, b, a = out.getpixel((out.width // 2, out.height // 2))
    assert a == 255 and r > 200 and g > 120


def test_a_palette_picture_keeps_its_clear_index():
    drawing = Image.new("RGBA", (400, 400), (0, 0, 0, 0))
    drawing.paste((230, 150, 40, 255), (150, 150, 250, 250))
    palette = drawing.convert("P", palette=Image.Palette.ADAPTIVE)
    palette.info["transparency"] = palette.getpixel((0, 0))
    out = Image.open(io.BytesIO(_generate_thumbnail(_png(palette), "image/png")[0]))
    assert out.getpixel((2, 2))[3] == 0


def test_an_opaque_photograph_stays_opaque():
    photo = Image.new("RGB", (640, 480), (40, 120, 200))
    buf = io.BytesIO()
    photo.save(buf, format="JPEG")
    out = Image.open(io.BytesIO(_generate_thumbnail(buf.getvalue(), "image/jpeg")[0]))
    assert out.mode == "RGB"
