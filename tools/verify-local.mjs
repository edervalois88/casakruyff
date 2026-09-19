/**
 * Verificación de la página en construcción de Casa Kruyff.
 *
 * Uso:  node tools/verify-local.mjs [url]
 * Por omisión: http://localhost:3100
 *
 * Comprueba encaje en una pantalla, desbordes, recursos, validación del
 * formulario, cambio de idioma, foco visible, comportamiento sin JavaScript y
 * que el preloader no deje la página congelada.
 *
 * Salida: review/*.png + reporte. Código de salida != 0 si algo falla.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const base = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "review");
await mkdir(out, { recursive: true });

const SHOTS = [
  { name: "desktop-es-1440", width: 1440, height: 900, dpr: 1, lang: "es" },
  { name: "desktop-en-1440", width: 1440, height: 900, dpr: 1, lang: "en" },
  { name: "laptop-es-1280", width: 1280, height: 720, dpr: 1, lang: "es" },
  { name: "mobile-es-390", width: 390, height: 844, dpr: 2, lang: "es" },
  { name: "mobile-en-390", width: 390, height: 844, dpr: 2, lang: "en" },
  { name: "mobile-es-360", width: 360, height: 640, dpr: 2, lang: "es" },
  { name: "tablet-es-820", width: 820, height: 1180, dpr: 2, lang: "es" },
];

let failures = 0;
const fail = (m) => { failures++; console.log(`   x ${m}`); };

const browser = await chromium.launch({ channel: "chrome" });

/* ── 1. Encuadre, recursos y visibilidad final ───────────────────────────── */
console.log(`ENCAJE  (${base})`);
for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.dpr,
    locale: shot.lang === "en" ? "en-US" : "es-MX",
  });
  const page = await context.newPage();

  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("requestfailed", (r) => problems.push(`recurso: ${r.url()}`));
  page.on("response", (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`);
  });

  // Marca el idioma antes de cargar y salta el preloader.
  await context.addInitScript((lang) => {
    try {
      window.localStorage.setItem("kx-lang", lang);
      window.sessionStorage.setItem("kx-seen", "1");
    } catch {}
  }, shot.lang);

  await page.goto(base + "/", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // La entrada completa tarda ~2.6 s; 4 s deja margen de sobra.
  await page.waitForTimeout(4000);

  await page.screenshot({ path: resolve(out, `${shot.name}.png`) });

  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const over = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        over.push(`${el.tagName.toLowerCase()}.${String(el.className || "").split(" ")[0]}`);
      }
    });

    // ¿Quedó algo invisible? Es el fallo clásico de una entrada animada.
    const faded = [];
    const watch = [".emblem", ".wordmark img", ".rule", ".eyebrow", ".headline", ".body", ".waitlist", ".foot"];
    for (const sel of watch) {
      const el = document.querySelector(sel);
      if (!el) { faded.push(`${sel}:ausente`); continue; }
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) faded.push(`${sel}:sin-caja`);
    }

    const head = document.querySelector(".headline");
    const headText = head?.querySelector(".sr-only")?.textContent?.trim() ?? "";
    const chars = head?.querySelectorAll(".headline__char").length ?? 0;

    const emblemImg = document.querySelector(".emblem__art img");
    const wordImg = document.querySelector(".wordmark img");

    return {
      scrollY: doc.scrollHeight > doc.clientHeight + 1,
      scrollX: doc.scrollWidth > doc.clientWidth + 1,
      over: [...new Set(over)].slice(0, 6),
      faded,
      lang: doc.lang,
      headText,
      chars,
      emblemOk: !!emblemImg && emblemImg.naturalWidth > 0 && emblemImg.complete,
      wordmarkOk: !!wordImg && wordImg.naturalWidth > 0 && wordImg.complete,
      // Opacidad efectiva del titular: si la entrada falló, se queda en 0.
      headlineOpacity: head ? +(+getComputedStyle(head.querySelector(".headline__char")).opacity).toFixed(2) : -1,
    };
  });

  console.log(
    `  ${shot.name.padEnd(20)} scrollY=${m.scrollY ? "SÍ" : "no"} scrollX=${m.scrollX ? "SÍ" : "no"} ` +
    `lang=${m.lang} emblema=${m.emblemOk ? "ok" : "NO"} wordmark=${m.wordmarkOk ? "ok" : "NO"} ` +
    `titular=${m.headlineOpacity} letras=${m.chars}`
  );

  if (m.scrollY) fail(`${shot.name}: desborde vertical`);
  if (m.scrollX) fail(`${shot.name}: desborde horizontal`);
  if (m.lang !== shot.lang) fail(`${shot.name}: idioma ${m.lang}, esperado ${shot.lang}`);
  if (!m.emblemOk) fail(`${shot.name}: el emblema no cargó`);
  if (!m.wordmarkOk) fail(`${shot.name}: el wordmark no cargó`);
  if (m.headlineOpacity !== 1) fail(`${shot.name}: el titular quedó en opacidad ${m.headlineOpacity}`);
  if (m.faded.length) fail(`${shot.name}: elementos sin caja -> ${m.faded.join(", ")}`);
  if (m.chars < 10) fail(`${shot.name}: el titular no se dividió en caracteres (${m.chars})`);
  for (const p of problems) fail(`${shot.name}: ${p}`);
  for (const o of m.over) fail(`${shot.name}: desborda ${o}`);

  await context.close();
}

/* ── 2. Formulario e idioma ──────────────────────────────────────────────── */
console.log("\nINTERACCIÓN");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Sin `addInitScript` de idioma a propósito: eso volvería a escribir "es" en
  // cada recarga y la prueba de persistencia sería vacua (probaría el script,
  // no la página).
  await page.goto(base + "/", { waitUntil: "load" });
  await page.evaluate(() => {
    try {
      window.localStorage.setItem("kx-lang", "es");
      window.sessionStorage.setItem("kx-seen", "1"); // salta el preloader
    } catch {}
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(3200);

  await page.fill("#email", "no-es-correo");
  await page.click('.waitlist button[type="submit"]');
  await page.waitForTimeout(500);
  const invalid = (await page.textContent(".waitlist__note"))?.trim();
  const rowState = await page.getAttribute(".waitlist__row", "data-state");
  console.log(`  correo inválido -> "${invalid}" [${rowState}]`);
  if (rowState !== "invalid" || !invalid) fail("formulario: no marca el correo inválido");

  await page.fill("#email", "a@b.com");
  await page.waitForTimeout(500);
  const cleared = (await page.textContent(".waitlist__note"))?.trim();
  if (cleared) fail(`formulario: el aviso no se limpia (="${cleared}")`);
  else console.log("  al escribir     -> aviso limpiado");

  // Selector de idioma.
  await page.click('.lang__btn[lang="en"]');
  await page.waitForTimeout(600);
  const en = {
    lang: await page.getAttribute("html", "lang"),
    headline: (await page.textContent(".headline .sr-only"))?.trim(),
    placeholder: await page.getAttribute("#email", "placeholder"),
    title: await page.title(),
    pressed: await page.getAttribute('.lang__btn[lang="en"]', "aria-pressed"),
  };
  console.log(`  EN -> lang=${en.lang} aria-pressed=${en.pressed} placeholder="${en.placeholder}"`);
  console.log(`        headline="${en.headline}"`);
  if (en.lang !== "en") fail("idioma: no cambia a EN");
  if (en.placeholder !== "you@email.com") fail(`idioma: placeholder sin traducir ("${en.placeholder}")`);
  if (!/Casa Kruyff/.test(en.title)) fail("idioma: el título no se actualiza");

  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(3200);
  const persisted = await page.getAttribute("html", "lang");
  console.log(`  tras recargar   -> lang=${persisted}`);
  if (persisted !== "en") fail("idioma: no persiste tras recargar");

  // El titular debe seguir visible tras recargar (el preloader no se repite).
  const op = await page.evaluate(
    () => +(+getComputedStyle(document.querySelector(".headline__char")).opacity).toFixed(2)
  );
  console.log(`  titular tras recargar -> opacidad ${op}`);
  if (op !== 1) fail(`el titular quedó en opacidad ${op} tras recargar (preloader mal cerrado)`);

  await page.screenshot({ path: resolve(out, "state-en-1440.png") });
  await context.close();
}

/* ── 3. Sin JavaScript ───────────────────────────────────────────────────── */
console.log("\nSIN JAVASCRIPT");
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(800);

  const text = await page.textContent("body");
  const needed = ["Casa Kruyff", "Estamos componiendo la casa", "SITIO EN PREPARACIÓN"];
  const missing = needed.filter((n) => !text.toUpperCase().includes(n.toUpperCase()));

  // La regla y el titular no deben depender de JS para verse.
  const visibility = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      return el ? +(+getComputedStyle(el).opacity).toFixed(2) : -1;
    };
    return { headline: read(".headline"), rule: read(".rule"), body: read(".body") };
  });

  console.log(`  contenido -> ${missing.length ? `falta: ${missing.join(", ")}` : "completo en ES"}`);
  console.log(`  opacidades -> titular=${visibility.headline} regla=${visibility.rule} cuerpo=${visibility.body}`);
  for (const n of missing) fail(`sin JS: falta "${n}"`);
  if (visibility.headline !== 1) fail("sin JS: el titular está oculto");
  if (visibility.body !== 1) fail("sin JS: el cuerpo está oculto");

  await page.screenshot({ path: resolve(out, "no-js-1440.png") });
  await context.close();
}

await browser.close();
console.log(
  failures === 0 ? `\nTodo correcto. Capturas en ${out}` : `\n${failures} PROBLEMA(S). Capturas en ${out}`
);
process.exitCode = failures === 0 ? 0 : 1;
