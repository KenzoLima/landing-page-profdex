/* Todo o texto da landing, num arquivo só.
 *
 * ╔═══════════════════════════════════════════════════════════════════════╗
 * ║ GUARDAS FACTUAIS: o que esta página NÃO pode afirmar                   ║
 * ║ (conferido no código do app em D:\profdex\main)                        ║
 * ╠═══════════════════════════════════════════════════════════════════════╣
 * ║ · NÃO expor estado interno do projeto (o que falta, o que está         ║
 * ║   cadastrado, nome de tecnologia).                                     ║
 * ║ · NÃO prometer um número de professores jogáveis digitado no texto: se ║
 * ║   for preciso, ele sai de data/professors.js.                          ║
 * ║ · NÃO existe app nativo (iOS/Android). É web, no navegador do celular. ║
 * ║ · NÃO linkar para o app: o jogo está fora do ar por algumas semanas, e ║
 * ║   os botões da página levam a seções dela mesma.                       ║
 * ║ · NÃO existe "pilha de QR sorteada": acertou o quiz, a bancada mostra  ║
 * ║   na tela um QR com o nome do aluno, que só vale para ele, e o         ║
 * ║   professor sai do TEMA que ele acertou (capture-lottery.ts).          ║
 * ║ · NÃO existe professor "encontrado sem capturar": a descoberta nasce   ║
 * ║   junto com a captura (captures.service.ts).                           ║
 * ║ · A batalha contra a IA NÃO ranqueia; só o PvP.                        ║
 * ║ · A realidade aumentada abre pelo botão "VER EM RA", na ficha do       ║
 * ║   professor; NÃO na arena de batalha.                                  ║
 * ║ · Sem travessão (—) no texto da página: vírgula, dois-pontos ou ponto. ║
 * ║ · Caixa alta só sem acento: a Press Start 2P descarta o til e o        ║
 * ║   circunflexo das maiúsculas (ver a regra `.pixel` em base.css).       ║
 * ╚═══════════════════════════════════════════════════════════════════════╝
 *
 * Tom: português do Brasil, direto, humor leve. O público é aluno de
 * computação: detalhe técnico honesto vende melhor que adjetivo de marketing.
 */

export const hero = {
  wordmarkStart: 'PROF',
  wordmarkEnd: 'DEX',
  subtitle: 'Colecione seus professores!',
  context: 'TechFil 2026 · UniFil',
  lede: 'Uma Pokédex de professores. Acerte o quiz, capture o professor pelo QR e batalhe contra outros alunos, em turnos, como manda a tradição.',
  cta: 'VER O JOGO',
  ctaSecondary: 'Quem fez',
}

/* Barra fixa do topo. Enxuta de propósito: três destinos (os vídeos, o
 * simulador e os créditos); a página inteira já se lê rolando. */
export const nav = {
  brandStart: 'PROF',
  brandEnd: 'DEX',
  // Nome acessível do logo. Contém o texto visível ("PROFDEX"), como exige a
  // WCAG 2.5.3: quem usa comando de voz fala o que vê.
  brandLabel: 'ProfDex, voltar ao topo',
  videos: 'Vídeos',
  app: 'App',
  credits: 'Quem somos',
}

export const howItWorks = {
  kicker: 'Como funciona',
  title: 'Do estande à coleção',
  // Fluxo real: a bancada gera um QR ligado ao TEMA que o aluno acertou e a
  // ele mesmo; o professor é escolhido no scan, entre os daquele tipo.
  steps: [
    {
      title: 'Encontre o estande ProfDex',
      desc: 'A mesa do time ProfDex no evento, com o tablet do quiz.',
    },
    {
      title: 'Responda ao quiz',
      desc: 'Escolha um tema e responda uma pergunta sobre o curso.',
    },
    {
      title: 'Receba o QR',
      desc: 'Acertou? A tela da bancada mostra um QR de captura com o seu nome e a sua matrícula. Ele só vale para você, e o professor sai do tema que você acertou.',
    },
    {
      title: 'Capture!',
      desc: 'Escaneie o QR da tela com o scanner do app. Sai um professor daquele tipo (quem você ainda não tem vem primeiro), e a bancada revela quem saiu, girando em 3D.',
    },
  ],
}

