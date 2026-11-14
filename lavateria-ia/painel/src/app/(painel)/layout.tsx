import { exigirUsuario } from '@/lib/auth';
import { Menu, MenuMovel } from '@/components/Menu';
import { alertasNaoLidos } from '@/lib/dados';

export const dynamic = 'force-dynamic';

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const u = await exigirUsuario();
  const alertas = await alertasNaoLidos();
  return (
    <div className="min-h-screen bg-surface-dim">
      <Menu nome={u.nome} alertas={alertas} />
      <MenuMovel nome={u.nome} alertas={alertas} />
      <main className="pb-24 lg:pl-64 print:pl-0">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
