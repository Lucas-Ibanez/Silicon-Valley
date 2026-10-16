/*
 * Conteúdo do site. Tudo que é texto/dados vive aqui; os outros scripts só renderizam.
 * Datas e números foram resumidos de fontes públicas — veja o rodapé.
 */
(function () {
  'use strict';
  var SV = window.SV = window.SV || {};

  SV.data = {

    /* ---------- Eras da cena do herói (7) ---------- */
    eras: [
      { name: 'O Vale dos Encantos', range: '1891 – 1938', code: '01',
        text: 'Antes dos chips, havia damascos. Pomares de ameixa e damasco cobriam o vale de Santa Clara, e uma universidade recém-criada já olhava para o futuro.' },
      { name: 'Garagens e Rádio', range: '1939 – 1955', code: '02',
        text: 'Dois amigos de Stanford montam a HP numa garagem de Palo Alto. Frederick Terman convence a universidade a abrir terreno e talento para a indústria.' },
      { name: 'A Era do Silício', range: '1956 – 1970', code: '03',
        text: 'O transistor chega à Califórnia. Oito engenheiros "traidores" fundam a Fairchild e inventam a indústria dos circuitos integrados.' },
      { name: 'O Computador Pessoal', range: '1971 – 1989', code: '04',
        text: 'A Intel lança o microprocessador, a Xerox PARC inventa a interface gráfica e dois Steves transformam um hobby de garagem na Apple.' },
      { name: 'A Internet', range: '1990 – 2000', code: '05',
        text: 'A Netscape abre capital em 1995 e a corrida do ponto-com começa. Em 2000 a bolha estoura, mas a infraestrutura fica.' },
      { name: 'Plataformas e Celulares', range: '2001 – 2021', code: '06',
        text: 'Google, Facebook, iPhone: o software devora o mundo e o Vale vira sinônimo de plataforma.' },
      { name: 'A Era da IA', range: '2022 – hoje', code: '07',
        text: 'Chips cada vez menores, modelos cada vez maiores. O silício volta ao centro da história.' }
    ],
    /* anos nas fronteiras entre as eras (usado no contador do herói) */
    eraYears: [1891, 1939, 1956, 1971, 1990, 2001, 2022, 2026],

    /* ---------- Linha do tempo (20 checkpoints) ---------- */
    timeline: [
      { year: 1891, era: 0, place: 'Stanford, Califórnia', title: 'Stanford abre as portas',
        summary: 'Leland e Jane Stanford fundam a universidade em memória do filho. Em volta, só pomares.',
        detail: 'A Universidade Leland Stanford Júnior abriu em outubro de 1891, em terras de uma antiga fazenda de cavalos. O vale de Santa Clara era então dominado por pomares de ameixa e damasco: o "Vale dos Encantos". Décadas depois, a universidade se tornaria o motor intelectual da região.',
        facts: [['Fundação', '1891'], ['Terreno original', '~3.300 hectares'], ['Paisagem', 'Pomares de ameixa e damasco']],
        people: ['Leland Stanford', 'Jane Stanford'] },

      { year: 1909, era: 0, place: 'Palo Alto', title: 'A primeira startup de tecnologia',
        summary: 'Cyril Elwell funda em Palo Alto a empresa que viraria a Federal Telegraph, pioneira do rádio.',
        detail: 'Em 1909, o engenheiro Cyril Elwell fundou em Palo Alto a Poulsen Wireless, rebatizada de Federal Telegraph Company, com apoio de David Starr Jordan, então presidente de Stanford. Foi uma das primeiras empresas de tecnologia da região e treinou uma geração de engenheiros de rádio. Em 1912, Lee de Forest e colegas aperfeiçoaram ali o audion como amplificador.',
        facts: [['Tecnologia', 'Rádio (transmissor a arco)'], ['Ligação com Stanford', 'Investimento do presidente da universidade'], ['Legado', 'Escola de engenheiros de rádio']],
        people: ['Cyril Elwell', 'Lee de Forest'] },

      { year: 1939, era: 1, place: 'Palo Alto', title: 'A garagem da HP',
        summary: 'Bill Hewlett e Dave Packard começam a Hewlett-Packard com US$ 538 e um oscilador de áudio.',
        detail: 'Dois colegas de engenharia elétrica de Stanford, incentivados pelo professor Frederick Terman, montaram a HP numa garagem da Addison Avenue, 367. O primeiro produto foi o oscilador de áudio HP 200A; a Disney comprou unidades para o filme Fantasia. A garagem é hoje marco histórico da Califórnia e chamada de "berço do Vale do Silício".',
        facts: [['Capital inicial', 'US$ 538'], ['Primeiro produto', 'Oscilador de áudio HP 200A'], ['Cliente famoso', 'Walt Disney (Fantasia)']],
        people: ['Bill Hewlett', 'Dave Packard', 'Frederick Terman'] },

      { year: 1951, era: 1, place: 'Stanford', title: 'O parque industrial de Stanford',
        summary: 'Terman arrenda terras da universidade para empresas de alta tecnologia. A academia entra no negócio.',
        detail: 'Para financiar a universidade sem vender terras, Stanford passou a arrendar lotes a empresas de tecnologia. O primeiro inquilino foi a Varian Associates, em 1951; depois vieram a própria HP, a Kodak e a General Electric. O modelo aproximou pesquisa e indústria e virou referência mundial de parque tecnológico.',
        facts: [['Primeiro inquilino', 'Varian Associates'], ['Modelo', 'Arrendamento, não venda de terras'], ['Mentor', 'Frederick Terman']],
        people: ['Frederick Terman'] },

      { year: 1956, era: 2, place: 'Mountain View', title: 'Shockley traz o silício',
        summary: 'O co-inventor do transistor abre um laboratório em Mountain View e muda a história com sua equipe.',
        detail: 'William Shockley, que dividiu o Nobel de Física de 1956 pela invenção do transistor, voltou à sua região natal para fundar o Shockley Semiconductor Laboratory, com apoio de Arnold Beckman. Atraiu jovens brilhantes, mas seu estilo de gestão difícil seria a faísca da diáspora que fundou o Vale.',
        facts: [['Nobel de Física', '1956 (com Bardeen e Brattain)'], ['Apoio financeiro', 'Arnold Beckman'], ['Endereço', 'San Antonio Road, Mountain View']],
        people: ['William Shockley', 'Arnold Beckman'] },

      { year: 1957, era: 2, place: 'Palo Alto / Mountain View', title: 'Os Oito Traidores',
        summary: 'Oito pesquisadores deixam Shockley e fundam a Fairchild Semiconductor, a "mãe" das empresas do Vale.',
        detail: 'Em 1957, Julius Blank, Victor Grinich, Jean Hoerni, Eugene Kleiner, Jay Last, Gordon Moore, Robert Noyce e Sheldon Roberts saíram juntos do laboratório de Shockley. Com o investimento de Sherman Fairchild, criaram a Fairchild Semiconductor. De lá saíram tantas empresas, como Intel e AMD, que os ex-funcionários foram chamados de "Fairchildren".',
        facts: [['Fundadores', '8 pesquisadores'], ['Investidor', 'Sherman Fairchild'], ['Descendentes', 'Intel, AMD, Kleiner Perkins…']],
        people: ['Robert Noyce', 'Gordon Moore', 'Jean Hoerni', 'Eugene Kleiner'] },

      { year: 1959, era: 2, place: 'Fairchild', title: 'O circuito integrado planar',
        summary: 'Hoerni cria o processo planar e Noyce junta componentes numa só pastilha de silício.',
        detail: 'Jean Hoerni inventou na Fairchild o processo planar, que protegia o silício com uma camada de óxido. Sobre essa base, Robert Noyce concebeu o circuito integrado monolítico: vários componentes numa única pastilha, ligados por trilhas metálicas. Jack Kilby, da Texas Instruments, havia demonstrado um protótipo em 1958; as duas invenções são reconhecidas como a origem do chip.',
        facts: [['Processo planar', 'Jean Hoerni (1959)'], ['Circuito integrado', 'Robert Noyce (1959)'], ['Rival simultâneo', 'Jack Kilby, Texas Instruments (1958)']],
        people: ['Jean Hoerni', 'Robert Noyce', 'Jack Kilby'] },

      { year: 1968, era: 2, place: 'Mountain View', title: 'Nasce a Intel',
        summary: 'Noyce e Moore deixam a Fairchild e fundam a Integrated Electronics. O primeiro funcionário é Andy Grove.',
        detail: 'Em julho de 1968, Robert Noyce e Gordon Moore criaram a Intel com financiamento organizado pelo investidor Arthur Rock. O foco inicial eram chips de memória. Andy Grove, que entrou como um dos primeiros funcionários, se tornaria o executivo que transformou a empresa em gigante.',
        facts: [['Fundadores', 'Robert Noyce e Gordon Moore'], ['Capital inicial', '~US$ 2,5 milhões'], ['Primeiros funcionários', 'Andy Grove entre eles']],
        people: ['Robert Noyce', 'Gordon Moore', 'Andy Grove', 'Arthur Rock'] },

      { year: 1969, era: 2, place: 'Menlo Park', title: 'A internet dá o primeiro "LO"',
        summary: 'A ARPANET conecta a UCLA ao SRI, em Menlo Park. A primeira mensagem trava na segunda letra.',
        detail: 'Em 29 de outubro de 1969, um computador da UCLA tentou fazer login num computador do Stanford Research Institute, em Menlo Park. Foram transmitidas só as letras "LO" antes de o sistema travar: o começo de "LOGIN". Era o segundo nó da ARPANET, ancestral da internet.',
        facts: [['Nó da Califórnia', 'SRI, Menlo Park'], ['Primeira mensagem', '"LO"'], ['Rede inicial', '4 nós (UCLA, SRI, UCSB, Utah)']],
        people: ['Leonard Kleinrock', 'Charley Kline'] },

      { year: 1971, era: 3, place: 'Santa Clara', title: 'O nome "Silicon Valley" e o 4004',
        summary: 'Um jornalista batiza a região, e a Intel lança o primeiro microprocessador comercial.',
        detail: 'Em janeiro de 1971, o jornalista Don Hoefler publicou na revista Electronic News a série "Silicon Valley U.S.A.", e o apelido pegou. No mesmo ano, a Intel lançou o 4004, o primeiro microprocessador comercial: um computador inteiro em uma pastilha com 2.300 transistores, projetado por Federico Faggin, Ted Hoff e Stan Mazor.',
        facts: [['Série de Don Hoefler', 'Janeiro de 1971'], ['Intel 4004', '2.300 transistores'], ['Projetistas', 'Faggin, Hoff e Mazor']],
        people: ['Don Hoefler', 'Federico Faggin', 'Ted Hoff'] },

      { year: 1972, era: 3, place: 'Menlo Park', title: 'Sand Hill Road e o capital de risco',
        summary: 'Kleiner Perkins e Sequoia abrem escritórios na rua que viraria sinônimo de investimento em startups.',
        detail: 'Em 1972, Kleiner Perkins (Eugene Kleiner, um dos Oito, e Tom Perkins) e Sequoia Capital (Don Valentine) começaram a operar em Menlo Park. O modelo trocava dinheiro por participação em empresas novas e de alto risco, dando ao Vale o combustível financeiro que faltava a outras regiões.',
        facts: [['Fundadas em', '1972'], ['Endereço', 'Sand Hill Road, Menlo Park'], ['Modelo', 'Capital em troca de participação']],
        people: ['Eugene Kleiner', 'Tom Perkins', 'Don Valentine'] },

      { year: 1973, era: 3, place: 'Palo Alto', title: 'Xerox PARC inventa o futuro',
        summary: 'O Alto reúne mouse, janelas e Ethernet. A Xerox inventa o computador moderno, e outros o comercializam.',
        detail: 'O Palo Alto Research Center, aberto em 1970, construiu em 1973 o Xerox Alto, com tela gráfica, janelas, mouse e rede Ethernet (Bob Metcalfe). A impressora a laser nasceu ali. Em 1979, Steve Jobs visitou o centro e saiu com ideias que moldariam o Macintosh.',
        facts: [['Fundação do PARC', '1970'], ['Xerox Alto', '1973'], ['Legado', 'Interface gráfica, Ethernet, impressora a laser']],
        people: ['Bob Taylor', 'Alan Kay', 'Bob Metcalfe', 'Lynn Conway'] },

      { year: 1976, era: 3, place: 'Los Altos', title: 'Apple, da garagem ao mundo',
        summary: 'Jobs, Wozniak e Wayne fundam a Apple em 1º de abril. O Apple I custava US$ 666,66.',
        detail: 'Steve Jobs, Steve Wozniak e Ronald Wayne criaram a Apple em 1º de abril de 1976, na casa dos pais de Jobs, em Los Altos. Wozniak projetava os computadores; Jobs enxergava o mercado. Ambos frequentavam o Homebrew Computer Club, de Menlo Park. O Apple II (1977) transformou o hobby em indústria.',
        facts: [['Fundadores', 'Jobs, Wozniak e Wayne'], ['Apple I', 'US$ 666,66'], ['Berço cultural', 'Homebrew Computer Club (1975)']],
        people: ['Steve Jobs', 'Steve Wozniak', 'Ronald Wayne'] },

      { year: 1984, era: 3, place: 'Cupertino', title: 'Macintosh e o comercial "1984"',
        summary: 'O Mac chega ao mercado com um comercial dirigido por Ridley Scott. A Cisco também nasce em 1984.',
        detail: 'O Macintosh foi apresentado em 24 de janeiro de 1984, dois dias depois do comercial "1984" exibido no Super Bowl. Também em 1984, Len Bosack e Sandy Lerner, de Stanford, fundaram a Cisco, cujos roteadores ligariam as redes do mundo.',
        facts: [['Macintosh', '24 de janeiro de 1984'], ['Comercial', 'Super Bowl XVIII, direção de Ridley Scott'], ['Cisco', 'Fundada em 1984, em Stanford']],
        people: ['Steve Jobs', 'Len Bosack', 'Sandy Lerner'] },

      { year: 1995, era: 4, place: 'Mountain View', title: 'O IPO da Netscape',
        summary: 'Uma empresa de navegador, ainda sem lucro, dispara na bolsa e acende a corrida do ponto-com.',
        detail: 'Fundada por Jim Clark e Marc Andreessen (que liderara o navegador Mosaic), a Netscape abriu capital em 9 de agosto de 1995. Apesar de ainda não ter lucro, as ações subiram muito no primeiro dia. O evento é considerado o início da euforia da internet comercial.',
        facts: [['IPO', '9 de agosto de 1995'], ['Produto', 'Netscape Navigator (1994)'], ['Sede', 'Mountain View']],
        people: ['Jim Clark', 'Marc Andreessen'] },

      { year: 1998, era: 4, place: 'Menlo Park', title: 'Google, mais uma garagem',
        summary: 'Larry Page e Sergey Brin, doutorandos de Stanford, fundam o Google numa garagem em Menlo Park.',
        detail: 'Page e Brin desenvolveram o PageRank em Stanford. O Google foi formalizado em 4 de setembro de 1998, depois de um cheque de US$ 100 mil de Andy Bechtolsheim, cofundador da Sun. A garagem era de Susan Wojcicki, que anos depois dirigiria o YouTube.',
        facts: [['Fundação', '4 de setembro de 1998'], ['Primeiro cheque', 'US$ 100 mil (Andy Bechtolsheim)'], ['Garagem', 'Susan Wojcicki, Menlo Park']],
        people: ['Larry Page', 'Sergey Brin', 'Susan Wojcicki', 'Andy Bechtolsheim'] },

      { year: 2000, era: 4, place: 'Nasdaq', title: 'A bolha estoura',
        summary: 'O Nasdaq atinge o pico em março e perde cerca de 78% até 2002. Muitas startups somem; as sólidas ficam.',
        detail: 'Em 10 de março de 2000 o Nasdaq tocou os 5.000 pontos. Nos dois anos e meio seguintes, o índice perdeu cerca de 78% do valor. Empresas sem modelo de negócio sumiram, milhares de pessoas perderam o emprego no Vale, mas a infraestrutura (fibra, servidores, talentos) sustentou a geração seguinte.',
        facts: [['Pico do Nasdaq', '10 de março de 2000 (~5.000 pontos)'], ['Queda até 2002', '~78%'], ['Sobreviventes', 'eBay, Amazon, Google (IPO em 2004)']],
        people: [] },

      { year: 2004, era: 5, place: 'Palo Alto', title: 'Redes sociais e Web 2.0',
        summary: 'O Facebook muda de Harvard para Palo Alto. YouTube e Twitter chegam logo depois.',
        detail: 'No verão de 2004, Mark Zuckerberg e sócios mudaram o Facebook de Harvard para Palo Alto, onde Peter Thiel fez o primeiro investimento externo (US$ 500 mil). O YouTube surgiu em 2005 e foi comprado pelo Google em 2006; o Twitter, em San Francisco, nasceu em 2006. A internet virou espaço de pessoas, não só de páginas.',
        facts: [['Facebook em Palo Alto', 'Verão de 2004'], ['Primeiro investidor', 'Peter Thiel (US$ 500 mil)'], ['YouTube → Google', '2006, por US$ 1,65 bilhão']],
        people: ['Mark Zuckerberg', 'Peter Thiel'] },

      { year: 2007, era: 5, place: 'San Francisco', title: 'O iPhone muda tudo',
        summary: 'Steve Jobs apresenta o iPhone. Em 2008 chega a App Store e começa a era do software de bolso.',
        detail: 'Em 9 de janeiro de 2007, Steve Jobs apresentou o iPhone como "um iPod, um telefone e um comunicador de internet". Ele chegou às lojas em 29 de junho. A App Store, em 2008, criou um novo mercado para desenvolvedores e consolidou o celular como plataforma central.',
        facts: [['Anúncio', '9 de janeiro de 2007'], ['Lançamento', '29 de junho de 2007'], ['App Store', '2008']],
        people: ['Steve Jobs'] },

      { year: 2022, era: 6, place: 'Santa Clara / San Francisco', title: 'A era da IA generativa',
        summary: 'O ChatGPT populariza a IA. Por trás, chips de Santa Clara e a arquitetura Transformer, nascida no Vale.',
        detail: 'Em 30 de novembro de 2022 a OpenAI, de San Francisco, lançou o ChatGPT. Os modelos dependem de GPUs de empresas como a NVIDIA (Santa Clara) e da arquitetura Transformer, publicada em 2017 por pesquisadores do Google. Uma volta ao começo: o silício é, de novo, o gargalo e a estrela.',
        facts: [['ChatGPT', '30 de novembro de 2022'], ['Hardware', 'GPUs da NVIDIA (Santa Clara)'], ['Base técnica', 'Transformer (Google, 2017)']],
        people: ['Fei-Fei Li', 'Jensen Huang'] }
    ],

    /* ---------- Linha do Vale (mapa esquemático) ---------- */
    cats: {
      chip: 'Semicondutores',
      pc: 'Computadores',
      web: 'Internet e software',
      cap: 'Ensino e capital'
    },

    stations: [
      { id: 'sf', name: 'San Francisco', tag: 'A ponta norte do eixo', fact: 'Nos anos 2010, parte do capital e das startups migrou do Vale para a cidade.',
        items: [
          { y: 2006, n: 'Twitter', c: 'web', t: 'Rede social fundada na cidade.' },
          { y: 2008, n: 'Airbnb', c: 'web', t: 'Plataforma de hospedagem nascida em San Francisco.' },
          { y: 2009, n: 'Uber', c: 'web', t: 'Aplicativo de transporte que popularizou o modelo "sob demanda".' },
          { y: 2015, n: 'OpenAI', c: 'web', t: 'Laboratório de IA; lançou o ChatGPT em 2022.' }
        ] },
      { id: 'rc', name: 'Redwood City', tag: 'Vídeo, jogos e software', fact: 'A Ampex gravou, em 1956, o primeiro videoteipe prático para TV.',
        items: [
          { y: 1956, n: 'Ampex', c: 'pc', t: 'Videoteipe profissional que revolucionou a televisão.' },
          { y: 1982, n: 'Electronic Arts', c: 'web', t: 'Fundada em San Mateo; sede em Redwood City.' }
        ] },
      { id: 'mp', name: 'Menlo Park', tag: 'O dinheiro e a rede', fact: 'Em Sand Hill Road estão alguns dos fundos mais influentes do mundo.',
        items: [
          { y: 1946, n: 'SRI International', c: 'cap', t: 'Instituto de pesquisa; sediou o 2º nó da ARPANET em 1969.' },
          { y: 1972, n: 'Kleiner Perkins e Sequoia', c: 'cap', t: 'Pioneiras do capital de risco, em Sand Hill Road.' },
          { y: 1998, n: 'Garagem do Google', c: 'web', t: 'Cedida por Susan Wojcicki aos fundadores.' },
          { y: 2011, n: 'Meta (Facebook)', c: 'web', t: 'Sede mudou-se de Palo Alto para Menlo Park.' }
        ] },
      { id: 'pa', name: 'Palo Alto', tag: 'O berço', fact: 'Na Addison Avenue, 367, a garagem da HP é marco histórico da Califórnia.',
        items: [
          { y: 1909, n: 'Federal Telegraph', c: 'pc', t: 'Primeira startup de rádio da região.' },
          { y: 1939, n: 'Hewlett-Packard', c: 'pc', t: 'A garagem que virou símbolo.' },
          { y: 1970, n: 'Xerox PARC', c: 'pc', t: 'Inventou a interface gráfica, a Ethernet e a impressora a laser.' },
          { y: 2004, n: 'Facebook (primeira sede)', c: 'web', t: 'Instalou-se em Palo Alto no verão de 2004.' }
        ] },
      { id: 'st', name: 'Stanford', tag: 'A universidade', fact: 'Cada geração de empresas do Vale tem alguém passando pelo campus.',
        items: [
          { y: 1891, n: 'Stanford University', c: 'cap', t: 'O motor intelectual do Vale.' },
          { y: 1951, n: 'Stanford Industrial Park', c: 'cap', t: 'Terras arrendadas para empresas de tecnologia.' },
          { y: 1982, n: 'Sun Microsystems', c: 'pc', t: 'Nome vem de Stanford University Network.' },
          { y: 1984, n: 'Cisco', c: 'web', t: 'Fundada por Len Bosack e Sandy Lerner.' },
          { y: 1994, n: 'Yahoo!', c: 'web', t: 'Começou como "guia da web" de Jerry Yang e David Filo.' },
          { y: 1998, n: 'Google', c: 'web', t: 'Nascido do doutorado de Page e Brin.' }
        ] },
      { id: 'mv', name: 'Mountain View', tag: 'Semicondutores e buscas', fact: 'O Computer History Museum guarda boa parte dessa história.',
        items: [
          { y: 1956, n: 'Shockley Semiconductor', c: 'chip', t: 'Primeira empresa de silício da região.' },
          { y: 1968, n: 'Intel (fundação)', c: 'chip', t: 'Criada por Noyce e Moore em Mountain View.' },
          { y: 1994, n: 'Netscape', c: 'web', t: 'Navegador que levou a web ao grande público.' },
          { y: 2004, n: 'Googleplex', c: 'web', t: 'Sede do Google desde 2004.' }
        ] },
      { id: 'sv', name: 'Sunnyvale', tag: 'Chips, jogos e defesa', fact: 'A Lockheed foi, nos anos 1950–60, uma das maiores empregadoras do Vale.',
        items: [
          { y: 1956, n: 'Lockheed Missiles & Space', c: 'cap', t: 'Âncora de defesa e demanda por eletrônica.' },
          { y: 1969, n: 'AMD', c: 'chip', t: 'Fundada por Jerry Sanders e outros ex-Fairchild.' },
          { y: 1972, n: 'Atari', c: 'pc', t: 'Pong e a indústria dos videogames.' },
          { y: 1999, n: 'Yahoo! (sede)', c: 'web', t: 'O portal instalou sua sede em Sunnyvale no fim dos anos 1990.' }
        ] },
      { id: 'cu', name: 'Cupertino', tag: 'A maçã', fact: 'Em 2017 a Apple mudou para o Apple Park, um grande anel de vidro.',
        items: [
          { y: 1977, n: 'Apple (incorporação)', c: 'pc', t: 'Empresa de Jobs e Wozniak vira sociedade anônima.' },
          { y: 1984, n: 'Macintosh', c: 'pc', t: 'O Mac chegou ao mercado em janeiro de 1984.' },
          { y: 2017, n: 'Apple Park', c: 'pc', t: 'Campus circular inaugurado em 2017.' }
        ] },
      { id: 'sc', name: 'Santa Clara', tag: 'A fábrica de chips', fact: 'Intel e NVIDIA mantêm sede aqui; o nome do vale vem desta cidade.',
        items: [
          { y: 1967, n: 'Applied Materials', c: 'chip', t: 'Equipamentos para fabricar semicondutores.' },
          { y: 1971, n: 'Intel 4004', c: 'chip', t: 'Primeiro microprocessador comercial.' },
          { y: 1993, n: 'NVIDIA', c: 'chip', t: 'Sede em Santa Clara; GPUs que impulsionam a IA.' }
        ] },
      { id: 'sj', name: 'San José', tag: 'A capital do Vale', fact: 'Maior cidade do Vale do Silício, com cerca de um milhão de habitantes.',
        items: [
          { y: 1956, n: 'IBM RAMAC', c: 'pc', t: 'Primeiro disco rígido comercial, criado no laboratório da IBM.' },
          { y: 1982, n: 'Adobe', c: 'web', t: 'Software gráfico e o formato PDF; sede em San José.' },
          { y: 1995, n: 'eBay', c: 'web', t: 'Leilões online criados por Pierre Omidyar.' },
          { y: 1984, n: 'Cisco (sede)', c: 'web', t: 'Fundada em 1984; hoje sediada em San José.' }
        ] }
    ],

    /* ---------- Chips para a Lei de Moore ---------- */
    chips: [
      { id: '4004', n: 'Intel 4004', y: 1971, t: 2300, node: '10 µm', nm: 10000, brand: 'Intel', logo: 'intel-classic', clock: '740 kHz', pkg: 'DIP cerâmico · 16 pinos', die: 12,
        blurb: 'O primeiro microprocessador comercial, criado para uma calculadora da Busicom.' },
      { id: '8086', n: 'Intel 8086', y: 1978, t: 29000, node: '3 µm', nm: 3000, brand: 'Intel', logo: 'intel-classic', clock: '5 a 10 MHz', pkg: 'DIP cerâmico · 40 pinos', die: 33,
        blurb: 'Origem da arquitetura x86, que segue viva nos PCs de hoje.' },
      { id: '286', n: 'Intel 80286', y: 1982, t: 134000, node: '1,5 µm', nm: 1500, brand: 'Intel', logo: 'intel-classic', clock: '6 a 12,5 MHz', pkg: 'PGA · 68 pinos', die: 49,
        blurb: 'Trouxe o modo protegido: memória isolada e multitarefa de verdade.' },
      { id: '386', n: 'Intel 80386', y: 1985, t: 275000, node: '1,5 µm', nm: 1500, brand: 'Intel', logo: 'intel-classic', clock: '16 a 33 MHz', pkg: 'PGA · 132 pinos', die: 104,
        blurb: 'Os 32 bits que abriram caminho para o Windows e o Linux modernos.' },
      { id: '486', n: 'Intel 80486', y: 1989, t: 1180000, node: '1 µm', nm: 1000, brand: 'Intel', logo: 'intel-classic', clock: '25 a 50 MHz', pkg: 'PGA · 168 pinos', die: 173,
        blurb: 'Primeiro da família com cache e unidade de ponto flutuante no mesmo chip.' },
      { id: 'p5', n: 'Pentium', y: 1993, t: 3100000, node: '0,8 µm', nm: 800, brand: 'Intel', logo: 'pentium', clock: '60 e 66 MHz', pkg: 'PGA · 273 pinos', die: 294,
        blurb: 'Superescalar: executa duas instruções por ciclo. Ganhou nome no lugar de número.' },
      { id: 'p3', n: 'Pentium III', y: 1999, t: 9500000, node: '250 nm', nm: 250, brand: 'Intel', logo: 'pentium3', clock: '450 a 600 MHz', pkg: 'Cartucho Slot 1', die: 128,
        blurb: 'Instruções SSE e o último Pentium vendido em cartucho Slot 1.' },
      { id: 'p4', n: 'Pentium 4', y: 2000, t: 42000000, node: '180 nm', nm: 180, brand: 'Intel', logo: 'intel-classic', clock: '1,3 a 2 GHz', pkg: 'FC-PGA · Socket 423/478', die: 217,
        blurb: 'Pipeline longo e frequências altíssimas, ao custo de muito calor.' },
      { id: 'c2d', n: 'Core 2 Duo', y: 2006, t: 291000000, node: '65 nm', nm: 65, brand: 'Intel', logo: 'intel-2006', clock: '1,8 a 3 GHz', pkg: 'LGA 775 com tampa metálica', die: 143,
        blurb: 'Dois núcleos eficientes: o fim da corrida por gigahertz.' },
      { id: 'i7', n: 'Core i7 (Nehalem)', y: 2008, t: 731000000, node: '45 nm', nm: 45, brand: 'Intel', logo: 'intel-2006', clock: '2,66 a 3,2 GHz', pkg: 'LGA 1366 com tampa metálica', die: 263,
        blurb: 'Controlador de memória integrado, L3 compartilhado e Turbo Boost.' },
      { id: 'a7', n: 'Apple A7', y: 2013, t: 1000000000, node: '28 nm', nm: 28, brand: 'Apple', logo: 'apple', clock: '1,3 GHz', pkg: 'SoC empilhado com a RAM', die: 102,
        blurb: 'O primeiro processador de 64 bits num smartphone, no iPhone 5s.' },
      { id: 'a11', n: 'Apple A11 Bionic', y: 2017, t: 4300000000, node: '10 nm', nm: 10, brand: 'Apple', logo: 'apple', clock: '2,39 GHz', pkg: 'SoC empilhado com a RAM', die: 88,
        blurb: 'Seis núcleos e o primeiro Neural Engine da Apple.' },
      { id: 'm1', n: 'Apple M1', y: 2020, t: 16000000000, node: '5 nm', nm: 5, brand: 'Apple', logo: 'apple-m1', clock: '3,2 GHz', pkg: 'SoC com RAM unificada no pacote', die: 119,
        blurb: 'CPU, GPU, Neural Engine e memória num só chip: o início do Apple Silicon.' },
      { id: 'h100', n: 'NVIDIA H100', y: 2022, t: 80000000000, node: '4 nm', nm: 4, brand: 'NVIDIA', logo: 'nvidia', clock: 'até ~2 GHz', pkg: 'Módulo SXM com 80 GB de HBM3', die: 814,
        blurb: 'A GPU que treina os grandes modelos de IA, com 80 bilhões de transistores.' }
    ],

    /* ---------- Fundadores ---------- */
    people: [
      { id: 'terman', name: 'Frederick Terman', role: 'O professor que plantou o Vale', years: '1900 – 1982', ini: 'FT', hue: 38,
        short: 'Orientou alunos, incentivou startups e criou o parque industrial de Stanford.',
        bio: 'Professor e depois provost de Stanford, Terman acreditava em "torres de excelência" (steeples of excellence) e em aproximar a universidade da indústria. Orientou Hewlett e Packard, apoiou a HP e idealizou o parque industrial que atraiu empresas de tecnologia. Muitos o chamam de "pai do Vale do Silício".' },
      { id: 'hp', name: 'Bill Hewlett e Dave Packard', role: 'Os da garagem', years: '1913 – 2001 · 1912 – 1996', ini: 'HP', hue: 210,
        short: 'US$ 538, uma garagem e uma moeda jogada para decidir o nome da empresa.',
        bio: 'Colegas de Stanford, fundaram a Hewlett-Packard em 1939. O nome saiu de uma moeda jogada ao ar. Criaram o "HP Way", uma cultura de confiança, horário flexível e participação nos lucros, que influenciou toda a geração seguinte de empresas do Vale.' },
      { id: 'shockley', name: 'William Shockley', role: 'O co-inventor do transistor', years: '1910 – 1989', ini: 'WS', hue: 12,
        short: 'Nobel de Física em 1956; trouxe o silício para o Vale. Um gestor difícil e uma figura controversa.',
        bio: 'Co-inventor do transistor e Nobel de Física em 1956, Shockley abriu seu laboratório em Mountain View e atraiu os jovens que depois fundariam a Fairchild. Seu estilo autoritário provocou a saída dos "Oito Traidores". Mais tarde, tornou-se conhecido por defender publicamente teorias eugenistas e racistas, rejeitadas pela comunidade científica.' },
      { id: 'noyce', name: 'Robert Noyce', role: 'O "prefeito" do Vale', years: '1927 – 1990', ini: 'RN', hue: 160,
        short: 'Co-inventor do circuito integrado, cofundador da Fairchild e da Intel.',
        bio: 'Físico carismático, ajudou a criar a Fairchild e a Intel e concebeu o circuito integrado monolítico. Instalou na Intel uma cultura informal e sem hierarquias rígidas: sem vagas reservadas, sem salas fechadas, tomando decisões rápido. Era chamado de "o prefeito do Vale do Silício".' },
      { id: 'moore', name: 'Gordon Moore', role: 'Autor da lei que leva seu nome', years: '1929 – 2023', ini: 'GM', hue: 275,
        short: 'Em 1965 observou que o número de componentes por chip dobrava em ritmo regular.',
        bio: 'Químico de formação, cofundou a Fairchild e a Intel. Em 1965 publicou o artigo que previa a duplicação anual de componentes por circuito integrado e, em 1975, revisou o ritmo para cerca de dois anos. A "Lei de Moore" virou meta e profecia autorrealizável da indústria.' },
      { id: 'jobs', name: 'Steve Jobs e Steve Wozniak', role: 'Visão e engenharia', years: '1955 – 2011 · nascido em 1950', ini: 'SJ', hue: 330,
        short: 'Dois amigos, uma garagem em Los Altos e o computador que entrou em casa.',
        bio: 'Wozniak projetou os primeiros Apple I e II; Jobs enxergou o produto e o mercado. Juntos fundaram a Apple em 1976. Jobs foi afastado em 1985, fundou a NeXT, comprou a Pixar e voltou à Apple em 1997 para liderar o Mac, o iPod, o iPhone e o iPad.' },
      { id: 'conway', name: 'Lynn Conway', role: 'Chips ao alcance de estudantes', years: '1938 – 2024', ini: 'LC', hue: 190,
        short: 'Co-autora do método Mead-Conway, que democratizou o projeto de circuitos integrados.',
        bio: 'Engenheira e cientista da computação, trabalhou na Xerox PARC e, com Carver Mead, publicou o método de projeto VLSI (1978 – 79), que permitiu que universidades e pequenas equipes desenhassem chips. Foi também uma pioneira de pesquisa em arquitetura de computadores, e depois uma voz importante pela inclusão na ciência.' },
      { id: 'pagebrin', name: 'Larry Page e Sergey Brin', role: 'Do doutorado ao PageRank', years: 'ambos nascidos em 1973', ini: 'PB', hue: 55,
        short: 'Dois doutorandos de Stanford que organizaram a internet com um algoritmo.',
        bio: 'Page e Brin criaram o PageRank, que classificava páginas pelos links recebidos, e fundaram o Google em 1998. A empresa abriu capital em 2004 e se tornou a Alphabet em 2015, uma das maiores companhias do mundo.' }
    ],

    /* ---------- DNA do Vale ---------- */
    dna: [
      { id: 'uni', name: 'Universidades', stat: '1891', statLabel: 'Stanford abre as portas',
        text: 'Stanford e Berkeley formam engenheiros, pesquisadores e fundadores. Frederick Terman incentivava os alunos a abrir empresas e arrendou terras da universidade para a indústria: a pesquisa saiu do laboratório e foi para o mercado.',
        ex: 'Google, Cisco, Yahoo e Sun nasceram no campus de Stanford.' },
      { id: 'vc', name: 'Capital de risco', stat: '1972', statLabel: 'Sand Hill Road',
        text: 'Investidores como Arthur Rock financiaram a Fairchild e a Intel. Em 1972, Kleiner Perkins e Sequoia abriram escritório em Menlo Park. O modelo é simples: aceitar que muitas apostas falhem em troca de poucas que mudam o mundo.',
        ex: 'Apple, Google e Cisco receberam capital de risco antes de abrir capital.' },
      { id: 'mob', name: 'Mobilidade de talentos', stat: '§ 16600', statLabel: 'Lei da Califórnia',
        text: 'Na Califórnia, cláusulas de não concorrência costumam ser inválidas. Engenheiros podem sair de uma empresa e abrir uma concorrente, e o conhecimento circula. A pesquisadora AnnaLee Saxenian mostrou como isso diferenciou o Vale da região de Boston.',
        ex: 'A Fairchild gerou mais de dez empresas relevantes, os "Fairchildren".' },
      { id: 'gov', name: 'Defesa e governo', stat: '1939', statLabel: 'NASA Ames nasce',
        text: 'Laboratórios como o Ames (1939) e contratos da Guerra Fria sustentaram a região. Programas como o Apollo e o míssil Minuteman estiveram entre os primeiros grandes compradores de circuitos integrados, o que ajudou a derrubar os preços.',
        ex: 'A Lockheed Missiles & Space, em Sunnyvale, era uma das maiores empregadoras do Vale nos anos 1960.' },
      { id: 'cul', name: 'Cultura de garagem', stat: '1975', statLabel: 'Homebrew Computer Club',
        text: 'Informalidade, contracultura e a ideia de que falhar faz parte do processo. Clubes de hobistas como o Homebrew, em Menlo Park, juntavam gente para trocar projetos e peças, e dali saíram Wozniak e a primeira geração de computadores pessoais.',
        ex: 'HP, Apple e Google foram, em algum momento, "projetos de garagem".' }
    ],

    /* ---------- Quiz ---------- */
    quiz: [
      { q: 'Em que ano Hewlett e Packard abriram a HP na garagem de Palo Alto?', o: ['1939', '1957', '1968', '1976'], a: 0,
        e: 'Foi em 1939, com US$ 538 de capital e um oscilador de áudio como primeiro produto.' },
      { q: 'Quem é chamado de "pai do Vale do Silício", professor de Stanford que incentivou seus alunos a abrir empresas?', o: ['William Shockley', 'Frederick Terman', 'Robert Noyce', 'Steve Jobs'], a: 1,
        e: 'Frederick Terman orientou Hewlett e Packard e criou o parque industrial de Stanford.' },
      { q: 'Como ficou conhecido o grupo de oito engenheiros que saiu do laboratório de Shockley e fundou a Fairchild?', o: ['Os Oito Traidores', 'Os Pioneiros do Silício', 'A Gangue do Transistor', 'Os Fairchildren'], a: 0,
        e: '"Traitorous Eight", apelido atribuído a Shockley. "Fairchildren" são as empresas e pessoas que surgiram depois.' },
      { q: 'Qual jornalista popularizou o nome "Silicon Valley", em 1971?', o: ['Walter Isaacson', 'Don Hoefler', 'Steven Levy', 'Tom Wolfe'], a: 1,
        e: 'Don Hoefler publicou a série "Silicon Valley U.S.A." na Electronic News, em janeiro de 1971.' },
      { q: 'Qual foi a primeira mensagem enviada pela ARPANET, em 1969, entre a UCLA e o SRI?', o: ['HELLO', 'LOGIN', 'LO', 'HI'], a: 2,
        e: 'O sistema travou depois de "LO", o início de "LOGIN".' },
      { q: 'Quantos transistores tinha o Intel 4004, o primeiro microprocessador comercial (1971)?', o: ['2.300', '23.000', '230.000', '2,3 milhões'], a: 0,
        e: 'Apenas 2.300. O NVIDIA H100, de 2022, tem cerca de 80 bilhões.' }
    ],

    /* ---------- Conquistas do passaporte ---------- */
    achievements: [
      { id: 'cp1', name: 'Primeiro commit', desc: 'Abra o seu primeiro checkpoint da travessia.' },
      { id: 'cp10', name: 'Historiador', desc: 'Abra 10 checkpoints.' },
      { id: 'cp20', name: 'Arquivista do Vale', desc: 'Abra todos os 20 checkpoints.' },
      { id: 'journey', name: 'Viajante do tempo', desc: 'Percorra a viagem do herói até o fim.' },
      { id: 'stations', name: 'Maquinista', desc: 'Visite todas as paradas da Linha do Vale.' },
      { id: 'moore', name: 'Lei de Moore', desc: 'Explore a curva de transistores.' },
      { id: 'people4', name: 'Networking', desc: 'Conheça 4 fundadores.' },
      { id: 'dna', name: 'Ecossistema', desc: 'Explore os 5 ingredientes do Vale.' },
      { id: 'quiz', name: 'Gênio do Vale', desc: 'Acerte todas as perguntas do quiz.' },
      { id: 'theme', name: 'Dois lados', desc: 'Alterne entre o tema claro e o escuro.' }
    ],

    levels: [
      { xp: 0, name: 'Curioso' },
      { xp: 50, name: 'Estagiário' },
      { xp: 120, name: 'Engenheiro' },
      { xp: 220, name: 'Fundador' },
      { xp: 350, name: 'Capitalista de risco' },
      { xp: 480, name: 'Lenda do Vale' }
    ]
  };
})();