export const quiz = {
  kicker: 'Quiz de bancada',
  title: 'Uma pergunta, 60 segundos',
  desc: 'No estande do evento tem um tablet. Você informa a matrícula, escolhe um tema e responde uma pergunta em 60 segundos, com alguém do time ao lado.',
  facts: [
    { label: 'Acertou', value: 'Aparece um QR na tela, só seu, que vale um professor do tema' },
    { label: 'Depois de cada tentativa', value: 'Aquele tema fica 10 min em espera; os outros 8 seguem liberados' },
    { label: 'Banco de questões', value: 'Pelo menos 40 por tema (16 fáceis, 12 médias, 12 difíceis), 420 no total' },
    { label: 'Alternativas', value: 'Embaralhadas a cada aplicação' },
  ],
}

export const typeWheel = {
  kicker: 'Roda de tipos',
  title: '9 tipos, e a roda gira',
  desc: 'Cada tipo é super-eficaz (2×) contra os dois seguintes no sentido horário, e fraco (0,5×) contra os dois anteriores. Professores têm até dois tipos, então os multiplicadores combinam: 4× · 2× · 1× · 0,5× · 0,25×.',
  // O tema do quiz define o tipo do professor que sai no QR (capture-lottery.ts).
  note: 'Os nove temas do quiz são estes mesmos nove tipos, e o tema que você acerta define o tipo do professor do QR. Quer uma equipe variada? Varie os temas.',
  legendStrong: 'Forte contra',
  legendWeak: 'Fraco contra',
  hint: 'Toque em um tipo para ver as vantagens dele, ou segure a roda para girar e soltar: ela trava no tipo que parar no topo.',
}

export const battle = {
  kicker: 'Batalha',
  title: 'Turnos, tipos e 72 golpes',
  desc: 'Cada professor capturado é um combatente com até dois tipos e um moveset de quatro golpes, montado a partir do movepool dos seus tipos.',
  stats: [
    { label: 'Ataque', hint: 'Quanto o golpe machuca' },
    { label: 'Defesa', hint: 'Quanto você aguenta' },
    { label: 'Velocidade', hint: 'Quem age primeiro no turno' },
  ],
  moveCategoriesTitle: 'Categorias de golpe',
  effectsTitle: 'Efeitos de status',
  moveCategories: ['ataque', 'defesa', 'buff', 'debuff', 'status', 'cura'],
  effects: [
    'paralisia',
    'confusão',
    'dano contínuo',
    'recuo',
    'multi-golpe',
    'ignorar defesa',
    'poder crescente',
    'escudos: bloquear, reduzir, refletir, esquivar',
    'imunidade a debuff',
    'desfazer dano',
    'repetir o último golpe',
  ],
  effectsNote: 'Todos funcionam de verdade na batalha.',
  training: 'O duelo contra a IA é um modo de treino: não conta para o ranking.',
  playLink: 'Jogar um treino no simulador',
}

/* Os dois vídeos do evento. Os arquivos e os posters moram em
 * config/links.js (VIDEOS); aqui fica só o texto. */
export const battleVideo = {
  kicker: 'Veja em ação',
  title: 'O ProfDex na TechFil',
  desc: 'O convite que rodou antes do evento e o encerramento com os números, a raid final e a hora dos campeões.',
  videos: {
    teaser: {
      title: 'Como se joga',
      caption: 'Do quiz na bancada à batalha em tempo real.',
    },
    encerramento: {
      title: 'Encerramento',
      caption: 'Os números do evento, a raid contra o lendário e a premiação.',
    },
  },
}

export const pvp = {
  kicker: 'PvP ranqueado',
  title: 'Aluno contra aluno, em tempo real',
  steps: [
    { title: 'Lobby', desc: 'Você vê quem está online agora.' },
    { title: 'Convite', desc: 'Chama alguém para a briga. O convite expira em 60 segundos.' },
    {
      title: 'Times às cegas',
      desc: 'Cada um monta um time de até 3 sem ver o do outro. Depois dos dois confirmarem, aparece o time do rival (professores e tipos, nunca golpes nem IVs), e cada um escolhe, também às cegas, quem entra primeiro.',
    },
    {
      title: 'Turnos de 60s',
      desc: 'Escolha simultânea.',
    },
    { title: 'Elo', desc: 'Quando um time fica sem ninguém de pé (ou no limite de 40 turnos), o rating muda e o ranking se mexe.' },
  ],
  // Cortes conferidos na fonte de verdade: profdex-back/src/battle/elo.ts.
  tiers: [
    { name: 'Bronze', min: 1000, max: 1099, icon: '🥉' },
    { name: 'Prata', min: 1100, max: 1199, icon: '🥈' },
    { name: 'Ouro', min: 1200, max: 1299, icon: '🥇' },
    { name: 'Platina', min: 1300, max: 1399, icon: '💠' },
    { name: 'Diamante', min: 1400, max: 1499, icon: '💎' },
    { name: 'Mestre', min: 1500, max: null, icon: '👑' },
  ],
  ratingNote:
    'Todo mundo começa em 1000, e 1000 também é o piso: perder muito não te enterra no ranking.',
  antiTrade: 'Intervalo entre batalhas ranqueadas da mesma dupla (12 horas por padrão, ajustável pela organização), para o ranking não virar acordo entre amigos.',
}

