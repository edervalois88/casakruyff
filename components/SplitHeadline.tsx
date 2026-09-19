"use client";

import { motion } from "motion/react";
import { EASE, enterProps } from "@/lib/entrance";

/**
 * Titular con revelado por carácter.
 *
 * El titular es el momento tipográfico de la página, así que se compone letra a
 * letra desde un desenfoque: se lee como tinta asentándose, no como un efecto.
 *
 * Accesibilidad: los caracteres animados van ocultos a lectores de pantalla y el
 * texto real vive en un `sr-only`. Así el nombre accesible y el texto que
 * indexan los buscadores son la frase completa, no letras sueltas.
 *
 * Cada letra reserva su ancho desde el primer frame (sólo se animan opacidad,
 * posición y desenfoque), de modo que el titular nunca empuja el resto de la
 * composición mientras se revela.
 *
 * Sin animación se emiten caracteres planos: mismo texto, misma métrica, sin
 * Motion y por tanto sin riesgo de quedarse en opacidad 0.
 */
export function SplitHeadline({
  animating,
  text,
  delay = 1.44,
}: {
  animating: boolean;
  text: string;
  delay?: number;
}) {
  const words = text.split(" ");

  // Escalonado constante sin importar cuántas palabras tenga la frase.
  const step = 0.032;
  let index = 0;

  return (
    <h1 className="headline">
      <span className="sr-only">{text}</span>

      <span aria-hidden="true">
        {words.map((word, w) => (
          <span className="headline__word" key={`${word}-${w}`}>
            {Array.from(word).map((char, c) => {
              const at = delay + index * step;
              index += 1;

              return animating ? (
                <motion.span
                  className="headline__char"
                  key={`${char}-${c}`}
                  {...enterProps(
                    { opacity: 0, y: 16, filter: "blur(7px)" },
                    { opacity: 1, y: 0, filter: "blur(0px)" },
                    { duration: 0.9, delay: at, ease: EASE.silk },
                  )}
                >
                  {char}
                </motion.span>
              ) : (
                <span className="headline__char" key={`${char}-${c}`}>
                  {char}
                </span>
              );
            })}
            {w < words.length - 1 && <span className="headline__space"> </span>}
          </span>
        ))}
      </span>
    </h1>
  );
}
