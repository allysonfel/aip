import { usuarioAtual } from '@/lib/auth';
import { config } from '@/lib/dados';

// Vídeo ao vivo (HLS) do mediamtx, repassado só para quem está logado e só
// com a privacidade desligada (o vídeo cru não tem as cabeças borradas).
const ORIGEM = (process.env.MEDIAMTX_HLS ?? 'http://mediamtx:8888').replace(/\/$/, '');
const AUTH = 'Basic ' + Buffer.from(`${process.env.MEDIAMTX_USUARIO ?? ''}:${process.env.MEDIAMTX_SENHA ?? ''}`).toString('base64');

export async function GET(req: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  if (!(await usuarioAtual())) return new Response('Faça login.', { status: 401 });
  if ((await config()).borrarRostos) return new Response('Vídeo cru desligado: privacidade ativa.', { status: 403 });
  const { caminho } = await params;
  if (caminho.some((p) => p.includes('..'))) return new Response('Caminho inválido.', { status: 400 });
  const busca = new URL(req.url).search; // HLS de baixa latência: ?_HLS_msn=...&_HLS_part=...
  const r = await fetch(`${ORIGEM}/lavateria/${caminho.map(encodeURIComponent).join('/')}${busca}`, { headers: { Authorization: AUTH }, cache: 'no-store' });
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.headers.get('Content-Type') ?? 'application/octet-stream', 'Cache-Control': 'no-store' } });
}
