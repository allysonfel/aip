// Dados fixos da Feira da Fundac. Posições na planta em fração da imagem
// (u = x / largura, v = y / altura), medidas na foto original de 1280 x 949.
const W = 1280, H = 949;
const p = (x, y) => [+(x / W).toFixed(5), +(y / H).toFixed(5)];

export const PLANTA = {
  arquivo: 'img/planta-transparente.webp',
  arquivoBranco: 'img/planta-restaurada.jpg',
  largura: 2560,
  altura: 1898,
};

// Primeiro encaixe (cantos da imagem: sup. esq., sup. dir., inf. dir., inf. esq.),
// calculado por 7 pontos comuns entre planta e satélite (Blocos A e B,
// Camelódromo, ADM e 3 cantos do terreno). Erro de 2 a 6 m.
export const ENCAIXE_INICIAL = [
  [-8.2927773, -35.973045],
  [-8.2926242, -35.9698028],
  [-8.2950232, -35.9699491],
  [-8.2949995, -35.9728209],
];

export const CENTRO_FEIRA = [-8.29375, -35.97142];

export const PORTOES = [
  { n: '01', pos: p(150, 88) },
  { n: '02', pos: p(382, 93), inicio: true },
  { n: '03', pos: p(600, 90), aprox: true },
  { n: '04', pos: p(812, 82) },
  { n: '05', pos: p(1003, 74) },
  { n: '06', pos: p(1148, 45) },
  { n: '07', pos: p(1113, 567) },
  { n: '08', pos: p(1085, 800) },
  { n: '09', pos: p(830, 810) },
  { n: '10', pos: p(598, 808) },
  { n: '11', pos: p(152, 693) },
  { n: '12', pos: p(137, 397) },
];

export const ROTULOS = [
  { t: 'Rua Rui Limeira Rosal', pos: p(640, 38), c: 'rua-nome' },
  { t: 'Quadra A', pos: p(258, 352), c: 'area' },
  { t: 'Quadra B', pos: p(483, 262), c: 'area' },
  { t: 'Quadra C', pos: p(705, 345), c: 'area' },
  { t: 'Quadra D', pos: p(918, 335), c: 'area' },
  { t: 'Bloco A', pos: p(478, 428), c: 'area' },
  { t: 'Bloco B', pos: p(921, 427), c: 'area' },
  { t: 'Camelódromo', pos: p(752, 581), c: 'area' },
  { t: 'ADM Feira', pos: p(410, 581), c: 'area' },
  { t: 'WC', pos: p(1045, 868), c: 'area' },
  { t: 'Assaí', pos: p(290, 790), c: 'area' },
  { t: 'Estacionamento', pos: p(345, 676), c: 'area' },
  { t: 'Lotes', pos: p(1112, 300), c: 'area' },
  { t: 'V-0', pos: p(118, 70), c: 'vmarco' },
  { t: 'V-1', pos: p(112, 364), c: 'vmarco' },
  { t: 'V-2', pos: p(105, 582), c: 'vmarco' },
  { t: 'V-3', pos: p(103, 626), c: 'vmarco' },
  { t: 'V-14', pos: p(1180, 30), c: 'vmarco' },
];

// Ruas numeradas: a planta tem as ruas 01 a ~41 da esquerda para a direita,
// a cada ~23 px na foto. Os números lidos na foto são pequenos; a posição é
// aproximada (o texto fino da planta, por baixo, é a referência).
export const RUA_X0 = 160, RUA_PASSO = 23;
export const RUAS = [1, 5, 10, 15, 20, 25, 30, 35, 40].map((n) => ({ t: `Rua ${String(n).padStart(2, '0')}`, pos: p(RUA_X0 + RUA_PASSO * (n - 1), 205), c: 'rua' }));

export function ruaPorU(u) {
  const x = u * W;
  return Math.min(42, Math.max(1, Math.round((x - RUA_X0) / RUA_PASSO) + 1));
}
export function quadraPorU(u) {
  const x = u * W;
  if (x < 395) return 'A';
  if (x < 600) return 'B';
  if (x < 835) return 'C';
  return 'D';
}

export const GRUPOS = [
  { id: 'PV', nome: 'PV', borda: '#ffffff' },
  { id: 'Escritório', nome: 'Escritório', borda: '#facc15' },
  { id: 'Feirante', nome: 'Feirante', borda: '#c084fc' },
  { id: 'Nova sugerida', nome: 'Nova sugerida', borda: '#5fd3ff' },
];

