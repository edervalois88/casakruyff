# Casa Kruyff — Página en construcción

Plan y entregable construidos a partir del brand book oficial
(`Casa Kruyff.pdf` — *branding*, Ochoa Studio, 23 páginas).

---

## Actualización: segunda versión

La primera entrega era HTML estático en un archivo. La segunda la reconstruye
como **Next.js + Framer Motion**, con estas decisiones y sus motivos.

**Qué se conservó.** El concepto (el emblema es un marco vacío: el sitio que
todavía no existe), la paleta del brand book, la tipografía Cormorant Garamond,
el enfoque de accesibilidad y la honestidad sobre los datos pendientes.

**Qué cambió.**

| Antes | Ahora | Por qué |
|---|---|---|
| HTML estático, CSS propio con animaciones declarativas | Next.js 16 + Framer Motion | Framer Motion necesita React. Además da componentes, tipografías optimizadas en build y despliegue continuo. |
| Sin preloader | Preloader que evoca el packaging del brand book | El manual muestra una caja oscura con la pieza clara dentro. Ese gesto abre ahora la página, y se ve una sola vez por sesión. |
| Marfil + Espresso + oro | Se suman **Chocolate, Arena y Lino** como capas tonales | El manual lista esos secundarios para «fondos alternativos, bloques de color y aplicaciones editoriales». Se usan en el fondo (degradado Lino→Arena), el halo del emblema y los marcos, sin tocar el oro, que sigue siendo el único acento. |
| Entrada por opacidad y desenfoque | Entrada por capas: barrido del wordmark, titular letra a letra, regla trazada desde el centro, barrido dorado sobre el emblema, parallax, halo que respira | El usuario pidió más detalle de animación. |
| Logo como PNG fijo | Logo con animación por capas | Ver la nota sobre el SVG, abajo. |

**Sobre vectorizar el logo: no se puede, y conviene saber por qué.** El PDF
incrusta el logotipo como **mapa de bits**, no como vectores: `get_drawings()`
devuelve únicamente los dos contenedores de imagen. Lo comprobé extrayendo las
dos imágenes embebidas (el arte en RGB y su máscara de transparencia) y midiendo
el arte real: **1060×896 px útiles, 164 dpi**. Ése es el techo físico. Un
auto-trace del ornamento barroco produciría miles de nodos sucios y perdería las
líneas de 1 px.

Así que el emblema se anima **por capas sobre el arte fiel al manual**, no
trazándose:

1. **Parallax** — se desplaza una fracción de lo que se desplaza la página.
2. **Barrido dorado** — una banda de oro cruza el ornamento cada ~8 s, recortada
   con una máscara en movimiento para que respete la silueta en vez de pasar por
   encima como un rectángulo. Pasa y se va: el manual pide dorado puntual.
3. **Halo** — un resplandor cálido respira detrás, muy tenue.

Si en el futuro aparece el logotipo en vectores (el archivo original de Ochoa
Studio), el mismo componente admite un `stroke-dasharray` para trazarlo de
verdad. El resto de la página no cambiaría.

---

## 1. Lo que dice el brand book

### Posicionamiento

> «Casa Kruyff es una casa de diseño y curaduría de interiores que reúne piezas
> excepcionales, talento internacional y una mirada estética atemporal para crear
> espacios con identidad. […] representa un lujo culto, íntimo y silencioso.»

Está **en el encuentro entre el legado clásico y el diseño contemporáneo** y
explícitamente **no persigue tendencias pasajeras**. Eso es una restricción de
diseño, no una frase de folleto: descarta cualquier recurso de moda pasajera
(glassmorphism, gradientes saturados, animaciones llamativas).

### Voz y tono (12 atributos declarados)

| Voz | Tono |
|---|---|
| Elegante · Segura · Culta · Cercana · Selectiva · Inspiradora | Sereno · Refinado · Evocador · Sensorial · Cálido · Discreto |

Dos de ellos mandan directamente sobre esta página: **sereno** («comunica sin
prisa, presión o intensidad comercial») y **discreto** («comunica exclusividad
con sutileza, evitando la ostentación»). Una página en construcción con cuenta
regresiva, badges o «¡Muy pronto!» violaría ambos.

### Paleta

