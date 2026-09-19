"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { contact } from "@/lib/site";
import { useLanguage } from "@/components/LanguageProvider";
import { EASE, enterProps } from "@/lib/entrance";

type State = "idle" | "invalid" | "sending" | "ok" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Lista de espera.
 *
 * Dos modos, y la diferencia se comunica con honestidad:
 *
 *  - Sin `waitlistEndpoint`, el formulario abre el correo del visitante con el
 *    mensaje ya escrito. Funciona hoy sin configurar nada.
 *  - Con endpoint, envía por POST y confirma en la propia página.
 *
 * Nunca dice «gracias» si el correo no llegó a ningún lado.
 */
export function Waitlist({ animating = true }: { animating?: boolean }) {
  const { t, locale } = useLanguage();
  const [state, setState] = useState<State>("idle");
  const [value, setValue] = useState("");

  const message = {
    idle: "",
    invalid: t.noteInvalid,
    sending: t.noteSending,
    ok: contact.waitlistEndpoint ? t.noteOk : t.noteMailto,
    error: t.noteError,
  }[state];

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = value.trim();

    if (!EMAIL.test(email)) {
      setState("invalid");
      return;
    }

    if (!contact.waitlistEndpoint) {
      const subject = locale === "en" ? "Waitlist — Casa Kruyff" : "Lista de espera — Casa Kruyff";
      const body = `Correo: ${email}\n`;
      window.location.href =
        `mailto:${contact.email ?? ""}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
      setState("ok");
      setValue("");
      return;
    }

    setState("sending");
    try {
      const data = new FormData();
      data.append("email", email);
      data.append("origen", "casakruyff/construccion");

      const res = await fetch(contact.waitlistEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setState("ok");
      setValue("");
    } catch {
      setState("error");
    }
  }

  // `animating` decide si se monta la versión con Motion. Ver
  // `components/Reveal.tsx` para el porqué: un `opacity: 0` inicial que nunca se
  // anima deja el formulario invisible.
  const Form = animating ? motion.form : "form";
  const formMotion = animating
    ? enterProps(
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0 },
        { duration: 1.5, delay: 1.78, ease: EASE.silk },
      )
    : {};

  return (
    <Form className="waitlist" onSubmit={onSubmit} noValidate {...formMotion}>
      <label className="waitlist__label" htmlFor="email">
        {t.formLabel}
      </label>

      <div className="waitlist__row" data-state={state}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          required
          placeholder={t.formPlaceholder}
          aria-describedby="form-note"
          aria-invalid={state === "invalid" || state === "error"}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (state === "invalid" || state === "error") setState("idle");
          }}
        />

        <button type="submit" disabled={state === "sending"}>
          {t.formCta}
        </button>
      </div>

      {/* La nota entra y sale con AnimatePresence: el alto no salta porque el
          contenedor tiene una altura mínima reservada. */}
      <div className="waitlist__note" id="form-note" role="status" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: EASE.luxury }}
            data-state={state}
          >
            {message}
          </motion.span>
        </AnimatePresence>
      </div>
    </Form>
  );
}
