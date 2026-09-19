# Casa Kruyff — Sitio en preparación

Página en construcción de **Casa Kruyff**, casa de diseño y curaduría de
interiores. Estática, sin build y sin dependencias: se abre `index.html` y
funciona.

**En vivo:** https://casakruyff.com

---

## Contenido

```
index.html          La página completa (HTML + CSS + JS en un archivo)
brand/              Assets de marca extraídos del brand book oficial
  emblem.png          Emblema ornamental, fondo transparente
  emblem-ivory.png    El mismo emblema en Marfil, para fondos oscuros
  wordmark.png        CASA KRUYFF, lockup horizontal
  wordmark-stacked.png  Lockup vertical del brand book
  lockup-share.png    Open Graph 1200x630
tools/              Scripts de assets y verificación (no se despliegan)
```

## Editar los datos de contacto

Todo lo editable está en un solo bloque dentro de `index.html`:

```html
<script id="kx-config">
window.KX = {
  email: "hola@casakruyff.com",
  whatsapp: "5215500000000",
  whatsappMessage: "Hola, me interesa conocer Casa Kruyff.",
  instagram: "casakruyff",
  endpoint: null
};
</script>
```

Los tres primeros siguen siendo marcadores pendientes: aparecen subrayados con
punteado dorado en la página hasta que los reemplaces. Si dejas un valor en
`null` o vacío, ese enlace desaparece en lugar de quedar roto.

`endpoint` controla la lista de espera:

- `null` — el formulario abre el correo del visitante con el mensaje ya escrito.
  Funciona sin configurar nada y no finge un envío que no ocurrió.
- Una URL que acepte `POST` de formulario (Formspree, Basin, endpoint propio) —
  captura el correo sin salir del sitio.

## Verificación

```bash
node tools/shoot.mjs         # local: encaje, recursos, formulario, idioma, sin-JS
node tools/check-motion.mjs  # local: entradas escalonadas y prefers-reduced-motion
node tools/verify-live.mjs   # producción: corre contra https://casakruyff.com
```

Las tres corren contra Chrome real y salen con código distinto de cero si algo
falla. `verify-live.mjs` acepta otra URL como argumento, así que también sirve
para revisar un preview:

```bash
node tools/verify-live.mjs https://casakruyff-abc123.vercel.app
```

Las capturas quedan en `review/`, que no se versiona.

## Despliegue

Conectar el repositorio a Vercel fue suficiente: no hay build que configurar.
El proyecto detecta el sitio estático y sirve `index.html` desde la raíz.

- **Producción:** cada push a `main` despliega automáticamente.
- **Previews:** cada pull request genera su propia URL.
- **Dominio canónico:** `casakruyff.com`. `www.casakruyff.com` responde 308
  permanente hacia el dominio raíz, para que los buscadores no indexen la misma
  página dos veces.
- `.vercelignore` deja fuera `tools/`, `review/` y la documentación, de modo que
  sólo se publican `index.html` y `brand/`.

Para desplegar a mano: `vercel deploy --prod`.

## Reextraer los assets desde el PDF

```bash
python tools/build-assets.py
```

Requiere PyMuPDF y Pillow. Lee el brand book oficial y regenera `brand/`
completo: recorta el emblema y el wordmark, los convierte a tinta con alfa y los
optimiza a PNG indexado.

## Identidad

Derivada del brand book oficial (*branding*, Ochoa Studio). Decisiones y
razonamiento completo en [`PLAN.md`](PLAN.md).

| Token | HEX | Uso |
|---|---|---|
| Café Espresso | `#36281F` | Texto, tinta del logotipo |
| Marfil | `#F4F0E6` | Fondo |
| Dorado Antiguo | `#8E7125` | Ornamento: reglas, marcos, sellos |
| Dorado para texto | `#7A6114` | Texto pequeño (AA: 5.2:1) |

Tipografía: **Cormorant Garamond** para display, **Lato** para texto y
**Montserrat Thin** para etiquetas micro — la combinación que el propio brand
book usa en sus aplicables.

### Accesibilidad

WCAG AA. Todas las animaciones respetan `prefers-reduced-motion` y la página se
lee completa sin JavaScript. El Dorado Antiguo del manual da 4.07:1 sobre
Marfil y no alcanza AA, así que se reserva para ornamento; el texto pequeño usa
`#7A6114` (5.2:1), el mismo oro oscurecido.

---

© Casa Kruyff. Todos los derechos reservados.
