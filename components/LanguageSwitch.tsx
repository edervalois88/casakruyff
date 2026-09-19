"use client";

import { motion } from "motion/react";
import { LOCALES, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/LanguageProvider";

const LABEL: Record<Locale, string> = { es: "ES", en: "EN" };
const FULL: Record<Locale, string> = { es: "Español", en: "English" };

/**
 * Selector de idioma.
 *
 * La pastilla dorada se desliza entre las dos opciones con un resorte contenido
 * (`layoutId`), así el cambio se lee como un solo objeto que se mueve en vez de
 * dos que se encienden y apagan.
 */
export function LanguageSwitch() {
  const { locale, t, setLocale } = useLanguage();

  return (
    <div className="lang" role="group" aria-label={t.langLabel}>
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            className="lang__btn"
            lang={code}
            aria-pressed={active}
            onClick={() => setLocale(code)}
          >
            <span className="lang__label">{LABEL[code]}</span>
            <span className="sr-only"> — {FULL[code]}</span>

            {active && (
              <motion.span
                className="lang__pill"
                aria-hidden="true"
                layoutId="lang-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.6 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