export const score = {
  kicker: 'Ranking',
  title: 'Sair da cadeira vale mais',
  desc: 'No app, o ranking compara Elo, capturas e porcentagem da dex (dá para ver na aba Ranking do simulador). Por trás, a organização acompanha uma pontuação de engajamento que mede a participação no evento:',
  rows: [
    { action: 'Primeira sessão do dia', points: 5 },
    { action: 'Minuto ativo (teto de 60 por dia)', points: 1 },
    { action: 'Professor novo na coleção', points: 20 },
    { action: 'Professor capturado', points: 50, highlight: true },
    { action: 'Raro capturado', points: 140, highlight: true },
    { action: 'Lendário capturado', points: 200, highlight: true },
    { action: 'Convite de batalha enviado', points: 5 },
    { action: 'Batalha concluída', points: 80, highlight: true },
    { action: 'Vitória', points: 30, prefix: '+' },
    { action: 'Coleção completa', points: 200 },
    { action: 'Quiz respondido na bancada', points: 10 },
    { action: 'Quiz acertado', points: 25, prefix: '+' },
  ],
  note: 'Tempo só conta com a aba visível. Deixar o app aberto a noite toda não rende nada.',
}

export const professors = {
  kicker: 'Pokédex',
  // Esta seção fala de PROGRESSO DE JOGO, nunca de progresso de produção.
  title: 'Sua coleção começa vazia',
  desc: 'Acerte o quiz na bancada, escaneie o QR e desbloqueie cada professor. Monte sua equipe, suba no ranking e desafie seus amigos.',
  unknownLabel: '???',
  unknownHint: 'Ainda não desbloqueado',
  unknownType: 'Tipo ???',
  rareLabel: '✦ RARO',
  raresTitle: '✦ Raros e o lendário',
  raresHint: 'Formas especiais: cada raro se destrava acertando cinco questões de cada tipo dele no quiz da bancada. O lendário fica em segredo até a raid, e só aparece para quem completa a Pokédex inteira, raros incluídos.',
  legendaryHint: 'Aparece na raid',
}

export const model3d = {
  kicker: 'Ver de perto',
  title: 'O professor em 3D',
  desc: 'Dentro do app, o botão "VER EM RA", na ficha do professor, abre o modelo em realidade aumentada. Aqui você escolhe um professor, ou um dos raros, e gira a prévia.',
  pickerLabel: 'Escolha o professor para ver em 3D',
  groups: {
    professores: 'Professores',
    especiais: 'Raros',
  },
  cta: 'VER EM 3D',
  ctaHint: 'O modelo só é baixado quando você toca no botão.',
  loading: 'Carregando modelo…',
  dragHint: 'Arraste para girar · pinça para aproximar',
  close: 'FECHAR 3D',
  // Mensagens da cadeia de guardas de src/three/useLazyModel.js. Cada recusa
  // diz o motivo: um "não deu" mudo é pior que a ausência do botão.
  refusals: {
    'save-data': 'Seu navegador está no modo de economia de dados, então o modelo 3D ficou de fora.',
    'slow-network': 'Sua conexão está lenta agora. Melhor não gastar dados com o 3D.',
    'low-memory': 'Este aparelho tem pouca memória para 3D. Ficamos na arte 2D.',
    'no-webgl': 'Este navegador não consegue mostrar 3D. A arte 2D continua aí.',
    'no-asset': 'A prévia em 3D não está disponível agora.',
    error: 'Não foi possível carregar o modelo. A arte 2D continua aí.',
  },
}

/* O simulador do app (src/app-demo/). Tudo nele é fictício (IVs, ranking) e o
 * ranking usa nomes inventados. Os textos de jogo (mensagens de batalha,
 * roteiro da raid) vêm do próprio app; estes são os da moldura. */
