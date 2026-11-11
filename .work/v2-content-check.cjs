// Confere que nenhum conteúdo factual se perdeu na reconstrução e que os
// pedidos do cliente foram atendidos. Uso: node .work/v2-content-check.cjs [index.html]
const fs = require('node:fs');
const path = require('node:path');
const file = path.resolve(__dirname, '..', process.argv[2] || 'index.html');
const html = fs.readFileSync(file, 'utf8');
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .toLowerCase();
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const textN = norm(text);

const must = {
  identidade: ['Brasil Vita', 'desde 1981', 'Clínica de Olhos'],
  endereco: ['Av. Brigadeiro Faria Lima, 1597', '9º andar', 'Conjunto 902', 'Jardim Paulistano', '01452-917'],
  horario: ['8h às 19h', '8h às 12h', 'Segunda a sexta', 'Sábado'],
  contato: ['(11) 3813-1200', '(11) 3813-1596', 'cbrasilvita@gmail.com'],
  especialidades: ['Catarata', 'Cirurgia refrativa', 'Córnea e patologia externa', 'Estrabismo', 'Glaucoma', 'Lentes de contato', 'Oftalmopediatria', 'Órbita', 'Plástica ocular estética', 'Plástica ocular reconstrutiva', 'Segmento posterior', 'Vias lacrimais'],
  exames: ['Ceratoscopia computadorizada', 'Paquimetria ultrassônica', 'Microscopia especular', 'Tonometria de aplanação', 'Curva tensional diária', 'Gonioscopia', 'Mapeamento de retina', 'Fundoscopia', 'Exame de motilidade ocular', 'Teste ortóptico', 'Acuidade visual com laser (PAM)', 'Teste de adaptação de lentes de contato', 'Biometria ultrassônica'],
  equipe: ['Dra. Célia', 'Dr. Maurício', 'Dr. Orlando', 'Dr. Paulo', 'Dr. João Brasil', 'Estrabismo e Oftalmopediatria', 'Retina e Vítreo', 'Córnea e Cirurgia Refrativa'],
  formacao: [
    'Graduação em Ciências Médicas — PUC-SP', 'Mestrado em Oftalmologia — UNIFESP', 'Residência médica — Faculdade de Medicina de Jundiaí', 'Coordenadora do Núcleo de Oftalmopediatria da UNIFESP', 'Chefe do Setor de Baixa Visão e Reabilitação Visual da UNIFESP', 'Membro do corpo editorial da Oftalmonews',
    'Graduação em Medicina — PUC-SP', 'Subespecialização em segmento posterior, retina, vítreo e ultrassom ocular', 'Especialização em Oftalmologia — Faculdade de Medicina de Jundiaí', 'Título de Especialista pelo Conselho Brasileiro de Oftalmologia (CBO)', 'Especialização em Retina e Vítreo — UNIFESP', 'Médico voluntário do setor de Retina e Vítreo da UNIFESP', 'Oftalmologista do Instituto de Infectologia Emílio Ribas',
    'Graduação em Medicina — Faculdade de Medicina de Jundiaí', 'Especialização em patologia externa e córnea — UNIFESP', 'Especialização em Oftalmologia — Mogi das Cruzes', 'Especialização em Cirurgia Refrativa — UNIFESP', 'Oftalmologista do Instituto de Olhos de Mogi das Cruzes', '@drorlandooftalmo',
    'Graduação em Medicina — Faculdade de Medicina de Santo Amaro', 'Chefe do setor de Órbita do Hospital São Paulo — UNIFESP', 'Coordenador do Pronto-Socorro de Oftalmologia do Hospital São Paulo — UNIFESP', 'Professor Assistente da Disciplina de Oftalmologia', 'Responsável pelo Setor de Órbita da Faculdade de Medicina de Jundiaí',
    'Especialização em Glaucoma e Catarata — UNIFESP', 'Mestre em Oftalmologia — UNIFESP', 'Doutorado — Universidade da Califórnia, Irvine (UCI)',
  ],
  convenios: ['Amil', 'Amafresp', 'Bradesco', 'Cabesp', 'Cassi', 'Economus', 'Fundação Saúde Itaú', 'Porto Seguro', 'Gama', 'Hapvida', 'Mediservice', 'Omint', 'Proasa', 'Sulamérica', 'Total Medcare'],
  estrutura: ['Quatro consultórios', 'Sala de exames', 'Sala de espera climatizada', 'Auto refrator', 'Topógrafo de córnea', 'Lensômetro digital'],
  prova: ['UNIFESP', 'Hospital São Paulo', 'Emílio Ribas', 'CBO', 'Irvine'],
  // DESATIVADO em 11/11/2026 a pedido da clínica: a linha "Responsável técnico:
  // Dr(a). [nome] — CRM-SP [número]" foi removida do rodapé do index.html porque
  // estava no ar com os marcadores por preencher. O CFM (Res. 1.974/2011) pede o
  // responsável técnico e o CRM no site da clínica: quando tiverem o nome e o
  // número, repor a linha no rodapé e descomentar a regra abaixo.
  // rodape: ['Responsável técnico'],
  cirurgias: ['Entenda a cirurgia', 'LASIK', 'PRK', 'Crosslinking', 'Ver o crosslinking'],
};
const mustNot = {
  'centro cirúrgico (cliente não tem)': ['centro cirúrgico', 'centro cirurgico'],
  'convênios antigos removidos': ['Afresp', 'Classes Laboriosas', 'CNEN', 'Emgepron', 'Adventista', 'Marítima', 'Medial', 'NotreDame', 'Plasac', 'Sabesprev', 'Unibanco'],
  'ícone/convite para enviar perguntas': ['Vamos conversar?', 'Conversar com a clínica', 'Consultar sobre um exame', 'Falar sobre meu convênio', 'tirar dúvidas', 'envie sua pergunta', 'mande sua dúvida'],
  'CFM: depoimento/promessa/preço': ['depoimento', 'garantimos', 'garantia de', 'R$', 'antes e depois', 'melhor clínica'],
  'regra do projeto': ['scroll-behavior:smooth', 'scroll-behavior: smooth'],
};
let ok = true;
for (const [group, items] of Object.entries(must)) {
  const missing = items.filter(i => !textN.includes(norm(i)));
  if (missing.length) { ok = false; console.log(`FALTA [${group}]: ${missing.join(' | ')}`); }
  else console.log(`ok   [${group}] ${items.length} itens`);
}
for (const [group, items] of Object.entries(mustNot)) {
  const found = items.filter(i => (i.includes('scroll-behavior') ? html.replace(/\s/g, '').includes(i.replace(/\s/g, '')) : new RegExp('(^|[^a-z])' + norm(i).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])').test(textN)));
  if (found.length) { ok = false; console.log(`INDEVIDO [${group}]: ${found.join(' | ')}`); }
  else console.log(`ok   [${group}] nada encontrado`);
}
// "Entenda a cirurgia": os textos ficam em data/cirurgias.js
const dataFile = path.resolve(__dirname, '..', 'data', 'cirurgias.js');
if (fs.existsSync(dataFile)) {
  const box = { window: {} };
  require('node:vm').runInNewContext(fs.readFileSync(dataFile, 'utf8'), box);
  const D = box.window.BV_CIRURGIAS;
  const textos = norm(JSON.stringify(D));
  const promessas = ['visao perfeita', 'sem risco', 'risco zero', 'garant', '100%', 'definitiv', 'indolor', 'sem dor', 'milagr', 'nunca mais', 'livre dos oculos', 'adeus aos oculos'];
  const achou = promessas.filter(p => textos.includes(p));
  if (achou.length) { ok = false; console.log(`INDEVIDO [cirurgias: promessa de resultado]: ${achou.join(' | ')}`); }
  else console.log('ok   [cirurgias: sem promessa de resultado] nada encontrado');
  const legenda = 'Ilustração esquemática com finalidade educativa. A indicação de cirurgia depende de avaliação oftalmológica.';
  if (D.legenda !== legenda) { ok = false; console.log('FALTA [cirurgias: legenda exata embaixo da ilustração]'); }
  else console.log('ok   [cirurgias: legenda]');
  const faltando = ['catarata', 'lasik', 'prk', 'crosslinking'].filter(k => !(D.cirurgias[k] && D.cirurgias[k].etapas && D.cirurgias[k].etapas.length === 6 && D.cirurgias[k].etapas.every(e => e.titulo && e.texto)));
  if (faltando.length) { ok = false; console.log(`FALTA [cirurgias: 6 etapas com título e texto]: ${faltando.join(' | ')}`); }
  else console.log('ok   [cirurgias: catarata, LASIK, PRK e crosslinking com 6 etapas cada]');
} else { ok = false; console.log('FALTA [cirurgias: data/cirurgias.js]'); }

const wa = (html.match(/api\.whatsapp\.com|wa\.me/g) || []).length;
const tel = (html.match(/href="tel:/g) || []).length;
console.log(`links: tel ${tel} · whatsapp ${wa}`);
console.log(ok ? 'CONTEÚDO OK' : 'CONTEÚDO COM PROBLEMAS');
process.exit(ok ? 0 : 1);
