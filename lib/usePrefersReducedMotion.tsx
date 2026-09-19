"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Lectura puntual de la preferencia. Fuera del ciclo de render no hay riesgo. */
export function prefersReducedMotionNow(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

function neverChanges(): () => void {
  return () => {};
}

/**
 * ¿Ya hidrató el cliente?
 *
 * `useSyncExternalStore` con un snapshot constante devuelve `false` en el HTML
 * del servidor y `true` en el cliente. Se usa como señal de "ya estamos en el
 * navegador", y es la pieza que permite que servidor y primer render del cliente
 * coincidan exactamente.
 *
 * Por qué hace falta: si el primer render del cliente decidiera "sí animo" y el
 * HTML del servidor trajera la versión estática, React conservaría el DOM del
 * servidor durante la hidratación y los elementos de Motion nunca llegarían a
 * montarse. El resultado se veía como contenido invisible.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

/**
 * ¿El sistema pide movimiento reducido?
 *
 * Sólo devuelve el valor real cuando el cliente ya hidrató. Antes de eso
 * devuelve `false`, que es lo que hace que el primer render del cliente coincida
 * con el HTML del servidor.
 *
 * Es importante consultarlo (junto con `useHydrated`) antes de montar cualquier
 * elemento de Motion: Motion fija su estado inicial (`opacity: 0`) en el montaje
 * y deja estilos inline, así que si se monta creyendo que no hay preferencia de
 * movimiento, ese `opacity: 0` queda fijado y el contenido no aparece nunca. La
 * regla CSS de `prefers-reduced-motion` no puede deshacerlo: los estilos inline
 * le ganan.
 */
export function usePrefersReducedMotion(): boolean {
  const hydrated = useHydrated();
  return useSyncExternalStore(subscribe, () => prefersReducedMotionNow(), () => false) && hydrated;
}
