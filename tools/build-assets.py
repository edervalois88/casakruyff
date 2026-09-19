"""
Casa Kruyff — extracción de assets de marca desde el brand book PDF.

Lee el PDF oficial (branding / Ochoa Studio) y produce los assets web de la
página en construcción:

  brand/emblem.png                 emblema ornamental, fondo transparente
  brand/wordmark.png               wordmark CASA KRUYFF (lockup horizontal)
  brand/wordmark-stacked.png       lockup vertical del brand book
  brand/lockup-share.png           composición para Open Graph / redes

Uso:
    python tools/build-assets.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

PDF = Path(
    r"C:\Users\EderV\.dsh\attachments\v1\files\c3"
    r"\c3f33313491571bd50caab3ca59419da0d2a18d0287a107af4eaf03ee9d01baa"
    r"\Casa Kruyff.pdf"
)
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "brand"

# Bounding box del arte del logo en la página 19 del brand book (en pt).
LOGO_BOX = (63.7, 295.2, 529.1, 588.9)

# Separación vertical detectada entre emblema y wordmark dentro del lockup.
BAND_GAP = 12


def render(page_index: int, box: tuple[float, float, float, float], dpi: int) -> Image.Image:
    """Renderiza una región del PDF a RGBA."""
    doc = fitz.open(PDF)
    page = doc[page_index]
    pix = page.get_pixmap(clip=fitz.Rect(*box), dpi=dpi, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def bands(img: Image.Image) -> list[tuple[int, int]]:
    """Encuentra las bandas horizontales con contenido (tinta sobre blanco)."""
    import numpy as np

    a = np.asarray(img.convert("L"), dtype=np.float32)
    ink = (255.0 - a).sum(axis=1)
    rows = np.where(ink > max(ink.max() * 0.004, 1.0))[0]
    if rows.size == 0:
        return []

    out: list[tuple[int, int]] = []
    start = prev = int(rows[0])
    for r in rows[1:]:
        r = int(r)
        if r - prev > BAND_GAP:
            out.append((start, prev))
            start = r
        prev = r
    out.append((start, prev))
    return out


def to_alpha(img: Image.Image, threshold: int = 246, feather: float = 1.0) -> Image.Image:
    """
    Convierte tinta oscura sobre blanco en alfa con color espresso.

    La luminancia se usa como canal alfa invertido, de modo que el trazo
    conserva su antialiasing en lugar de quedar escalonado.
    """
    import numpy as np

    a = np.asarray(img.convert("L"), dtype=np.float32)
    # Normaliza: blanco puro (>=threshold) -> transparente; negro -> opaco.
    alpha = np.clip((threshold - a) / threshold, 0.0, 1.0)
    if feather > 1.0:
        alpha = np.clip(alpha * feather, 0.0, 1.0)
    alpha = (alpha ** 0.92) * 255.0

    h, w = a.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0] = 0x36  # Café Espresso
    out[..., 1] = 0x28
    out[..., 2] = 0x1F
    out[..., 3] = alpha.astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def trim(img: Image.Image, pad: int = 0, floor: int = 3) -> Image.Image:
    """Recorta el margen vacío usando el canal alfa."""
    import numpy as np

    a = np.asarray(img)
    mask = a[..., 3] > floor
    ys, xs = np.where(mask)
    if ys.size == 0:
        return img
    box = (
        max(int(xs.min()) - pad, 0),
        max(int(ys.min()) - pad, 0),
        min(int(xs.max()) + 1 + pad, img.width),
        min(int(ys.max()) + 1 + pad, img.height),
    )
    return img.crop(box)


def fit(img: Image.Image, target_w: int) -> Image.Image:
    """Escala a un ancho objetivo conservando proporción (nunca agranda)."""
    if img.width <= target_w:
        return img
    h = round(img.height * target_w / img.width)
    return img.resize((target_w, h), Image.LANCZOS)


def flatten_alpha(img: Image.Image, floor: float = 0.10) -> Image.Image:
    """
    Colapsa el alfa casi vacío a cero.

    El antialiasing del PDF deja miles de valores intermedios que arruinan la
    compresión por tramas largas. Recortar el ruido por debajo del 10 % reduce
    el archivo a ~1/6 sin cambio visible a tamaño de uso.
    """
    import numpy as np

    a = np.asarray(img).astype(np.float32).copy()
    alpha = a[..., 3] / 255.0
    a[..., 3] = np.where(alpha < floor, 0.0, alpha) * 255.0
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def save(img: Image.Image, name: str, width: int | None = None, colors: int = 32) -> None:
    """
    Escala a `width` y guarda en PNG indexado.

    El emblema y el wordmark son tinta monocromática, así que una paleta de 32
    colores es indistinguible del RGBA completo y pesa una fracción. El escalado
    se hace en RGBA (LANCZOS sobre paleta mete ruido de cuantización) y la
    reducción de paleta va al final.
    """
    path = OUT / name
    if width:
        img = fit(img, width)
    if colors and img.mode != "P":
        img = img.convert("P", palette=Image.ADAPTIVE, colors=colors)
    img.save(path, "PNG", optimize=True)
    print(f"  {name:28} {img.width:>5}x{img.height:<5} {path.stat().st_size / 1024:7.1f} KB")


def main() -> int:
    if not PDF.exists():
        print(f"No se encontró el brand book: {PDF}", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    print("Extrayendo assets de marca…")

    # Render amplio del lockup horizontal y vertical a alta resolución.
    horizontal_word = None
    for label, page_index, dpi in (
        ("horizontal", 18, 900),
        ("stacked", 19, 900),
    ):
        art = render(page_index, LOGO_BOX, dpi)
        found = bands(art)
        if len(found) < 2:
            print(f"  aviso: bandas inesperadas en {label}: {found}", file=sys.stderr)
            continue

        (e0, e1), (w0, w1) = found[0], found[-1]

        emblem = flatten_alpha(trim(to_alpha(art.crop((0, e0, art.width, e1 + 1))), pad=4))
        word = flatten_alpha(trim(to_alpha(art.crop((0, w0, art.width, w1 + 1))), pad=4))

        if label == "horizontal":
            save(emblem, "emblem.png", width=900)
            save(word, "wordmark.png", width=1800)
            save(compose(emblem, word), "lockup-share.png", colors=128)
            # Marfil para fondos oscuros: mismo trazo, tinta Marfil.
            save(recolor(emblem, (0xF4, 0xF0, 0xE6)), "emblem-ivory.png", width=900)
            horizontal_word = word
        else:
            save(word, "wordmark-stacked.png", width=1500)

    if horizontal_word is None:
        print("No se pudo extraer el lockup horizontal.", file=sys.stderr)
        return 1

    print("Listo.")
    return 0


def recolor(img: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    import numpy as np

    a = np.asarray(img).copy()
    a[..., 0], a[..., 1], a[..., 2] = rgb
    return Image.fromarray(a, "RGBA")


def compose(emblem: Image.Image, word: Image.Image) -> Image.Image:
    """Reconstruye el lockup del brand book sobre Marfil, formato 1200x630."""
    W, H = 1200, 630
    canvas = Image.new("RGBA", (W, H), (0xF4, 0xF0, 0xE6, 255))

    em = fit(emblem, 300)
    wm = fit(word, 560)

    gap = 44
    total = em.height + gap + wm.height
    top = (H - total) // 2

    canvas.alpha_composite(em, ((W - em.width) // 2, top))
    canvas.alpha_composite(wm, ((W - wm.width) // 2, top + em.height + gap))
    return canvas


if __name__ == "__main__":
    raise SystemExit(main())