| Rol | Nombre | HEX | Uso declarado |
|---|---|---|---|
| Primario | Café Espresso | `#36281F` | Fondos principales, aplicaciones institucionales |
| Primario | Marfil | `#F4F0E6` | Fondos claros, papelería, **sitio web**, espacios negativos |
| Primario | Negro | — | Textos, información funcional, alto contraste |
| Secundario | Chocolate | `#4E3B2F` | Fondos alternativos, bloques de color |
| Secundario | Arena | `#BFAC94` | Fondos secundarios, aplicaciones editoriales |
| Secundario | Lino | `#E1D9CE` | Fondos, separadores, tarjetas |
| Acento | **Dorado Antiguo** | `#8E7125` | «iconos, ornamentos, líneas, sellos, marcos, detalles del logotipo» — **uso puntual** |

El brand book nombra el **sitio web** como uso explícito del Marfil: la página
va sobre Marfil, no sobre Espresso. El Dorado es acento *puntual* — el manual
insiste en que se use con moderación para conservar su impacto.

### Tipografía

El manual ofrece dos opciones y no elige:

- **Opción 1** — Playfair Display (títulos) + Lato (subtítulo, texto). Canva: Lato.
- **Opción 2** — Cormorant Garamond (títulos, subtítulo, texto). Canva: The Seasons.

**Decidí la Opción 2 (Cormorant Garamond + Lato)** por una razón de evidencia: el
propio brand book la usa en sus aplicables. La maqueta de packaging (p. 23) y el
logotipo (pp. 19-20) están compuestos en Cormorant Garamond Light, y la
paginación del documento (Montserrat Thin) revela el registro tipográfico que el
estudio eligió para texto funcional minúsculo. La Opción 1 queda documentada
abajo por si prefieres cambiarla: es una línea de CSS.

### Materia y referencias visuales

El mood board (p. 2) no muestra interiores: muestra **arquitectura clásica
europea, ornamento en piedra, un cisne, terrazas con arcos y un lago**. La
dirección estética es *legado y permanencia*, no *showroom*. El packaging (p. 23)
es el gesto clave: **una caja oscura que contiene tela marfil con el emblema
grabado**. Restricción, no acumulación.

### Estructura del brand book (mapa de lectura)

`01 Visión general` (visión, misión, objetivo, propuesta de valor, voz, tono,
valores, segmentación) · `02 Branding` (mood board, aplicable) ·
`03 Brand book` (logueo, paleta, tipografía).

Público: residencial de alto poder adquisitivo, coleccionistas de diseño,
interioristas y arquitectos, proyectos de hospitalidad.

---

## 2. Concepto de la página

**«Estamos componiendo la casa».**

El emblema de la marca es un **marco ornamental vacío**. Ese vacío es
literalmente el sitio que todavía no existe. En lugar de taparlo con un aviso
genérico, la página convierte el marco en el mensaje: el emblema se traza, la
regla dorada se dibuja desde el centro y el wordmark aparece — la casa se está
componiendo ante los ojos de quien llega.

Es coherente con los valores declarados (**curaduría, atemporalidad, excelencia,
discreción**) y no promete nada que no exista todavía.

### Correspondencia brief → ejecución

| Del brand book | En la página |
|---|---|
| Marfil como base del sitio web | Fondo `#F4F0E6` |
| Dorado Antiguo «puntual… líneas, marcos, sellos» | Regla bajo el wordmark, marco hairline de página, puntos separadores, etiqueta superior. Nada más |
| «Legado clásico + diseño contemporáneo» | Emblema barroco + composición asimétrica contemporánea, tipografía con tracking amplio |
| Cormorant Garamond (Opción 2, la usada en aplicables) | Titular, wordmark, mensaje |
| Lato para texto | Cuerpo de texto |
| Registro de Montserrat Thin del brand book | Etiquetas micro en versalitas |
| Tono sereno | 8 entradas escalonadas en 2.4 s, sin rebotes ni urgencia |
| Tono sensorial / evocador | Papel con grano y viñeta cálida; el sitio se siente impreso |
| Discreción | Sin contador, sin exclamaciones, sin badge de «próximamente» |
| Packaging: caja oscura → tela marfil | Retícula de página: marco dorado fino sobre marfil, contenido contenido |

### Decisiones de accesibilidad (brand book → WCAG AA)

El Dorado Antiguo `#8E7125` da **4.07:1** sobre Marfil: no alcanza AA (4.5:1)
para texto. El manual lo destina a **ornamento**, así que respeté esa intención y
resolví el conflicto sin salirme de la paleta:

