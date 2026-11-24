import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // AVIF primeiro: mesma nitidez com arquivos bem menores que JPEG/WebP.
    formats: ['image/avif', 'image/webp'],
    // 85 para as fotos grandes do site; 75 continua sendo o padrão.
    qualities: [75, 85],
  },
  // O painel do Shopping Caruaru fica todo em /shopping-caruaru (login
  // incluso). Os endereços antigos continuam funcionando e levam para lá.
  async redirects() {
    return [
      { source: '/shopping', destination: '/shopping-caruaru', permanent: false },
      { source: '/shopping/:caminho*', destination: '/shopping-caruaru/:caminho*', permanent: false },
      { source: '/login', destination: '/shopping-caruaru/login', permanent: false },
      { source: '/trocar-senha', destination: '/shopping-caruaru/trocar-senha', permanent: false },
      { source: '/sem-acesso', destination: '/shopping-caruaru/sem-acesso', permanent: false },
      // Páginas antigas do site (antes eram páginas com permanentRedirect).
      { source: '/empresas', destination: '/solucoes/shoppings-e-varejo', permanent: true },
      { source: '/setor-publico', destination: '/solucoes/setor-publico', permanent: true },
      { source: '/tecnologia', destination: '/', permanent: true },
      { source: '/solucoes/estacionamentos', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
