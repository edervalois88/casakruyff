"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE } from "@/lib/entrance";
import { site } from "@/lib/site";
import { prefersReducedMotionNow, useHydrated, usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

const SEEN_KEY = "kx-seen";

type Phase = "mounting" | "showing" | "done";

/**
 * Preloader y compuerta de la entrada.
 *
 * El velo Marfil-sobre-Espresso reproduce el gesto del packaging del brand book:
 * la caja oscura que contiene la pieza clara. Se muestra una sola vez por sesión.
 *
 * Arquitectura, y por qué es así:
 *
 *  - La página SIEMPRE existe en el HTML del servidor, en su forma estática y ya
 *    visible. Si dependiera de JavaScript, quien llegue sin él vería una página
 *    vacía.
 *
 *  - Los elementos ANIMADOS se montan aparte, y sólo cuando `animating` es true.
 *    Es imprescindible: Motion fija su estado inicial (`opacity: 0`) en el
 *    montaje, así que si se montara creyendo que no hay preferencia de
 *    movimiento, ese `opacity: 0` quedaría fijado y el contenido no aparecería
 *    nunca. La regla CSS de `prefers-reduced-motion` no puede deshacerlo porque
 *    los estilos de Motion son inline.
 *
 *  - `animating` se activa cuando el velo ya está en pantalla (o cuando no hay
 *    velo), de modo que el montaje de la versión animada ocurre tapado y no se
 *    ve ningún salto.
 */
export function Preloader({
  children,
}: {
  children: (animating: boolean, intro: boolean) => React.ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>("mounting");
  const hydrated = useHydrated();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(SEEN_KEY) === "1";
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Sin sessionStorage no se puede recordar: se muestra una vez por carga.
      seen = false;
    }

    if (seen || prefersReducedMotionNow()) {
      setPhase("done");
      return;
    }

    setPhase("showing");
    const timer = window.setTimeout(() => setPhase("done"), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Mientras el velo se está mostrando se renderiza la versión estática (está
  // tapada). Cuando se retira, la preferencia ya tiene su valor definitivo, así
  // que el montaje de la versión animada es correcto.
  //
  // `hydrated` es imprescindible: el HTML del servidor trae la versión estática,
  // y si el primer render del cliente decidiera animar, React conservaría el DOM
  // del servidor durante la hidratación y los elementos de Motion nunca se
  // montarían. El resultado se veía como contenido invisible.
  const animating = hydrated && phase !== "showing" && !reduced;

  // Mientras el velo tapa, los bloques de la página van `hidden`: así sus
  // elementos animados se montan —y Motion fija su estado inicial— sin llegar a
  // pintarse nunca en ese estado.
  const intro = phase !== "done";

  return (
    <>
      <AnimatePresence>
        {phase === "showing" && (
          <motion.div
            className="preloader"
            initial={{ opacity: 1 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.95, ease: EASE.silk }}
            aria-hidden="true"
          >
            <div className="preloader__inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="preloader__mark"
                src="/brand/emblem-ivory.png"
                alt=""
                width={900}
                height={1257}
              />
              <span className="preloader__word">{site.name}</span>
              <motion.span
                className="preloader__rule"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, delay: 0.25, ease: EASE.silk }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children(animating, intro)}
    </>
  );
}
