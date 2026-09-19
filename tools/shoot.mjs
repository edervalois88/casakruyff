/**
 * Verificación de la página en construcción de Casa Kruyff.
 *
 * Uso:  node tools/shoot.mjs
 * Salida: review/*.png + reporte en consola
 *
 * Comprueba: encaje en una pantalla (desktop/tablet/móvil), desbordes
 * horizontales, recursos faltantes, errores de consola, estados del formulario,
 * cambio de idioma, foco visible y comportamiento sin JavaScript.
 */
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const url = pathToFileURL(resolve(root, "index.html")).href;
const out = resolve(root, "review");

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
const fail = (msg) => {
  failures += 1;
  console.log(`   x ${msg}`);
};

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

/* ── 1. Encuadre y recursos por viewport ─────────────────────────────────── */
console.log("ENCAJE");
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

  await page.goto(url, { waitUntil: "load" });
  await page.evaluate((l) => {
    try { localStorage.setItem("kx-lang", l); } catch {}
  }, shot.lang);
  await page.reload({ waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3200); // deja terminar la entrada

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
    return {
      scrollH: doc.scrollHeight,
      clientH: doc.clientHeight,
      scrollW: doc.scrollWidth,
      clientW: doc.clientWidth,
      over: [...new Set(over)].slice(0, 6),
      lang: doc.lang,
    };
  });

  const bits = [
    `scrollY=${m.scrollH > m.clientH + 1 ? "SÍ" : "no"}`,
    `scrollX=${m.scrollW > m.clientW + 1 ? "SÍ" : "no"}`,
    `lang=${m.lang}`,
  ];
  console.log(`  ${shot.name.padEnd(20)} ${shot.width}x${shot.height}  ${bits.join("  ")}`);

  if (m.scrollH > m.clientH + 1) fail(`${shot.name}: desborde vertical (${m.scrollH}/${m.clientH})`);
  if (m.scrollW > m.clientW + 1) fail(`${shot.name}: desborde horizontal`);
  if (m.lang !== shot.lang) fail(`${shot.name}: idioma ${m.lang}, esperado ${shot.lang}`);
  for (const p of problems) fail(`${shot.name}: ${p}`);
  for (const o of m.over) fail(`${shot.name}: elemento fuera del viewport ${o}`);

  await context.close();
}

/* ── 2. Estados del formulario e idioma ─────────────────────────────────── */
console.log("\nINTERACCIÓN");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => { try { localStorage.setItem("kx-lang", "es"); } catch {} });
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(600);

  // Correo inválido -> mensaje de error en español, sin navegación.
  await page.fill("#email", "no-es-correo");
  await page.click("#waitlist button[type=submit]");
  await page.waitForTimeout(250);
  const invalid = await page.textContent("#form-note");
  const invalidState = await page.getAttribute("#form-note", "data-state");
  console.log(`  correo inválido  -> "${invalid}" [${invalidState}]`);
  if (invalidState !== "error" || !invalid) fail("formulario: no marca el correo inválido");

  // Al escribir, el error se limpia.
  await page.fill("#email", "a@b.com");
  await page.dispatchEvent("#email", "input");
  await page.waitForTimeout(150);
  const cleared = await page.textContent("#form-note");
  if (cleared.trim()) fail(`formulario: el error no se limpia (="${cleared}")`);
  else console.log("  al escribir      -> aviso limpiado");

  // Cambio de idioma: el marcador del campo también cambia.
  await page.click('.lang__btn[data-lang="en"]');
  await page.waitForTimeout(250);
  const en = {
    lang: await page.getAttribute("html", "lang"),
    headline: await page.textContent(".headline"),
    ph: await page.getAttribute("#email", "placeholder"),
    title: await page.title(),
    pressed: await page.getAttribute('.lang__btn[data-lang="en"]', "aria-pressed"),
  };
  console.log(`  EN -> lang=${en.lang} aria-pressed=${en.pressed}`);
  console.log(`        headline="${en.headline}"  placeholder="${en.ph}"`);
  if (en.lang !== "en") fail("idioma: no cambia a EN");
  if (en.ph !== "you@email.com") fail(`idioma: placeholder no traducido ("${en.ph}")`);
  if (!/Casa Kruyff/.test(en.title)) fail("idioma: el título no se actualiza");

  // El idioma persiste tras recargar.
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(300);
  const persisted = await page.getAttribute("html", "lang");
  console.log(`  tras recargar    -> lang=${persisted}`);
  if (persisted !== "en") fail("idioma: no persiste tras recargar");

  // Foco visible por teclado.
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const s = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), outline: s.outlineWidth, cls: el.className };
  });
  console.log(`  primer Tab       -> <${focus.tag}> outline=${focus.outline}`);
  if (parseFloat(focus.outline) === 0) fail("foco: el primer elemento no muestra contorno");

  await page.screenshot({ path: resolve(out, "state-form-error.png") });
  await context.close();
}

/* ── 3. Sin JavaScript: el idioma base debe leerse completo ─────────────── */
console.log("\nSIN JAVASCRIPT");
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const text = await page.textContent("body");
  const needed = ["Casa Kruyff", "Estamos componiendo la casa", "SITIO EN PREPARACIÓN"];
  const missing = needed.filter((n) => !text.toUpperCase().includes(n.toUpperCase()));
  console.log(`  contenido base   -> ${missing.length ? `falta: ${missing.join(", ")}` : "completo en ES"}`);
  for (const n of missing) fail(`sin JS: falta "${n}"`);
  await page.screenshot({ path: resolve(out, "no-js-1440.png") });
  await context.close();
}

await browser.close();
console.log(
  failures === 0
    ? `\nTodo correcto. Capturas en ${out}`
    : `\n${failures} PROBLEMA(S). Capturas en ${out}`
);
process.exitCode = failures === 0 ? 0 : 1;
