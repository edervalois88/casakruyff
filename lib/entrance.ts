/**
 * Sistema de movimiento.
 *
 * El brand book pide tono «sereno» (sin prisa) y «refinado» (sutil): duraciones
 * largas, curvas de salida suave, ningún rebote salvo donde se quiere llamar la
 * atención. Estas constantes son la única fuente de verdad del ritmo.
 */

export const EASE = {
  /** Entrada premium: arranca rápido y se asienta. */
  silk: [0.16, 1, 0.3, 1] as const,
  /** Interfaz y hover. */
  luxury: [0.25, 0.1, 0.1, 1] as const,
  /** Barridos y revelados. */
  reveal: [0.77, 0, 0.175, 1] as const,
};

export const DUR = {
  headline: 1.5,
  ui: 0.5,
  /** Barrido dorado del emblema. */
  sweep: 2.0,
};

/**
 * Escalonado de la entrada. Cada pieza entra cuando la anterior ya se asentó;
 * el conjunto completo tarda ~2.6 s, que es lento a propósito.
 */
export const STAGGER = {
  emblem: 0,
  wordmark: 0.3,
  rule: 1.15,
  eyebrow: 1.32,
  headline: 1.44,
  body: 1.62,
  form: 1.78,
  foot: 1.94,
};

/** Entrada estándar: sube y aparece. */
export const rise = (delay = 0, duration = DUR.headline) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: EASE.silk },
});

/** Resorte contenido para micro-interacciones. */
export const snapSpring = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.6 };

/** Estados de entrada que usa `Reveal`. */
export type EnterFrom = Record<string, number | string>;
export type EnterTo = Record<string, number | string>;

/**
 * Props de entrada.
 *
 * No recibe `reduced`: quien decide es el llamador, y cuando no toca animar
 * simplemente no monta el componente de Motion (ver `components/Reveal.tsx`).
 * Ésa es la única forma segura, porque Motion fija su `initial` en el montaje y
 * los estilos que deja son inline: una regla CSS con `!important` llegaría a
 * tiempo, pero devolver `initial={false}` en un render posterior no.
 */
export function enterProps<F extends EnterFrom, T extends EnterTo>(
  from: F,
  to: T,
  transition: { duration: number; delay?: number; ease?: readonly [number, number, number, number] },
): { initial: F; animate: T; transition: typeof transition } {
  return { initial: from, animate: to, transition };
}