export const LOCAIS = [
  ...PORTOES.map((g) => `Portão ${g.n}`),
  'Paraguai', 'Praça de alimentação 1', 'Praça de alimentação 2', 'Camelódromo', 'ADM', 'Comando Presente', 'Escritório',
  'Quadra A', 'Quadra B', 'Quadra C', 'Quadra D', 'Outro',
];

export const SITUACOES = [
  { id: 'funcionando', nome: 'Funcionando', cor: '#22c55e', classe: 'cor-ok' },
  { id: 'parada', nome: 'Parada', cor: '#ff4d4d', classe: 'cor-erro' },
  { id: 'sem sinal', nome: 'Sem sinal', cor: '#ff4d4d', classe: 'cor-erro' },
  { id: 'não sei', nome: 'Não sei', cor: '#9ca3af', classe: '' },
];
export const COR_NOVA = '#3b9bff';

export const TIPOS = ['bullet', 'dome', 'giratória (PTZ)', 'outro', 'não sei'];
export const ABERTURAS = [
  { id: 'estreita', nome: 'Estreita (~40°)', graus: 40 },
  { id: 'media', nome: 'Média (~70°)', graus: 70 },
  { id: 'ampla', nome: 'Ampla (~100°)', graus: 100 },
];
export const ALTURAS = [
  { id: 'baixa', nome: 'Baixa (até 2,5 m)' },
  { id: 'media', nome: 'Média (2,5 a 4 m)' },
  { id: 'alta', nome: 'Alta (acima de 4 m)' },
];
export const ROSTO = ['sim', 'não', 'não sei'];
export const COBRE = ['portão', 'corredor', 'estacionamento', 'box', 'praça', 'carga e descarga', 'outro'];
export const PRIORIDADE = ['sim', 'talvez', 'não'];

export const OUTROS = [
  { id: 'sem_cobertura', nome: 'Ponto sem cobertura', cor: '#fb923c', icone: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#000" stroke-width="2.6"/><path d="M6 18 18 6" stroke="#000" stroke-width="2.6"/></svg>' },
  { id: 'monitoramento', nome: 'Sala de monitoramento / gravador (DVR/NVR)', cor: '#a78bfa', icone: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="11" rx="1.5" fill="none" stroke="#000" stroke-width="2.4"/><path d="M8 20h8M12 16v4" stroke="#000" stroke-width="2.4"/></svg>' },
  { id: 'energia', nome: 'Ponto de energia ou internet', cor: '#facc15', icone: '<svg viewBox="0 0 24 24"><path d="M13 2 5 13h6l-1 9 8-11h-6l1-9Z" fill="#000"/></svg>' },
  { id: 'furto', nome: 'Local de furto relatado', cor: '#f43f5e', icone: '<svg viewBox="0 0 24 24"><path d="M12 4v10" stroke="#000" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="19" r="1.8" fill="#000"/></svg>' },
  { id: 'aglomeracao', nome: 'Área de aglomeração', cor: '#2dd4bf', icone: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3" fill="#000"/><circle cx="16" cy="8" r="3" fill="#000"/><path d="M2 20c0-4 3-6 6-6s6 2 6 6M10 20c0-4 3-6 6-6s6 2 6 6" fill="none" stroke="#000" stroke-width="2.2"/></svg>' },
];

// Lista informada pela administração da Fundac.
export const ESPERADO_PV = [
  ['Portão 01', 2], ['Portão 02', 2], ['Portão 03', 2], ['Portão 04', 2], ['Portão 05', 2], ['Portão 06', 1],
  ['Portão 07', 2], ['Portão 08', 2], ['Portão 09', 2], ['Portão 10', 2], ['Portão 11', 0], ['Portão 12', 2],
  ['Comando Presente', 2], ['Paraguai', 16], ['Escritório', 3, 'Escritório e banheiro'],
  ['Praça de alimentação 1', 8], ['Praça de alimentação 2', 0], ['Camelódromo', 0],
];
export const ESPERADO_GRUPOS = [
  ['Escritório', 19, 'Câmeras do Escritório'],
  ['Feirante', 40, 'Feirantes (a instalar)'],
];
export const TOTAL_INFORMADO = 109;
export const OBS_ADM = 'O monitoramento do Paraguai é feito no próprio Paraguai, e o dos portões no Portão 2 e no Portão 7.';
