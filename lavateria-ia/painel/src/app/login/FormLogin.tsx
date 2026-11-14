'use client';

import { useActionState } from 'react';
import { entrar } from './actions';

export default function FormLogin() {
  const [estado, acao, enviando] = useActionState(entrar, { erro: null });
  return (
    <form action={acao} className="rounded border border-outline-variant bg-surface p-6">
      <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        Usuário
        <input name="login" autoComplete="username" required autoFocus className="mt-1.5 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm normal-case tracking-normal text-on-surface" />
      </label>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        Senha
        <input name="senha" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-sm border border-outline-variant bg-surface px-3 py-2 text-sm normal-case tracking-normal text-on-surface" />
      </label>
      {estado.erro && <p role="alert" className="mt-4 text-sm text-error">{estado.erro}</p>}
      <button disabled={enviando} className="mt-6 w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60">
        {enviando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