- `--dorado` `#8E7125` → **sólo ornamento** (reglas, marcos, puntos): decorativo.
- `--dorado-ink` `#7A6114` → **5.2:1**, para texto pequeño (etiqueta, enlaces,
  botón). Es el mismo oro, oscurecido; la familia cromática no cambia.

Medido con la fórmula de luminancia relativa de WCAG 2.1:

| Par | Ratio | AA texto |
|---|---|---|
| Espresso / Marfil | 12.47 | ✅ |
| Dorado Antiguo / Marfil | 4.07 | ❌ sólo ornamento |
| **Dorado para texto / Marfil** | **5.20** | ✅ |
| Texto secundario / Marfil | 5.71 | ✅ |
| Etiquetas del pie / Marfil | 4.76 | ✅ |
| Chocolate (respaldo) / Marfil | 7.41 | ✅ |

---

## 3. Estructura de archivos

```
casa-kruyff/
├── index.html                  La página (autocontenida, sin build)
├── brand/
│   ├── emblem.png              Emblema ornamental, alfa, 900×1257
│   ├── emblem-ivory.png        Mismo emblema en Marfil (para fondos oscuros)
│   ├── wordmark.png            CASA KRUYFF, 1800×183
│   ├── wordmark-stacked.png    Lockup vertical del brand book (1500×275)
│   └── lockup-share.png        Open Graph 1200×630 (31 KB)
├── tools/
│   ├── build-assets.py         Reextrae los assets desde el PDF
│   ├── shoot.mjs               Verifica encaje, recursos, formulario, idioma, sin-JS
│   └── check-motion.mjs        Verifica entradas y prefers-reduced-motion
└── review/                     Capturas de verificación (no subir a producción)
```

**Sin build, sin dependencias.** Son archivos estáticos: se abre `index.html` y
funciona. No hay `node_modules`, ni paso de compilación, ni framework que
mantener. Pesos: 359 KB de assets de marca en total, 29 KB de HTML.

Los assets son **PNG indexados a 32 colores** derivados del PDF a 900 dpi. El
emblema y el wordmark son tinta monocromática, así que la paleta reducida es
indistinguible del RGBA completo y pesa ~1/6 (1 MB → 91 KB). El PDF incrusta el
logotipo como mapa de bits, no como vectores: por eso el asset es raster. A
tamaño de uso (≈148 px de ancho, o 296 px en pantallas 2×) los 900 px de origen
dan más del doble de densidad necesaria.

---

## 4. Lo único que falta: los datos reales

Abre `index.html`, baja hasta el bloque `<script id="kx-config">` y reemplaza los
marcadores. Ya están visibles en la página con un subrayado punteado dorado, así
que no se te pueden pasar por alto.

```js
window.KX = {
  email: "hola@casakruyff.com",     // ← PENDIENTE: correo real
  whatsapp: "5215500000000",        // ← PENDIENTE: número real, solo dígitos
  whatsappMessage: "Hola, me interesa conocer Casa Kruyff.",
  instagram: "casakruyff",          // ← PENDIENTE: usuario real, sin @
  endpoint: null                    // ← PENDIENTE (opcional), ver abajo
};
```

Si dejas un valor en `null` o vacío, **ese enlace desaparece** en lugar de quedar
roto. Un marcador sin reemplazar nunca produce un 404 ni un enlace muerto.

### El formulario de lista de espera

Por omisión (`endpoint: null`) el formulario **abre el correo del visitante** con
el asunto y el mensaje ya escritos. Funciona hoy mismo, no requiere configurar
nada y no finge un envío que no ocurrió.

Para capturar correos sin salir del sitio, pon la URL de un servicio que acepte
`POST` de formulario:

```js
endpoint: "https://formspree.io/f/XXXXXXXX"
```

Sirve Formspree, Basin, o un endpoint propio. El campo se envía como `email`,
más un `origen` para distinguir el tráfico de esta página.

> **Decisión de honestidad:** preferí el respaldo por `mailto` antes que mostrar
> un mensaje de éxito falso. Un formulario que dice «¡Gracias!» y tira el correo
> es peor que no tener formulario.

---

## 5. Qué se verificó (no es una suposición)

`node tools/shoot.mjs` y `node tools/check-motion.mjs` corren contra Chrome real.
Resultado actual, todo en verde:

