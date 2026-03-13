import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/mi-restaurante-2', // La ruta que ya tienes funcionando
        permanent: true,
      },
    ];
  },
};

export default nextConfig;