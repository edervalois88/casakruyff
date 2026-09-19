/**
 * Comprueba que la entrada escalonada existe y se ejecuta, y que
 * prefers-reduced-motion la desactiva.
 *
 * En lugar de muestrear opacidades en tiempos fijos (frágil: la ventana en la
 * que un elemento está a medio aparecer dura décimas), se consulta el registro
 * de animaciones del navegador y se avanza el reloj a voluntad.
 *
 * Uso: node tools/check-motion.mjs
 */
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const url = pathToFileURL(resolve(here, "..", "index.html")).href;

let failures = 0;
const fail = (m) => { failures++; console.log(`  x ${m}`); };

const browser = await chromium.launch({ channel: "chrome" });

/* ── 1. Animaciones registradas y con retraso escalonado ────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(300);

  const anims = await page.evaluate(() =>
    document.getAnimations().map((a) => ({
      name: a.animationName,
      delay: a.effect.getTiming().delay,
      duration: a.effect.getTiming().duration,
      target: a.effect.target?.className || a.effect.target?.tagName,
    }))
  );

  console.log("ANIMACIONES DE ENTRADA");
  for (const a of anims) {
    console.log(
      `  ${String(a.name).padEnd(7)} retraso=${String(a.delay).padStart(4)}ms ` +
      `duración=${a.duration}ms  objetivo=${String(a.target).split(" ")[0]}`
    );
  }

  const expected = ["veil", "ink", "trazo", "rise"];
  for (const name of expected) {
    if (!anims.some((a) => a.name === name)) fail(`falta la animación "${name}"`);
  }
  if (anims.length < 8) fail(`se esperaban al menos 8 animaciones, hay ${anims.length}`);

  // El escalonado debe ser real: retrasos distintos y crecientes.
  const delays = [...new Set(anims.map((a) => a.delay))].sort((x, y) => x - y);
  console.log(`  retrasos distintos: ${delays.join(", ")}ms`);
  if (delays.length < 4) fail("el escalonado no tiene retrasos diferenciados");

  await page.close();
}

/* ── 2. Estado final tras completarse ───────────────────────────────────── */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(3600);

  const final = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { opacity: +(+s.opacity).toFixed(3), display: s.display, filter: s.filter };
    };
    const anims = document.getAnimations();
    return {
      // Con `fill: forwards` una animación terminada sigue listada: lo que
      // importa es su playState, no el conteo.
      running: anims.filter((a) => a.playState === "running").length,
      pending: anims.filter((a) => a.playState === "paused").length,
      total: anims.length,
      veil: read(".emblem__veil"),
      wordmark: read(".wordmark"),
      rule: read(".rule"),
      eyebrow: read(".eyebrow"),
      headline: read(".headline"),
      body: read(".body"),
      waitlist: read(".waitlist"),
      foot: read(".foot"),
    };
  });

  console.log("\nESTADO FINAL (todo visible, nada animándose)");
  for (const [k, v] of Object.entries(final)) {
    if (k === "running" || k === "pending" || k === "total") continue;
    console.log(`  ${k.padEnd(9)} opacity=${v.opacity}  display=${v.display}  filter=${v.filter}`);
  }
  console.log(`  animaciones: ${final.total} registradas, ${final.running} en curso, ${final.pending} en pausa`);

  for (const key of ["wordmark", "rule", "eyebrow", "headline", "body", "waitlist", "foot"]) {
    if (final[key]?.opacity !== 1) fail(`${key}: opacidad final ${final[key]?.opacity}, se esperaba 1`);
  }
  if (final.running !== 0) fail(`quedaron ${final.running} animaciones en curso`);
  await page.close();
}

/* ── 3. prefers-reduced-motion ──────────────────────────────────────────── */
{
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    const veil = document.querySelector(".emblem__veil");
    const read = (sel) => +(+getComputedStyle(document.querySelector(sel)).opacity).toFixed(3);
    return {
      veilDisplay: veil ? getComputedStyle(veil).display : "ausente",
      headline: read(".headline"),
      foot: read(".foot"),
    };
  });

  console.log("\nMOVIMIENTO REDUCIDO (compuesto desde el primer frame)");
  console.log(`  velo=${state.veilDisplay}  headline.opacity=${state.headline}  foot.opacity=${state.foot}`);
  if (state.veilDisplay !== "none") fail("reduced-motion: el velo sigue presente");
  if (state.headline !== 1 || state.foot !== 1) fail("reduced-motion: hay contenido invisible");
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "\nMovimiento correcto." : `\n${failures} PROBLEMA(S) de movimiento.`);
process.exitCode = failures === 0 ? 0 : 1;
