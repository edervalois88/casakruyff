import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El repo vive dentro de otra carpeta con su propio package-lock; sin esto
  // Turbopack avisa e intenta usar el lockfile del directorio padre.
  turbopack: { root: __dirname },
  async headers() {
    return [
      {
        // Los assets de marca son inmutables: llevan hash de contenido
        // implícito en el nombre del archivo generado por el pipeline.
        source: "/brand/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default config;
