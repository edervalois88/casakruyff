import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Lato, Montserrat } from "next/font/google";
import { DEFAULT_LOCALE, COPY } from "@/lib/i18n";
import { site } from "@/lib/site";
import "./globals.css";
import "./page.css";

/**
 * Tipografías.
 *
 * `next/font` las descarga en build y las sirve desde el propio dominio: no hay
 * petición a Google en tiempo de ejecución, así que desaparecen el salto de
 * layout y la dependencia de un tercero.
 *
 * Cormorant Garamond es la Opción 2 del brand book y la que el propio manual usa
 * en sus aplicables (logotipo y packaging). Montserrat Thin reproduce el
 * registro que el estudio eligió para las etiquetas micro del documento.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  variable: "--font-lato",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: COPY[DEFAULT_LOCALE].title,
  description: site.description[DEFAULT_LOCALE],
  applicationName: site.name,
  alternates: {
    canonical: "/",
    languages: { es: "/", en: "/" },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: COPY[DEFAULT_LOCALE].title,
    description: site.description[DEFAULT_LOCALE],
    url: site.url,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    images: [
      {
        url: "/brand/lockup-share.png",
        width: 1200,
        height: 630,
        alt: "Casa Kruyff",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: COPY[DEFAULT_LOCALE].title,
    description: site.description[DEFAULT_LOCALE],
    images: ["/brand/lockup-share.png"],
  },
  icons: {
    icon: [{ url: "/brand/icon-512.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/brand/icon-512.png", sizes: "512x512" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#36281F",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // El HTML se sirve en español, el idioma base. Quien tenga otro idioma
    // guardado o un navegador en inglés lo corrige el proveedor de idioma.
    <html lang={DEFAULT_LOCALE} className={`${cormorant.variable} ${lato.variable} ${montserrat.variable}`}>
      <head>
        {/* Marca que hay JS antes del primer pintado. Todo lo que se anima
            arranca visible y sólo se oculta si este script corrió; así, sin
            JavaScript, la página se lee completa en lugar de quedar en blanco. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js');`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
