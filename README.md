# Casa Kruyff — Sitio en preparación

Página en construcción de **Casa Kruyff**, casa de diseño y curaduría de
interiores. Next.js + Framer Motion sobre Vercel.

**En vivo:** https://casakruyff.com

---

## Estructura

```
app/
  layout.tsx           Metadatos, tipografías (next/font) y <html>
  page.tsx             Composición de la página
  globals.css          Tokens de marca y base
  page.css             Estilos de la composición
components/
  Preloader.tsx        Velo de entrada y compuerta de la animación
  Reveal.tsx           Envoltorio de entrada (con y sin animación)
  Emblem.tsx           Emblema con parallax, barrido dorado y halo
  Wordmark.tsx         Revelado del wordmark
  SplitHeadline.tsx    Titular letra a letra
  Waitlist.tsx         Lista de espera
  Footer.tsx           Pie con contacto
  LanguageProvider.tsx Idioma ES/EN con persistencia
  LanguageSwitch.tsx   Selector con pastilla deslizante
lib/
  site.ts              Datos de contacto y del sitio  ← EDITAR AQUÍ
  i18n.ts              Textos bilingües
  entrance.ts          Curvas, duraciones y escalonado
  usePrefersReducedMotion.tsx  Preferencia de movimiento
public/brand/          Assets de marca
tools/                 Scripts de assets y verificación (no se despliegan)
```

## Editar los datos de contacto

Todo está en `lib/site.ts`:

```ts
export const contact: Contact = {
  email: null,              // ← correo real
  whatsapp: null,           // ← número real, sólo dígitos
  whatsappMessage: "Hola, me interesa conocer Casa Kruyff.",
  instagram: null,          // ← usuario real, sin @
  waitlistEndpoint: null,   // ← opcional, ver abajo
};
```

Siguen siendo marcadores pendientes: en la página aparecen con subrayado punteado
dorado y la palabra «pendiente». **Si un valor queda en `null`, ese enlace no se
renderiza** en lugar de quedar roto.

`waitlistEndpoint` controla la lista de espera:

- `null` — el formulario abre el correo del visitante con el mensaje ya escrito.
- Una URL que acepte `POST` de formulario (Formspree, Basin, endpoint propio) —
  captura el correo sin salir del sitio.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # build de producción
npm start            # sirve el build
```

## Verificación

Las tres suites corren contra Chrome real y salen con código distinto de cero si
algo falla. Las capturas quedan en `review/`, que no se versiona.

```bash
npm run verify                 # encaje + movimiento, contra localhost:3100
node tools/verify-live.mjs     # contra https://casakruyff.com
```

`verify-local.mjs` comprueba encaje en una pantalla sin scroll (7 viewports),
desbordes, recursos, validación del formulario, cambio de idioma con persistencia,
foco visible y **que la página se lea completa sin JavaScript**.

`check-motion.mjs` comprueba que la entrada escalonada realmente corre, que el
preloader aparece y se retira, y que `prefers-reduced-motion` deja todo
compuesto sin animación.

## Reextraer los assets desde el PDF

```bash
python tools/build-assets.py
```

Requiere PyMuPDF y Pillow. Lee el brand book oficial y regenera `public/brand/`
completo.

**Sobre el logo:** el PDF incrusta el logotipo como mapa de bits, no como
vectores (`get_drawings()` sólo devuelve los contenedores de imagen). El arte
real mide 1060×896 px — 164 dpi. Ese es el techo físico: no hay curvas que
extraer y un auto-trace del ornamento produciría miles de nodos sucios. Por eso
el emblema se anima por capas (parallax, barrido con máscara, halo) en lugar de
trazarse con un `stroke-dasharray`.

## Notas de arquitectura

Dos decisiones que parecen raras y no lo son:

**Los elementos animados se montan sólo cuando toca animar.** Motion fija su
estado inicial (`opacity: 0`) en el montaje y lo deja como estilo inline, así que
ninguna regla CSS puede deshacerlo. Si se montara creyendo que no hay preferencia
de movimiento, con `prefers-reduced-motion` el contenido se quedaría invisible
para siempre. Por eso `Reveal` renderiza sin Motion cuando no toca, y
`usePrefersReducedMotion` sólo devuelve el valor real después de hidratar.

**El preloader es una compuerta, no un adorno.** Mientras el velo tapa la
pantalla, los bloques de la página están `hidden`. Así los elementos se montan
con su estado inicial sin llegar a pintarse, y la entrada corre al descubrirse.
Sin JavaScript el atributo `hidden` nunca se pone y la página se ve completa.

## Despliegue

Cada push a `main` despliega automáticamente en Vercel. El dominio canónico es
`casakruyff.com`; `www.casakruyff.com` responde 308 permanente hacia el raíz.
`.vercelignore` deja fuera `tools/`, `review/` y la documentación.

---

© Casa Kruyff. Todos los derechos reservados.
