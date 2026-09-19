"use client";

import { motion } from "motion/react";
import { EASE, enterProps } from "@/lib/entrance";

/**
 * El wordmark CASA KRUYFF.
 *
 * Se descubre con un barrido de izquierda a derecha: la palabra se posa en el
 * papel en lugar de aparecer de golpe. Es el gesto más reconocible de la
 * entrada.
 *
 * Sin animación se renderiza sin Motion y con el clip abierto: el mismo
 * elemento, ya visible. Ver `components/Reveal.tsx` para el porqué.
 */
export function Wordmark({
  animating,
  delay = 0.35,
  width = 320,
  src = "/brand/wordmark.png",
  alt = "Casa Kruyff",
}: {
  animating: boolean;
  delay?: number;
  width?: number;
  src?: string;
  alt?: string;
}) {
  const image = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      width={1400}
      height={142}
      decoding="async"
      fetchPriority="high"
    />
  );

  return (
    <div className="wordmark" style={{ width }}>
      {animating ? (
        <motion.div
          className="wordmark__clip"
          {...enterProps(
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)" },
            { duration: 1.35, delay, ease: EASE.reveal },
          )}
        >
          {image}
        </motion.div>
      ) : (
        <div className="wordmark__clip">{image}</div>
      )}
    </div>
  );
}
