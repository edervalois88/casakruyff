/**
 * Verifica el sitio DESPLEGADO (no el archivo local).
 *
 * Uso: node tools/verify-live.mjs [url]
 * Por omisión: https://casakruyff.com
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
  const page = await context.newPage();

  const problems = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  page.on("requestfailed", (r) => problems.push(`recurso: ${r.url()}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`HTTP ${r.status()} ${r.url()}`);
  });

  await page.goto(base + "/", { waitUntil: "load" });
  await page.evaluate((l) => { try { localStorage.setItem("kx-lang", l); } catch {} }, c.lang);
  await page.reload({ waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3200);

  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    const over = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      if (r.right > window.innerWidth + 1 || r.left < -1) over.push(el.tagName.toLowerCase());
    });
    const img = document.querySelector(".emblem img");
    const wm = document.querySelector(".wordmark");

    // `document.fonts.check()` es sensible a la sintaxis del eje de peso y da
    // falsos negativos. Lo que importa es qué familia acabó aplicándose y qué
    // caras registró el navegador.
    const loaded = [];
    document.fonts.forEach((f) => loaded.push(`${f.family}|${f.status}`));
    const used = (sel) => getComputedStyle(document.querySelector(sel)).fontFamily;

    return {
      scrollY: doc.scrollHeight > doc.clientHeight + 1,
      scrollX: doc.scrollWidth > doc.clientWidth + 1,
      over: [...new Set(over)].slice(0, 5),
      lang: doc.lang,
      emblemOk: !!img && img.naturalWidth > 0 && img.complete,
      wordmarkOk: !!wm && wm.naturalWidth > 0 && wm.complete,
      loaded,
      displayUsed: used(".headline"),
      sansUsed: used(".body"),
    };
  });

  const loadedCormorant = m.loaded.some((f) => f.startsWith("Cormorant Garamond|loaded"));
  const loadedLato = m.loaded.some((f) => f.startsWith("Lato|loaded"));
  const displayOk = /Cormorant Garamond/.test(m.displayUsed) && loadedCormorant;
  const sansOk = /Lato/.test(m.sansUsed) && loadedLato;

  console.log(
    `  ${c.name.padEnd(20)} scrollY=${m.scrollY ? "SÍ" : "no"}  scrollX=${m.scrollX ? "SÍ" : "no"}  ` +
    `lang=${m.lang}  emblema=${m.emblemOk ? "ok" : "NO"}  wordmark=${m.wordmarkOk ? "ok" : "NO"}  ` +
    `display=${displayOk ? "ok" : "NO"}  texto=${sansOk ? "ok" : "NO"}`
  );

  if (c.name === "desktop-es-1440") {
    console.log(`    familias aplicadas: display="${m.displayUsed}" texto="${m.sansUsed}"`);
    console.log(`    caras registradas: ${m.loaded.join("  ")}`);
  }

  if (m.scrollY) fail(`${c.name}: desborde vertical`);
  if (m.scrollX) fail(`${c.name}: desborde horizontal`);
  if (m.lang !== c.lang) fail(`${c.name}: idioma ${m.lang}`);
  if (!m.emblemOk) fail(`${c.name}: el emblema no cargó`);
  if (!m.wordmarkOk) fail(`${c.name}: el wordmark no cargó`);
  if (!displayOk) fail(`${c.name}: la tipografía display no se aplicó (${m.displayUsed})`);
  if (!sansOk) fail(`${c.name}: la tipografía de texto no se aplicó (${m.sansUsed})`);
  for (const p of problems) fail(`${c.name}: ${p}`);
  for (const o of m.over) fail(`${c.name}: desborda ${o}`);

  if (c.name === "desktop-es-1440" || c.name === "mobile-es-390") {
    await page.screenshot({ path: resolve(out, `live-${c.name}.png`) });
  }

  await context.close();
}

console.log("\nRESPUESTA DEL SERVIDOR");
for (const u of [base + "/", "https://www.casakruyff.com/", base + "/brand/emblem.png"]) {
  const res = await fetch(u, { redirect: "manual" });
  console.log(`  ${u.padEnd(44)} ${res.status}`);
  if (res.status >= 400) fail(`${u} responde ${res.status}`);
}

await browser.close();
console.log(failures === 0 ? "\nProducción verificada, todo correcto." : `\n${failures} PROBLEMA(S) en producción.`);
process.exitCode = failures === 0 ? 0 : 1;
