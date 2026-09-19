"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * El emblema ornamental.
 *
 * Es el marco vacío de la marca: literalmente el sitio que todavía no existe.
 * Se anima en tres capas independientes para dar profundidad sin ruido:
 *
 *  1. Parallax — el emblema se desplaza más lento que la página (profundidad).
 *  2. Barrido dorado — una franja de oro cruza el ornamento en bucle lento, con
 *     pausa larga entre pasadas. El manual reserva el dorado para ornamento
 *     puntual, así que la luz pasa y se va: no se queda encendida.
 *  3. Resplandor — un halo cálido respira detrás, muy tenue.
 */

/** Segundos de espera entre pasadas del barrido. */
const SWEEP_PAUSE = 6.2;
/** Duración de una pasada. */
const SWEEP_DURATION = 2.0;

export function Emblem({
  width = 140,
  animating = true,
}: {
  width?: number;
  animating?: boolean;
}) {
  // Con movimiento reducido no hay barrido ni respiración: el ornamento se queda
  // quieto, que es exactamente lo que se pidió.
  const prefersReduced = usePrefersReducedMotion();
  const quiet = !animating || prefersReduced;

  // Parallax: sólo una fracción del scroll, para que se lea como profundidad
  // y no como deslizamiento.
  const { scrollYProgress } = useScroll();
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const parallaxScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.986]);

  // Barrido: una banda estrecha de oro que recorre la caja del emblema.
  const sweep = useMotionValue(-45);
  const sweepMask = useMotionTemplate`linear-gradient(102deg, transparent ${sweep}%, #fff calc(${sweep}% + 15%), transparent calc(${sweep}% + 30%))`;

  useEffect(() => {
    if (quiet) return;

    // Motion encadena espera y pasada sin bucles manuales.
    const controls = animate(sweep, [-45, 145], {
      duration: SWEEP_DURATION,
      delay: SWEEP_PAUSE,
      repeat: Infinity,
      repeatDelay: SWEEP_PAUSE,
      ease: [0.4, 0, 0.2, 1],
      repeatType: "loop",
    });

    return () => controls.stop();
  }, [quiet, sweep]);

  return (
    <div className="emblem" style={{ width }}>
      <motion.div
        className="emblem__glow"
        aria-hidden="true"
        animate={quiet ? undefined : { opacity: [0.45, 0.8, 0.45], scale: [1, 1.035, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="emblem__art"
        style={quiet ? undefined : { y: parallaxY, scale: parallaxScale }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/emblem.png"
          alt=""
          width={900}
          height={1257}
          decoding="async"
          fetchPriority="high"
        />

        {/* Capa de luz: repite el arte en oro y la recorta con una máscara en
            movimiento, de modo que el barrido respeta la silueta del ornamento
            en vez de pasar por encima como un rectángulo. */}
        {!quiet && (
          <motion.span
            className="emblem__sheen"
            aria-hidden="true"
            style={{ maskImage: sweepMask, WebkitMaskImage: sweepMask }}
          />
        )}
      </motion.div>
    </div>
  );
}
