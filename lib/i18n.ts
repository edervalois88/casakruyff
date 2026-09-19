/**
 * Textos bilingües.
 *
 * Voz y tono según el brand book: elegante, segura, culta, cercana, selectiva,
 * inspiradora / sereno, refinado, evocador, sensorial, cálido, discreto.
 * Español mexicano natural; nada de urgencia comercial ni signos de exclamación.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export type Copy = {
  skip: string;
  topmark: string;
  langLabel: string;
  eyebrow: string;
  headline: string;
  body: string;
  formLabel: string;
  formCta: string;
  formPlaceholder: string;
  noteInvalid: string;
  noteSending: string;
  noteOk: string;
  noteMailto: string;
  noteError: string;
  noteUnconfigured: string;
  footEmail: string;
  footWhatsapp: string;
  footInstagram: string;
  pending: string;
  title: string;
};

export const COPY: Record<Locale, Copy> = {
  es: {
    skip: "Ir al contenido",
    topmark: "Diseño y curaduría de interiores",
    langLabel: "Idioma",
    eyebrow: "Sitio en preparación",
    headline: "Estamos componiendo la casa",
    body: "Reunimos piezas excepcionales, talento internacional y una mirada estética atemporal para crear espacios con identidad. Muy pronto podrás recorrer nuestra curaduría completa.",
    formLabel: "Recibe el aviso de apertura",
    formCta: "Avisarme",
    formPlaceholder: "tu@correo.com",
    noteInvalid: "Escribe un correo válido, por favor.",
    noteSending: "Enviando…",
    noteOk: "Gracias. Te escribiremos en cuanto abramos.",
    noteMailto: "Abrimos tu correo con el mensaje listo para enviar.",
    noteError: "No pudimos registrar tu correo. Intenta de nuevo o escríbenos directamente.",
    noteUnconfigured: "La lista de espera se activa en cuanto definamos el destino de los correos.",
    footEmail: "Correo",
    footWhatsapp: "WhatsApp",
    footInstagram: "Instagram",
    pending: "pendiente",
    title: "Casa Kruyff — En preparación",
  },
  en: {
    skip: "Skip to content",
    topmark: "Design and interior curation",
    langLabel: "Language",
    eyebrow: "Site in preparation",
    headline: "We are composing the house",
    body: "We bring together exceptional pieces, international talent and a timeless aesthetic vision to create spaces with identity. Our full curation will open to you very soon.",
    formLabel: "Be notified at opening",
    formCta: "Notify me",
    formPlaceholder: "you@email.com",
    noteInvalid: "Please enter a valid email address.",
    noteSending: "Sending…",
    noteOk: "Thank you. We will write as soon as we open.",
    noteMailto: "We opened your mail app with the message ready to send.",
    noteError: "We could not register your email. Please try again or write to us directly.",
    noteUnconfigured: "The waitlist switches on once we decide where the emails should go.",
    footEmail: "Email",
    footWhatsapp: "WhatsApp",
    footInstagram: "Instagram",
    pending: "pending",
    title: "Casa Kruyff — In preparation",
  },
};
