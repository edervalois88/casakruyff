/**
 * Datos de contacto del sitio.
 *
 * ── LO ÚNICO QUE HAY QUE EDITAR ───────────────────────────────────────────
 * Los valores marcados como PENDIENTE siguen siendo marcadores: en la página
 * aparecen con subrayado punteado dorado. Reemplázalos y desaparecen.
 *
 * Si un valor queda en `null`, ese enlace NO se renderiza. Es preferible a
 * mostrar un enlace roto o un dato falso.
 */

export type Contact = {
  email: string | null;
  whatsapp: string | null;
  whatsappMessage: string;
  instagram: string | null;
  /** URL que acepte POST de formulario. Si es null, la lista de espera abre el correo. */
  waitlistEndpoint: string | null;
};

/** Marca un valor como pendiente de confirmar por el cliente. */
export const PENDING = Symbol("pending");

const raw: Contact = {
  /** PENDIENTE: correo real */
  email: null,
  /** PENDIENTE: número real, formato internacional, sólo dígitos */
  whatsapp: null,
  whatsappMessage: "Hola, me interesa conocer Casa Kruyff.",
  /** PENDIENTE: usuario real, sin @ */
  instagram: null,
  /** PENDIENTE (opcional): Formspree, Basin o endpoint propio */
  waitlistEndpoint: null,
};

export const contact = raw;

export const site = {
  name: "Casa Kruyff",
  domain: "casakruyff.com",
  url: "https://casakruyff.com",
  location: {
    es: "Lomas de Chapultepec, Ciudad de México",
    en: "Lomas de Chapultepec, Mexico City",
  },
  description: {
    es: "Casa Kruyff, casa de diseño y curaduría de interiores. Estamos componiendo el sitio.",
    en: "Casa Kruyff, a house of design and interior curation. The site is being composed.",
  },
} as const;

/** ¿Hay algún dato de contacto real todavía? */
export const hasContact = Boolean(contact.email || contact.whatsapp || contact.instagram);
