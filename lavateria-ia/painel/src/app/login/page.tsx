import { redirect } from 'next/navigation';
import { usuarioAtual } from '@/lib/auth';
import { LogoAIP } from '@/components/Logo';
import FormLogin from './FormLogin';

export default async function Login() {
  if (await usuarioAtual()) redirect('/');
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-dim px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex flex-col items-center">
            <LogoAIP className="h-10 text-on-surface" />
            <span className="mt-[0.55em] whitespace-nowrap text-[6.4px] font-medium uppercase tracking-[0.14em] text-on-surface-variant">Agência de Inteligência Patrimonial</span>
          </span>
          <h1 className="mt-8 text-2xl font-bold text-on-surface">Lavateria Fast Bezerros</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Piloto de IA nas câmeras. Acesso restrito.</p>
        </div>
        <FormLogin />
      </div>
    </main>
  );
}
