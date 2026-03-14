import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido 'output: export' para permitir funcionalidades de servidor
  // como middleware, API routes com autenticação, etc.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
