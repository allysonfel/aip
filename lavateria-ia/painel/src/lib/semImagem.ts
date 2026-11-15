/** Imagem neutra quando o recorte já foi apagado na limpeza diária da meia-noite. */
export function semImagem(): Response {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200"><rect width="160" height="200" fill="#1f2125"/><text x="80" y="92" fill="#9aa0a6" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">imagem apagada</text><text x="80" y="110" fill="#9aa0a6" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">na limpeza diária</text></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, max-age=3600' } });
}
