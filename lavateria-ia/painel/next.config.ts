import type { NextConfig } from 'next';

// O painel mora em aipbrasil.com/lavateria (o Coolify manda esse caminho
// para este app; o resto do domínio continua no site da AIP).
const nextConfig: NextConfig = {
  basePath: '/lavateria',
  poweredByHeader: false,
};

export default nextConfig;