export const appDemo = {
  kicker: 'Experimente',
  title: 'O app, na palma da mão',
  desc: 'O jogo está fora do ar por algumas semanas, então montamos uma réplica navegável. Toque nas abas embaixo do celular: é o mesmo desenho e o mesmo motor de batalha do app, com dados fictícios.',
  badge: 'Demonstração · dados fictícios',
  fullscreen: {
    open: 'ABRIR EM TELA CHEIA',
    close: 'Sair da tela cheia',
    label: 'Simulador do ProfDex em tela cheia',
  },
  navLabel: 'Telas do app',
  note: 'Nada aqui usa câmera, login ou servidor. A coleção é a de um treinador fictício, com a Pokédex completa, e o ranking tem nomes inventados.',
  tabs: {
    dex: 'ProfDex',
    battle: 'Batalha',
    ranking: 'Ranking',
    raid: 'Raid',
  },
  guide: [
    { tab: 'dex', title: 'ProfDex', desc: 'A coleção completa: os professores e os raros. Toque em qualquer um para abrir a ficha com atributos e golpes.' },
    { tab: 'battle', title: 'Batalha', desc: 'O treino contra a IA, jogável: escolha um professor e use os golpes. Mesmas regras de tipo e de dano do app.' },
    { tab: 'ranking', title: 'Ranking', desc: 'Elo do PvP, capturas e porcentagem da dex, com jogadores fictícios.' },
    { tab: 'raid', title: 'Raid', desc: 'A luta contra o lendário, Sérgio Tanaka, contada cena a cena: a roda de tipos, os três estágios, o NDE da Coordenação e o Ricardo Infiltrado.' },
  ],
  dex: {
    trainer: 'TREINADOR',
    captured: 'capturados',
    captureState: 'CAPTURADO',
    rares: 'RAROS',
    legendaryHint: 'O lendário só aparece para quem completa a Pokédex, e se captura na raid.',
    legendaryCta: 'VER RAID',
    sheetLabel: 'Ficha de',
    sheetTabsLabel: 'Seções da ficha',
    back: 'Voltar',
    tabs: { sobre: 'SOBRE', golpes: 'GOLPES' },
    statsTitle: 'ATRIBUTOS',
    movesTitle: 'MOVEPOOL DOS TIPOS',
    view3d: 'VER EM 3D',
  },
  battle: {
    title: 'TREINO',
    subtitle: 'BATALHA CONTRA A IA',
    pickLede: 'Escolha um professor da sua coleção. O adversário é sorteado.',
    seal: 'Treino · não vale ranking',
    flee: 'Fugir',
    end: { victory: 'Você venceu!', defeat: 'Você foi derrotado', fled: 'Você fugiu' },
    endNote: 'Foi um treino: seu Elo e suas estatísticas não mudaram.',
    again: 'JOGAR DE NOVO',
    change: 'TROCAR PROFESSOR',
  },
  ranking: {
    subtitle: 'TOP TREINADORES',
    tabsLabel: 'Tipo de ranking',
    tabs: { elo: 'ELO', capturas: 'CAPTURAS', dex: 'DEX' },
    podiumLabel: 'Pódio',
    you: 'Você',
  },
  raid: {
    title: 'RAID',
    subtitle: 'O lendário',
    stepsLabel: 'Cenas da raid',
    window: 'Raid aberta das 18h às 22h',
    lead: 'PRIMEIRO',
    buffsLabel: 'Buffs da roda do Ricardo',
    buffNote: 'Os números são os nós da roda; a cor é a chance (verde comum, azul incomum, dourado raro, pesos 4, 2 e 1).',
    wheelNote: 'Os tipos dos estágios 2 e 3 são sorteados na roda a cada raid; esta é uma raid possível.',
    win: 'Lendário capturado!',
    tap: 'TOQUE PARA CONTINUAR',
    nextScene: 'Toque para a próxima cena',
    end: 'FIM DA RAID',
    back: 'VOLTAR',
    skip: 'PULAR',
    restart: 'Recomeçar',
  },
}

/* Cada pessoa tem LinkedIn e GitHub; os rótulos saem daqui, e a vírgula entre
 * eles é do CSS, não do texto. */
const perfis = (linkedin, github) => [
  { url: linkedin, label: 'LinkedIn' },
  { url: github, label: 'GitHub' },
]

