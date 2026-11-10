import 'server-only';

// Liga e desliga o motor de visão (serviço `visao-ia` no Railway) pela tela de
// Configurações. Ele fica DESLIGADO no dia a dia (custa CPU e memória 24 h) e é
// ligado só para demonstração.
//
// Variáveis no serviço do painel (Railway):
//   RAILWAY_MOTOR_TOKEN       token do projeto (Project Settings > Tokens), ambiente production
//   RAILWAY_MOTOR_SERVICE_ID  id do serviço visao-ia
//   RAILWAY_ENVIRONMENT_ID    o Railway já injeta sozinho
//
// Ligar = republicar a última publicação do motor (mesma imagem, sem build).
// Desligar = remover a publicação ativa (igual a `railway down`).

const API = 'https://backboard.railway.com/graphql/v2';

export type EstadoMotor = 'ligado' | 'ligando' | 'desligado' | 'sem_configuracao' | 'erro';

function config() {
  const token = process.env.RAILWAY_MOTOR_TOKEN;
  const servico = process.env.RAILWAY_MOTOR_SERVICE_ID;
  const ambiente = process.env.RAILWAY_ENVIRONMENT_ID;
  return token && servico && ambiente ? { token, servico, ambiente } : null;
}

async function gql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Project-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await r.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!r.ok || j.errors?.length || !j.data) {
    // Detalhe só no log do servidor; a tela recebe mensagem genérica.
    console.error('[motor] Railway respondeu', r.status, j.errors?.map((e) => e.message).join('; '));
    throw new Error('railway');
  }
  return j.data;
}

type Dep = { id: string; status: string; createdAt: string };

async function ultimas(c: NonNullable<ReturnType<typeof config>>, n = 5): Promise<Dep[]> {
  const d = await gql<{ deployments: { edges: { node: Dep }[] } }>(
    c.token,
    'query($s:String!,$e:String!,$n:Int!){deployments(first:$n,input:{serviceId:$s,environmentId:$e}){edges{node{id status createdAt}}}}',
    { s: c.servico, e: c.ambiente, n },
  );
  return d.deployments.edges.map((e) => e.node);
}

const ATIVO = ['SUCCESS', 'SLEEPING'];
const SUBINDO = ['QUEUED', 'WAITING', 'INITIALIZING', 'BUILDING', 'DEPLOYING'];

export async function estadoMotor(): Promise<{ estado: EstadoMotor; desde: string | null }> {
  const c = config();
  if (!c) return { estado: 'sem_configuracao', desde: null };
  try {
    const [d] = await ultimas(c, 1);
    if (!d) return { estado: 'desligado', desde: null };
    if (ATIVO.includes(d.status)) return { estado: 'ligado', desde: d.createdAt };
    if (SUBINDO.includes(d.status)) return { estado: 'ligando', desde: d.createdAt };
    return { estado: 'desligado', desde: null };
  } catch {
    return { estado: 'erro', desde: null };
  }
}

export async function ligarMotor(): Promise<void> {
  const c = config();
  if (!c) throw new Error('sem_configuracao');
  const deps = await ultimas(c);
  if (deps[0] && (ATIVO.includes(deps[0].status) || SUBINDO.includes(deps[0].status))) return; // já está ligado ou subindo
  const base = deps[0];
  if (!base) throw new Error('sem_publicacao');
  await gql(c.token, 'mutation($id:String!){deploymentRedeploy(id:$id){id}}', { id: base.id });
}

export async function desligarMotor(): Promise<void> {
  const c = config();
  if (!c) throw new Error('sem_configuracao');
  for (const d of await ultimas(c)) {
    if (ATIVO.includes(d.status) || SUBINDO.includes(d.status)) await gql(c.token, 'mutation($id:String!){deploymentRemove(id:$id)}', { id: d.id });
  }
}
