/* HYPEX · catálogo da loja
   Para cadastrar um produto novo, copie um item de PRODUTOS e troque os dados.
   Preços em centavos. "de" é o preço antigo, quando a peça está em promoção. */
(function () {
  'use strict';

  /* Cada cor define a peça (a, b, c) e a parede que aparece atrás dela (fundo, tinta). */
  const CORES = {
    cafe:      { nome: 'Café', a: '#4A3428', b: '#C9A98A', c: '#D9B36C', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Marrom' },
    prata:     { nome: 'Prata e laranja', a: '#AEB4C0', b: '#FF6A1F', c: '#14112B', fundo: '#8F979B', tinta: '#1A1A1C', familia: 'Cinza' },
    tangerina: { nome: 'Terracota', a: '#B4562C', b: '#FFD3B8', c: '#2417B8', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Laranja' },
    arara:     { nome: 'Carmim', a: '#8E1F2F', b: '#FFC91F', c: '#1B2BD6', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Vermelho' },
    canario:   { nome: 'Mostarda', a: '#B88A2C', b: '#14112B', c: '#E5173F', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Amarelo' },
    cobalto:   { nome: 'Azul profundo', a: '#2A4590', b: '#BFD0FF', c: '#FFC91F', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Azul' },
    turquesa:  { nome: 'Petróleo', a: '#1F4E5A', b: '#0B4F6C', c: '#FFE14D', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Azul' },
    mata:      { nome: 'Verde floresta', a: '#234A3A', b: '#F3F1EA', c: '#FF6A1F', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Verde' },
    limao:     { nome: 'Oliva', a: '#6E7240', b: '#1D3B2A', c: '#FF4F9A', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Verde' },
    lavanda:   { nome: 'Lilás', a: '#A89BB5', b: '#F0E9FF', c: '#14112B', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Roxo' },
    violeta:   { nome: 'Berinjela', a: '#44304F', b: '#D8C3FF', c: '#C6E82B', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Roxo' },
    chiclete:  { nome: 'Rosé', a: '#C79A9A', b: '#FFD6E8', c: '#14112B', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Rosa' },
    vinho:     { nome: 'Vinho', a: '#5E1A2B', b: '#E8B5C8', c: '#FFC91F', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Vermelho' },
    areia:     { nome: 'Areia', a: '#E7D8BC', b: '#8A6A44', c: '#E5173F', fundo: '#2F2F2D', tinta: '#FFFFFF', familia: 'Bege' },
    grafite:   { nome: 'Grafite', a: '#2C2B3A', b: '#6F6D86', c: '#FF6A1F', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Preto' },
    neve:      { nome: 'Off-white', a: '#F4F2EA', b: '#CFCBDD', c: '#2346E8', fundo: '#8F979B', tinta: '#1A1A1C', familia: 'Branco' },
    jeans:     { nome: 'Jeans médio', a: '#3F6DA8', b: '#2E5284', c: '#F2C879', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Azul' },
    escuro:    { nome: 'Jeans escuro', a: '#1E2F52', b: '#14213B', c: '#F2C879', fundo: '#D9D6CF', tinta: '#1A1A1C', familia: 'Azul' }
  };

  const DEPARTAMENTOS = {
    tenis:      { nome: 'Tênis', exp: 'prateleira', cor: '#34332F', tinta: '#FFFFFF', frase: 'Uma outra perspectiva.' },
    meias:      { nome: 'Meias', exp: 'arara', cor: '#E4E5E2', tinta: '#1A1A1C', frase: 'A menor peça do look, e a que mais aparece.' },
    intima:     { nome: 'Roupa íntima', exp: 'arara', cor: '#E4E5E2', tinta: '#1A1A1C', frase: 'Algodão, elástico macio e cor onde só você vê.' },
    casacos:    { nome: 'Casacos', exp: 'arara', cor: '#E4E5E2', tinta: '#1A1A1C', frase: 'Arraste a arara. Tem casaco para garoa, vento e frio de verdade.' },
    roupas:     { nome: 'Roupas', exp: 'arara', cor: '#E4E5E2', tinta: '#1A1A1C', frase: 'Camisetas, calças, vestidos e tudo o que vai entre elas.' },
  };

  const ESTILOS = {
    street:     { nome: 'Street', cor: '#2F2F2D', frase: 'Corte largo, recorte de cor, sola alta.' },
    casual:     { nome: 'Casual', cor: '#8F979B', frase: 'O que você veste sem pensar, e fica bom.' },
    esporte:    { nome: 'Esporte', cor: '#C9CCCB', frase: 'Tecido que seca rápido e não atrapalha.' },
    alfaiataria:{ nome: 'Alfaiataria', cor: '#3C3A38', frase: 'Vinco na calça e blazer sem gravata.' },
    praia:      { nome: 'Praia', cor: '#D9D6CF', frase: 'Da areia para o almoço, sem trocar de roupa.' }
  };

  const T = {
    roupa: ['PP', 'P', 'M', 'G', 'GG', 'XG'],
    calca: ['36', '38', '40', '42', '44', '46', '48'],
    tenis: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],
    meia: ['34-38', '39-44'],
    intima: ['P', 'M', 'G', 'GG'],
    unico: ['Único']
  };

  const P = (id, nome, dep, art, preco, cores, cfg) => Object.assign({
    id, nome, dep, art, preco, cores, o: {}, modelos: [{ n: 'Padrão', o: {} }], tam: T.roupa, esgotados: [],
    estilos: ['casual'], publico: 'Unissex', desc: '', detalhes: []
  }, cfg);

  const camiseta = { manga: 'curta', gola: 'careca', hy: 322, largo: 2 };
  const moletom = { manga: 'longa', gola: 'capuz', hy: 332, barra: 24, largo: 8 };

  const PRODUTOS = [
    /* ---------- TÊNIS ---------- */
    P('cometa', 'Cometa', 'tenis', 'tenis', 49900, ['areia', 'tangerina', 'cobalto', 'grafite'], {
      o: { estilo: 'run', sola: 'ar' }, tam: T.tenis, esgotados: ['34', '44'], estilos: ['street', 'esporte'],
      modelos: [{ n: 'Sola alta', o: {} }, { n: 'Sola com ar', o: { sola: 'ar' } }],
      desc: 'Corrida de cidade com duas cápsulas de ar no calcanhar.', detalhes: ['Cabedal em tela respirável', 'Duas cápsulas de ar', 'Palmilha removível', 'Peso: 290 g no tamanho 40']
    }),
    P('quadra', 'Quadra 80', 'tenis', 'tenis', 39900, ['neve', 'mata', 'arara', 'cobalto'], {
      o: { estilo: 'quadra', sola: 'lisa', corExt: '#F3F1EA' }, tam: T.tenis, estilos: ['street', 'casual'],
      modelos: [{ n: 'Cano baixo', o: {} }, { n: 'Cano alto', o: { alto: true } }],
      desc: 'O clássico de quadra, com biqueira furadinha e calcanhar em contraste.', detalhes: ['Couro sintético de toque macio', 'Biqueira perfurada', 'Sola vulcanizada']
    }),
    P('bolha', 'Bolha', 'tenis', 'tenis', 59900, ['cobalto', 'grafite', 'lavanda', 'neve'], {
      o: { estilo: 'bolha', sola: 'ar' }, tam: T.tenis, esgotados: ['35'], estilos: ['street'], de: 69900,
      desc: 'Gomos acolchoados por toda a lateral e sola transparente.', detalhes: ['Painéis acolchoados', 'Sola com cápsulas de ar', 'Forro de malha macia']
    }),
    P('atelie', 'Ateliê', 'tenis', 'tenis', 54900, ['lavanda', 'areia', 'neve', 'grafite'], {
      o: { estilo: 'chunky', sola: 'chunky' }, tam: T.tenis, estilos: ['street'],
      desc: 'Sola alta e camadas sobrepostas para quem gosta de presença.', detalhes: ['Sola alta de 5 cm', 'Três camadas de recorte', 'Cadarço chato']
    }),
    P('trilha', 'Trilha Norte', 'tenis', 'tenis', 62900, ['grafite', 'mata', 'tangerina'], {
      o: { estilo: 'trilha', sola: 'trilha' }, tam: T.tenis, esgotados: ['34', '35'], estilos: ['esporte'],
      desc: 'Solado com cravos para terra molhada e cabedal reforçado.', detalhes: ['Cravos de 4 mm', 'Biqueira reforçada', 'Repele água leve']
    }),
    P('retro', 'Retrô 78', 'tenis', 'tenis', 34900, ['areia', 'vinho', 'cobalto'], {
      o: { estilo: 'retro', sola: 'fina', corSola: '#F3F1EA', corExt: '#D59A4B' }, tam: T.tenis, estilos: ['casual'], de: 44900,
      desc: 'Perfil baixo de corrida dos anos 70, em camurça e nylon.', detalhes: ['Camurça sintética', 'Solado de borracha cor de mel', 'Perfil baixo']
    }),
    P('pilar', 'Pilar', 'tenis', 'tenis', 57900, ['grafite', 'neve', 'canario'], {
      o: { estilo: 'pilar', alto: true, sola: 'crepe', corSola: '#C89B5C', corExt: '#2346E8' }, tam: T.tenis, estilos: ['street'],
      modelos: [{ n: 'Sem tira', o: {} }, { n: 'Com tira', o: { tira: true } }],
      desc: 'Cano alto com colarinho acolchoado e sola de crepe.', detalhes: ['Colarinho acolchoado', 'Sola de crepe', 'Etiqueta bordada no cano']
    }),
    P('lua', 'Lua', 'tenis', 'tenis', 42900, ['neve', 'areia', 'grafite'], {
      o: { estilo: 'slip', sola: 'lisa', corExt: '#CFCBDD' }, tam: T.tenis, estilos: ['casual', 'alfaiataria'],
      desc: 'Sem cadarço, com biqueira espelhada. Calça em dois segundos.', detalhes: ['Elástico oculto', 'Biqueira metalizada', 'Bom com calça de alfaiataria']
    }),
    P('couro', 'Couro Bloco', 'tenis', 'tenis', 46900, ['neve', 'grafite', 'areia'], {
      o: { estilo: 'couro', sola: 'lisa', corExt: '#CFCBDD' }, tam: T.tenis, estilos: ['casual', 'alfaiataria'],
      desc: 'Minimalista, com o calcanhar em um bloco de cor.', detalhes: ['Couro legítimo', 'Forro de couro', 'Costura aparente']
    }),
    P('onda', 'Onda', 'tenis', 'tenis', 38900, ['chiclete', 'grafite', 'neve', 'lavanda'], {
      o: { estilo: 'tricot', sola: 'onda', corSola: '#F3F1EA' }, tam: T.tenis, estilos: ['esporte', 'casual'],
      desc: 'Tricô de calçar como meia, sobre uma sola em ondas.', detalhes: ['Cabedal em tricô', 'Sola esculpida', 'Lavável à mão']
    }),

    /* ---------- MEIAS ---------- */
    P('alto', 'Cano Alto Listra', 'meias', 'meia', 3990, ['neve', 'grafite', 'cobalto', 'arara'], {
      o: { cano: 'alto', listras: 3 }, tam: T.meia, estilos: ['street', 'esporte'],
      modelos: [{ n: 'Cano alto', o: { cano: 'alto' } }, { n: 'Cano médio', o: { cano: 'medio' } }],
      desc: 'A meia para aparecer acima do tênis.', detalhes: ['80% algodão', 'Punho reforçado', 'Par único']
    }),
    P('soquete', 'Soquete Caxemira', 'meias', 'meia', 6990, ['areia', 'grafite', 'vinho'], {
      o: { cano: 'soquete', faixa: true }, tam: T.meia, estilos: ['casual'],
      desc: 'Canelado fino em fio com caxemira, macio do punho à ponta.', detalhes: ['Fio com caxemira', 'Canelado fino', 'Calcanhar reforçado']
    }),
    P('corrida', 'Corrida Pro', 'meias', 'meia', 4990, ['grafite', 'neve', 'tangerina'], {
      o: { cano: 'medio', faixa: true }, tam: T.meia, estilos: ['esporte'],
      desc: 'Compressão no arco do pé e tecido que seca rápido.', detalhes: ['Compressão leve', 'Zonas de ventilação', 'Antiodor']
    }),
    P('bolinha', 'Bolinhas', 'meias', 'meia', 2990, ['neve', 'lavanda', 'canario'], {
      o: { cano: 'medio', bolinhas: true }, tam: T.meia, publico: 'Feminino', estilos: ['casual'], de: 3990,
      desc: 'Bolinhas contrastantes para sair do comum.', detalhes: ['Algodão macio', 'Punho sem elástico apertado']
    }),
    P('social', 'Social Fina', 'meias', 'meia', 3490, ['vinho', 'grafite', 'escuro'], {
      o: { cano: 'alto' }, tam: T.meia, publico: 'Masculino', estilos: ['alfaiataria'],
      desc: 'Cano longo que não cai, para usar com sapato ou tênis limpo.', detalhes: ['Fio de bambu', 'Punho firme']
    }),
    P('felpuda', 'Felpuda', 'meias', 'meia', 4490, ['areia', 'neve', 'lavanda'], {
      o: { cano: 'medio', felpa: true }, tam: T.meia, estilos: ['casual'],
      desc: 'A meia de ficar em casa nos dias frios.', detalhes: ['Felpa interna', 'Solado com grip']
    }),

    /* ---------- ROUPA ÍNTIMA ---------- */
    P('boxer', 'Boxer Algodão', 'intima', 'cueca', 4990, ['grafite', 'cobalto', 'mata', 'neve'], {
      o: { corte: 'boxer' }, tam: T.intima, publico: 'Masculino',
      modelos: [{ n: 'Boxer', o: { corte: 'boxer' } }, { n: 'Boxer longa', o: { corte: 'longa' } }, { n: 'Slip', o: { corte: 'slip' } }],
      desc: 'Algodão com elastano e cós largo que não enrola.', detalhes: ['95% algodão, 5% elastano', 'Cós bordado', 'Costura plana']
    }),
    P('boxerlistra', 'Boxer Listrada', 'intima', 'cueca', 5490, ['neve', 'cobalto', 'grafite'], {
      o: { corte: 'boxer', listras: true }, tam: T.intima, publico: 'Masculino', de: 6990,
      desc: 'Listra fina vertical, como a dos pijamas antigos.', detalhes: ['Algodão fio 40', 'Cós bordado']
    }),
    P('calcinha', 'Calcinha Biquíni', 'intima', 'calcinha', 5990, ['areia', 'neve', 'grafite', 'vinho'], {
      o: { corte: 'biquini' }, tam: T.intima, publico: 'Feminino',
      modelos: [{ n: 'Biquíni', o: { corte: 'biquini' } }, { n: 'Cintura alta', o: { corte: 'alta' } }],
      desc: 'Microfibra sem costura, com bordas coladas que não marcam na roupa.', detalhes: ['Microfibra macia', 'Forro de algodão']
    }),
    P('sutia', 'Sutiã Sem Aro', 'intima', 'sutia', 7990, ['areia', 'neve', 'grafite', 'vinho'], {
      o: {}, tam: T.intima, publico: 'Feminino', esgotados: ['GG'],
      desc: 'Sustenta sem aro e tem alças reguláveis.', detalhes: ['Sem aro', 'Bojo removível', 'Alças reguláveis']
    }),
    P('topesporte', 'Top Treino', 'intima', 'top', 8990, ['grafite', 'violeta', 'neve'], {
      o: { manga: 'regata', gola: 'careca', hy: 214, barra: 22, barraL: 66, largo: -6, painel: true, marca: true }, tam: T.intima, publico: 'Feminino', estilos: ['esporte'],
      desc: 'Sustentação média, para corrida leve e academia.', detalhes: ['Secagem rápida', 'Faixa elástica larga']
    }),
    P('regatainterna', 'Regata Canelada', 'intima', 'top', 5990, ['neve', 'grafite', 'areia'], {
      o: { manga: 'regata', gola: 'careca', hy: 318, largo: -4, listras: false }, tam: T.intima,
      desc: 'Canelada e ajustada: vai por baixo ou sozinha.', detalhes: ['Algodão canelado', 'Ajuste ao corpo']
    }),

    /* ---------- CASACOS ---------- */
    P('aurora', 'Jaqueta Aurora', 'casacos', 'tecnica', 79900, ['prata', 'grafite', 'cobalto', 'limao'], {
      o: { corpo: null }, estilos: ['street', 'esporte'], esgotados: ['PP'],
      desc: 'Nylon impermeável, capuz regulável e seis bolsos. Pronta para a chuva.', detalhes: ['Nylon impermeável', 'Forro de tela', 'Seis bolsos com zíper', 'Barra e capuz com cordão']
    }),
    P('puffer', 'Puffer Inverno', 'casacos', 'top', 69900, ['grafite', 'neve', 'vinho', 'mata'], {
      o: { manga: 'longa', gola: 'alta', puffer: true, ziper: true, hy: 318, largo: 18, barraL: 88, barra: 12, brilho: true }, estilos: ['street', 'casual'], de: 89900,
      modelos: [{ n: 'Curto', o: { hy: 318 } }, { n: 'Longo', o: { hy: 410 } }],
      desc: 'Enchimento leve que esquenta de verdade e cabe na mochila.', detalhes: ['Enchimento térmico', 'Guarda em bolsa própria', 'Punho elástico']
    }),
    P('cortavento', 'Corta-Vento Faixa', 'casacos', 'top', 34900, ['mata', 'grafite', 'tangerina', 'areia'], {
      o: { manga: 'longa', gola: 'alta', bloco: true, ziper: true, hy: 322, largo: 10, barra: 10, bolso: 'laterais', brilho: true }, estilos: ['esporte', 'casual'],
      desc: 'Leve, com faixa de cor no ombro. Dobra e vai na bolsa.', detalhes: ['Tecido corta-vento', 'Bolsos com zíper', 'Pesa só 180 g']
    }),
    P('jaquetajeans', 'Jeans Oficina', 'casacos', 'top', 32900, ['jeans', 'escuro'], {
      o: { manga: 'longa', gola: 'polo', botoes: 34, hy: 280, largo: 8, bolso: 'jeans', barra: 18, corPunho: null }, estilos: ['casual', 'street'],
      desc: 'Jaqueta jeans de corte reto, com pesponto cor de mel.', detalhes: ['Jeans 100% algodão', 'Botões de metal', 'Dois bolsos no peito']
    }),
    P('trench', 'Trench Garoa', 'casacos', 'top', 64900, ['areia', 'grafite', 'vinho'], {
      o: { manga: 'longa', gola: 'alfaiate', hy: 432, largo: 6, barraL: 94, cinto: 226, trespasse: true, punho: false }, estilos: ['alfaiataria'],
      desc: 'Longo, trespassado e com cinto. Para os dias de garoa fina.', detalhes: ['Repele água leve', 'Cinto removível', 'Forro xadrez']
    }),
    P('capuzzip', 'Moletom Zíper', 'casacos', 'top', 25900, ['mata', 'grafite', 'neve', 'areia', 'cobalto'], {
      o: Object.assign({}, moletom, { ziper: true, bolso: 'laterais' }), estilos: ['street', 'casual'],
      desc: 'Moletom pesado de 450 g, felpado por dentro.', detalhes: ['Algodão 450 g/m²', 'Felpado por dentro', 'Zíper de duas vias']
    }),
    P('blazer', 'Blazer Solto', 'casacos', 'top', 49900, ['vinho', 'grafite', 'neve', 'areia'], {
      o: { manga: 'longa', gola: 'alfaiate', hy: 344, largo: 6, punho: false, bolso: 'laterais' }, estilos: ['alfaiataria'],
      desc: 'Blazer sem ombreira, para usar por cima de camiseta.', detalhes: ['Sem ombreira', 'Forro parcial', 'Dois botões']
    }),
    P('fleece', 'Fleece Serra', 'casacos', 'top', 29900, ['areia', 'grafite', 'mata'], {
      o: { manga: 'longa', gola: 'alta', hy: 320, largo: 10, barra: 12, bolso: 'peito', bloco: false, corPunho: null, ziper: false }, estilos: ['casual'], de: 37900,
      desc: 'Pelo macio com bolso no peito, para o frio de serra.', detalhes: ['Fleece reciclado', 'Bolso com zíper', 'Punho com viés']
    }),

    /* ---------- ROUPAS ---------- */
    P('pesada', 'Camiseta Pesada', 'roupas', 'top', 8990, ['neve', 'grafite', 'areia', 'tangerina', 'cobalto', 'mata'], {
      o: Object.assign({}, camiseta), estilos: ['street', 'casual'],
      modelos: [{ n: 'Regular', o: {} }, { n: 'Oversized', o: { largo: 16, hy: 340, barraL: 82 } }, { n: 'Cropped', o: { hy: 240 } }],
      desc: 'Malha de 240 g que não fica transparente nem amassa à toa.', detalhes: ['Algodão 240 g/m²', 'Gola canelada', 'Pré-encolhida']
    }),
    P('estampa', 'Camiseta Hypex', 'roupas', 'top', 15990, ['grafite', 'neve', 'areia'], {
      o: Object.assign({}, camiseta, { estampa: true }), estilos: ['street'],
      desc: 'Malha encorpada com um X pequeno bordado tom sobre tom no peito.', detalhes: ['Bordado tom sobre tom', 'Algodão 240 g/m²']
    }),
    P('listrada', 'Camiseta Listrada', 'roupas', 'top', 9990, ['neve', 'cobalto', 'arara'], {
      o: Object.assign({}, camiseta, { listras: true }), estilos: ['casual', 'praia'], de: 12990,
      desc: 'Listras largas, jeito de férias o ano inteiro.', detalhes: ['Malha fio tinto', 'Listras tingidas no fio']
    }),
    P('polo', 'Polo Piquet', 'roupas', 'top', 13990, ['mata', 'vinho', 'neve', 'cobalto'], {
      o: { manga: 'curta', gola: 'polo', hy: 324, marca: true }, publico: 'Masculino', estilos: ['alfaiataria', 'casual'],
      desc: 'Piquet encorpado com gola que fica no lugar.', detalhes: ['Algodão piquet', 'Dois botões', 'Logo bordado']
    }),
    P('camisa', 'Camisa Linho', 'roupas', 'top', 19990, ['areia', 'neve', 'lavanda', 'turquesa'], {
      o: { manga: 'longa', gola: 'camisa', hy: 342, punho: true }, estilos: ['alfaiataria', 'praia'],
      modelos: [{ n: 'Manga longa', o: { manga: 'longa' } }, { n: 'Manga curta', o: { manga: 'curta' } }],
      desc: 'Linho leve, bom para calor e para reunião.', detalhes: ['55% linho, 45% algodão', 'Botões de casca', 'Corte reto']
    }),
    P('regata', 'Regata Tricô', 'roupas', 'top', 16900, ['neve', 'grafite', 'vinho', 'areia'], {
      o: { manga: 'regata', gola: 'careca', hy: 318, largo: 4 }, estilos: ['alfaiataria', 'casual'],
      desc: 'Tricô canelado fino, gola alta e acabamento limpo nas cavas.', detalhes: ['Tricô canelado', 'Gola alta', 'Ajuste ao corpo']
    }),
    P('capuz', 'Moletom Canguru', 'roupas', 'top', 21900, ['grafite', 'neve', 'areia', 'mata', 'vinho'], {
      o: Object.assign({}, moletom, { bolso: 'canguru' }), estilos: ['street', 'casual'], esgotados: ['XG'],
      modelos: [{ n: 'Com capuz', o: { gola: 'capuz' } }, { n: 'Gola careca', o: { gola: 'careca' } }],
      desc: 'Bolso canguru grande, capuz forrado e caimento largo.', detalhes: ['Algodão 400 g/m²', 'Capuz forrado', 'Cordão chato']
    }),
    P('cargo', 'Calça Cargo', 'roupas', 'calca', 24900, ['mata', 'areia', 'grafite', 'lavanda'], {
      o: { cargo: true, boca: 52, quadril: 86 }, tam: T.calca, estilos: ['street'], esgotados: ['36'],
      modelos: [{ n: 'Reta', o: { boca: 52 } }, { n: 'Balão', o: { boca: 66 } }, { n: 'Bermuda', o: { hy: 262, boca: 56 } }],
      desc: 'Bolsos laterais com aba e tecido que aguenta o dia a dia.', detalhes: ['Sarja 100% algodão', 'Dois bolsos com aba', 'Barra ajustável']
    }),
    P('alfaiatada', 'Calça Vinco', 'roupas', 'calca', 22900, ['grafite', 'areia', 'vinho', 'neve'], {
      o: { vinco: true, boca: 58, quadril: 82, bolsoFrente: true }, tam: T.calca, estilos: ['alfaiataria'],
      desc: 'Cintura alta, vinco marcado e perna larga.', detalhes: ['Tecido de alfaiataria', 'Vinco permanente', 'Cós com passantes']
    }),
    P('jeansreta', 'Jeans Reta', 'roupas', 'calca', 19900, ['jeans', 'escuro'], {
      o: { jeans: true, boca: 48 }, tam: T.calca, estilos: ['casual', 'street'], de: 24900,
      modelos: [{ n: 'Reta', o: { boca: 48 } }, { n: 'Pantalona', o: { boca: 70 } }, { n: 'Skinny', o: { boca: 26, quadril: 72, vao: 18 } }],
      desc: 'Jeans firme com pesponto cor de mel.', detalhes: ['98% algodão', 'Cinco bolsos', 'Botão de metal']
    }),
    P('jogger', 'Jogger Treino', 'roupas', 'calca', 15900, ['grafite', 'cobalto', 'chiclete'], {
      o: { elastico: true, jogger: true, boca: 34, quadril: 78, vao: 16, bolsoFrente: true }, estilos: ['esporte', 'casual'],
      desc: 'Cós com cordão e punho no tornozelo.', detalhes: ['Moletinho leve', 'Bolso com zíper', 'Punho canelado']
    }),
    P('shorts', 'Bermuda Linho', 'roupas', 'calca', 22900, ['areia', 'grafite', 'mata'], {
      o: { elastico: true, hy: 226, boca: 58, bolsoFrente: true }, tam: T.calca, estilos: ['alfaiataria', 'praia'],
      desc: 'Linho de alfaiataria, com pregas na frente e vinco marcado.', detalhes: ['Linho com viscose', 'Pregas frontais', 'Fecho embutido']
    }),
    P('saia', 'Saia Plissada', 'roupas', 'saia', 17900, ['vinho', 'areia', 'grafite', 'mata'], {
      o: { plissado: true }, publico: 'Feminino', estilos: ['alfaiataria', 'casual'],
      modelos: [{ n: 'Midi', o: { hy: 372 } }, { n: 'Mini', o: { hy: 232, boca: 96 } }, { n: 'Longa', o: { hy: 440, boca: 128 } }],
      tam: T.intima, desc: 'Plissado permanente e caimento leve.', detalhes: ['Plissado permanente', 'Cós elástico nas costas']
    }),
    P('vestido', 'Vestido Revoada', 'roupas', 'vestido', 25900, ['neve', 'turquesa', 'chiclete'], {
      o: { estampa: true }, publico: 'Feminino', estilos: ['praia', 'casual'],
      modelos: [{ n: 'Longo', o: { hy: 430 } }, { n: 'Curto', o: { hy: 300, boca: 96 } }],
      tam: T.intima, desc: 'Estampa de penas em viscose fresca.', detalhes: ['Viscose', 'Alças finas', 'Forro inteiro']
    }),
    P('vestidoliso', 'Vestido Liso', 'roupas', 'vestido', 21900, ['grafite', 'vinho', 'mata', 'neve'], {
      o: {}, publico: 'Feminino', estilos: ['alfaiataria'], tam: T.intima,
      desc: 'Cor forte e corte simples. Serve para o dia e para a noite.', detalhes: ['Crepe leve', 'Alças finas']
    }),


  ];

  /* Fotos em img/ (grande) e img/p/ (leve). Para trocar por fotos reais, mantenha os nomes. */
  /* Preencher com as imagens traseiras após sua geração e conferência. */
  const FOTOS_COSTAS = {};
  PRODUTOS.forEach(p => { p.foto = `img/${p.id}.png`; p.fotoLeve = `img/p/${p.id}.png`; });
  PRODUTOS.forEach(p => { p.fotoCostas = FOTOS_COSTAS[p.id]; });
  /* Cada modelo só aparece na loja quando tem foto própria (img/<id>-m<n>.png).
     Para liberar outro modelo, gere a foto e acrescente o id e o número aqui. */
  const MODELOS_COM_FOTO = {
    cometa: [1], quadra: [1], pilar: [1], alto: [1], boxer: [1, 2], calcinha: [1], puffer: [1],
    pesada: [1, 2], camisa: [1], capuz: [1], cargo: [1, 2], jeansreta: [1, 2], saia: [1, 2], vestido: [1],
  };
  PRODUTOS.forEach(p => {
    const lib = MODELOS_COM_FOTO[p.id] || [];
    p.modelos = p.modelos.filter((m, i) => {
      if (i === 0) return true;
      if (!lib.includes(i)) return false;
      m.foto = `img/${p.id}-m${i}.png`; m.fotoLeve = `img/p/${p.id}-m${i}.png`;
      m.fotoCostas = FOTOS_COSTAS[`${p.id}-m${i}`];
      return true;
    });
  });

  /* A parede usa sua própria fotografia; o catálogo mantém os PNGs recortados. */
  const TENIS_NA_PAREDE = ['cometa', 'quadra', 'bolha', 'atelie', 'trilha', 'retro', 'pilar', 'lua', 'couro', 'onda'];
  const CORES_NA_PAREDE = { cometa: 'tangerina', quadra: 'mata', retro: 'vinho' };
  TENIS_NA_PAREDE.forEach((id, i) => {
    const p = PRODUTOS.find(p => p.id === id);
    p.indiceParede = i;
    p.fotoZoom = `img/tenis-${id}-zoom.webp`;
    p.modelos = [{ n: 'Modelo da vitrine', o: {} }];
    const cor = CORES_NA_PAREDE[id];
    if (cor) p.cores = [cor, ...p.cores.filter(c => c !== cor)];
  });

  /* Peças guardadas até ganharem foto à altura da loja. Tire o id daqui para voltar à venda. */
  const GUARDADAS = [];
  PRODUTOS.forEach(p => { p.oculto = GUARDADAS.includes(p.id); });
  /* Gênero de cada peça: o filtro Masculino e o Feminino também mostram as unissex. */
  const GENERO = {
    Masculino: ['bolha', 'trilha', 'pilar', 'couro', 'corrida', 'cortavento', 'blazer', 'camisa', 'cargo', 'jogger', 'shorts'],
    Feminino: ['atelie', 'lua', 'onda', 'felpuda', 'puffer', 'trench', 'listrada', 'alfaiatada', 'regata']
  };
  Object.entries(GENERO).forEach(([g, ids]) => ids.forEach(id => { PRODUTOS.find(p => p.id === id).publico = g; }));

  /* Cupons. Regras reais: tipo, valor, compra mínima e departamento. */
  const CUPONS = {
    HYPEX10:     { tipo: 'pct', valor: 10, minimo: 0, texto: '10% em toda a loja' },
    COLORIDO15:  { tipo: 'pct', valor: 15, minimo: 25000, texto: '15% em compras a partir de R$ 250' },
    PENOCHAO25:  { tipo: 'pct', valor: 25, minimo: 0, deps: ['tenis'], texto: '25% em tênis' },
    FRETEGRATIS: { tipo: 'frete', valor: 0, minimo: 0, texto: 'Frete econômico grátis' },
    BEMVINDO50:  { tipo: 'fixo', valor: 5000, minimo: 20000, texto: 'R$ 50 em compras a partir de R$ 200' }
  };

  const FRETE_GRATIS_A_PARTIR = 29900;
  const DESCONTO_PIX = .05;

  window.Loja = { CORES, DEPARTAMENTOS, ESTILOS, PRODUTOS, CUPONS, FRETE_GRATIS_A_PARTIR, DESCONTO_PIX };
})();