| Comprobación | Resultado |
|---|---|
| Encaje en una pantalla sin scroll — 1440×900, 1280×720, 820×1180, 390×844, 360×640 | ✅ 7/7 |
| Desborde horizontal en cualquier viewport | ✅ ninguno |
| Recursos faltantes o errores de consola | ✅ ninguno |
| Validación: correo inválido → mensaje en español, sin navegar | ✅ |
| El aviso de error se limpia al escribir | ✅ |
| Cambio ES→EN: `lang`, titular, marcador del campo, `<title>` | ✅ |
| El idioma persiste tras recargar | ✅ |
| Foco visible por teclado en el primer elemento | ✅ contorno 1 px |
| **Sin JavaScript**: la página se lee completa en español | ✅ |
| Entradas escalonadas: 8 animaciones, retrasos 250→1600 ms | ✅ |
| Estado final: todo en opacidad 1, 0 animaciones en curso | ✅ |
| `prefers-reduced-motion`: compuesto desde el primer frame, sin velo | ✅ |

Capturas en `review/` — desktop ES/EN, laptop, tablet, móvil 390 ES/EN, móvil
360, estado de error del formulario y sin-JS.

### Dos defectos reales que encontró la verificación

1. **Sin JavaScript el texto quedaba invisible.** Las entradas usaban
   `animation-fill-mode: both`, que aplica el keyframe inicial (`opacity: 0`)
   durante el retraso. Si el JS fallaba, el titular se quedaba a opacidad 0 para
   siempre. Corregido: `forwards` + animaciones limitadas a `html.js`. Sin JS el
   contenido aparece ya compuesto.
2. **El pie chocaba con el marco dorado.** El hairline era `position: fixed` y se
   dibujaba encima del contenido en pantallas bajas. Corregido: el marco ahora
   reserva espacio con el padding del contenedor, así el contenido nunca lo pisa.

---

## 6. Cómo está publicado

| | |
|---|---|
| **Dominio** | `casakruyff.com` — registrado en Vercel, nameservers de Vercel |
| **Repositorio** | `github.com/edervalois88/casakruyff` |
| **Hosting** | Vercel, sitio estático, deploy automático en cada push a `main` |

**Vista local:** abre `index.html` en el navegador. Nada más.

**Producción:** sube `index.html` y `brand/` a la raíz del hosting. Es estático
puro, sin build. En Vercel, `tools/` y `review/` quedan fuera del despliegue por
`.vercelignore`.

Antes de publicar cambios:

1. Reemplaza los cuatro marcadores de `kx-config` (ver sección 4).
2. Si cambia el dominio, actualiza `canonical`, `og:url` y `og:image`.
3. `review/` no se versiona ni se despliega: son capturas de verificación.

### Si prefieres la Opción 1 tipográfica (Playfair Display)

En la hoja de Google Fonts, sustituye `Cormorant+Garamond` por
`Playfair+Display:wght@400;500` y cambia:

```css
--display:"Playfair Display", Georgia, serif;
```

Todo lo demás se recompone solo: la escala está en `clamp()`.

### Si más adelante quieres migrarlo a Next.js

La página es un solo archivo: el `<style>` va a un módulo CSS o a
`globals.css`, el bloque `<script id="kx-config">` a variables de entorno
públicas, y las dos funciones de `COPY` a un diccionario `es`/`en`. Los assets ya
están listos para `public/`.

---

## 7. Lo que no hice, y por qué

- **No inventé datos.** Teléfono, correo y redes quedaron como marcadores
  visibles en lugar de datos plausibles pero falsos.
- **No agregué cuenta regresiva, «próximamente» ni badges.** El tono declarado
  (sereno, discreto) los excluye.
- **No publiqué cifras, años de trayectoria ni premios.** El brand book no los
  respalda.
- **No usé el mood board como imágenes de la página.** Son referencias de
  dirección estética, no fotografía de la casa; usarlas sería presentar material
  ajeno como propio.

## 8. Siguientes pasos sugeridos

1. **Pasarme los datos reales** y los integro en un minuto.
2. **Confirmar la Opción tipográfica** (Cormorant Garamond vs. Playfair Display).
3. **Decidir el destino del formulario** (mailto hoy, o endpoint de captura).
4. **Si quieres, defino la fotografía de apertura**: cuando exista material propio
   de la casa, la página puede pasar de marco vacío a una sola imagen a sangre
   con el emblema encima — el mismo concepto, ya con contenido.
