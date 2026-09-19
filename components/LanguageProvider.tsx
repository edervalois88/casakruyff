"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { COPY, DEFAULT_LOCALE, LOCALES, type Copy, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";

const STORAGE_KEY = "kx-lang";

type LanguageValue = {
  locale: Locale;
  t: Copy;
  setLocale: (next: Locale) => void;
};

const LanguageContext = createContext<LanguageValue | null>(null);

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Idioma del sitio.
 *
 * El HTML se renderiza siempre en español (idioma base, el que leen los
 * buscadores y quien llega sin JS). Si el visitante ya eligió otro idioma, o su
 * navegador viene en inglés, se corrige en el primer efecto.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let next: Locale = DEFAULT_LOCALE;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(saved)) {
        next = saved;
      } else if (!(navigator.language ?? "").toLowerCase().startsWith("es")) {
        next = "en";
      }
    } catch {
      // Modo privado o almacenamiento bloqueado: se queda en el idioma base.
    }

    setLocaleState(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = COPY[locale].title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", site.description[locale]);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin persistencia: el cambio vale para esta visita.
    }
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({ locale, t: COPY[locale], setLocale }),
    [locale, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage debe usarse dentro de <LanguageProvider>");
  return value;
}
