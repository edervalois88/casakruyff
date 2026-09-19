"use client";

import { motion } from "motion/react";
import { EASE, enterProps, type EnterFrom, type EnterTo } from "@/lib/entrance";

type Timing = { duration: number; delay?: number; ease?: readonly [number, number, number, number] };

/**
 * Envoltorio de entrada.
 *
 * Existe por un solo motivo: Motion fija su estado inicial en el MONTAJE. Si el
 * elemento se monta con `initial={{ opacity: 0 }}` y la animación no llega a
 * correr —porque el visitante pidió movimiento reducido, o porque no hay
 * JavaScript— el contenido se queda invisible para siempre. Los estilos que
 * deja Motion son inline, así que ninguna regla CSS puede rescatarlo.
 *
 * Solución: cuando NO toca animar, el elemento se renderiza sin Motion. Misma
 * caja, mismo contenido, ya visible. `animating` sólo pasa a true cuando la
 * preferencia está resuelta y el velo tapa la pantalla, así que el intercambio
 * no se ve.
 */
export function Reveal({
  animating,
  from,
  to,
  timing,
  className,
  style,
  hidden,
  children,
}: {
  animating: boolean;
  from: EnterFrom;
  to: EnterTo;
  timing: Timing;
  className?: string;
  style?: React.CSSProperties;
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  if (!animating) {
    return (
      <div className={className} style={style} hidden={hidden}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      hidden={hidden}
      {...enterProps(from, to, timing)}
    >
      {children}
    </motion.div>
  );
}

/** Igual que `Reveal`, pero renderiza un párrafo. */
export function RevealText({
  animating,
  from,
  to,
  timing,
  className,
  hidden,
  children,
}: {
  animating: boolean;
  from: EnterFrom;
  to: EnterTo;
  timing: Timing;
  className?: string;
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  if (!animating) {
    return (
      <p className={className} hidden={hidden}>
        {children}
      </p>
    );
  }

  return (
    <motion.p className={className} hidden={hidden} {...enterProps(from, to, timing)}>
      {children}
    </motion.p>
  );
}

/** Transición estándar de la casa. */
export const enter = (delay: number, duration = 1.5): Timing => ({
  duration,
  delay,
  ease: EASE.silk,
});
