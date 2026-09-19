"use client";

import { motion } from "motion/react";
import { contact, site } from "@/lib/site";
import { useLanguage } from "@/components/LanguageProvider";
import { EASE, enterProps } from "@/lib/entrance";

/**
 * Pie de página.
 *
 * Los datos de contacto se renderizan sólo si existen. Un dato ausente se
 * muestra como campo pendiente marcado en dorado: es información útil para
 * quien administra el sitio, no un enlace roto para quien lo visita.
 */
export function Footer({ animating = true }: { animating?: boolean }) {
  const { t, locale } = useLanguage();

  const digits = (contact.whatsapp ?? "").replace(/\D/g, "");
  const instagram = (contact.instagram ?? "").replace(/^@/, "");

  const links = [
    contact.email
      ? { key: "email", label: contact.email, href: `mailto:${contact.email}` }
      : { key: "email", label: t.footEmail, pending: true },
    digits
      ? {
          key: "whatsapp",
          label: t.footWhatsapp,
          href:
            `https://wa.me/${digits}` +
            (contact.whatsappMessage
              ? `?text=${encodeURIComponent(contact.whatsappMessage)}`
              : ""),
        }
      : { key: "whatsapp", label: t.footWhatsapp, pending: true },
    instagram
      ? { key: "instagram", label: `@${instagram}`, href: `https://instagram.com/${instagram}` }
      : { key: "instagram", label: t.footInstagram, pending: true },
  ];

  const Foot = animating ? motion.footer : "footer";
  const footMotion = animating
    ? enterProps(
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0 },
        { duration: 1.5, delay: 1.94, ease: EASE.silk },
      )
    : {};

  return (
    <Foot className="foot" {...footMotion}>
      <span className="foot__place">{site.location[locale]}</span>

      <span className="foot__links">
        {links.map((link) =>
          "href" in link && link.href ? (
            <a
              key={link.key}
              href={link.href}
              {...(link.key === "email" ? {} : { target: "_blank", rel: "noopener" })}
            >
              {link.label}
            </a>
          ) : (
            <span key={link.key} className="foot__pending">
              {link.label}
              <em className="foot__todo">{t.pending}</em>
            </span>
          ),
        )}
      </span>

      <span className="foot__copy">
        © {new Date().getFullYear()} {site.name}
      </span>
    </Foot>
  );
}
