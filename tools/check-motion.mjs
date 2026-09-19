/**
 * Verifica el movimiento de la página.
 *
 * Uso:  node tools/check-motion.mjs [url]
 * Por omisión: http://localhost:3100
 *
 * Comprueba que la entrada escalonada realmente ocurre, que el preloader se
 * retira, que el barrido del emblema existe, y que prefers-reduced-motion deja
 * todo compuesto sin animación.
 */
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const base = (process.argv[2] || "http://localhost:3100").replace(/\/$/, "");
const out = resolve(dirname(fileURLToPath(import.meta.url)), "..", "review");
await mkdir(out, { recursive: true });

let failures = 0;
const fail = (m) => { failures++; console.log(`  x ${m}`); };

const browser = await chromium.launch({ channel: "chrome" });

/* ── 1. El preloader aparece y se retira ─────────────────────────────────── */
console.log("PRELOADER (primera visita, sin sesión previa)");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "load" });

  // El velo se monta en un efecto, después del evento `load`: hay que esperarlo
  // en vez de consultar de inmediato.
  const appeared = await page
    .waitForSelector(".preloader", { timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  const early = await page.evaluate(() => {
    const frame = document.querySelector(".frame");
    const char = document.querySelector(".headline__char");
    return {
      present: !!document.querySelector(".preloader"),
      // Mientras el velo tapa, los bloques de la página están `hidden`: se
      // montan (y Motion fija su estado inicial) sin llegar a pintarse así.
      pageHidden: frame ? frame.hasAttribute("hidden") : null,
      headline: char ? +(+getComputedStyle(char).opacity).toFixed(2) : null,
    };
  });
  console.log(
    `  al cargar        -> preloader=${early.present ? "visible" : "ausente"}  ` +
    `página oculta=${early.pageHidden ? "sí (correcto)" : "NO"}  titular=${early.headline}`
  );
  if (!appeared || !early.present) fail("el preloader no aparece en la primera visita");
  if (!early.pageHidden) fail("la página se está pintando detrás del velo (la entrada no arrancaría)");

  await page.waitForTimeout(1400);
  await page.screenshot({ path: resolve(out, "preloader.png") });

  await page.waitForTimeout(3600);
  const late = await page.evaluate(() => ({
    present: !!document.querySelector(".preloader"),
    headline: +(+getComputedStyle(document.querySelector(".headline__char")).opacity).toFixed(2),
  }));
  console.log(`  tras la entrada  -> preloader=${late.present ? "AÚN VISIBLE" : "retirado"}  titular=${late.headline}`);
  if (late.present) fail("el preloader no se retiró");
  if (late.headline !== 1) fail(`el titular quedó en opacidad ${late.headline}`);

  await context.close();
}

/* ── 2. Entrada escalonada y barrido del emblema ─────────────────────────── */
console.log("\nMOVIMIENTO");
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try { window.sessionStorage.setItem("kx-seen", "1"); window.localStorage.setItem("kx-lang", "es"); } catch {}
  });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "load" });

  // Las animaciones que Motion registra en el navegador, con su estado.
  const anims = await page.evaluate(() =>
    document.getAnimations().map((a) => ({
      name: a.animationName || a.id || "(motion)",
      state: a.playState,
    }))
  );
  console.log(`  animaciones registradas al cargar: ${anims.length}`);

  // Muestreo del titular: debe pasar por valores intermedios.
  const samples = [];
  for (const at of [250, 900, 1800, 3200, 4200]) {
    await page.waitForTimeout(at - (samples.at(-1)?.at ?? 0));
    const s = await page.evaluate(() => {
      const chars = [...document.querySelectorAll(".headline__char")];
      const op = chars.map((c) => +(+getComputedStyle(c).opacity).toFixed(2));
      const rule = document.querySelector(".rule");
      const foot = document.querySelector(".foot");
      return {
        minChar: op.length ? Math.min(...op) : -1,
        maxChar: op.length ? Math.max(...op) : -1,
        ruleOpacity: rule ? +(+getComputedStyle(rule).opacity).toFixed(2) : -1,
        footOpacity: foot ? +(+getComputedStyle(foot).opacity).toFixed(2) : -1,
        sheen: !!document.querySelector(".emblem__sheen"),
        glowOpacity: (() => {
          const g = document.querySelector(".emblem__glow");
          return g ? +(+getComputedStyle(g).opacity).toFixed(2) : -1;
        })(),
      };
    });
    samples.push({ at, ...s });
  }

  for (const s of samples) {
    console.log(
      `  t=${String(s.at).padStart(4)}ms  letras[min..max]=${s.minChar}..${s.maxChar}  ` +
      `regla=${s.ruleOpacity}  pie=${s.footOpacity}  halo=${s.glowOpacity}  barrido=${s.sheen ? "sí" : "no"}`
    );
  }

  const last = samples.at(-1);
  if (last.maxChar !== 1) fail(`el titular no terminó visible (max=${last.maxChar})`);
  if (last.ruleOpacity !== 1) fail(`la regla no terminó visible (${last.ruleOpacity})`);
  if (last.footOpacity !== 1) fail(`el pie no terminó visible (${last.footOpacity})`);
  if (!last.sheen) fail("no existe la capa de barrido dorado del emblema");

  // El escalonado debe producir letras a distinta opacidad en algún momento.
  const staggered = samples.some((s) => s.minChar < 1 && s.maxChar > 0);
  if (!staggered) fail("no se observó revelado escalonado por carácter");
  else console.log("  -> revelado escalonado por carácter verificado");

  await context.close();
}

/* ── 3. prefers-reduced-motion ───────────────────────────────────────────── */
console.log("\nMOVIMIENTO REDUCIDO");
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    try { window.sessionStorage.setItem("kx-seen", "1"); } catch {}
  });
  const page = await context.newPage();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(700);

  const state = await page.evaluate(() => {
    const read = (sel) => {
      const el = document.querySelector(sel);
      return el ? +(+getComputedStyle(el).opacity).toFixed(2) : -1;
    };
    return {
      preloader: !!document.querySelector(".preloader"),
      headline: read(".headline"),
      body: read(".body"),
      foot: read(".foot"),
      sheen: !!document.querySelector(".emblem__sheen"),
    };
  });

  console.log(
    `  preloader=${state.preloader ? "VISIBLE" : "ausente"}  titular=${state.headline}  ` +
    `cuerpo=${state.body}  pie=${state.foot}  barrido=${state.sheen ? "presente" : "desactivado"}`
  );
  if (state.preloader) fail("reduced-motion: el preloader sigue visible");
  if (state.headline !== 1 || state.body !== 1 || state.foot !== 1) {
    fail("reduced-motion: hay contenido invisible");
  }
  if (state.sheen) fail("reduced-motion: el barrido del emblema sigue activo");

  await context.close();
}

await browser.close();
console.log(failures === 0 ? "\nMovimiento correcto." : `\n${failures} PROBLEMA(S) de movimiento.`);
process.exitCode = failures === 0 ? 0 : 1;
