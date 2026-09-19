import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El repo vive dentro de otra carpeta con su propio package-lock; sin esto
  // Turbopack avisa e intenta usar el lockfile del directorio padre.
  turbopack: { root: __dirname },
  // Las cabeceras de caché de /brand/* viven en vercel.json, junto al resto de
  // la configuración de despliegue. Tenerlas en los dos sitios sólo invita a que
  // se contradigan.
};

export default config;
