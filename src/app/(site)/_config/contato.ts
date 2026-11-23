// Canais diretos de contato. Enquanto estiverem vazios, os botões somem do site.
export const WHATSAPP = ""; // só números, com DDI e DDD. Ex.: 5581999999999
export const EMAIL = "";
export const CIDADE = ""; // cidade e estado exibidos no rodapé. Ex.: Recife, PE
export const INSTAGRAM = "aipbrasil"; // perfil, sem @ (link: instagram.com/<perfil>)

// Endereço público do site (canonical, sitemap, Open Graph). O Railway saiu de uso em 2026-11-12.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aipbrasil.com";
