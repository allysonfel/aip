// Cria/atualiza o schema e o administrador quando o servidor sobe.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.DATABASE_URL) return;
  const { garantirSchema } = await import('./lib/schema');
  for (let tentativa = 1; tentativa <= 10; tentativa++) {
    try {
      await garantirSchema();
      console.log('[painel] schema pronto');
      return;
    } catch (e) {
      console.error(`[painel] schema: tentativa ${tentativa} falhou:`, e instanceof Error ? e.message : e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}
