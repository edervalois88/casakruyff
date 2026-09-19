/**
 * Verifica el sitio DESPLEGADO (no el build local).
 *
 * Uso: node tools/verify-live.mjs [url]
 * Por omisión: https://casakruyff.com
 *
 * Comprueba encaje en una pantalla, recursos, tipografías realmente aplicadas,
 * la redirección de www, el 404 y que el preloader no deje la página a medias.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const base = (process.argv[2] || "https://casakruyff.com").replace(/\/$/, "");
const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "review");
await mkdir(out, { recursive: true });

const CASES = [
  { name: "desktop-es-1440", width: 1440, height: 900, lang: "es" },
  { name: "desktop-en-1440", width: 1440, height: 900, lang: "en" },
  { name: "laptop-es-1280", width: 1280, height: 720, lang: "es" },
  { name: "mobile-es-390", width: 390, height: 844, lang: "es" },
  { name: "mobile-en-390", width: 390, height: 844, lang: "en" },
  { name: "mobile-es-360", width: 360, height: 640, lang: "es" },
  { name: "tablet-es-820", width: 820, height: 1180, lang: "es" },
];

let failures = 0;
const fail = (m) => { failures++; console.log(`   x ${m}`); };

console.log(`VERIFICANDO ${base}\n`);
const browser = await chromium.launch({ channel: "chrome" });

console.log("ENCAJE EN PRODUCCIÓN");
for (const c of CASES) {
  const context = await browser.newContext({
    viewport: { width: c.width, height: c.height },
    locale: c.lang === "en" ? "en-US" : "es-MX",
  });

  // Salta el preloader: aquí se mide la página ya compuesta.
  await context.addInitScript((lang) => {
    try {
      window.localStorage.setItem("kx-lang", lang);
      window.sessionStorage.setItem("kx-seen", "1");
    } catch {}
  }, c.lang);

  const page = await context.newPage();

  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("requestfailed", (r) => problems.push(`recurso: ${r.url()}`));
  page.on("response", (r) => {
    if (r.status() >= 400) problems.push(`HTTP ${r.status()} ${r.url()}`);
  });

  await page.goto(base + "/", { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  // La entrada completa tarda ~4.7 s desde el arranque (incluye el velo y la
  // última letra del titular). Se espera de sobra para medir el estado final.
  await page.waitForTimeout(7000);

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

    const emblem = document.querySelector(".emblem__art img");
    const word = document.querySelector(".wordmark img");
    const chars = [...document.querySelectorAll(".headline__char")];

    const used = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).fontFamily : "";
    };

    const loaded = [];
    document.fonts.forEach((f) => loaded.push(`${f.family}|${f.status}`));

    return {
      scrollY: doc.scrollHeight > doc.clientHeight + 1,
      scrollX: doc.scrollWidth > doc.clientWidth + 1,
      over: [...new Set(over)].slice(0, 6),
      lang: doc.lang,
      // naturalWidth prueba que la imagen cargó de verdad, no sólo que el tag está.
      emblemOk: !!emblem && emblem.naturalWidth > 0 && emblem.complete,
      wordmarkOk: !!word && word.naturalWidth > 0 && word.complete,
      sheen: !!document.querySelector(".emblem__sheen"),
      chars: chars.length,
      charsVisible: chars.length ? Math.min(...chars.map((el) => +getComputedStyle(el).opacity)) : -1,
      displayUsed: used(".headline"),
      sansUsed: used(".body"),
      loaded,
    };
  });

  // next/font sirve las familias desde el propio dominio y las renombra con un
  // hash, así que se comprueba el nombre base, no el nombre exacto.
  const displayOk = /Cormorant Garamond/i.test(m.displayUsed);
  const sansOk = /Lato/i.test(m.sansUsed);
  const fontsLoaded = m.loaded.some((f) => /Cormorant Garamond/i.test(f) && f.endsWith("loaded"))
    && m.loaded.some((f) => /^Lato/i.test(f) && f.endsWith("loaded"));

  console.log(
    `  ${c.name.padEnd(20)} scrollY=${m.scrollY ? "SÍ" : "no"} scrollX=${m.scrollX ? "SÍ" : "no"} ` +
    `lang=${m.lang} emblema=${m.emblemOk ? "ok" : "NO"} wordmark=${m.wordmarkOk ? "ok" : "NO"} ` +
    `letras=${m.chars} visibles=${m.charsVisible}`
  );
  if (c.name === "desktop-es-1440") {
    console.log(`    display="${m.displayUsed}"`);
    console.log(`    texto="${m.sansUsed}"`);
  }

  if (m.scrollY) fail(`${c.name}: desborde vertical`);
  if (m.scrollX) fail(`${c.name}: desborde horizontal`);
  if (m.lang !== c.lang) fail(`${c.name}: idioma ${m.lang}, esperado ${c.lang}`);
  if (!m.emblemOk) fail(`${c.name}: el emblema no cargó`);
  if (!m.wordmarkOk) fail(`${c.name}: el wordmark no cargó`);
  if (!m.sheen) fail(`${c.name}: falta la capa de barrido dorado`);
  if (m.chars < 10) fail(`${c.name}: el titular no se dividió en caracteres`);
  if (m.charsVisible !== 1) fail(`${c.name}: el titular quedó en opacidad ${m.charsVisible}`);
  if (!displayOk) fail(`${c.name}: la tipografía display no se aplicó (${m.displayUsed})`);
  if (!sansOk) fail(`${c.name}: la tipografía de texto no se aplicó (${m.sansUsed})`);
  if (!fontsLoaded) fail(`${c.name}: las fuentes no reportan estado "loaded"`);
  for (const p of problems) fail(`${c.name}: ${p}`);
  for (const o of m.over) fail(`${c.name}: desborda ${o}`);

  if (c.name === "desktop-es-1440" || c.name === "mobile-es-390") {
    await page.screenshot({ path: resolve(out, `live-${c.name}.png`) });
  }

  await context.close();
}

/* ── 2. El preloader no deja la página a medias en producción ───────────── */
console.log("\nPRELOADER EN PRODUCCIÓN (visita nueva)");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "load" });

  const appeared = await page
    .waitForSelector(".preloader", { timeout: 4000 })
    .then(() => true)
    .catch(() => false);

  // Espera a que la entrada termine de verdad, no a un tiempo fijo.
  await page
    .waitForFunction(
      () => {
        const chars = [...document.querySelectorAll(".headline__char")];
        if (!chars.length) return false;
        const allVisible = chars.every((el) => Number(getComputedStyle(el).opacity) >= 1);
        return allVisible && !document.querySelector(".preloader");
      },
      { timeout: 12000 },
    )
    .catch(() => {});

  const after = await page.evaluate(() => {
    const chars = [...document.querySelectorAll(".headline__char")];
    const frame = document.querySelector(".frame");
    return {
      preloader: !!document.querySelector(".preloader"),
      frameHidden: frame ? frame.hasAttribute("hidden") : null,
      visible: chars.length ? Math.min(...chars.map((el) => +getComputedStyle(el).opacity)) : -1,
    };
  });

  console.log(
    `  velo apareció=${appeared ? "sí" : "NO"}  velo retirado=${after.preloader ? "NO" : "sí"}  ` +
    `página oculta=${after.frameHidden ? "SÍ" : "no"}  titular=${after.visible}`
  );
  if (!appeared) fail("producción: el preloader no aparece en una visita nueva");
  if (after.preloader) fail("producción: el preloader no se retiró");
  if (after.frameHidden) fail("producción: la página se quedó oculta");
  if (after.visible !== 1) fail(`producción: el titular quedó en opacidad ${after.visible}`);
  await context.close();
}