export const credits = {
  kicker: 'Quem somos',
  title: 'Quem fez o ProfDex',
  lede: 'Um projeto de alunos de Computação da UniFil, desenvolvido no Grupo de Pesquisa em Realidade Aumentada para a TechFil 2026.',

  photosTitle: 'O time no evento',
  photos: [
    {
      slug: 'time-estande-1',
      alt: 'O time ProfDex, de camisetas roxas, posando junto ao estande do jogo na TechFil.',
    },
    {
      slug: 'time-palco-1',
      alt: 'O time ProfDex no palco durante "A hora dos campeões", com o telão do jogo ao fundo.',
    },
    {
      slug: 'time-estande-2',
      alt: 'Integrantes do time ProfDex reunidos ao lado do estande, segurando prêmios do evento.',
    },
    {
      slug: 'time-palco-2',
      alt: 'Premiação no palco: o time ProfDex ao lado do apresentador, diante do telão do ProfDex.',
    },
  ],

  projectTitle: 'O projeto',
  projectParagraphs: [
    'O ProfDex nasceu para a TechFil: uma Pokédex de professores em que o aluno responde ao quiz no estande, captura o professor por QR code e batalha com ele contra outros alunos.',
    'No mesmo app juntamos socialização, realidade aumentada, revisão de conteúdo e combate PvP em tempo real, uma forma de aproximar dos estudos os jogos de que tanto gostamos.',
  ],

  metricsTitle: 'Quatro dias de estande',
  metricsIntro: 'O que o estande registrou de 28/09 a 01/10.',
  metrics: [
    { value: 98422, label: 'Interações no app' },
    { value: 1905, label: 'Perguntas respondidas na bancada' },
    { value: 1148, label: 'Professores capturados' },
    { value: 233, label: 'Batalhas concluídas' },
    { value: 256, label: 'Alunos no evento' },
  ],
  metricsImageAlt: 'Relatório do estande ProfDex: interações, perguntas, capturas e batalhas de cada um dos quatro dias, e a origem das interações.',
  metricsImageLink: 'Ver o relatório completo',

  teamTitle: 'Time Ratos Cegos',
  team: [
    {
      name: 'Enzo Horçai da Silva',
      role: 'UI/UX',
      links: perfis('https://www.linkedin.com/in/enzohorcai/', 'https://github.com/EnzoHorcai'),
    },
    {
      name: 'Gregório C. Campos Lotz',
      role: 'Back-end e UI/UX',
      links: perfis('https://www.linkedin.com/in/greg%C3%B3rio-celso-campos-lotz/', 'https://github.com/gregoriounifil'),
    },
    {
      name: 'Kenzo Lima Yamamoto',
      role: 'Back-end e UI/UX',
      links: perfis('https://www.linkedin.com/in/kenzo-lima-yamamoto-ab5512359/', 'https://github.com/KenzoLima'),
    },
    {
      name: 'Maísa P. Dalla Costa',
      role: 'Arte e pixel art',
      links: perfis('https://www.linkedin.com/in/maisapascoalotodallacosta/', 'https://github.com/maisadallacosta'),
    },
    {
      name: 'Nicole Duarte Guirardelli',
      role: 'Back-end',
      links: perfis('https://www.linkedin.com/in/nicole-guirardelli/', 'https://github.com/NicoleGuirardelli'),
    },
  ],

  advisorsTitle: 'Professores orientadores',
  advisors: [
    {
      name: 'Eron Ponce',
      role: 'Orientador',
      links: perfis('https://www.linkedin.com/in/eron-ponce-95285b213/', 'https://github.com/Eronponce'),
    },
    {
      name: 'Gustavo Queiroz',
      role: 'Orientador',
      links: perfis('https://www.linkedin.com/in/gustavo-queiroz-silveira/', 'https://github.com/gustavo-qss'),
    },
    {
      name: 'Mario Henrique Adaniya',
      role: 'Orientador',
      links: perfis('https://www.linkedin.com/in/mhadaniya/', 'https://github.com/mhadaniya'),
    },
  ],

  institutionTitle: 'Instituição',
  institutionName: 'UniFil',
  institutionDesc: 'Com o apoio do Centro Universitário Filadélfia e do Grupo de Pesquisa em Realidade Aumentada.',
  institutionLink: 'unifil.br',

  projectLink: 'Código da landing no GitHub',
}

export const footer = {
  project: 'ProfDex',
  event: 'TechFil · UniFil',
  creditsLabel: 'Sobre',
  compLabel: 'Instagram de computação',
  siteLabel: 'unifil.br',
  colophon: 'Feito por alunos, para alunos, com uma quantidade defensável de nostalgia.',
}
