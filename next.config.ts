import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AVIF primeiro: mesma nitidez com arquivos bem menores que JPEG/WebP.
    formats: ['image/avif', 'image/webp'],
    // 85 para as fotos grandes do site; 75 continua sendo o padrão.
    qualities: [75, 85],
  },
};

export default nextConfig;
