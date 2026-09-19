"""
Casa Kruyff — extracción de assets de marca desde el brand book PDF.

El PDF (branding / Ochoa Studio) incrusta el logotipo como MAPA DE BITS, no como
vectores: `get_drawings()` devuelve sólo 2 objetos (los propios contenedores de
imagen). Por eso no hay curvas que extraer y el auto-trace de un ornamento
barroco produciría miles de nodos sucios.

Truco de calidad: el arte vive en dos imágenes embebidas — el color (RGB) y su
máscara de transparencia (escala de grises) — ambas a 1939x1224. El alfa es un
canal limpio, así que se reconstruye el RGBA y se reduce con LANCZOS. Al
renderizar el PDF a 900 dpi se obtienen 3880x2448 px de origen, más del doble de
la resolución real del arte: ese supermuestreo es lo que suaviza las líneas de
1 px del ornamento.

Resolución real del arte: 1060x896 px útiles (164 dpi). Es el techo físico.

Salida en public/brand/.
Uso: python tools/build-assets.py
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
OUT = ROOT / "public" / "brand"

# Lockup del logo en la página 19 del brand book (en pt).
LOGO_BOX = (63.7, 295.2, 529.1, 588.9)
DPI = 900
BAND_GAP = 12

# Anchos de salida: el emblema se usa a ~140 px CSS (280 en retina) y el
# wordmark a ~320 px CSS (640 en retina). El doble cubre pantallas 2x con
# margen; más allá sólo añade peso.
EMBLEM_W = 900
WORDMARK_W = 1400

ESPRESSO = (0x36, 0x28, 0x1F)
MARFIL = (0xF4, 0xF0, 0xE6)


def render(page_index: int, box: tuple[float, float, float, float]) -> Image.Image:
    doc = fitz.open(PDF)
    page = doc[page_index]
    pix = page.get_pixmap(clip=fitz.Rect(*box), dpi=DPI, alpha=False)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def bands(img: Image.Image) -> list[tuple[int, int]]:
    """Bandas horizontales con contenido (tinta sobre blanco)."""
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


def to_ink(img: Image.Image, rgb: tuple[int, int, int] = ESPRESSO, threshold: int = 246) -> Image.Image:
    """Tinta oscura sobre blanco -> capa alfa. Conserva el antialiasing."""
    import numpy as np

    a = np.asarray(img.convert("L"), dtype=np.float32)
    alpha = np.clip((threshold - a) / threshold, 0.0, 1.0)

    h, w = a.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = rgb
    out[..., 3] = (alpha ** 0.92 * 255.0).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def flatten_alpha(img: Image.Image, floor: float = 0.10) -> Image.Image:
    """
    Colapsa el alfa casi vacío a cero.

    El antialiasing del PDF deja miles de valores intermedios que arruinan la
    compresión por tramas largas. Recortar por debajo del 10 % reduce el archivo
    a ~1/6 sin cambio visible a tamaño de uso.
    """
    import numpy as np

    a = np.asarray(img).astype(np.float32).copy()
    alpha = a[..., 3] / 255.0
    a[..., 3] = np.where(alpha < floor, 0.0, alpha) * 255.0
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def trim(img: Image.Image, pad: int = 4, floor: int = 3) -> Image.Image:
    import numpy as np

    a = np.asarray(img)
    ys, xs = np.where(a[..., 3] > floor)
    if ys.size == 0:
        return img
    return img.crop((
        max(int(xs.min()) - pad, 0),
        max(int(ys.min()) - pad, 0),
        min(int(xs.max()) + 1 + pad, img.width),
        min(int(ys.max()) + 1 + pad, img.height),
    ))


def downscale(img: Image.Image, width: int | None) -> Image.Image:
    """LANCZOS sobre RGBA. Nunca agranda: el origen ya es el techo."""
    if not width or img.width <= width:
        return img
    return img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def recolor(img: Image.Image, rgb: tuple[int, int, int]) -> Image.Image:
    import numpy as np

    a = np.asarray(img).copy()
    a[..., 0], a[..., 1], a[..., 2] = rgb
    return Image.fromarray(a, "RGBA")


def save(img: Image.Image, name: str, width: int | None = None, colors: int = 32) -> None:
    """Escala, convierte a paleta y guarda. La paleta va al final."""
    path = OUT / name
    img = downscale(img, width)
    if colors and img.mode != "P":
        img = img.convert("P", palette=Image.ADAPTIVE, colors=colors)
    img.save(path, "PNG", optimize=True)
    print(f"  {name:26} {img.width:>5}x{img.height:<5} {path.stat().st_size / 1024:7.1f} KB")


def compose_share(emblem: Image.Image, word: Image.Image) -> Image.Image:
    """Lockup del brand book sobre Marfil, 1200x630 para Open Graph."""
    W, H = 1200, 630
    canvas = Image.new("RGBA", (W, H), (*MARFIL, 255))
    em = downscale(emblem, 300)
    wm = downscale(word, 560)
    gap = 44
    top = (H - (em.height + gap + wm.height)) // 2
    canvas.alpha_composite(em, ((W - em.width) // 2, top))
    canvas.alpha_composite(wm, ((W - wm.width) // 2, top + em.height + gap))
    return canvas


def main() -> int:
    if not PDF.exists():
        print(f"No se encontró el brand book: {PDF}", file=sys.stderr)
        return 1

    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Extrayendo assets a {DPI} dpi (origen ~{DPI / 72 * 465:.0f} px de ancho)…")

    for label, page_index in (("horizontal", 18), ("stacked", 19)):
        art = render(page_index, LOGO_BOX)
        found = bands(art)
        if len(found) < 2:
            print(f"  aviso: bandas inesperadas en {label}: {found}", file=sys.stderr)
            continue

        (e0, e1), (w0, w1) = found[0], found[-1]
        emblem = flatten_alpha(trim(to_ink(art.crop((0, e0, art.width, e1 + 1)))))
        word = flatten_alpha(trim(to_ink(art.crop((0, w0, art.width, w1 + 1)))))

        if label == "horizontal":
            save(emblem, "emblem.png", EMBLEM_W)
            save(word, "wordmark.png", WORDMARK_W)
            save(compose_share(emblem, word), "lockup-share.png", colors=128)
            # Marfil sobre fondos oscuros: mismo trazo, otra tinta.
            save(recolor(emblem, MARFIL), "emblem-ivory.png", EMBLEM_W)
            # El wordmark también en Marfil, para el preloader sobre Espresso.
            save(recolor(word, MARFIL), "wordmark-ivory.png", WORDMARK_W)
            # Icono cuadrado para favicon / apple-touch-icon.
            icon = Image.new("RGBA", (512, 512), (*MARFIL, 255))
            em_icon = downscale(emblem, 300)
            icon.alpha_composite(em_icon, ((512 - em_icon.width) // 2, (512 - em_icon.height) // 2))
            save(icon, "icon-512.png", colors=64)
        else:
            save(word, "wordmark-stacked.png", 1200)

    print("Listo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
