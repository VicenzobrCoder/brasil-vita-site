/* ============================================================
   TEXTOS DA SEÇÃO "ENTENDA A CIRURGIA"
   ------------------------------------------------------------
   Este é o único lugar onde ficam os textos das animações de
   catarata, LASIK, PRK e crosslinking. O desenho e o movimento ficam em outro
   arquivo (assets/cirurgias.js) e não precisam ser tocados.

   COMO EDITAR
   - Mude só o que está entre aspas simples ('...').
   - Não apague as aspas, as vírgulas nem os nomes antes dos
     dois-pontos (titulo:, texto:, aba: ...).
   - Se o texto tiver apóstrofo, escreva \' (barra e apóstrofo).
   - Cada cirurgia tem 6 etapas, cada uma ligada a uma cena do
     desenho. Dá para reescrever os textos à vontade, mas não
     acrescentar nem tirar etapas.
   - Regra do CFM: nada de prometer resultado ("visão perfeita",
     "sem riscos", "garantido"). O tom é só informativo.

   SITUAÇÃO: todos os textos aguardam a revisão da Dra. Célia.
   ============================================================ */

window.BV_CIRURGIAS = {

  // Aparece embaixo de cada ilustração.
  legenda: 'Ilustração esquemática com finalidade educativa. A indicação de cirurgia depende de avaliação oftalmológica.',

  // Botão embaixo de cada ilustração (abre o WhatsApp da clínica).
  botao: 'Agendar avaliação',

  // Palavras dos controles.
  controles: {
    anterior: 'Anterior',
    proxima: 'Próxima',
    deNovo: 'Ver de novo',
    etapa: 'Etapa',
    de: 'de',
    irPara: 'Ir para a etapa'
  },

  cirurgias: {

    // ---------------------------------------------------------
    catarata: {
      aba: 'Catarata',
      titulo: 'Cirurgia de catarata',
      resumo: 'O cristalino que ficou opaco é retirado e substituído por uma lente artificial.',
      whatsapp: 'Olá, gostaria de agendar uma avaliação de catarata.',
      ilustracao: {
        titulo: 'Olho visto de lado, em corte',
        descricao: 'Desenho esquemático do olho visto de lado, com córnea, íris, cristalino dentro da cápsula e retina. As etapas mostram a troca do cristalino opaco por uma lente intraocular.'
      },
      // Nomes que aparecem dentro do desenho.
      rotulos: {
        cornea: 'Córnea',
        iris: 'Íris',
        cristalino: 'Cristalino',
        capsula: 'Cápsula',
        lente: 'Lente intraocular',
        retina: 'Retina',
        frente: 'Vista de frente'
      },
      etapas: [
        {
          titulo: 'O olho com catarata',
          texto: 'O cristalino, a lente natural do olho, fica opaco, e a luz chega embaçada à retina.'
        },
        {
          titulo: 'Anestesia e microincisão',
          texto: 'Com colírio anestésico, é feita uma pequena incisão na borda da córnea.'
        },
        {
          titulo: 'Abertura da cápsula',
          texto: 'Uma abertura circular é feita na cápsula que envolve o cristalino.'
        },
        {
          titulo: 'Remoção do cristalino',
          texto: 'Com ultrassom, o cristalino opaco é fragmentado e aspirado.'
        },
        {
          titulo: 'Implante da lente',
          texto: 'Uma lente intraocular dobrável é inserida e se abre dentro da cápsula.'
        },
        {
          titulo: 'Fim do procedimento',
          texto: 'A incisão se fecha sozinha, geralmente sem pontos, e a luz volta a passar por uma lente transparente.'
        }
      ]
    },

    // ---------------------------------------------------------
    lasik: {
      aba: 'LASIK',
      titulo: 'Cirurgia refrativa: LASIK',
      resumo: 'O laser corrige a curvatura da córnea por baixo de uma lamela fina, que depois volta ao lugar.',
      whatsapp: 'Olá, gostaria de agendar uma avaliação para cirurgia refrativa (LASIK ou PRK).',
      ilustracao: {
        titulo: 'Córnea vista em corte, com o olho inteiro embaixo',
        descricao: 'Desenho esquemático da córnea em corte, com o epitélio por cima e o estroma por baixo. Embaixo, um olho inteiro mostra onde a luz forma o foco. As etapas mostram a lamela sendo criada e levantada, o laser corrigindo a curvatura e a lamela voltando ao lugar.'
      },
      rotulos: {
        corte: 'Córnea,',
        corte2: 'vista em corte',
        epitelio: 'Epitélio',
        estroma: 'Estroma',
        olho: 'Olho inteiro',
        antes1: 'foco antes',
        antes2: 'da retina',
        depois1: 'foco na',
        depois2: 'retina'
      },
      etapas: [
        {
          titulo: 'Por que corrigir',
          texto: 'Na miopia, hipermetropia ou astigmatismo, a curvatura da córnea faz a luz focar fora da retina.'
        },
        {
          titulo: 'Anestesia',
          texto: 'O olho é anestesiado com colírio.'
        },
        {
          titulo: 'Criação do flap',
          // [CONFIRMAR COM A DRA. CÉLIA: femtossegundo ou microcerátomo]
          // Se a clínica usar microcerátomo, troque por:
          // 'Um instrumento de precisão, o microcerátomo, cria uma lamela fina na superfície da córnea.'
          texto: 'Um laser de femtossegundo cria uma lamela fina na superfície da córnea.'
        },
        {
          titulo: 'Flap levantado',
          texto: 'A lamela é levantada, como a página de um livro, expondo a camada interna da córnea.'
        },
        {
          titulo: 'Correção com excimer laser',
          texto: 'O excimer laser remodela a curvatura da córnea de acordo com o grau.'
        },
        {
          titulo: 'Reposicionamento',
          texto: 'A lamela volta ao lugar e adere naturalmente, sem pontos.'
        }
      ]
    },

    // ---------------------------------------------------------
    prk: {
      aba: 'PRK',
      titulo: 'Cirurgia refrativa: PRK',
      resumo: 'O laser corrige a curvatura direto na superfície da córnea, depois de retirar o epitélio, que volta a crescer.',
      whatsapp: 'Olá, gostaria de agendar uma avaliação para cirurgia refrativa (LASIK ou PRK).',
      ilustracao: {
        titulo: 'Córnea vista em corte, com o olho inteiro embaixo',
        descricao: 'O mesmo desenho da córnea usado no LASIK. As etapas mostram o epitélio sendo retirado, o laser corrigindo a curvatura na superfície, a lente de contato de proteção e o epitélio crescendo de novo.'
      },
      rotulos: {
        corte: 'Córnea,',
        corte2: 'vista em corte',
        epitelio: 'Epitélio',
        estroma: 'Estroma',
        olho: 'Olho inteiro',
        antes1: 'foco antes',
        antes2: 'da retina',
        depois1: 'foco na',
        depois2: 'retina'
      },
      etapas: [
        {
          titulo: 'Por que corrigir',
          texto: 'Na miopia, hipermetropia ou astigmatismo, a curvatura da córnea faz a luz focar fora da retina.'
        },
        {
          titulo: 'Anestesia',
          texto: 'O olho é anestesiado com colírio.'
        },
        {
          titulo: 'Remoção do epitélio',
          texto: 'A camada mais superficial da córnea, o epitélio, é removida.'
        },
        {
          titulo: 'Correção com excimer laser',
          texto: 'O excimer laser remodela a curvatura da córnea diretamente na superfície.'
        },
        {
          titulo: 'Lente de proteção',
          texto: 'Uma lente de contato terapêutica é colocada para proteger o olho.'
        },
        {
          titulo: 'Regeneração',
          texto: 'Nos dias seguintes, o epitélio se regenera naturalmente.'
        }
      ]
    },

    // ---------------------------------------------------------
    // Acrescentado em 09/10/2026, a pedido da clínica.
    crosslinking: {
      aba: 'Crosslinking',
      titulo: 'Crosslinking: tratamento do ceratocone',
      resumo: 'Um colírio de vitamina B2 e luz ultravioleta criam novas ligações entre as fibras da córnea, com o objetivo de frear o avanço do ceratocone.',
      whatsapp: 'Olá, gostaria de agendar uma avaliação de ceratocone (crosslinking).',
      ilustracao: {
        titulo: 'Córnea com ceratocone vista em corte, com o olho inteiro embaixo',
        descricao: 'Desenho esquemático da córnea em corte, com o epitélio por cima e o estroma, formado por fibras, por baixo. Embaixo, um olho inteiro mostra a córnea ganhando forma de cone. As etapas mostram o epitélio sendo retirado, o colírio de riboflavina penetrando na córnea, a luz ultravioleta criando novas ligações entre as fibras e o epitélio crescendo de novo.'
      },
      rotulos: {
        corte: 'Córnea,',
        corte2: 'vista em corte',
        epitelio: 'Epitélio',
        estroma: 'Estroma',
        riboflavina: 'Riboflavina',
        ligacoes1: 'Novas',
        ligacoes2: 'ligações',
        olho: 'Olho inteiro',
        antes1: 'córnea com',
        antes2: 'curva normal',
        depois1: 'córnea em',
        depois2: 'forma de cone'
      },
      etapas: [
        {
          titulo: 'O ceratocone',
          texto: 'No ceratocone, a córnea fica mais fina e vai se deformando, em forma de cone. Isso distorce a visão.'
        },
        {
          titulo: 'Anestesia',
          texto: 'O olho é anestesiado com colírio.'
        },
        {
          titulo: 'Remoção do epitélio',
          // [CONFIRMAR COM A DRA. CÉLIA: a clínica retira o epitélio
          // (técnica "epi-off") ou faz o crosslinking com o epitélio
          // (técnica transepitelial, "epi-on")? Se for com o epitélio,
          // avisar: o desenho desta etapa e da etapa 6 precisa mudar.]
          texto: 'A camada mais superficial da córnea, o epitélio, é removida para o colírio penetrar melhor.'
        },
        {
          titulo: 'Colírio de riboflavina',
          texto: 'Um colírio de riboflavina, a vitamina B2, é pingado várias vezes e penetra na córnea.'
        },
        {
          titulo: 'Luz ultravioleta',
          // [CONFIRMAR COM A DRA. CÉLIA: tempo de luz usado na clínica,
          // se quiser citar (ex.: "por cerca de 10 minutos").]
          texto: 'A córnea recebe luz ultravioleta por alguns minutos. Junto com a riboflavina, a luz cria novas ligações entre as fibras da córnea.'
        },
        {
          titulo: 'Lente de proteção',
          texto: 'Uma lente de contato de proteção é colocada e o epitélio se regenera nos dias seguintes. O objetivo é deixar a córnea mais firme e frear o avanço do ceratocone.'
        }
      ]
    }
  }
};