/* ── 3. Servidor ────────────────────────────────────────────────────────── */
console.log("\nRESPUESTA DEL SERVIDOR");
{
  const apex = await fetch(base + "/", { redirect: "manual" });
  console.log(`  ${(base + "/").padEnd(44)} ${apex.status}`);
  if (apex.status !== 200) fail(`${base}/ responde ${apex.status}`);

  const asset = await fetch(base + "/brand/emblem.png", { redirect: "manual" });
  console.log(`  ${(base + "/brand/emblem.png").padEnd(44)} ${asset.status}`);
  if (asset.status !== 200) fail(`el emblema responde ${asset.status}`);

  // www debe redirigir al dominio raíz (canónico elegido).
  if (base === "https://casakruyff.com") {
    const www = await fetch("https://www.casakruyff.com/", { redirect: "manual" });
    const loc = www.headers.get("location");
    console.log(`  ${"https://www.casakruyff.com/".padEnd(44)} ${www.status}  -> ${loc}`);
    if (![301, 308].includes(www.status)) fail(`www debería redirigir (301/308), responde ${www.status}`);
    else if (!String(loc).startsWith("https://casakruyff.com")) fail(`www redirige a ${loc}`);
  }

  const missing = await fetch(base + "/no-existe-" + Date.now(), { redirect: "manual" });
  console.log(`  ${"ruta inexistente".padEnd(44)} ${missing.status}`);
  if (missing.status !== 404) fail(`una ruta inexistente responde ${missing.status}, se esperaba 404`);
}

await browser.close();
console.log(failures === 0 ? "\nProducción verificada, todo correcto." : `\n${failures} PROBLEMA(S) en producción.`);
process.exitCode = failures === 0 ? 0 : 1;
