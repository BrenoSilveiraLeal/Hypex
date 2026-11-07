/* HYPEX · aplicação da loja: rotas, vitrines, sacola, cupons e checkout simulado */
(function () {
  'use strict';
  const { CORES, DEPARTAMENTOS, ESTILOS, PRODUTOS, CUPONS, FRETE_GRATIS_A_PARTIR, DESCONTO_PIX } = window.Loja;
  const Arte = window.Arte;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const moedaF = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const R$ = c => moedaF.format(c / 100);
  const seguro = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const porId = id => PRODUTOS.find(p => p.id === id);
  const VISIVEIS = PRODUTOS.filter(p => !p.oculto);
  const doDep = d => VISIVEIS.filter(p => p.dep === d);

  /* ---------- memória do navegador (opcional) ---------- */
  const guardar = (k, v) => { try { localStorage.setItem('hypex.' + k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const ler = (k, d) => { try { const v = localStorage.getItem('hypex.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };

  const S = {
    sacola: ler('sacola', []).filter(i => porId(i.id)).map(i => (porId(i.id).modelos[i.modelo] ? i : Object.assign(i, { modelo: 0 }))),
    cupom: ler('cupom', null),
    cupomAviso: '',
    sel: {},
    filtros: { dep: '', estilo: '', publico: '', cor: '', promo: false, ordem: 'relevancia', q: '' },
    modoDep: {},
    sec: {},
    pedido: ler('pedido', null),
    ck: {
      etapa: 1,
      dados: { nome: '', email: '', cpf: '', tel: '' },
      ent: { cep: '', rua: '', num: '', comp: '', bairro: '', cidade: '', uf: '', frete: 'econ' },
      pag: { metodo: 'pix', num: '', titular: '', val: '', cvv: '', parc: 1 },
      erros: {}, pixGerado: false, processando: false, recusa: ''
    }
  };

  /* ---------- seleção de cada peça ---------- */
  function selDe(p) {
    if (!S.sel[p.id]) S.sel[p.id] = { cor: p.cores[0], modelo: 0, tam: p.tam.length === 1 ? p.tam[0] : '', vista: 'frente' };
    return S.sel[p.id];
  }
  const opcoes = (p, modelo, classe) => Object.assign({}, p.o, (p.modelos[modelo] || {}).o, classe ? { classe } : {});
  /* Foto real recortada quando existir. As outras cores recolorem a mesma foto com um
     filtro que mantém as sombras e os brilhos do tecido. */
  const filtrosFeitos = {};
  function filtroCor(cor, base) {
    const id = `cor-${cor}-${base}`;
    if (!filtrosFeitos[id]) {
      const n = parseInt(CORES[cor].a.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => (v / 255).toFixed(3));
      const k = (.5 / Math.max(.26, Arte.lum(CORES[base].a))).toFixed(3);
      const lin = ['R', 'G', 'B'].map(x => `<feFunc${x} type="linear" slope="${k}"/>`).join('');
      const tab = ['R', 'G', 'B'].map((x, i) => `<feFunc${x} type="table" tableValues="0 ${c[i]} 1"/>`).join('');
      $('.defs defs').insertAdjacentHTML('beforeend', `<filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0"/><feComponentTransfer>${lin}</feComponentTransfer><feComponentTransfer>${tab}</feComponentTransfer></filter>`);
      filtrosFeitos[id] = true;
    }
    return id;
  }
  function fotoHTML(p, cor, grande, modelo = 0, vista = 'frente') {
    if (vista === 'costas') {
      const md = p.modelos[modelo] || {};
      const costas = md.fotoCostas || (modelo === 0 ? p.fotoCostas : null);
      if (!costas) return `<span class="arte costas-pendente" role="status"><span>Vista das costas</span><strong>Imagem em preparação</strong><small>A foto traseira desta peça ainda não está disponível.</small></span>`;
      const filtro = cor !== p.cores[0] ? ` style="filter:url(#${filtroCor(cor, p.cores[0])})"` : '';
      return `<span class="arte foto foto-topo"><img src="${costas}" alt="${seguro(p.nome)}, vista das costas" draggable="false"${filtro}></span>`;
    }
    const md = p.modelos[modelo] || {}, foto = md.foto || p.foto, leve = md.fotoLeve || p.fotoLeve;
    const topo = ehArara(p) ? ' foto-topo' : '';
    const filtro = cor !== p.cores[0] ? ` style="filter:url(#${filtroCor(cor, p.cores[0])})"` : '';
    const carga = grande ? '' : ' loading="lazy" decoding="async"';
    return `<span class="arte foto${topo}"><img src="${grande ? foto : leve}" srcset="${leve} 460w, ${foto} 800w" sizes="${grande ? '70vw' : '(max-width: 860px) 50vw, 26vw'}" alt=""${carga} draggable="false"${filtro}></span>`;
  }
  const arte = (p, cor, modelo = 0, vista, classe) => p.foto ? fotoHTML(p, cor, false, modelo) : Arte.desenhar(p.art, CORES[cor], opcoes(p, modelo, classe), vista);
  const LED = '#FFA45C';
  const ehArara = p => DEPARTAMENTOS[p.dep].exp === 'arara';

  /* ---------- totais em centavos ---------- */
  function regiaoCep(cep) {
    const d = (cep || '').replace(/\D/g, '');
    if (d.length !== 8) return null;
    const t = {
      0: ['São Paulo', 'SP', 0], 1: ['Campinas', 'SP', 0], 2: ['Rio de Janeiro', 'RJ', 1], 3: ['Belo Horizonte', 'MG', 1],
      4: ['Salvador', 'BA', 2], 5: ['Recife', 'PE', 2], 6: ['Fortaleza', 'CE', 3], 7: ['Brasília', 'DF', 2],
      8: ['Curitiba', 'PR', 1], 9: ['Porto Alegre', 'RS', 1]
    }[d[0]];
    return { cidade: t[0], uf: t[1], zona: t[2] };
  }
  function opcoesFrete() {
    const r = regiaoCep(S.ck.ent.cep), z = r ? r.zona : 0;
    return [
      { id: 'econ', nome: 'Econômica', valor: 1490 + z * 500, prazo: `${5 + z * 2} a ${8 + z * 2} dias úteis` },
      { id: 'expr', nome: 'Expressa', valor: 2990 + z * 900, prazo: `${1 + z} a ${2 + z} dias úteis` },
      { id: 'loja', nome: 'Retirar na loja', valor: 0, prazo: 'Pronto em 2 horas, na Hypex Centro' }
    ];
  }
  const subtotal = () => S.sacola.reduce((t, i) => t + porId(i.id).preco * i.qtd, 0);
  function checarCupom(cod) {
    const c = CUPONS[cod];
    if (!c) return { ok: false, msg: 'Esse cupom não existe. Confira o código ou escolha um da lista.' };
    const sub = subtotal();
    if (!S.sacola.length) return { ok: false, msg: 'Coloque uma peça na sacola para usar este cupom.' };
    if (c.minimo && sub < c.minimo) return { ok: false, msg: `Este cupom vale a partir de ${R$(c.minimo)}. Faltam ${R$(c.minimo - sub)}.` };
    if (c.deps && !S.sacola.some(i => c.deps.includes(porId(i.id).dep))) {
      return { ok: false, msg: `Este cupom vale só para ${c.deps.map(d => DEPARTAMENTOS[d].nome.toLowerCase()).join(' e ')}.` };
    }
    return { ok: true };
  }
  function totais(comCheckout) {
    const sub = subtotal();
    let desc = 0, freteGratisCupom = false;
    const c = S.cupom && CUPONS[S.cupom];
    if (c) {
      const base = c.deps ? S.sacola.filter(i => c.deps.includes(porId(i.id).dep)).reduce((t, i) => t + porId(i.id).preco * i.qtd, 0) : sub;
      if (c.tipo === 'pct') desc = Math.round(base * c.valor / 100);
      if (c.tipo === 'fixo') desc = Math.min(c.valor, sub);
      if (c.tipo === 'frete') freteGratisCupom = true;
    }
    const liquido = sub - desc;
    const gratisPorValor = sub >= FRETE_GRATIS_A_PARTIR;
    let frete = null;
    if (comCheckout && regiaoCep(S.ck.ent.cep)) {
      const op = opcoesFrete().find(o => o.id === S.ck.ent.frete) || opcoesFrete()[0];
      frete = op.valor;
      if (op.id === 'econ' && (freteGratisCupom || gratisPorValor)) frete = 0;
    }
    const pix = comCheckout && S.ck.pag.metodo === 'pix' ? Math.round(liquido * DESCONTO_PIX) : 0;
    return { sub, desc, frete, pix, total: liquido - pix + (frete || 0), gratisPorValor, freteGratisCupom };
  }

  /* ---------- componentes ---------- */
  const preco = p => `${p.de ? `<s>${R$(p.de)}</s> ` : ''}<b>${R$(p.preco)}</b>`;
  const parcelaTxt = v => { const n = Math.min(6, Math.max(1, Math.floor(v / 3000))); return n > 1 ? `ou ${n}x de ${R$(Math.ceil(v / n))} sem juros` : 'à vista'; };

  function nichoHTML(p, i = 0, inicio = 0) {
    const s = selDe(p), c = CORES[s.cor];
    return `<a class="nicho" href="#p-${p.id}" data-peca="${p.id}" style="--glow:${LED};--i:${i};grid-column:${inicio || 'auto'} / span 2">
      <span class="nicho-peca">${arte(p, s.cor, s.modelo)}</span>
      <span class="suporte" aria-hidden="true"><span class="vidro"></span></span>
      <span class="plaquinha"><span class="plaquinha-nome">${p.nome}</span><span class="plaquinha-preco">${R$(p.preco)}</span></span>
      ${p.de ? `<span class="selo">-${Math.round((1 - p.preco / p.de) * 100)}%</span>` : ''}
    </a>`;
  }
  const paredeHTML = (lista, n = 4) => {
    /* a última linha, quando incompleta, fica centralizada */
    const k = lista.length, m = Math.max(1, Math.min(n, k)), r = k % m;
    return `<div class="nichos" style="--n:${m};grid-template-columns:repeat(${m * 2},minmax(0,1fr))">${lista.map((p, i) => nichoHTML(p, i, r && i === k - r ? m - r + 1 : 0)).join('')}</div>`;
  };
  const POR_TELA = 8;
  const telasDe = lista => { const s = []; for (let i = 0; i < lista.length; i += POR_TELA) s.push(lista.slice(i, i + POR_TELA)); return s; };

  function paredeTenisHTML() {
    const lista = doDep('tenis').slice().sort((a, b) => a.indiceParede - b.indiceParede);
    const xs = [4.375, 23.625, 43, 61.5625, 80];
    const larguras = [17, 16.125, 15.375, 15.9375, 16.875];
    return `<div class="nichos tenis-parede">
      <picture class="tenis-fotografia"><source media="(max-width: 860px)" srcset="img/tenis-parede-mobile.webp"><img src="img/tenis-parede.webp" alt="Dez modelos de tênis sobre prateleiras de vidro em uma parede de concreto escuro." decoding="async"></picture>
      ${lista.map((p, i) => `<a class="nicho tenis-modelo" href="#p-${p.id}" data-peca="${p.id}" aria-label="Explorar ${p.nome}, ${R$(p.preco)}" style="--x:${xs[i % 5]}%;--y:${i < 5 ? 25.9762 : 60.4619}%;--largura:${larguras[i % 5]}%;--xm:${i % 2 * 50}%;--ym:${Math.floor(i / 2) * 20}%">
        <span class="nicho-peca">${arte(p, selDe(p).cor, selDe(p).modelo)}</span>
        <span class="suporte" aria-hidden="true"><span class="vidro"></span></span>
        <span class="plaquinha"><span class="plaquinha-nome">${p.nome}</span><span class="plaquinha-preco">${R$(p.preco)}</span></span>
      </a>`).join('')}
    </div>`;
  }

  function cabideHTML(p, cor, i = 0) {
    const s = selDe(p), k = cor || s.cor;
    return `<a class="cabide" href="#p-${p.id}" data-peca="${p.id}" draggable="false" style="--glow:${CORES[k].a};--i:${i}">
      <span class="cabide-peca">${arte(p, k, s.modelo)}<span class="tag-preco">${R$(p.preco)}</span></span>
      <span class="cabide-nome">${p.nome}</span>
    </a>`;
  }
  function araraHTML(lista, cores) {
    return `<div class="arara" data-arara>
      <div class="arara-cano" aria-hidden="true"></div>
      <div class="arara-trilho">${lista.map((p, i) => cabideHTML(p, cores && cores[i], i)).join('')}</div>
      <div class="arara-controles">
        <button class="redondo" type="button" data-seta="-1" aria-label="Voltar peças da arara">${icone('esq')}</button>
        <div class="arara-pontos" aria-hidden="true">${lista.map(() => '<i></i>').join('')}</div>
        <button class="redondo" type="button" data-seta="1" aria-label="Avançar peças da arara">${icone('dir')}</button>
      </div>
    </div>`;
  }
  function cardHTML(p, i = 0) {
    const s = selDe(p), c = CORES[s.cor];
    return `<article class="card" style="--fundo:${c.fundo};--tinta:${c.tinta};--i:${i}" data-card="${p.id}">
      <a class="card-peca" href="#p-${p.id}" data-peca="${p.id}" aria-label="${p.nome}, ${R$(p.preco)}">
        ${arte(p, s.cor, s.modelo)}
        ${p.de ? `<span class="selo">-${Math.round((1 - p.preco / p.de) * 100)}%</span>` : ''}
      </a>
      <div class="card-info">
        <a class="card-nome" href="#p-${p.id}" data-peca="${p.id}">${p.nome}</a>
        <p class="card-preco">${preco(p)}</p>
        <div class="bolinhas" role="group" aria-label="Cores de ${p.nome}">${p.cores.slice(0, 5).map(k => `<button type="button" class="bolinha${k === s.cor ? ' ativa' : ''}" style="--c:${CORES[k].a}" data-card-cor="${k}" aria-label="${CORES[k].nome}" aria-pressed="${k === s.cor}"></button>`).join('')}</div>
      </div>
    </article>`;
  }

  function icone(n) {
    const i = {
      esq: '<path d="M15 5l-7 7 7 7"/>', dir: '<path d="M9 5l7 7-7 7"/>',
      busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
      sacola: '<path d="M5 8h14l1.2 13H3.8z"/><path d="M9 11V6a3 3 0 016 0v5"/>',
      fechar: '<path d="M5 5l14 14M19 5L5 19"/>', mais: '<path d="M12 5v14M5 12h14"/>', menos: '<path d="M5 12h14"/>',
      seta: '<path d="M7 17L17 7M9 7h8v8"/>', girar: '<path d="M4 12a8 8 0 0114-5l2 2M20 5v4h-4M20 12a8 8 0 01-14 5l-2-2M4 19v-4h4"/>',
      lixo: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', check: '<path d="M4 12l5 5L20 6"/>'
    };
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${i[n]}</svg>`;
  }

  /* ---------- PÁGINA INICIAL ---------- */
  const SLIDES = [
    { id: 'aurora', cor: 'prata', palavra: 'ABRIGA', fundo: '#8F979B', tinta: '#1A1A1C', pal: ['LEVE', 'SECA', 'ÚTIL'], partes: ['AU', 'RO', 'RA'], lado: 'Nylon que segura a chuva, capuz regulável e seis bolsos com zíper.' },
    { id: 'cometa', cor: 'areia', palavra: 'CORRE', fundo: '#D9D6CF', tinta: '#1A1A1C', pal: ['LEVE', 'ALTO', 'MACIO'], partes: ['CO', 'ME', 'TA'], lado: 'Camurça e tela sobre uma sola alta esculpida, para andar o dia inteiro.' },
    { id: 'capuz', cor: 'grafite', palavra: 'VESTE', fundo: '#2F2F2D', tinta: '#FFFFFF', pal: ['PESADO', 'LARGO', 'QUENTE'], partes: ['CAN', 'GU', 'RU'], lado: 'Moletom de 400 g, capuz forrado e um bolso onde cabem as duas mãos.' },
    { id: 'cargo', cor: 'mata', palavra: 'CARREGA', fundo: '#B9BDBE', tinta: '#1A1A1C', pal: ['BOLSOS', 'RESISTENTE', 'URBANA'], partes: ['CAR', 'GO'], lado: 'Calça cargo de sarja com bolsos amplos e ajuste confortável.' }
  ];
  let heroTimer = 0, heroI = 0;

  function heroConteudo(i) {
    const sl = SLIDES[i], p = porId(sl.id);
    /* O destaque usa a foto transparente; as fotos da parede incluem o cenário. */
    const destaque = p.id === 'cometa'
      ? { ...p, foto: 'img/cometa.png', fotoLeve: 'img/p/cometa.png', cores: ['areia'], modelos: [{}] }
      : p;
    return { sl, p, grande: destaque.foto ? fotoHTML(destaque, sl.cor, true) : Arte.desenhar(p.art, CORES[sl.cor], Object.assign({}, p.o, { cabide: false })), mini: destaque.foto ? fotoHTML(destaque, sl.cor) : Arte.desenhar(p.art, CORES[sl.cor], Object.assign({}, p.o, { cabide: false })) };
  }
  function heroHTML(primeira) {
    const { sl, p, grande, mini } = heroConteudo(heroI);
    const fotos = SLIDES.map((s, i) => `<button type="button" class="hero-botao${i === heroI ? ' ativo' : ''}" data-slide="${i}" aria-label="Mostrar ${porId(s.id).nome}" aria-pressed="${i === heroI}" style="--c:${s.fundo}"><i></i></button>`).join('');
    return `<section class="hero${primeira ? ' primeira' : ''}" id="hero" data-tom="${sl.tinta === '#FFFFFF' ? 'escuro' : 'claro'}" style="--fundo:${sl.fundo};--tinta:${sl.tinta}">
      <div class="hero-palavra" data-prof="-14" style="--n:${sl.palavra.length}" aria-hidden="true">${[...sl.palavra].map((l, i) => `<span class="letra" style="--i:${i}">${l}</span>`).join('')}</div>
      <svg class="hero-mira" data-prof="10" viewBox="0 0 400 400" aria-hidden="true">
        <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" stroke-opacity=".35"/>
        <circle cx="200" cy="200" r="130" fill="none" stroke="currentColor" stroke-opacity=".2"/>
        <path d="M200 0V60M200 340V400M0 200H60M340 200H400" stroke="currentColor" stroke-opacity=".4"/>
      </svg>
      <a class="hero-peca hero-peca-${p.art}" data-prof="26" href="#p-${p.id}" data-peca="${p.id}" aria-label="Ver ${p.nome}">${grande}</a>
      <div class="hero-esq">
        <a class="etiqueta" href="#p-${p.id}" data-peca="${p.id}" aria-label="Comprar ${p.nome} por ${R$(p.preco)}">
        <span class="etiqueta-foto">${mini}</span>
        <span class="etiqueta-palavras">${sl.pal.map(w => `<span>${w}</span>`).join('')}</span>
        <span class="etiqueta-rodape"><span class="etiqueta-preco">${R$(p.preco)}</span>${icone('seta')}</span>
      </a>
        <h1>Tudo o que você veste, em todas as cores.</h1>
        <p>Roupas, tênis, meias, roupa íntima e casacos. ${PRODUTOS.length} peças, cada uma em várias cores, modelos e tamanhos.</p>
        <a class="botao" href="#loja">Ver toda a loja ${icone('dir')}</a>
      </div>
      <div class="hero-dir">
        <span class="mono">${String(heroI + 1).padStart(3, '0')}</span>
        <strong class="hero-nome">${sl.partes.map(x => `<span>${x}</span>`).join('')}</strong>
        <p>${sl.lado}</p>
      </div>
      <div class="hero-seletor" role="group" aria-label="Peças em destaque">${fotos}</div>
    </section>`;
  }

  function trocarHero(i) {
    heroI = (i + SLIDES.length) % SLIDES.length;
    const h = $('#hero'); if (!h) return;
    const aplica = () => {
      const atual = $('#hero'); if (!atual) return;
      const novo = document.createElement('div'); novo.innerHTML = heroHTML();
      atual.replaceWith(novo.firstElementChild);
      ligarHero();
      tomDoTopo();
    };
    if (calmo()) { aplica(); return; }
    const sl = SLIDES[heroI];
    h.classList.add('saindo');
    h.style.setProperty('--fundo', sl.fundo); h.style.setProperty('--tinta', sl.tinta);
    setTimeout(aplica, 380);
  }
  function ligarHero() {
    const h = $('#hero'); if (!h) return;
    h.addEventListener('pointermove', e => {
      if (calmo() || e.pointerType === 'touch') return;
      const r = h.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      $$('[data-prof]', h).forEach(el => { el.style.setProperty('--tx', (x * el.dataset.prof) + 'px'); el.style.setProperty('--ty', (y * el.dataset.prof) + 'px'); });
    });
  }
  function iniciarTimerHero() {
    clearInterval(heroTimer);
    if (calmo() || !$('#hero')) return;
    heroTimer = setInterval(() => {
      const h = $('#hero');
      if (!h) { clearInterval(heroTimer); return; }
      if (document.hidden || h.matches(':hover') || h.contains(document.activeElement)) return;
      trocarHero(heroI + 1);
    }, 7000);
  }

  function letreiroHTML() {
    const itens = Object.entries(CUPONS).map(([k, c]) => `<button type="button" class="cupom-chip" data-usar-cupom="${k}"><b>${k}</b> ${c.texto}</button>`).join('');
    return `<section class="letreiro" aria-label="Cupons de desconto"><div class="letreiro-faixa"><div class="letreiro-grupo">${itens}</div><div class="letreiro-grupo" aria-hidden="true">${itens}</div></div></section>`;
  }

  function mosaicoHTML() {
    const dest = { tenis: ['cometa', 'tangerina'], casacos: ['puffer', 'canario'], roupas: ['pesada', 'neve'], meias: ['alto', 'neve'], intima: ['boxer', 'cobalto'] };
    return `<section class="mosaico guia" aria-labelledby="titulo-dep">
      <h2 id="titulo-dep" class="titulo">Cinco departamentos, uma loja só</h2>
      <div class="mosaico-grade">${Object.entries(DEPARTAMENTOS).map(([k, d]) => {
        const p = porId(dest[k][0]);
        return `<a class="ladrilho ladrilho-${k}" href="#${k}" style="--fundo:${d.cor};--tinta:${d.tinta}">
          <span class="ladrilho-nome">${d.nome}</span>
          <span class="mono">${doDep(k).length} peças</span>
          <span class="ladrilho-peca">${p.foto ? fotoHTML(p, p.cores[0]) : Arte.desenhar(p.art, CORES[dest[k][1]], Object.assign({}, p.o, { cabide: false }))}</span>
        </a>`;
      }).join('')}</div>
    </section>`;
  }

  const LOOKS = {
    street: [['capuz', 'grafite'], ['cargo', 'mata'], ['atelie', 'lavanda']],
    casual: [['pesada', 'neve'], ['jeansreta', 'jeans'], ['couro', 'neve']],
    esporte: [['cortavento', 'mata'], ['jogger', 'grafite'], ['onda', 'chiclete']],
    alfaiataria: [['blazer', 'vinho'], ['alfaiatada', 'grafite'], ['lua', 'neve']],
    praia: [['camisa', 'areia'], ['shorts', 'areia'], ['couro', 'neve']]
  };
  function estilosHTML() {
    return `<section class="estilos guia" aria-labelledby="titulo-est">
      <h2 id="titulo-est" class="titulo">Escolha pelo estilo</h2>
      <div class="estilos-faixas">${Object.entries(ESTILOS).map(([k, e]) => {
        const [a, b, c] = LOOKS[k];
        const pa = porId(a[0]), pb = porId(b[0]), pc = porId(c[0]);
        const tinta = Arte.contra(e.cor);
        return `<a class="estilo" href="#estilo-${k}" style="--fundo:${e.cor};--tinta:${tinta}">
          <span class="estilo-look" aria-hidden="true">
            <span class="look-a">${pa.foto ? fotoHTML(pa, pa.cores[0]) : Arte.desenhar(pa.art, CORES[a[1]], Object.assign({}, pa.o, { cabide: false }))}</span>
            <span class="look-b">${pb.foto ? fotoHTML(pb, pb.cores[0]) : Arte.desenhar(pb.art, CORES[b[1]], pb.o)}</span>
            <span class="look-c">${pc.foto ? fotoHTML(pc, pc.cores[0]) : Arte.desenhar(pc.art, CORES[c[1]], pc.o)}</span>
          </span>
          <span class="estilo-texto"><strong>${e.nome}</strong><span>${e.frase}</span></span>
        </a>`;
      }).join('')}</div>
    </section>`;
  }

  function telaInicio() {
    const araraMix = ['pesada', 'capuzzip', 'puffer', 'blazer', 'jeansreta', 'aurora', 'polo', 'vestido', 'cargo', 'listrada', 'saia', 'jaquetajeans'];
    return heroHTML(true) + letreiroHTML() +
      `<section class="parede parede-tenis" data-tom="escuro" style="--fundo:${DEPARTAMENTOS.tenis.cor};--tinta:#fff">
        <div class="parede-cab guia">
          <div><p class="mono">Tênis / Série 01</p><h2 class="titulo">Uma outra perspectiva.</h2></div>
          <a class="link-parede" href="#tenis">Entrar na parede ${icone('dir')}</a>
        </div>
        <div class="tenis-panorama">${paredeTenisHTML()}</div>
      </section>
      <section class="secao-arara guia-sem" data-tom="claro" aria-labelledby="titulo-arara">
        <p class="arara-selo mono">Nova coleção &nbsp;|&nbsp; Role ou arraste a arara</p><h2 class="sr" id="titulo-arara">Arara de roupas</h2>
        ${araraHTML(araraMix.map(porId))}
        <div class="arara-texto guia revelar">
          <p class="arara-grande">Peças pesadas, corte largo.</p>
          <div><p>Casacos, moletons, camisetas e calças na mesma arara.</p>
          <p class="arara-dica">Clique em uma peça para ver fotos, cores e tamanhos.</p>
          <div class="arara-botoes"><a class="botao" href="#casacos">Ver casacos</a><a class="botao botao-contorno" href="#roupas">Ver roupas</a></div></div>
        </div>
      </section>` + looksHTML(0) + corredorHTML() + mosaicoHTML();
  }

  /* Looks: composição com pontos numerados e lista de compra */
  const CHAVES_LOOK = Object.keys(LOOKS);
  let lookI = 0;
  let trocaLookAtual = null;
  async function trocarLook(passo) {
    const contar = i => (i + CHAVES_LOOK.length) % CHAVES_LOOK.length;
    if (trocaLookAtual) { trocaLookAtual.alvo = contar(trocaLookAtual.alvo + passo); return; }
    let secao = $('#looks');
    if (!secao) return;
    const estado = { alvo: contar(lookI + passo) };
    trocaLookAtual = estado;
    const animar = (el, frames, duracao) => el.animate(frames, { duration: duracao, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
    const esperar = animacoes => Promise.all(animacoes.map(a => a.finished.catch(() => {})));
    try {
      while (secao.isConnected && estado.alvo !== lookI) {
        secao.setAttribute('aria-busy', 'true');
        const palco = $('.looks-palco', secao), altura = palco.clientHeight + 50;
        const links = $$('.looks-peca, .looks-ponto', secao);
        links.forEach(el => { el.inert = true; });
        if (!calmo()) await esperar([
          ...links.map(el => animar(el, [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(-${altura}px)`, opacity: 0 }], 600)),
          animar($('.looks-info', secao), [{ opacity: 1 }, { opacity: 0 }], 350)
        ]);
        if (!secao.isConnected) break;
        // Durante a saída, cliques rápidos escolhem o destino mais recente.
        let destino;
        do {
          destino = estado.alvo;
          await Promise.all(LOOKS[CHAVES_LOOK[destino]].map(async ([id]) => {
            const img = new Image(); img.src = porId(id).foto;
            try { await img.decode(); } catch (_) { /* conserva o tratamento de erro das fotos */ }
          }));
        } while (destino !== estado.alvo && secao.isConnected);
        if (!secao.isConnected) break;
        const foco = document.activeElement?.closest('[data-look]')?.dataset.look;
        secao.outerHTML = looksHTML(destino);
        secao = $('#looks');
        secao.setAttribute('aria-busy', 'true');
        if (foco) $(`[data-look="${foco}"]`, secao)?.focus({ preventScroll: true });
        const novas = $$('.looks-peca, .looks-ponto', secao);
        novas.forEach(el => { el.inert = true; });
        Mov.atualizar();
        if (!calmo()) await esperar([
          ...novas.map(el => animar(el, [{ transform: `translateY(${altura}px)`, opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], 750)),
          animar($('.looks-info', secao), [{ opacity: 0 }, { opacity: 1 }], 500)
        ]);
        secao.getAnimations({ subtree: true }).filter(a => a.effect?.getTiming().fill === 'both' && a.playState === 'finished').forEach(a => a.cancel());
        novas.forEach(el => { el.inert = false; });
        secao.removeAttribute('aria-busy');
      }
    } finally { if (trocaLookAtual === estado) trocaLookAtual = null; }
  }
  function looksHTML(i, troca) {
    lookI = (i + CHAVES_LOOK.length) % CHAVES_LOOK.length;
    const k = CHAVES_LOOK[lookI], e = ESTILOS[k], pecas = LOOKS[k].map(x => porId(x[0]));
    const pos = [['lp-a', 26, 26], ['lp-b', 68, 44], ['lp-c', 42, 80]];
    return `<section class="looks guia${troca ? ' troca' : ''}" id="looks" data-tom="claro" aria-labelledby="titulo-look">
      <div class="looks-palco">
        ${pecas.map((p, n) => `<a class="looks-peca ${pos[n][0]}" href="#p-${p.id}" data-peca="${p.id}" aria-label="${p.nome}">${fotoHTML(p, p.cores[0])}</a>`).join('')}
        ${pecas.map((p, n) => `<a class="looks-ponto" href="#p-${p.id}" data-peca="${p.id}" style="left:${pos[n][1]}%;top:${pos[n][2]}%" aria-label="Ver ${p.nome}">${n + 1}</a>`).join('')}
        <button type="button" class="redondo looks-seta looks-seta-e" data-look="-1" aria-label="Look anterior">${icone('esq')}</button>
        <button type="button" class="redondo looks-seta looks-seta-d" data-look="1" aria-label="Próximo look">${icone('dir')}</button>
      </div>
      <div class="looks-info">
        <p class="mono">Look ${String(lookI + 1).padStart(2, '0')} / ${String(CHAVES_LOOK.length).padStart(2, '0')}</p>
        <h2 id="titulo-look">${e.nome}</h2>
        <p>${e.frase}</p>
        <ul class="looks-lista">${pecas.map((p, n) => `<li>
          <span class="looks-num">${n + 1}</span>
          <a class="looks-foto" href="#p-${p.id}" data-peca="${p.id}" aria-label="${p.nome}">${fotoHTML(p, p.cores[0])}</a>
          <a class="looks-nome" href="#p-${p.id}" data-peca="${p.id}">${p.nome}<small>${CORES[p.cores[0]].nome} · ${R$(p.preco)}</small></a>
          <a class="looks-mais" href="#p-${p.id}" data-peca="${p.id}" aria-label="Escolher tamanho de ${p.nome}">${icone('mais')}</a>
        </li>`).join('')}</ul>
        <a class="link-parede" href="#estilo-${k}">Ver tudo em ${e.nome} ${icone('dir')}</a>
      </div>
    </section>`;
  }

  /* O tênis da estação: um par só, que gira com a rolagem e revela os detalhes */
  function corredorHTML() {
    const p = porId('couro');
    return `<section class="corredor" id="corredor" data-tom="claro" aria-labelledby="titulo-corredor">
      <div class="corredor-fixo">
        <div class="corredor-palavra" aria-hidden="true">COURO</div>
        <span class="corredor-t" aria-hidden="true"><img src="img/couro.png" alt="" loading="lazy" draggable="false"></span>
        <div class="corredor-base">
          <div class="corredor-texto">
            <p class="mono">O tênis da estação</p>
            <h2 id="titulo-corredor">${p.nome}</h2>
            <p>${p.desc}</p>
            <a class="botao" href="#p-${p.id}" data-peca="${p.id}">Ver o ${p.nome} · ${R$(p.preco)}</a>
          </div>
          <ol class="corredor-dets">${p.detalhes.map((d, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b><span>${d}</span></li>`).join('')}</ol>
        </div>
      </div>
    </section>`;
  }
  /* ---------- DEPARTAMENTO ---------- */
  function telaDep(k) {
    const d = DEPARTAMENTOS[k], lista = listaDep(k), modo = S.modoDep[k] || 'vitrine';
    if (d.exp === 'prateleira' && modo === 'vitrine') return telaCena(k);
    const vitrine = lista.length ? araraHTML(lista) : semResultado(k);
    const modoHTML = `<div class="modo" role="group" aria-label="Forma de ver as peças">
          <button type="button" data-modo="vitrine" data-dep="${k}" aria-pressed="${modo === 'vitrine'}">${d.exp === 'arara' ? 'Arara' : 'Parede'}</button>
          <button type="button" data-modo="grade" data-dep="${k}" aria-pressed="${modo === 'grade'}">Grade</button>
        </div>`;
    const outros = `<div class="dep-outros">${Object.entries(DEPARTAMENTOS).filter(([x]) => x !== k).map(([x, o]) => `<a class="pilula" href="#${x}">${o.nome}</a>`).join('')}</div>`;
    const filtrosHTML = `<div class="guia fb-linha dep-filtros">${barraFiltros(k, doDep(k))}${modoHTML}</div>`;
    if (d.exp === 'arara' && modo === 'vitrine') {
      return `<section class="dep dep-arara secao-arara" data-tom="claro">
        <p class="arara-selo mono">${d.nome} &nbsp;|&nbsp; ${lista.length} ${lista.length === 1 ? 'peça' : 'peças'}</p>
        ${filtrosHTML}
        ${vitrine}
        <div class="arara-texto guia">
          <h1 class="arara-grande">${d.nome}</h1>
          <div><p>${d.frase}</p><p class="arara-dica">Clique em uma peça para ver fotos, cores e tamanhos.</p></div>
        </div>
        <div class="guia">${outros}</div>
      </section>`;
    }
    return `<section class="dep parede dep-${d.exp}" data-tom="${d.tinta === '#FFFFFF' ? 'escuro' : 'claro'}" style="--fundo:${d.cor};--tinta:${d.tinta}">
      <div class="parede-cab guia dep-cab">
        <div>
          <p class="mono">${d.nome} / ${String(lista.length).padStart(2, '0')} peças</p>
          <h1 class="titulo-dep">${d.frase}</h1>
        </div>
      </div>
      ${filtrosHTML}
      <div class="guia">${lista.length ? `<div class="grade">${lista.map(cardHTML).join('')}</div>` : semResultado(k)}</div>
      <div class="guia">${outros}</div>
    </section>`;
  }
  /* ---------- PAREDE: uma cena só, a câmera entra na peça ---------- */
  function telaCena(k, foco) {
    if (foco && !casaFiltro(foco, estadoFiltro(k))) S.sec[k] = { publico: '', tam: '', cor: '' };
    const d = DEPARTAMENTOS[k], lista = listaDep(k), tenis = k === 'tenis' && lista.length === doDep(k).length;
    const telas = tenis ? [lista] : telasDe(lista), curta = doDep(k).length <= 6;
    telaCenaI = 0;
    return `<section class="cena${tenis ? ' cena-tenis' : ''}${curta ? ' cena-curta' : ''}${foco ? ' foco' : ''}" id="cena" data-dep="${k}" data-tom="escuro" style="--fundo:${d.cor}">
      <div class="cena-janela" id="janela">
        <div class="camera" id="camera"><div class="cena-trilho">${telas.map((pg, i) => `<div class="pagina${tenis ? ' tenis-panorama' : ''}" data-tela-n="${i}">${tenis ? paredeTenisHTML() : paredeHTML(pg, curta ? 3 : 4)}</div>`).join('')}</div></div>
        <div class="cena-luz" aria-hidden="true"></div>
      </div>
      <div class="cena-titulo"><p class="mono">${d.nome} / Série 01</p><h1>${d.frase}</h1>${curta && lista.length ? `<p class="cena-sub">${lista.length} ${lista.length === 1 ? 'modelo' : 'modelos'}, a partir de ${R$(Math.min(...lista.map(x => x.preco)))}.</p>` : ''}</div>
      ${tenis ? `<details class="cena-filtros tenis-filtros"><summary>Filtrar coleção</summary>${barraFiltros(k, doDep(k))}</details>` : `<div class="cena-filtros">${barraFiltros(k, doDep(k))}</div>`}
      ${lista.length ? '' : `<div class="cena-vazio">${semResultado(k)}</div>`}
      <div class="cena-rodape mono">
        <span><i></i>${lista.length} ${lista.length === 1 ? 'peça' : 'peças'}${telas.length > 1 ? ` · Tela <b id="cena-tela-n">01</b> / ${String(telas.length).padStart(2, '0')}` : ''}</span>
        <span class="cena-dica">Passe o cursor para acender. Clique para explorar.</span>
        <button type="button" data-modo="grade" data-dep="${k}">Ver em grade</button>
      </div>
      ${telas.length > 1 ? `<button type="button" class="cena-seta cena-seta-e" data-tela="-1" aria-label="Tela anterior">${icone('esq')}</button>
      <button type="button" class="cena-seta cena-seta-d" data-tela="1" aria-label="Próxima tela com mais ${d.nome.toLowerCase()}"><span>Mais ${d.nome.toLowerCase()}</span>${icone('dir')}</button>` : ''}
      <div id="cena-painel">${foco ? painelCena(foco) : ''}</div>
    </section>
    <div id="cena-extra" class="cena-extra">${foco ? combinaHTML(foco) : ''}</div>`;
  }
  function painelCena(p) {
    return `<a class="cena-voltar" href="#${p.dep}">${icone('esq')} Voltar à prateleira</a>
    <div id="pdp" data-id="${p.id}">
      <div class="cena-info cena-info-entra">
        <p class="mono" style="--i:1">Hypex / ${String(doDep(p.dep).indexOf(p) + 1).padStart(2, '0')}</p>
        <h1 class="pdp-nome" style="--i:2">${p.nome}</h1>
        <p class="pdp-desc" style="--i:3">${p.desc}</p>
      </div>
      ${compraHTML(p, true)}
    </div>`;
  }
  function combinaHTML(p) {
    return `<section class="combina guia" aria-labelledby="titulo-combina">
      <h2 class="titulo revelar" id="titulo-combina">Combina com</h2>
      <div class="grade">${comboPara(p).map(cardHTML).join('')}</div>
    </section>`;
  }
  function compraHTML(p, cena) {
    const s = selDe(p), c = CORES[s.cor];
    const dicaTam = p.dep === 'tenis' ? 'Numeração brasileira' : p.tam.length === 1 ? 'Tamanho único' : 'Guia em Medidas';
    const tamanhos = `<div class="opcoes tamanhos">${p.tam.map(t => { const fora = p.esgotados.includes(t); return `<button type="button" class="opcao${t === s.tam ? ' ativa' : ''}${fora ? ' esgotado' : ''}" data-tam="${t}" aria-pressed="${t === s.tam}" ${fora ? `disabled aria-label="${t}, esgotado"` : ''}>${t}</button>`; }).join('')}</div>`;
    const blocoTam = cena && p.tam.length > 1
      ? `<details class="tam-menu" id="tam-menu"><summary><span id="tam-txt">${s.tam ? 'Tamanho ' + s.tam : 'Escolha o tamanho'}</span><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg></summary>${tamanhos}</details>`
      : tamanhos;
    return `<form class="compra ${cena ? 'compra-painel-entra' : ''}" id="compra" novalidate>
      <div class="compra-topo" style="--i:0">
        <p class="compra-cor" id="nome-cor">${c.nome}</p>
        <p class="compra-preco">${preco(p)}</p>
      </div>
      <p class="compra-parcela" style="--i:1">${parcelaTxt(p.preco)} · 5% off no Pix</p>
      <fieldset style="--i:2"><legend>Cor</legend>
        <div class="bolinhas">${p.cores.map(k => `<button type="button" class="bolinha grande${k === s.cor ? ' ativa' : ''}" style="--c:${CORES[k].a}" data-cor="${k}" aria-label="${CORES[k].nome}" aria-pressed="${k === s.cor}"></button>`).join('')}</div>
      </fieldset>
      ${p.modelos.length > 1 ? `<fieldset style="--i:3"><legend>Modelo</legend><div class="opcoes">${p.modelos.map((m, i) => `<button type="button" class="opcao${i === s.modelo ? ' ativa' : ''}" data-modelo="${i}" aria-pressed="${i === s.modelo}">${m.n}</button>`).join('')}</div></fieldset>` : ''}
      <fieldset style="--i:4"><legend>Tamanho <span class="legenda-dica">${dicaTam}</span></legend>
        ${blocoTam}
        <p class="erro" id="erro-tam" hidden>Escolha um tamanho para colocar na sacola.</p>
      </fieldset>
      <button type="submit" class="botao-sacola" id="adicionar" style="--i:5"><span><b id="adicionar-txt">Colocar na sacola</b><small>${R$(p.preco)} · ${parcelaTxt(p.preco)}</small></span><i>${icone('sacola')}</i></button>
      <details class="detalhes" style="--i:6"><summary>Detalhes da peça</summary><ul>${p.detalhes.map(x => `<li>${x}</li>`).join('')}</ul></details>
      ${p.tam.length > 1 ? `<details class="detalhes" style="--i:6"><summary>Medidas</summary>${tabelaMedidas(p)}</details>` : ''}
      <details class="detalhes" style="--i:6"><summary>Entrega e troca</summary><p>Frete grátis acima de ${R$(FRETE_GRATIS_A_PARTIR)} na entrega econômica. Primeira troca grátis em até 30 dias.</p></details>
    </form>`;
  }

  /* ---------- LOJA COM FILTROS ---------- */
  function filtrados() {
    const f = S.filtros, q = norm(f.q).trim();
    let l = VISIVEIS.filter(p => {
      if (f.dep && p.dep !== f.dep) return false;
      if (!casaFiltro(p, f)) return false;
      if (f.estilo && !p.estilos.includes(f.estilo)) return false;
      if (f.promo && !p.de) return false;
      if (q) {
        const texto = norm([p.nome, DEPARTAMENTOS[p.dep].nome, p.desc, p.publico, ...p.estilos.map(e => ESTILOS[e].nome), ...p.cores.map(k => CORES[k].nome), ...p.modelos.map(m => m.n)].join(' '));
        if (!q.split(/\s+/).every(w => texto.includes(w))) return false;
      }
      return true;
    });
    if (f.ordem === 'menor') l = l.slice().sort((a, b) => a.preco - b.preco);
    if (f.ordem === 'maior') l = l.slice().sort((a, b) => b.preco - a.preco);
    if (f.ordem === 'promo') l = l.slice().sort((a, b) => (b.de ? 1 - b.preco / b.de : 0) - (a.de ? 1 - a.preco / a.de : 0));
    return l;
  }
  /* Barra de filtros igual em todas as seções: gênero, tamanho e cor */
  function estadoFiltro(ns) { return ns === 'loja' ? S.filtros : (S.sec[ns] = S.sec[ns] || { publico: '', tam: '', cor: '' }); }
  function casaFiltro(p, f) {
    if (f.publico && p.publico !== f.publico && (f.publico === 'Unissex' || p.publico !== 'Unissex')) return false;
    if (f.tam && (!p.tam.includes(f.tam) || p.esgotados.includes(f.tam))) return false;
    if (f.cor && !p.cores.some(k => CORES[k].familia === f.cor)) return false;
    return true;
  }
  function listaDep(k) { return doDep(k).filter(p => casaFiltro(p, estadoFiltro(k))); }
  function semResultado(ns) {
    return `<div class="vazio fb-vazio"><p class="titulo">Nenhuma peça com esses filtros.</p><button type="button" class="botao" data-fb-limpar data-ns="${ns}">Limpar filtros</button></div>`;
  }
  /* Tamanhos em ordem e separados por tipo: nunca uma lista misturada */
  const LETRAS = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
  function opcoesTamanho(tams, atual) {
    const tipo = t => {
      if (LETRAS.includes(t)) return 'Roupas';
      if (/^\d\d-\d\d$/.test(t)) return 'Meias';
      if (/^\d\d$/.test(t) && +t <= 50) return 'Numeração';
      return 'Outros tamanhos';
    };
    const ordem = ['Roupas', 'Numeração', 'Meias', 'Outros tamanhos'];
    const grupos = ordem.map(n => [n, tams.filter(t => tipo(t) === n)]).filter(([, l]) => l.length);
    grupos.forEach(([n, l]) => {
      if (n === 'Roupas') l.sort((a, b) => LETRAS.indexOf(a) - LETRAS.indexOf(b));
      if (n === 'Numeração') l.sort((a, b) => a - b);
    });
    const op = t => `<option value="${t}"${atual === t ? ' selected' : ''}>${t}</option>`;
    return grupos.length === 1 ? grupos[0][1].map(op).join('') : grupos.map(([n, l]) => `<optgroup label="${n}">${l.map(op).join('')}</optgroup>`).join('');
  }
  function barraFiltros(ns, base, extra = '') {
    const f = estadoFiltro(ns);
    const tams = [...new Set(base.flatMap(p => p.tam))];
    const fams = new Map();
    base.forEach(p => p.cores.forEach(k => { if (!fams.has(CORES[k].familia)) fams.set(CORES[k].familia, CORES[k].a); }));
    const gen = ['', 'Masculino', 'Feminino', 'Unissex'].map(g => `<button type="button" class="${f.publico === g ? 'ativa' : ''}" data-fb="publico" data-ns="${ns}" data-v="${g}" data-foco="fb-pub-${g}" aria-pressed="${f.publico === g}">${g || 'Todos'}</button>`).join('');
    return `<div class="fb">
      <div class="fb-seg" role="group" aria-label="Gênero">${gen}</div>
      ${tams.length > 1 ? `<label class="fb-sel"><span>Tamanho</span><select data-fb-sel="tam" data-ns="${ns}" data-foco="fb-tam"><option value="">Todos</option>${opcoesTamanho(tams, f.tam)}</select></label>` : ''}
      <div class="fb-cores" role="group" aria-label="Cor"><span>Cor</span>${[...fams].map(([n, h]) => `<button type="button" class="fb-cor${f.cor === n ? ' ativa' : ''}" style="--c:${h}" data-fb="cor" data-ns="${ns}" data-v="${n}" data-foco="fb-cor-${n}" aria-label="${n}" title="${n}" aria-pressed="${f.cor === n}"></button>`).join('')}</div>
      ${extra}
      ${f.publico || f.tam || f.cor ? `<button type="button" class="fb-limpar" data-fb-limpar data-ns="${ns}">${icone('fechar')}Limpar</button>` : ''}
    </div>`;
  }
  let araraFiltroTimer = 0, araraFiltroAnim = null, araraFiltrando = false, araraFiltroEstado = null;
  function cancelarFiltroArara() {
    clearTimeout(araraFiltroTimer);
    if (araraFiltroAnim) { araraFiltroAnim.cancel(); araraFiltroAnim = null; }
    if (!araraFiltrando) araraFiltroEstado = null;
  }
  function transicaoCorArara(ns, foco) {
    const trilho = $('.arara-trilho'), rota = location.hash;
    $$(`[data-fb="cor"][data-ns="${ns}"]`).forEach(b => {
      const ativa = b.dataset.v === estadoFiltro(ns).cor;
      b.classList.toggle('ativa', ativa);
      b.setAttribute('aria-pressed', ativa);
    });
    /* Durante a saída, a próxima coleção usa a escolha mais recente.
       Durante a entrada, termina o movimento e mantém só a última escolha. */
    if (araraFiltroEstado && araraFiltroEstado.ns === ns && araraFiltroEstado.rota === rota) {
      araraFiltroEstado.foco = foco;
      return;
    }
    trilho.closest('.arara').classList.remove('ver');
    const inicios = new Map($$('.cabide', trilho).map(peca => {
      const s = getComputedStyle(peca);
      return [peca, { translate: s.translate === 'none' ? '0px' : s.translate, opacity: s.opacity }];
    }));
    cancelarFiltroArara();
    const estado = { ns, rota, foco, aplicado: null };
    araraFiltroEstado = estado;
    const animarFila = (trilho, entrando, estados = new Map()) => {
      const pecas = $$('.cabide', trilho), esquerda = trilho.getBoundingClientRect().left;
      const visiveis = pecas.filter(p => esquerda + p.offsetLeft < innerWidth + 40 && esquerda + p.offsetLeft + p.offsetWidth > -40);
      const duracao = entrando ? 850 : 650, intervalo = 150, animacoes = [];
      pecas.forEach(peca => {
        const i = visiveis.indexOf(peca);
        if (i < 0) {
          animacoes.push(peca.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'forwards' }));
          return;
        }
        const de = entrando ? { translate: '100vw', opacity: 0 } : estados.get(peca) || { translate: '0px', opacity: 1 };
        const ate = entrando ? { translate: '0px', opacity: 1 } : { translate: '-100vw', opacity: 0 };
        animacoes.push(peca.animate([de, ate], {
          duration: duracao, delay: i * intervalo,
          easing: entrando ? 'cubic-bezier(.16,1,.3,1)' : 'cubic-bezier(.4,0,.7,1)',
          fill: entrando ? 'backwards' : 'forwards'
        }));
      });
      return {
        duracao: duracao + Math.max(0, visiveis.length - 1) * intervalo,
        cancel: () => animacoes.forEach(a => a.cancel()),
        finished: Promise.all(animacoes.map(a => a.finished)).catch(() => null)
      };
    };
    trilho.closest('.arara').setAttribute('aria-busy', 'true');
    araraFiltroAnim = animarFila(trilho, false, inicios);
    const tempoSaida = araraFiltroAnim.duracao;
    araraFiltroTimer = setTimeout(() => {
      if (location.hash !== rota || !trilho.isConnected || araraFiltroEstado !== estado) return;
      const y = scrollY;
      estado.aplicado = JSON.stringify(estadoFiltro(ns));
      araraFiltrando = true;
      try { desenharRota(false); } finally { araraFiltrando = false; }
      scrollTo(0, y);
      const novo = $('.arara-trilho');
      if (novo) {
        /* Cada cabide chega no seu tempo, sem mover a faixa inteira. */
        novo.closest('.arara').classList.remove('ver');
        novo.closest('.arara').setAttribute('aria-busy', 'true');
        const entrada = animarFila(novo, true);
        araraFiltroAnim = entrada;
        entrada.finished.then(() => {
          if (araraFiltroAnim !== entrada || araraFiltroEstado !== estado || !novo.isConnected) return;
          entrada.cancel(); araraFiltroAnim = null;
          novo.closest('.arara').removeAttribute('aria-busy');
          araraFiltroEstado = null;
          if (JSON.stringify(estadoFiltro(ns)) !== estado.aplicado) transicaoCorArara(ns, estado.foco);
        });
        limpezas.push(cancelarFiltroArara);
      } else {
        araraFiltroEstado = null;
        const vazio = $('.fb-vazio');
        if (vazio) vazio.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
      }
      if (estado.foco) { const b = $(`[data-foco="${estado.foco}"]`); if (b) b.focus({ preventScroll: true }); }
    }, tempoSaida);
    limpezas.push(cancelarFiltroArara);
  }
  function aplicarFiltro(ns, foco, corAntes) {
    const f = estadoFiltro(ns), base = ns === 'loja' ? VISIVEIS : doDep(ns);
    /* quem filtra por cor já vê cada peça naquela cor */
    if (f.cor !== corAntes) base.forEach(p => {
      const s = selDe(p);
      if (!f.cor) s.cor = p.cores[0];
      else if (CORES[s.cor].familia !== f.cor) { const k = p.cores.find(x => CORES[x].familia === f.cor); if (k) s.cor = k; }
    });
    if (ns === 'loja') { repintarLoja(foco); return; }
    if (f.cor !== corAntes && $('.arara-trilho') && !calmo()) { transicaoCorArara(ns, foco); return; }
    cancelarFiltroArara();
    const y = scrollY;
    desenharRota(false);
    scrollTo(0, y);
    if (foco) { const a = $(`[data-foco="${foco}"]`); if (a) a.focus({ preventScroll: true }); }
  }
  function telaLoja() {
    const f = S.filtros, l = filtrados();
    const base = f.dep ? doDep(f.dep) : VISIVEIS;
    const aba = (val, rot) => `<button type="button" class="aba${f.dep === val ? ' ativa' : ''}" data-filtro="dep" data-valor="${val}" data-foco="dep-${val}" aria-pressed="${f.dep === val}">${rot}</button>`;
    const extra = `<label class="fb-sel"><span>Estilo</span><select data-estilo data-foco="fb-estilo"><option value="">Todos</option>${Object.entries(ESTILOS).map(([k, e]) => `<option value="${k}"${f.estilo === k ? ' selected' : ''}>${e.nome}</option>`).join('')}</select></label>
      <button type="button" class="fb-promo${f.promo ? ' ativa' : ''}" data-promo data-foco="promo" aria-pressed="${f.promo}">Promoções</button>`;
    return `<section class="loja guia">
      <header class="loja-cab">
        <h1 class="titulo-dep">${f.dep ? DEPARTAMENTOS[f.dep].nome : 'Toda a loja'}</h1>
        <div class="loja-cab-d"><p class="mono" aria-live="polite">${String(l.length).padStart(2, '0')} ${l.length === 1 ? 'peça' : 'peças'}${f.q ? ` para “${seguro(f.q)}”` : ''}</p>
          <label class="fb-sel"><span>Ordenar</span>
            <select id="ordem" data-ordem>
              ${[['relevancia', 'Destaques'], ['menor', 'Menor preço'], ['maior', 'Maior preço'], ['promo', 'Maior desconto']].map(([v, t]) => `<option value="${v}"${f.ordem === v ? ' selected' : ''}>${t}</option>`).join('')}
            </select>
          </label>
        </div>
      </header>
      <nav class="abas" aria-label="Departamentos">${aba('', 'Tudo')}${Object.entries(DEPARTAMENTOS).map(([k, d]) => aba(k, d.nome)).join('')}</nav>
      <div class="loja-barra">
        ${barraFiltros('loja', base, extra)}
      </div>
      <div class="loja-resultados">${!l.length ? semResultado('loja')
        : f.dep || f.q ? `<div class="grade">${l.map(cardHTML).join('')}</div>`
        : Object.entries(DEPARTAMENTOS).map(([k, d]) => {
          const grupo = l.filter(p => p.dep === k);
          if (!grupo.length) return '';
          return `<section class="loja-secao" aria-labelledby="sec-${k}">
            <header class="loja-secao-cab">
              <div><h2 class="titulo" id="sec-${k}">${d.nome}</h2><span class="mono">${String(grupo.length).padStart(2, '0')} ${grupo.length === 1 ? 'peça' : 'peças'}</span></div>
              <button type="button" class="link-parede" data-filtro="dep" data-valor="${k}">Ver todos ${icone('dir')}</button>
            </header>
            <div class="grade">${grupo.slice(0, 4).map(cardHTML).join('')}</div>
          </section>`;
        }).join('')}</div>
    </section>`;
  }

  /* ---------- PRODUTO ---------- */
  function vizinhos(p) {
    const l = doDep(p.dep), i = l.indexOf(p);
    return [l[(i - 1 + l.length) % l.length], l[(i + 1) % l.length]];
  }
  function telaProduto(p) {
    if (!ehArara(p)) return telaCena(p.dep, p);
    const s = selDe(p), [ant, prox] = vizinhos(p), dep = DEPARTAMENTOS[p.dep];
    return `<section class="pdp pdp-arara" id="pdp" data-id="${p.id}" data-tom="claro" style="--fundo:${dep.cor};--tinta:${dep.tinta};--glow:${LED}">
      <div class="pdp-grade guia">
        <div class="pdp-info">
          <p class="mono"><a href="#${p.dep}">${dep.nome}</a> / ${String(doDep(p.dep).indexOf(p) + 1).padStart(2, '0')}</p>
          <h1 class="pdp-nome">${p.nome}</h1>
          <p class="pdp-desc">${p.desc}</p>
          <div class="pdp-tags">${p.estilos.map(e => `<a class="pilula pilula-tinta" href="#estilo-${e}">${ESTILOS[e].nome}</a>`).join('')}<span class="pilula pilula-tinta pilula-fixa">${p.publico}</span></div>
        </div>
        <div class="pdp-palco" id="palco">
          <div class="arara-cano" aria-hidden="true"></div>
          <a class="vizinho vizinho-e" href="#p-${ant.id}" data-peca="${ant.id}" aria-label="Peça anterior: ${ant.nome}">${arte(ant, selDe(ant).cor, selDe(ant).modelo)}</a>
          <div class="pdp-peca" id="pdp-peca">${fotoHTML(p, s.cor, true, s.modelo)}</div>
          <a class="vizinho vizinho-d" href="#p-${prox.id}" data-peca="${prox.id}" aria-label="Próxima peça: ${prox.nome}">${arte(prox, selDe(prox).cor, selDe(prox).modelo)}</a>
        </div>
        ${compraHTML(p)}
      </div>
    </section>
    ${combinaHTML(p)}`;
  }
  function tabelaMedidas(p) {
    if (p.tam === undefined) return '';
    const num = p.dep === 'tenis' ? p.tam.map(t => [t, (Number(t) * .666 + .4).toFixed(1) + ' cm']) :
      p.tam.map((t, i) => [t, (p.art === 'calca' ? 72 + i * 4 : 88 + i * 6) + ' cm']);
    const rot = p.dep === 'tenis' ? 'Comprimento do pé' : p.art === 'calca' ? 'Cintura' : p.dep === 'meias' ? 'Medida' : 'Tórax';
    return `<table class="medidas"><thead><tr><th scope="col">Tamanho</th><th scope="col">${rot}</th></tr></thead><tbody>${num.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
  }
  function comboPara(p) {
    const ordem = { tenis: ['meias', 'roupas', 'casacos'], meias: ['tenis', 'roupas', 'intima'], intima: ['meias', 'roupas', 'casacos'], casacos: ['roupas', 'tenis', 'meias'], roupas: ['tenis', 'casacos', 'meias'] }[p.dep];
    const sai = [];
    ordem.forEach(d => {
      const cand = doDep(d).filter(x => x.estilos.some(e => p.estilos.includes(e)));
      const lista = cand.length ? cand : doDep(d);
      sai.push(lista[(p.id.length + d.length) % lista.length]);
    });
    const extra = doDep(p.dep).filter(x => x !== p)[0];
    if (extra) sai.push(extra);
    return sai;
  }
  function pintarProduto(p, comAnim) {
    const s = selDe(p), c = CORES[s.cor], sec = $('#pdp');
    if (!sec) return;
    const box = $('#pdp-peca');
    Mov.trocaPeca(box, () => {
      box.innerHTML = p.foto ? fotoHTML(p, s.cor, true, s.modelo) : arte(p, s.cor, s.modelo, s.vista);
      $('#nome-cor').textContent = c.nome;
      pintarCorParede(p);
    }, comAnim && ehArara(p));
  }

  /* ---------- SACOLA ---------- */
  function salvarSacola() { guardar('sacola', S.sacola); guardar('cupom', S.cupom); }
  function revalidarCupom() {
    if (S.cupom && !checarCupom(S.cupom).ok) {
      if (S.sacola.length) S.cupomAviso = `O cupom ${S.cupom} saiu: ${checarCupom(S.cupom).msg}`;
      S.cupom = null;
    }
  }
  function adicionar(p, s) {
    const k = i => i.id === p.id && i.cor === s.cor && i.modelo === s.modelo && i.tam === s.tam;
    const achado = S.sacola.find(k);
    if (achado) achado.qtd = Math.min(9, achado.qtd + 1);
    else S.sacola.push({ id: p.id, cor: s.cor, modelo: s.modelo, tam: s.tam, qtd: 1 });
    salvarSacola(); atualizarSacola();
  }
  function atualizarSacola() {
    revalidarCupom();
    const n = S.sacola.reduce((t, i) => t + i.qtd, 0);
    $('#contador').textContent = `(${String(n).padStart(2, '0')})`;
    $('#btn-sacola').setAttribute('aria-label', `Abrir sacola, ${n} ${n === 1 ? 'item' : 'itens'}`);
    $('#sacola-corpo').innerHTML = sacolaHTML();
    if ($('#ck-resumo')) $('#ck-resumo').innerHTML = resumoHTML();
    salvarSacola();
    contarTotais();
  }
  function contarTotais() {
    Mov.contar($('#sacola-corpo .total dd'), 'sacola', totais(false).total);
    if ($('#ck-resumo .total dd')) Mov.contar($('#ck-resumo .total dd'), 'checkout', totais(true).total);
  }
  function itemHTML(i, idx, compacto) {
    const p = porId(i.id), c = CORES[i.cor], mod = p.modelos.length > 1 ? p.modelos[i.modelo].n + ' · ' : '';
    return `<li class="item" style="--i:${idx}">
      <a class="item-foto" href="#p-${p.id}" style="--fundo:${c.fundo}" data-fecha-sacola aria-label="Ver ${p.nome}">${arte(p, i.cor, i.modelo)}</a>
      <div class="item-info">
        <a class="item-nome" href="#p-${p.id}" data-fecha-sacola>${p.nome}</a>
        <p class="item-var">${c.nome} · ${mod}${i.tam}</p>
        ${compacto ? `<p class="item-var">Quantidade: ${i.qtd}</p>` : `<div class="qtd">
          <button type="button" data-qtd="${idx}" data-delta="-1" aria-label="Tirar uma unidade de ${p.nome}">${icone('menos')}</button>
          <output aria-live="polite">${i.qtd}</output>
          <button type="button" data-qtd="${idx}" data-delta="1" aria-label="Pôr mais uma unidade de ${p.nome}" ${i.qtd >= 9 ? 'disabled' : ''}>${icone('mais')}</button>
          <button type="button" class="item-rem" data-remover="${idx}" aria-label="Remover ${p.nome} da sacola">${icone('lixo')}</button>
        </div>`}
      </div>
      <p class="item-preco">${R$(p.preco * i.qtd)}</p>
    </li>`;
  }
  function cupomHTML(idCampo) {
    const c = S.cupom && CUPONS[S.cupom];
    if (c) return `<div class="cupom-ativo"><div><b>${S.cupom}</b><span>${c.texto}</span></div><button type="button" class="link" data-tirar-cupom>Remover</button></div>`;
    const sugestoes = Object.keys(CUPONS).map(k => `<button type="button" class="cupom-mini" data-sugerir="${k}" title="${CUPONS[k].texto}">${k}</button>`).join('');
    return `<form class="cupom-form" data-form-cupom novalidate>
      <label for="${idCampo}">Cupom de desconto</label>
      <div class="cupom-linha">
        <input id="${idCampo}" name="cupom" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${seguro(S.cupomDigitado || '')}" placeholder="Digite o código" aria-describedby="${idCampo}-msg">
        <button type="submit" class="botao botao-pequeno">Aplicar</button>
      </div>
      <p class="erro" id="${idCampo}-msg" role="alert"${S.cupomErro ? '' : ' hidden'}>${seguro(S.cupomErro || '')}</p>
      <div class="cupom-sugestoes">${sugestoes}</div>
    </form>`;
  }
  function sacolaHTML() {
    if (!S.sacola.length) {
      return `<div class="sacola-vazia">
        <p class="titulo">Sua sacola está vazia.</p>
        <p>Comece pela parede de tênis ou pela arara.</p>
        <div class="dep-outros"><a class="pilula" href="#tenis" data-fecha-sacola>Tênis</a><a class="pilula" href="#casacos" data-fecha-sacola>Casacos</a><a class="pilula" href="#roupas" data-fecha-sacola>Roupas</a></div>
      </div>`;
    }
    const t = totais(false);
    const falta = FRETE_GRATIS_A_PARTIR - t.sub;
    const pct = Math.min(100, Math.round(t.sub / FRETE_GRATIS_A_PARTIR * 100));
    return `<div class="frete-barra">
        <p>${falta > 0 ? `Faltam <b>${R$(falta)}</b> para o frete grátis` : '<b>Frete grátis</b> na entrega econômica'}</p>
        <div class="barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Progresso até o frete grátis"><i style="width:${pct}%"></i></div>
      </div>
      <ul class="itens">${S.sacola.map((i, x) => itemHTML(i, x)).join('')}</ul>
      <div class="sacola-pe">
        ${S.cupomAviso ? `<p class="aviso">${seguro(S.cupomAviso)}</p>` : ''}
        ${cupomHTML('cupom-sacola')}
        <dl class="contas">
          <div><dt>Subtotal</dt><dd>${R$(t.sub)}</dd></div>
          ${t.desc ? `<div class="desconto"><dt>Cupom ${S.cupom}</dt><dd>- ${R$(t.desc)}</dd></div>` : ''}
          ${t.freteGratisCupom ? `<div class="desconto"><dt>Cupom ${S.cupom}</dt><dd>Frete econômico grátis</dd></div>` : ''}
          <div><dt>Frete</dt><dd>Calculado no checkout</dd></div>
          <div class="total"><dt>Total</dt><dd>${R$(t.total)}</dd></div>
        </dl>
        <a class="botao botao-grande" href="#checkout" data-fecha-sacola>Finalizar compra ${icone('dir')}</a>
        <button type="button" class="link link-centro" data-fechar-sacola>Continuar comprando</button>
      </div>`;
  }
  let focoAntes = null;
  function abrirSacola() {
    const a = $('#sacola'); focoAntes = document.activeElement;
    a.hidden = false; $('#sombra').hidden = false;
    requestAnimationFrame(() => { a.classList.add('aberta'); $('#sombra').classList.add('aberta'); });
    $('#miolo').inert = true;
    document.documentElement.classList.add('travado');
    setTimeout(() => { const f = $('#fechar-sacola'); if (f) f.focus(); }, 40);
  }
  function fecharSacola() {
    const a = $('#sacola');
    if (a.hidden) return;
    a.classList.remove('aberta'); $('#sombra').classList.remove('aberta');
    $('#miolo').inert = false;
    document.documentElement.classList.remove('travado');
    setTimeout(() => { a.hidden = true; $('#sombra').hidden = true; }, calmo() ? 0 : 320);
    if (focoAntes && focoAntes.isConnected) focoAntes.focus();
  }
  function voarParaSacola(origem) {
    const alvo = $('#btn-sacola');
    alvo.classList.remove('pulo'); void alvo.offsetWidth; alvo.classList.add('pulo');
    if (calmo() || !origem) return;
    const r = origem.getBoundingClientRect(), a = alvo.getBoundingClientRect();
    const c = origem.cloneNode(true);
    c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;z-index:90;pointer-events:none;margin:0;view-transition-name:none`;
    document.body.appendChild(c);
    const dx = a.left + a.width / 2 - (r.left + r.width / 2), dy = a.top + a.height / 2 - (r.top + r.height / 2);
    const an = c.animate([
      { transform: 'none', opacity: 1 },
      { transform: `translate(${dx * .55}px, ${dy * .3 - 60}px) scale(.45) rotate(-10deg)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.06) rotate(14deg)`, opacity: .3 }
    ], { duration: 720, easing: 'cubic-bezier(.45,.05,.3,1)' });
    an.onfinish = () => c.remove();
  }
  let toastT = 0;
  function toast(msg, acao) {
    const t = $('#toast');
    t.innerHTML = `<span>${msg}</span>${acao ? `<button type="button" class="link" data-acao-toast>${acao}</button>` : ''}`;
    t.hidden = false; t.classList.add('visivel');
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.classList.remove('visivel'); setTimeout(() => { t.hidden = true; }, 240); }, 4200);
  }

  /* ---------- CHECKOUT SIMULADO ---------- */
  const so = s => s.replace(/\D/g, '');
  const mascara = {
    cpf: v => { const d = so(v).slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); },
    tel: v => { const d = so(v).slice(0, 11); return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3') : d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (m, a, b, c) => (a ? `(${a}` : '') + (b ? `) ${b}` : '') + (c ? `-${c}` : '')); },
    cep: v => { const d = so(v).slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; },
    cartao: v => so(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 '),
    val: v => { const d = so(v).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; },
    cvv: v => so(v).slice(0, 4), uf: v => v.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase()
  };
  function cpfValido(c) {
    const d = so(c); if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (const n of [9, 10]) {
      let s = 0; for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
      if (((s * 10) % 11) % 10 !== +d[n]) return false;
    }
    return true;
  }
  function luhn(n) {
    const d = so(n); if (d.length < 13) return false;
    let s = 0, dobra = false;
    for (let i = d.length - 1; i >= 0; i--) { let x = +d[i]; if (dobra) { x *= 2; if (x > 9) x -= 9; } s += x; dobra = !dobra; }
    return s % 10 === 0;
  }
  const bandeira = n => { const d = so(n); if (/^4/.test(d)) return 'Visa'; if (/^5[1-5]|^2[2-7]/.test(d)) return 'Mastercard'; if (/^3[47]/.test(d)) return 'Amex'; if (/^(50|63|65)/.test(d)) return 'Elo'; return 'Cartão'; };
  function validaEtapa(n) {
    const e = {}, { dados: D, ent: N, pag: G } = S.ck;
    if (n === 1) {
      if (D.nome.trim().split(/\s+/).length < 2) e.nome = 'Escreva nome e sobrenome.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(D.email)) e.email = 'Confira o e-mail. Exemplo: voce@email.com';
      if (!cpfValido(D.cpf)) e.cpf = 'CPF inválido. Confira os 11 números.';
      if (so(D.tel).length < 10) e.tel = 'Escreva o telefone com DDD.';
    }
    if (n === 2) {
      if (!regiaoCep(N.cep)) e.cep = 'O CEP tem 8 números.';
      if (N.frete !== 'loja') {
        if (!N.rua.trim()) e.rua = 'Escreva o nome da rua.';
        if (!N.num.trim()) e.num = 'Escreva o número, ou S/N.';
        if (!N.bairro.trim()) e.bairro = 'Escreva o bairro.';
        if (!N.cidade.trim()) e.cidade = 'Escreva a cidade.';
        if (N.uf.length !== 2) e.uf = 'Use a sigla: SP, RJ...';
      }
    }
    if (n === 3 && (G.metodo === 'credito' || G.metodo === 'debito')) {
      if (!luhn(G.num)) e.num = 'Número de cartão inválido. Para testar, use 4242 4242 4242 4242.';
      if (G.titular.trim().length < 3) e.titular = 'Escreva o nome como está no cartão.';
      const m = /^(\d{2})\/(\d{2})$/.exec(G.val);
      const hoje = new Date();
      if (!m || +m[1] < 1 || +m[1] > 12) e.val = 'Use o formato MM/AA.';
      else if (new Date(2000 + +m[2], +m[1], 1) <= hoje) e.val = 'Este cartão já venceu.';
      if (so(G.cvv).length < 3) e.cvv = 'O CVV tem 3 ou 4 números.';
    }
    S.ck.erros = e;
    return !Object.keys(e).length;
  }
  function campo(sec, nome, rot, ext = {}) {
    const v = S.ck[sec][nome], er = S.ck.erros[nome], id = `ck-${sec}-${nome}`;
    return `<div class="campo ${ext.cl || ''}${er ? ' tem-erro' : ''}">
      <label for="${id}">${rot}${ext.opc ? ' <span>(opcional)</span>' : ''}</label>
      <input id="${id}" data-sec="${sec}" data-nome="${nome}" ${ext.mask ? `data-mask="${ext.mask}"` : ''} value="${seguro(v)}" type="${ext.tipo || 'text'}" ${ext.modo ? `inputmode="${ext.modo}"` : ''} autocomplete="${ext.auto || 'off'}" placeholder="${ext.ph || ''}" ${er ? `aria-invalid="true" aria-describedby="${id}-e"` : ''}>
      ${er ? `<p class="erro" id="${id}-e">${er}</p>` : ''}
    </div>`;
  }
  function etapaCab(n, titulo, resumo) {
    const at = S.ck.etapa;
    return `<div class="etapa-cab">
      <span class="etapa-num${at > n ? ' feita' : ''}${at === n ? ' atual' : ''}">${at > n ? icone('check') : n}</span>
      <div class="etapa-tit"><h2>${titulo}</h2>${at > n && resumo ? `<p>${seguro(resumo)}</p>` : ''}</div>
      ${at > n ? `<button type="button" class="link" data-ir-etapa="${n}">Editar</button>` : ''}
    </div>`;
  }
  function etapa1() {
    const D = S.ck.dados;
    return `<section class="etapa${S.ck.etapa === 1 ? ' aberta' : ''}">${etapaCab(1, 'Seus dados', `${D.nome} · ${D.email}`)}
      ${S.ck.etapa === 1 ? `<div class="etapa-corpo">
        <button type="button" class="pilula pilula-exemplo" data-exemplo>Preencher tudo com dados de exemplo</button>
        <div class="campos">
          ${campo('dados', 'nome', 'Nome completo', { cl: 'largo', auto: 'off' })}
          ${campo('dados', 'email', 'E-mail', { tipo: 'email', modo: 'email', ph: 'voce@email.com' })}
          ${campo('dados', 'cpf', 'CPF', { mask: 'cpf', modo: 'numeric', ph: '000.000.000-00' })}
          ${campo('dados', 'tel', 'Celular', { mask: 'tel', modo: 'tel', ph: '(11) 90000-0000' })}
        </div>
        <button type="button" class="botao botao-grande" data-avancar="1">Ir para a entrega ${icone('dir')}</button>
      </div>` : ''}</section>`;
  }
  function etapa2() {
    const N = S.ck.ent, ops = opcoesFrete(), r = regiaoCep(N.cep), t = totais(true);
    const resumoEnt = N.frete === 'loja' ? 'Retirada na Hypex Centro' : `${N.rua}, ${N.num} · ${N.cidade}/${N.uf}`;
    return `<section class="etapa${S.ck.etapa === 2 ? ' aberta' : ''}">${etapaCab(2, 'Entrega', resumoEnt)}
      ${S.ck.etapa === 2 ? `<div class="etapa-corpo">
        <div class="campos">${campo('ent', 'cep', 'CEP', { mask: 'cep', modo: 'numeric', ph: '00000-000' })}
          <div class="campo campo-dica" id="cep-dica">${r ? `<p>Entrega para <b>${r.cidade}/${r.uf}</b></p>` : '<p>O prazo e o frete aparecem quando o CEP estiver completo.</p>'}</div>
        </div>
        ${r ? `<div class="fretes" role="radiogroup" aria-label="Forma de entrega">${ops.map(o => {
          const gratis = o.id === 'econ' && (t.gratisPorValor || t.freteGratisCupom);
          return `<label class="frete${N.frete === o.id ? ' ativo' : ''}"><input type="radio" name="frete" value="${o.id}" data-frete ${N.frete === o.id ? 'checked' : ''}>
            <span class="frete-nome">${o.nome}</span><span class="frete-prazo">${o.prazo}</span>
            <span class="frete-valor">${gratis || o.valor === 0 ? 'Grátis' : R$(o.valor)}</span></label>`;
        }).join('')}</div>
        ${N.frete !== 'loja' ? `<div class="campos">
          ${campo('ent', 'rua', 'Rua', { cl: 'largo', auto: 'off' })}
          ${campo('ent', 'num', 'Número', { modo: 'text' })}
          ${campo('ent', 'comp', 'Complemento', { opc: true })}
          ${campo('ent', 'bairro', 'Bairro')}
          ${campo('ent', 'cidade', 'Cidade')}
          ${campo('ent', 'uf', 'UF', { mask: 'uf' })}
        </div>` : ''}` : ''}
        <button type="button" class="botao botao-grande" data-avancar="2">Ir para o pagamento ${icone('dir')}</button>
      </div>` : ''}</section>`;
  }
  function qrFalso(seed) {
    let h = seed, rnd = () => { h = (h * 9301 + 49297) % 233280; return h / 233280; }, s = '';
    const n = 25, marca = (x, y) => x < 7 && y < 7 || x >= n - 7 && y < 7 || x < 7 && y >= n - 7;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!marca(x, y) && rnd() > .52) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    const q = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
    return `<svg class="qr" viewBox="-1 -1 27 27" role="img" aria-label="QR Code ilustrativo"><rect x="-1" y="-1" width="27" height="27" fill="#fff"/><g fill="#14112B">${s}${q(0, 0)}${q(n - 7, 0)}${q(0, n - 7)}</g></svg>`;
  }
  function etapa3() {
    const G = S.ck.pag, t = totais(true);
    const metodos = [['pix', 'Pix', '5% off e aprovação na hora'], ['credito', 'Cartão de crédito', 'Até 6x sem juros'], ['debito', 'Cartão de débito', 'À vista'], ['boleto', 'Boleto', 'Compensa em até 2 dias úteis']];
    let corpo = '';
    if (G.metodo === 'pix') {
      corpo = S.ck.pixGerado ? `<div class="pagar-pix">
          ${qrFalso(so(S.ck.dados.cpf).slice(0, 5) * 1 + t.total)}
          <div>
            <p class="titulo-pequeno">Pague ${R$(t.total)} com Pix</p>
            <p>QR Code ilustrativo. Este Pix não é real e não movimenta dinheiro.</p>
            <p class="mono" id="pix-tempo" aria-live="off">Expira em 10:00</p>
            <button type="button" class="botao botao-grande" data-pagar>Simular pagamento do Pix</button>
          </div>
        </div>` : `<button type="button" class="botao botao-grande" data-gerar-pix>Gerar Pix de ${R$(t.total)}</button>`;
    } else if (G.metodo === 'boleto') {
      let barras = ''; let x = 0, h = t.total;
      while (x < 300) { h = (h * 9301 + 49297) % 233280; const w = 1 + h % 4; barras += `<rect x="${x}" y="0" width="${w}" height="50"/>`; x += w + 1 + (h >> 3) % 3; }
      corpo = `<div class="pagar-boleto">
          <svg viewBox="0 0 300 50" class="barras" role="img" aria-label="Código de barras ilustrativo" preserveAspectRatio="none"><g fill="#14112B">${barras}</g></svg>
          <p>Boleto ilustrativo de ${R$(t.total)}. Não pague em banco.</p>
          <button type="button" class="botao botao-grande" data-pagar>Simular pagamento do boleto</button>
        </div>`;
    } else {
      const cred = G.metodo === 'credito';
      const parcelas = [1, 2, 3, 4, 5, 6].filter(n => n === 1 || t.total / n >= 3000);
      if (!parcelas.includes(+G.parc)) G.parc = 1;
      corpo = `<div class="pagar-cartao">
        <div class="cartao-visual" aria-hidden="true">
          <span class="cartao-band" id="c-band">${bandeira(G.num)}</span>
          <span class="cartao-num" id="c-num">${seguro(G.num) || '•••• •••• •••• ••••'}</span>
          <span class="cartao-pe"><span id="c-tit">${seguro(G.titular.toUpperCase()) || 'SEU NOME'}</span><span id="c-val">${seguro(G.val) || 'MM/AA'}</span></span>
        </div>
        <div class="campos">
          ${campo('pag', 'num', 'Número do cartão', { mask: 'cartao', modo: 'numeric', cl: 'largo', ph: '0000 0000 0000 0000', auto: 'off' })}
          ${campo('pag', 'titular', 'Nome no cartão', { cl: 'largo', auto: 'off' })}
          ${campo('pag', 'val', 'Validade', { mask: 'val', modo: 'numeric', ph: 'MM/AA', auto: 'off' })}
          ${campo('pag', 'cvv', 'CVV', { mask: 'cvv', modo: 'numeric', ph: '000', auto: 'off' })}
          ${cred ? `<div class="campo largo"><label for="ck-parc">Parcelas</label>
            <select id="ck-parc" data-parc>${parcelas.map(n => `<option value="${n}"${+G.parc === n ? ' selected' : ''}>${n}x de ${R$(Math.ceil(t.total / n))} sem juros</option>`).join('')}</select></div>` : ''}
        </div>
        <p class="dica">Cartão de teste: 4242 4242 4242 4242, validade futura e qualquer CVV. Final 0002 simula recusa: 4000 0000 0000 0002.</p>
        ${S.ck.recusa ? `<p class="erro erro-caixa" role="alert">${S.ck.recusa}</p>` : ''}
        <button type="button" class="botao botao-grande" data-pagar>Pagar ${R$(t.total)}</button>
      </div>`;
    }
    return `<section class="etapa${S.ck.etapa === 3 ? ' aberta' : ''}">${etapaCab(3, 'Pagamento')}
      ${S.ck.etapa === 3 ? `<div class="etapa-corpo">
        <div class="metodos" role="radiogroup" aria-label="Forma de pagamento">
          ${metodos.map(([id, nome, dica]) => `<label class="metodo${G.metodo === id ? ' ativo' : ''}"><input type="radio" name="metodo" value="${id}" data-metodo ${G.metodo === id ? 'checked' : ''}><b>${nome}</b><span>${dica}</span></label>`).join('')}
        </div>
        ${corpo}
      </div>` : ''}</section>`;
  }
  function resumoHTML() {
    const t = totais(true);
    return `<h2 class="titulo-pequeno">Resumo da compra</h2>
      <ul class="itens itens-compactos">${S.sacola.map((i, x) => itemHTML(i, x, true)).join('')}</ul>
      ${cupomHTML('cupom-ck')}
      ${S.cupomAviso ? `<p class="aviso">${seguro(S.cupomAviso)}</p>` : ''}
      <dl class="contas">
        <div><dt>Subtotal</dt><dd>${R$(t.sub)}</dd></div>
        ${t.desc ? `<div class="desconto"><dt>Cupom ${S.cupom}</dt><dd>- ${R$(t.desc)}</dd></div>` : ''}
        ${t.pix ? `<div class="desconto"><dt>5% off no Pix</dt><dd>- ${R$(t.pix)}</dd></div>` : ''}
        <div><dt>Frete</dt><dd>${t.frete === null ? 'Informe o CEP' : t.frete === 0 ? 'Grátis' : R$(t.frete)}</dd></div>
        <div class="total"><dt>Total</dt><dd>${R$(t.total)}</dd></div>
      </dl>`;
  }
  function telaCheckout() {
    if (!S.sacola.length) return `<section class="ck guia"><div class="vazio"><p class="titulo">Sua sacola está vazia.</p><a class="botao" href="#loja">Ver a loja</a></div></section>`;
    return `<section class="ck guia">
      <div class="ck-cab"><h1 class="titulo-dep">Finalizar compra</h1>
        <p class="aviso-demo"><b>Compra simulada.</b> Nenhum valor é cobrado. Não digite dados reais de cartão.</p></div>
      <div class="ck-grade">
        <div class="ck-etapas" id="ck-etapas">${etapa1()}${etapa2()}${etapa3()}</div>
        <aside class="ck-resumo" id="ck-resumo">${resumoHTML()}</aside>
      </div>
    </section>`;
  }
  function pintarEtapas() { const e = $('#ck-etapas'); if (e) e.innerHTML = etapa1() + etapa2() + etapa3(); const r = $('#ck-resumo'); if (r) r.innerHTML = resumoHTML(); contarTotais(); }

  let pixInt = 0;
  function iniciarPixRelogio() {
    clearInterval(pixInt); let s = 600;
    pixInt = setInterval(() => {
      const el = $('#pix-tempo'); if (!el) { clearInterval(pixInt); return; }
      s--; if (s <= 0) { clearInterval(pixInt); el.textContent = 'Pix expirado. Gere outro.'; return; }
      el.textContent = `Expira em ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
  }
  function concluirPedido() {
    const t = totais(true), N = S.ck.ent, G = S.ck.pag;
    const op = opcoesFrete().find(o => o.id === N.frete);
    const nomes = { pix: 'Pix', credito: `Crédito ${bandeira(G.num)} em ${G.parc}x`, debito: `Débito ${bandeira(G.num)}`, boleto: 'Boleto' };
    S.pedido = {
      numero: 'HPX-' + Math.floor(100000 + Math.random() * 899999),
      itens: S.sacola.slice(), totais: t, cupom: S.cupom,
      pagamento: nomes[G.metodo], primeiroNome: S.ck.dados.nome.trim().split(/\s+/)[0],
      entrega: N.frete === 'loja' ? 'Retirada na Hypex Centro' : `${N.rua}, ${N.num} · ${N.cidade}/${N.uf}`,
      prazo: op.prazo, email: S.ck.dados.email
    };
    guardar('pedido', S.pedido);
    S.sacola = []; S.cupom = null; S.cupomAviso = ''; S.cupomErro = ''; S.cupomDigitado = '';
    Object.assign(S.ck.pag, { num: '', titular: '', val: '', cvv: '', parc: 1 });
    S.ck.etapa = 1; S.ck.pixGerado = false; S.ck.recusa = ''; S.ck.erros = {};
    salvarSacola(); atualizarSacola();
    location.hash = 'pedido';
  }
  function pagar(btn) {
    if (!validaEtapa(3)) { pintarEtapas(); const e = $('.tem-erro input'); if (e) e.focus(); return; }
    const G = S.ck.pag;
    S.ck.recusa = '';
    btn.disabled = true;
    btn.innerHTML = '<span class="gira"></span> Processando pagamento';
    setTimeout(() => {
      if ((G.metodo === 'credito' || G.metodo === 'debito') && so(G.num).endsWith('0002')) {
        S.ck.recusa = 'Pagamento recusado pela simulação. Troque o cartão ou escolha outra forma de pagamento.';
        pintarEtapas();
        return;
      }
      concluirPedido();
    }, 1400);
  }
  function telaPedido() {
    const o = S.pedido;
    if (!o) return `<section class="ck guia"><div class="vazio"><p class="titulo">Ainda não há pedido por aqui.</p><a class="botao" href="#loja">Ver a loja</a></div></section>`;
    const t = o.totais;
    const passos = ['Pedido recebido', 'Pagamento aprovado', 'Separando as peças', 'A caminho'];
    return `<section class="pedido" style="--fundo:#D9D6CF;--tinta:#1A1A1C">
      <div class="guia pedido-cab">
        <p class="mono">Pedido ${o.numero}</p>
        <h1 class="pedido-titulo">Tudo certo, ${seguro(o.primeiroNome)}!</h1>
        <p class="pedido-sub">Esta foi uma compra simulada, então nada foi cobrado e nenhuma peça vai sair daqui. Em uma loja de verdade, a confirmação iria para ${seguro(o.email)}.</p>
        <ol class="linha-tempo">${passos.map((x, i) => `<li class="${i < 2 ? 'feito' : ''}"><i></i><span>${x}</span></li>`).join('')}</ol>
      </div>
    </section>
    <section class="guia pedido-corpo">
      <ul class="itens itens-compactos">${o.itens.map((i, x) => itemHTML(i, x, true)).join('')}</ul>
      <div class="pedido-lado">
        <dl class="contas">
          <div><dt>Subtotal</dt><dd>${R$(t.sub)}</dd></div>
          ${t.desc ? `<div class="desconto"><dt>Cupom ${o.cupom}</dt><dd>- ${R$(t.desc)}</dd></div>` : ''}
          ${t.pix ? `<div class="desconto"><dt>5% off no Pix</dt><dd>- ${R$(t.pix)}</dd></div>` : ''}
          <div><dt>Frete</dt><dd>${t.frete ? R$(t.frete) : 'Grátis'}</dd></div>
          <div class="total"><dt>Total</dt><dd>${R$(t.total)}</dd></div>
        </dl>
        <dl class="ficha"><div><dt>Pagamento</dt><dd>${seguro(o.pagamento)}</dd></div><div><dt>Entrega</dt><dd>${seguro(o.entrega)}</dd></div><div><dt>Prazo</dt><dd>${seguro(o.prazo)}</dd></div></dl>
        <a class="botao botao-grande" href="#loja">Continuar comprando ${icone('dir')}</a>
      </div>
    </section>`;
  }
  function confete() {
    if (calmo()) return;
    const cores = ['#E8541E', '#1A1A1C', '#8F979B', '#E8541E', '#3C4043', '#B9BDBE'];
    for (let i = 0; i < 46; i++) {
      const e = document.createElement('i');
      e.className = 'pluma';
      e.innerHTML = `<svg viewBox="-6 -10 34 30" width="${16 + (i % 4) * 7}"><path d="M-1 -9 H8 L13 -1 L19 -11 H29 L18 5 L27 18 H18 L13 10 L8 18 H-1 L8 5 Z" fill="${cores[i % 6]}"/></svg>`;
      e.style.left = (2 + (i * 37) % 96) + 'vw';
      document.body.appendChild(e);
      const an = e.animate([
        { transform: `translateY(-8vh) rotate(${i * 40}deg)`, opacity: 1 },
        { transform: `translate(${(i % 2 ? 1 : -1) * 60}px, 105vh) rotate(${i * 40 + 500}deg)`, opacity: .9 }
      ], { duration: 2200 + (i % 7) * 240, delay: (i % 9) * 90, easing: 'cubic-bezier(.3,.3,.6,1)', fill: 'both' });
      an.onfinish = () => e.remove();
    }
  }

  /* ---------- ARARA ARRASTÁVEL ---------- */
  let limpezas = [];
  function montarArara(el) {
    const trilho = $('.arara-trilho', el), itens = $$('.cabide', trilho), pecas = itens.map(i => $('.cabide-peca', i));
    const pontos = $$('.arara-pontos i', el); let pontoAtual = -1;
    const ang = itens.map(() => ({ a: 0, v: 0, f: 0, b: 0 }));
    let x = 0, v = 0, vAnt = 0, dest = null, arrastando = false, px = 0, inicio = 0, moveu = false, raf = 0, ultT = 0, morto = false, tAnt = 0;
    const min = () => Math.min(0, el.clientWidth - trilho.offsetWidth);
    const parado = calmo();
    let percursoScroll = null;

    function desenho() {
      trilho.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      const m = min();
      if (pontos.length) {
        const n = m ? Math.round((x / m) * (pontos.length - 1)) : 0;
        if (n !== pontoAtual) { if (pontos[pontoAtual]) pontos[pontoAtual].classList.remove('ativo'); pontoAtual = n; if (pontos[n]) pontos[n].classList.add('ativo'); }
      }
    }
    /* a arara acelera e freia como uma mola; cada peça vem atrás, como pêndulo */
    function tick(agora) {
      if (morto) return;
      const f = Math.min(2.5, tAnt ? (agora - tAnt) / 16.67 : 1) || 1; tAnt = agora;
      const m = min();
      if (!arrastando && !percursoScroll) {
        if (dest !== null) {
          const d = dest - x;
          v += (d * .0125 - v * .224) * f;
          if (Math.abs(d) < .3 && Math.abs(v) < .05) { x = dest; dest = null; v = 0; }
        } else v *= Math.pow(.955, f);
        x += v * f;
        if (x > 0) { x += (0 - x) * .12 * f; v *= Math.pow(.7, f); }
        if (x < m) { x += (m - x) * .12 * f; v *= Math.pow(.7, f); }
      }
      if (!arrastando && percursoScroll) v *= Math.pow(.82, f);
      const acel = (v - vAnt) / f; vAnt = v;
      let ativo = arrastando || dest !== null || Math.abs(v) > .05 || x > .5 || x < m - .5;
      if (!parado) ang.forEach((g, i) => {
        g.f += (acel - g.f) * (.1 + (i % 4) * .025) * f;
        g.v += (-g.a * .013 + g.f * .2 + v * .004) * f;
        g.v *= Math.pow(.968, f); g.a += g.v * f;
        g.a = 11 * Math.tanh(g.a / 11);
        g.b += (g.a - g.b) * .07 * f;
        if (Math.abs(g.a) > .02 || Math.abs(g.v) > .015) ativo = true;
        pecas[i].style.transform = `rotate(${g.a.toFixed(3)}deg) skewX(${((g.b - g.a) * .55).toFixed(3)}deg)`;
      });
      desenho();
      if (!ativo) tAnt = 0;
      raf = ativo ? requestAnimationFrame(tick) : 0;
    }
    const acorda = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const irPara = (valor, suave = true) => {
      const alvo = Math.max(min(), Math.min(0, valor));
      if (percursoScroll) percursoScroll.ir(alvo, suave);
      else { dest = alvo; acorda(); }
    };
    /* A rolagem nativa percorre uma faixa vertical com a arara fixa.
       O progresso tem a mesma origem nos dois sentidos, sem capturar wheel. */
    if (!parado && min() < -1) {
      const percurso = document.createElement('div'), fixo = document.createElement('div');
      percurso.className = 'arara-percurso'; fixo.className = 'arara-fixo';
      el.before(percurso); percurso.append(fixo); fixo.append(el);
      let distancia = 0, inicioScroll = 0, topo = 0;
      const sincronizar = () => {
        if (morto) return;
        inicioScroll = percurso.getBoundingClientRect().top + scrollY - topo;
        const novo = -Math.max(0, Math.min(distancia, scrollY - inicioScroll));
        if (Math.abs(novo - x) < .01) return;
        v = Math.max(-60, Math.min(60, novo - x)); x = novo; dest = null;
        desenho(); acorda();
      };
      const medir = (preservar = false) => {
        const dentro = distancia > 0 && scrollY >= inicioScroll && scrollY <= inicioScroll + distancia;
        const progresso = distancia ? Math.max(0, Math.min(1, -x / distancia)) : 0;
        topo = $('.topo').offsetHeight + 12;
        distancia = Math.max(0, -min());
        percurso.style.height = (el.offsetHeight + distancia) + 'px';
        percurso.style.setProperty('--arara-topo', topo + 'px');
        inicioScroll = percurso.getBoundingClientRect().top + scrollY - topo;
        if (preservar && dentro && Math.abs(scrollY - inicioScroll - progresso * distancia) > 1) scrollTo({ top: inicioScroll + progresso * distancia, behavior: 'instant' });
        sincronizar();
      };
      percursoScroll = {
        ir(valor, suave) {
          inicioScroll = percurso.getBoundingClientRect().top + scrollY - topo;
          scrollTo({ top: inicioScroll - valor, behavior: suave ? 'smooth' : 'instant' });
          if (!suave) sincronizar();
        }
      };
      const redimensionar = () => medir(true);
      addEventListener('scroll', sincronizar, { passive: true });
      addEventListener('resize', redimensionar);
      const observer = new ResizeObserver(redimensionar); observer.observe(el);
      medir();
      limpezas.push(() => {
        removeEventListener('scroll', sincronizar); removeEventListener('resize', redimensionar);
        observer.disconnect(); percursoScroll = null;
        if (percurso.isConnected) { percurso.before(el); percurso.remove(); }
      });
    }
    const mover = e => {
      if (!arrastando) return;
      const dx = e.clientX - px; px = e.clientX;
      if (Math.abs(e.clientX - inicio) > 6) moveu = true;
      const m = min();
      x += (x > 0 || x < m) ? dx * .35 : dx;
      if (percursoScroll) irPara(x, false);
      const agora = performance.now(), dt = Math.max(8, agora - ultT); ultT = agora;
      v = dx * 16 / dt;
      acorda();
    };
    const soltar = () => {
      if (!arrastando) return;
      arrastando = false; el.classList.remove('arrastando');
      removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); removeEventListener('pointercancel', soltar);
      acorda();
    };
    trilho.addEventListener('pointerdown', e => {
      if (e.button) return;
      arrastando = true; dest = null; moveu = false; px = inicio = e.clientX; ultT = performance.now(); v = 0;
      el.classList.add('arrastando');
      addEventListener('pointermove', mover); addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
      acorda();
    });
    trilho.addEventListener('click', e => {
      if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; return; }
    }, true);
    trilho.addEventListener('dragstart', e => e.preventDefault());
    itens.forEach((it, i) => {
      it.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch' && !arrastando && !parado) { ang[i].v += .28; acorda(); } });
      it.addEventListener('focus', () => {
        const r = it.offsetLeft, w = it.offsetWidth;
        if (r + x < 0 || r + w + x > el.clientWidth) { irPara(el.clientWidth / 2 - r - w / 2); trilho.parentElement.scrollLeft = 0; }
      });
    });
    $$('[data-seta]', el).forEach(b => b.addEventListener('click', () => {
      /* anda de peça em peça e para sempre com a peça inteira à vista */
      const passo = itens.length > 1 ? itens[1].offsetLeft - itens[0].offsetLeft : el.clientWidth * .7;
      const qtd = Math.max(1, Math.floor(el.clientWidth * .62 / passo));
      const base = Math.round((dest === null ? x : dest) / passo) * passo;
      irPara(base - b.dataset.seta * qtd * passo);
    }));
    const cabe = () => el.classList.toggle('cabe', min() === 0);
    const rs = () => { cabe(); acorda(); };
    addEventListener('resize', rs);
    cabe();
    desenho();
    /* entrada: as peças chegam deslizando e balançam ao parar */
    if (!parado && !araraFiltrando && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        io.disconnect(); el.classList.add('ver');
        itens.forEach((_, i) => setTimeout(() => { if (!morto) { ang[i].v += .62; acorda(); } }, 380 + i * 65));
      }), { threshold: .2 });
      io.observe(el); limpezas.push(() => io.disconnect());
    }
    const vento = e => { if (parado || morto) return; ang.forEach((g, i) => { g.v += e.detail * (.18 + (i % 4) * .05); }); acorda(); };
    addEventListener('hypex:vento', vento);
    const brisa = setInterval(() => {
      if (parado || morto || arrastando || document.hidden) return;
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      for (let n = 0; n < 2; n++) { const g = ang[Math.floor(Math.random() * ang.length)]; if (g) g.v += .07 + Math.random() * .1; }
      acorda();
    }, 2600);
    limpezas.push(() => { clearInterval(brisa); removeEventListener('hypex:vento', vento); });
    limpezas.push(() => { morto = true; cancelAnimationFrame(raf); removeEventListener('resize', rs); removeEventListener('pointermove', mover); removeEventListener('pointerup', soltar); });
  }

  function montarParedes() {
    $$('.parede').forEach(par => {
      const f = e => { const r = par.getBoundingClientRect(); par.style.setProperty('--mx', (e.clientX - r.left) + 'px'); par.style.setProperty('--my', (e.clientY - r.top) + 'px'); };
      par.addEventListener('pointermove', f);
    });
    if ('IntersectionObserver' in window && !calmo()) {
      const io = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('acender'); io.unobserve(en.target); }
      }), { threshold: .15 });
      $$('.parede .nichos').forEach(n => io.observe(n));
      limpezas.push(() => io.disconnect());
    }
  }
  function montarPalco() {
    const palco = $('#palco'); if (!palco) return;
    if (palco.closest('.pdp-arara')) return;
    palco.addEventListener('pointermove', e => {
      if (calmo() || e.pointerType === 'touch') return;
      const r = palco.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      palco.style.setProperty('--ry', (x * 14) + 'deg'); palco.style.setProperty('--rx', (-y * 8) + 'deg');
    });
    palco.addEventListener('pointerleave', () => { palco.style.setProperty('--ry', '0deg'); palco.style.setProperty('--rx', '0deg'); });
  }

  /* ---------- CÂMERA DA PAREDE ---------- */
  function pintarCorParede(p) {
    const cor = p && selDe(p).cor;
    $$('.cena-tenis .tenis-fotografia img, .cena-tenis .tenis-aproximacao').forEach(foto => { foto.style.filter = ''; });
    window.TenisCor.pintar(p, cor, p ? CORES[cor].a : '');
  }
  function prepararZoomTenis(p) {
    const parede = $('.cena-tenis .tenis-parede');
    if (!parede) return;
    const anterior = $('.tenis-aproximacao', parede);
    if (!p || innerWidth <= 860) { if (anterior) anterior.remove(); return; }
    if (anterior && anterior.dataset.pecaZoom === p.id) return;
    if (anterior) anterior.remove();
    const imagem = new Image();
    imagem.className = 'tenis-aproximacao';
    imagem.dataset.pecaZoom = p.id;
    imagem.alt = '';
    imagem.decoding = 'async';
    imagem.fetchPriority = 'high';
    const centros = [710, 1745, 2790, 3825, 4864];
    const i = p.indiceParede;
    imagem.style.left = `${(centros[i % 5] - 688) / 5504 * 100}%`;
    imagem.style.top = `${((i < 5 ? 970 : 2010) - 384) / 3072 * 100}%`;
    imagem.onload = () => imagem.decode().then(() => imagem.classList.add('pronta')).catch(() => {});
    imagem.src = p.fotoZoom;
    parede.append(imagem);
    pintarCorParede(p);
  }
  function moverCamera(animar = true) {
    const cam = $('#camera'), jan = $('#janela'); if (!cam) return;
    if (!animar) cam.style.transition = 'none';
    cam.style.setProperty('--w', jan.clientWidth + 'px');
    const atual = $('.nicho.atual', cam);
    prepararZoomTenis(atual ? porId(atual.dataset.peca) : null);
    if (!atual) cam.style.transform = innerWidth > 860 && telaCenaI ? `translateX(${-telaCenaI * jan.clientWidth}px)` : 'none';
    else {
      const peca = $('.nicho-peca', atual), gr = atual.parentElement, pag = gr.parentElement;
      const W = jan.clientWidth, H = jan.clientHeight, movel = innerWidth <= 860;
      const larg = peca.offsetWidth, alt = peca.offsetHeight;
      const x = pag.offsetLeft + gr.offsetLeft + atual.offsetLeft, y = pag.offsetTop + gr.offsetTop + atual.offsetTop;
      const alvo = movel ? W * .9 : Math.min(W * .58, H * .72 * 1.6), s = alvo / larg;
      const cx = movel ? W / 2 : W * .47, base = movel ? H * .88 : H * .84;
      cam.style.transform = `translate(${(cx - (x + larg / 2) * s).toFixed(1)}px, ${(base - (y + alt) * s).toFixed(1)}px) scale(${s.toFixed(3)})`;
    }
    if (!animar) { void cam.offsetWidth; cam.style.transition = ''; }
  }
  function marcarPeca(p) {
    const cam = $('#camera');
    $$('.nicho.atual', cam).forEach(n => n.classList.remove('atual'));
    const velho = $('#pdp-peca'); if (velho) velho.removeAttribute('id');
    pintarCorParede(p);
    if (!p) return;
    const n = $(`.nicho[data-peca="${p.id}"]`, cam), pc = $('.nicho-peca', n);
    n.classList.add('atual'); pc.id = 'pdp-peca';
    telaCenaI = +n.closest('.pagina').dataset.telaN || 0;
    pc.innerHTML = fotoHTML(p, selDe(p).cor, true, selDe(p).modelo);
  }
  let telaCenaI = 0;
  function pintarTela() {
    const total = $$('.pagina').length, n = $('#cena-tela-n');
    if (n) n.textContent = String(telaCenaI + 1).padStart(2, '0');
    const e = $('.cena-seta-e'), d = $('.cena-seta-d');
    if (e) e.classList.toggle('fora', telaCenaI === 0);
    if (d) d.classList.toggle('fora', telaCenaI >= total - 1);
  }
  function irTela(delta) {
    const total = $$('.pagina').length, novo = Math.max(0, Math.min(total - 1, telaCenaI + delta));
    if (novo === telaCenaI) return;
    telaCenaI = novo;
    moverCamera(true); pintarTela();
    const pg = $(`.pagina[data-tela-n="${novo}"]`);
    if (pg && !calmo()) { pg.classList.remove('entra'); void pg.offsetWidth; pg.classList.add('entra'); setTimeout(() => pg.classList.remove('entra'), 1500); }
  }
  function focarCena(p) {
    const cena = $('#cena');
    marcarPeca(p);
    cena.classList.toggle('foco', !!p);
    cena.classList.remove('ligando');
    $('#cena-painel').innerHTML = p ? painelCena(p) : '';
    $('#cena-extra').innerHTML = p ? combinaHTML(p) : '';
    moverCamera(true); pintarTela();
    revelar(); Mov.atualizar();
  }
  function montarCena(animar) {
    const cena = $('#cena'); if (!cena) return;
    const h = location.hash.slice(1), p = h.startsWith('p-') ? porId(h.slice(2)) : null;
    cena.addEventListener('pointermove', e => { const r = cena.getBoundingClientRect(); cena.style.setProperty('--mx', (e.clientX - r.left) + 'px'); cena.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    const rs = () => moverCamera(false);
    addEventListener('resize', rs); limpezas.push(() => removeEventListener('resize', rs));
    if (p) {
      marcarPeca(p);
      if (animar && !calmo()) {
        /* quem chega de outra página vê a parede inteira e a câmera entra */
        const cam = $('#camera'), n = $('.nicho.atual', cam);
        n.classList.remove('atual'); moverCamera(false); n.classList.add('atual');
        setTimeout(() => moverCamera(true), 240);
      } else moverCamera(false);
    } else if (!calmo()) {
      cena.classList.add('ligando');
      $$('.nichos', cena).forEach(n => n.classList.add('acender'));
      moverCamera(false);
    } else moverCamera(false);
    pintarTela();
  }

  /* ---------- REVELAÇÃO, ROLAGEM E TOM DO CABEÇALHO ---------- */
  let obsRevelar = null;
  function revelar() {
    if (calmo() || !('IntersectionObserver' in window)) return;
    if (obsRevelar) obsRevelar.disconnect();
    obsRevelar = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visto'); obsRevelar.unobserve(en.target); }
    }), { rootMargin: '0px 0px 6% 0px', threshold: .04 });
    $$('#app .revelar:not(.visto), #app .ladrilho:not(.visto), #app .looks-palco:not(.visto), #app .looks-info:not(.visto), #app .combina .card:not(.visto), #app .loja-secao-cab:not(.visto), .rodape-colunas > div:not(.visto)').forEach(el => {
      el.classList.add('revelar');
      const irmaos = el.parentElement ? [...el.parentElement.children] : [];
      el.style.setProperty('--i', Math.min(6, irmaos.indexOf(el)));
      obsRevelar.observe(el);
    });
  }
  function tomDoTopo() {
    let tom = 'claro';
    for (const el of $$('#miolo [data-tom]')) {
      const r = el.getBoundingClientRect();
      if (r.top <= 34 && r.bottom > 34) { tom = el.dataset.tom; break; }
    }
    document.documentElement.dataset.tom = tom;
    $('.topo').classList.toggle('rolou', scrollY > 40);
  }
  function moverCorredor() {
    const c = $('#corredor'); if (!c) return;
    const r = c.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const k = calmo() ? .6 : Math.max(0, Math.min(1, -r.top / Math.max(1, c.offsetHeight - innerHeight)));
    const t = $('.corredor-t', c);
    if (t) t.style.transform = `translate(${(14 - k * 14).toFixed(2)}vw, ${(5 - k * 6).toFixed(2)}vh) rotate(${(-13 + k * 13).toFixed(2)}deg) scale(${(.74 + k * .26).toFixed(3)})`;
    $$('.corredor-dets li', c).forEach((li, i) => li.classList.toggle('on', calmo() || k > .18 + i * .24));
    const w = $('.corredor-palavra', c); if (w) w.style.transform = `translateX(${(-k * 34).toFixed(2)}vw)`;
  }
  function aoRolar() {
    tomDoTopo();
    const h = $('#hero');
    if (h && !calmo()) h.style.setProperty('--sy', Math.min(scrollY, innerHeight) + 'px');
    moverCorredor();
  }
  try { history.scrollRestoration = 'manual'; } catch (e) { /* navegador sem suporte */ }
  addEventListener('scroll', aoRolar, { passive: true });
  addEventListener('resize', aoRolar);

  /* ---------- ROTAS ---------- */
  let rotaAtual = '', origem = null;
  let zoomPeca = null;
  function limparZoomPeca() {
    if (!zoomPeca) return;
    const z = zoomPeca; zoomPeca = null;
    z.animacao.cancel(); z.bloqueio.remove();
  }
  function abrirRoupaComZoom(link, ponto) {
    if (zoomPeca) return;
    const original = $('.arte', link) || $('.arte', link.closest('.card') || link), p = porId(link.dataset.peca);
    if (!original || !p) return;
    const r = original.getBoundingClientRect(), cena = app.getBoundingClientRect(), rota = location.hash;
    if (!r.width || !r.height) { location.hash = link.hash; return; }
    const bloqueio = document.createElement('div'); bloqueio.className = 'peca-camera-bloqueio';
    bloqueio.addEventListener('wheel', e => e.preventDefault(), { passive: false });
    document.body.append(bloqueio);
    const s = selDe(p), preload = new Image();
    preload.src = (p.modelos[s.modelo] || {}).foto || p.foto;
    const escala = Math.max(1.35, Math.min(1.8, innerHeight * .96 / r.height, innerWidth * .90 / r.width));
    const cx = Math.max(24, Math.min(innerWidth - 24, ponto ? ponto.x : r.left + r.width / 2));
    const cy = Math.max(24, Math.min(innerHeight - 24, ponto ? ponto.y : r.top + r.height / 2));
    /* O ponto observado permanece fixo: não transporta a peça para o centro. */
    const origemCamera = `${cx - cena.left}px ${cy - cena.top}px`;
    const animacao = app.animate([
      { transform: 'scale(1)', transformOrigin: origemCamera },
      { transform: `scale(${escala})`, transformOrigin: origemCamera }
    ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    zoomPeca = { original, bloqueio, animacao, navegando: false };
    animacao.onfinish = () => {
      if (!zoomPeca || location.hash !== rota) { limparZoomPeca(); return; }
      origem = { camera: true };
      zoomPeca.navegando = true;
      location.hash = link.hash;
    };
  }
  const scrolls = {};
  function marcarNav(h) {
    const p = h.startsWith('p-') ? porId(h.slice(2)) : null;
    $$('.topo-deps a').forEach(a => a.classList.toggle('atual', a.getAttribute('href') === '#' + h || (!!p && a.getAttribute('href') === '#' + p.dep)));
  }
  function desenharRota(animar) {
    limpezas.forEach(f => f()); limpezas = [];
    clearInterval(heroTimer); clearInterval(pixInt);
    const h = decodeURIComponent(location.hash.slice(1)) || 'inicio';
    let html = '', titulo = 'Hypex Roupas';
    if (DEPARTAMENTOS[h]) { html = telaDep(h); titulo = `${DEPARTAMENTOS[h].nome} · Hypex`; }
    else if (h === 'loja') html = telaLoja();
    else if (h.startsWith('estilo-') && ESTILOS[h.slice(7)]) {
      Object.assign(S.filtros, { dep: '', publico: '', cor: '', promo: false, q: '', estilo: h.slice(7) });
      html = telaLoja();
    } else if (h.startsWith('p-') && porId(h.slice(2))) { const p = porId(h.slice(2)); html = telaProduto(p); titulo = `${p.nome} · Hypex`; }
    else if (h === 'checkout') html = telaCheckout();
    else if (h === 'pedido') html = telaPedido();
    else html = telaInicio();
    app.innerHTML = html;
    /* parede e arara carregam tudo de uma vez: as peças ficam prontas para deslizar */
    $$('#camera img, .arara img').forEach(i => { i.loading = 'eager'; });
    document.title = titulo;
    marcarNav(h);
    $$('[data-arara]').forEach(montarArara);
    montarParedes(); montarPalco(); ligarHero(); iniciarTimerHero(); montarCena(animar);
    revelar(); aoRolar(); Mov.atualizar();
    if (h === 'pedido') confete();
    return h;
  }
  function entrada(flip) {
    if (calmo()) return;
    app.classList.add('entrar');
    setTimeout(() => app.classList.remove('entrar'), 1500);
    if (flip && flip.camera) {
      app.animate([{ opacity: .25 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
      return;
    }
    /* A navegação lateral mantém o cabide na mesma altura. Não usa FLIP entre
       caixas de proporções diferentes, nem reaproveita a escala da miniatura. */
    if (flip && flip.centro) {
      const palco = $('#palco');
      const direcao = flip.lado === 'd' ? 1 : -1;
      if (palco) palco.animate([
        { opacity: .3, transform: `translateX(${direcao * 28}px)` },
        { opacity: 1, transform: 'translateX(0)' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' });
      return;
    }
    const alvo = flip && $('#pdp-peca .arte');
    if (alvo) {
      const r = alvo.getBoundingClientRect();
      if (r.width) alvo.animate([
        { transformOrigin: '0 0', transform: `translate(${flip.left - r.left}px, ${flip.top - r.top}px) scale(${flip.width / r.width})` },
        { transformOrigin: '0 0', transform: 'none' }
      ], { duration: 650, easing: 'cubic-bezier(.3,.9,.2,1)' });
    }
  }
  function trocarRota() {
    if (zoomPeca && !zoomPeca.navegando) limparZoomPeca();
    scrolls[rotaAtual] = scrollY;
    const destino = location.hash.slice(1) || 'inicio';
    const p = destino.startsWith('p-') ? porId(destino.slice(2)) : null;
    const vitrine = DEPARTAMENTOS[destino] && DEPARTAMENTOS[destino].exp === 'prateleira' && (S.modoDep[destino] || 'vitrine') === 'vitrine';
    const depCena = p && !ehArara(p) ? p.dep : (vitrine ? destino : null);
    const cena = $('#cena');
    /* mesma parede: não troca de página, só move a câmera */
    if (cena && depCena && cena.dataset.dep === depCena && (!p || $(`.nicho[data-peca="${p.id}"]`, cena))) {
      origem = null;
      focarCena(p);
      rotaAtual = destino;
      document.title = `${p ? p.nome : DEPARTAMENTOS[destino].nome} · Hypex`;
      marcarNav(destino);
      scrollTo({ top: 0, behavior: calmo() ? 'auto' : 'smooth' });
      return;
    }
    const flip = depCena ? null : origem; origem = null;
    const troca = () => {
      if (flip && flip.camera) limparZoomPeca();
      rotaAtual = desenharRota(true);
      scrollTo(0, scrolls[destino] && !destino.startsWith('p-') && destino !== 'checkout' ? scrolls[destino] : 0);
      aoRolar();
      entrada(flip);
    };
    if (calmo() || flip) { troca(); return; }
    Mov.cortina(troca);
  }
  /* ---------- BUSCA ---------- */
  let buscaT = 0;
  function abrirBusca() { const b = $('#busca'); clearTimeout(buscaT); b.classList.remove('saindo'); b.hidden = false; $('#miolo').inert = true; const i = $('#busca-campo'); i.value = S.filtros.q || ''; pintarBusca(); i.focus(); document.documentElement.classList.add('travado'); }
  function fecharBusca() {
    const b = $('#busca'); if (b.hidden || b.classList.contains('saindo')) return;
    const fim = () => { b.hidden = true; b.classList.remove('saindo'); document.documentElement.classList.remove('travado'); };
    $('#miolo').inert = false;
    if (calmo()) { fim(); return; }
    b.classList.add('saindo');
    buscaT = setTimeout(fim, 520);
  }
  function pintarBusca() {
    const q = $('#busca-campo').value, salvo = S.filtros;
    S.filtros = { dep: '', estilo: '', publico: '', cor: '', promo: false, ordem: 'relevancia', q };
    const l = q.trim() ? filtrados() : [];
    S.filtros = salvo;
    $('#busca-res').innerHTML = !q.trim()
      ? `<p class="mono">Procure por</p><div class="dep-outros">${['tênis', 'moletom', 'jeans', 'azul', 'praia', 'boxer', 'camisa'].map(t => `<button type="button" class="pilula" data-busca="${t}">${t}</button>`).join('')}</div>`
      : l.length ? `<ul class="busca-lista">${l.slice(0, 8).map((p, n) => { const s = selDe(p); return `<li style="--i:${n}"><a href="#p-${p.id}" data-fecha-busca><span class="busca-foto" style="--fundo:${CORES[s.cor].fundo}">${arte(p, s.cor, s.modelo)}</span><span class="busca-nome">${p.nome}<small>${DEPARTAMENTOS[p.dep].nome}</small></span><b>${R$(p.preco)}</b></a></li>`; }).join('')}</ul>
        <button type="button" class="botao" data-ver-busca>Ver ${l.length} ${l.length === 1 ? 'resultado' : 'resultados'}</button>`
      : `<p class="titulo-pequeno">Nada encontrado para “${seguro(q)}”.</p><p>Tente o nome de uma peça, cor ou estilo.</p>`;
  }

  /* Foto que falhou por instabilidade da rede: tenta de novo e, por fim, some sem deixar ícone quebrado */
  document.addEventListener('error', e => {
    const i = e.target;
    if (!i || i.tagName !== 'IMG' || !i.closest('.foto')) return;
    const t = +(i.dataset.tentativa || 0);
    if (t >= 3) { i.style.visibility = 'hidden'; return; }
    i.dataset.tentativa = t + 1;
    const url = i.getAttribute('src');
    setTimeout(() => { if (i.isConnected) { i.removeAttribute('srcset'); i.removeAttribute('src'); i.setAttribute('src', url); } }, 900 * (t + 1));
  }, true);
  addEventListener('online', () => {
    $$('.foto img').forEach(i => { if (i.complete && !i.naturalWidth) { const url = i.getAttribute('src'); i.style.visibility = ''; i.removeAttribute('src'); i.setAttribute('src', url); } });
  });

  /* ---------- EVENTOS ---------- */
  document.addEventListener('click', e => {
    if (e.defaultPrevented) return;
    const t = e.target, c = s => t.closest(s);
    let el;
    if ((el = c('.cabide[data-peca], .card-peca[data-peca], .card-nome[data-peca]')) && ehArara(porId(el.dataset.peca)) && !calmo() && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && !e.button) {
      e.preventDefault(); abrirRoupaComZoom(el, e.detail ? { x: e.clientX, y: e.clientY } : null); return;
    }
    if ((el = c('[data-peca]'))) { origem = null; const a = $('.arte', el); if (a && !el.closest('#cena')) { const r = a.getBoundingClientRect(); origem = { left: r.left, top: r.top, width: r.width }; const viz = el.closest('.vizinho'), centro = $('#pdp-peca .arte'); if (viz && centro) { const rc = centro.getBoundingClientRect(); origem.lado = viz.classList.contains('vizinho-d') ? 'd' : 'e'; origem.centro = { left: rc.left, top: rc.top, width: rc.width }; } } }
    if ((el = c('[data-ver-dep]'))) { Object.assign(S.filtros, { dep: el.dataset.verDep, estilo: '', publico: '', cor: '', promo: false, q: '' }); }
    if ((el = c('[data-tela]'))) { irTela(+el.dataset.tela); return; }
    if ((el = c('[data-fb]'))) {
      const f = estadoFiltro(el.dataset.ns), g = el.dataset.fb, antes = f.cor;
      if (g === 'cor' && f.cor === el.dataset.v) return;
      f[g] = f[g] === el.dataset.v ? '' : el.dataset.v;
      aplicarFiltro(el.dataset.ns, el.dataset.foco, antes); return;
    }
    if ((el = c('[data-fb-limpar]'))) { const f = estadoFiltro(el.dataset.ns), antes = f.cor; f.publico = f.tam = f.cor = ''; if (el.dataset.ns === 'loja') { f.estilo = ''; f.promo = false; f.q = ''; } aplicarFiltro(el.dataset.ns, null, antes); return; }
    if ((el = c('[data-look]'))) { trocarLook(+el.dataset.look); return; }
    if ((el = c('[data-slide]'))) { trocarHero(+el.dataset.slide); const b = $(`[data-slide="${el.dataset.slide}"]`); if (b) b.focus(); iniciarTimerHero(); return; }
    if (c('#btn-sacola')) { abrirSacola(); return; }
    if (c('[data-fechar-sacola]') || c('#sombra')) { fecharSacola(); return; }
    if (c('[data-fecha-sacola]')) fecharSacola();
    if (c('#btn-busca')) { abrirBusca(); return; }
    if (c('[data-fechar-busca]')) { fecharBusca(); return; }
    if (c('[data-fecha-busca]')) fecharBusca();
    if ((el = c('[data-busca]'))) { $('#busca-campo').value = el.dataset.busca; pintarBusca(); $('#busca-campo').focus(); return; }
    if (c('[data-ver-busca]')) { aplicarBusca(); return; }
    if (c('[data-acao-toast]')) { $('#toast').classList.remove('visivel'); abrirSacola(); return; }

    /* cartões da grade */
    if ((el = c('[data-card-cor]'))) {
      const card = el.closest('[data-card]'), p = porId(card.dataset.card), s = selDe(p);
      s.cor = el.dataset.cardCor;
      card.style.setProperty('--fundo', CORES[s.cor].fundo); card.style.setProperty('--tinta', CORES[s.cor].tinta);
      const box = $('.card-peca', card);
      Mov.trocaPeca(box, () => { $('.arte', box).outerHTML = arte(p, s.cor, s.modelo); });
      $$('.bolinha', card).forEach(b => { const on = b.dataset.cardCor === s.cor; b.classList.toggle('ativa', on); b.setAttribute('aria-pressed', on); });
      return;
    }

    /* produto */
    const pdp = c('#pdp');
    if (pdp) {
      const p = porId(pdp.dataset.id), s = selDe(p);
      if ((el = c('[data-cor]'))) { s.cor = el.dataset.cor; $$('[data-cor]', pdp).forEach(b => { const on = b.dataset.cor === s.cor; b.classList.toggle('ativa', on); b.setAttribute('aria-pressed', on); }); pintarProduto(p, true); return; }
      if ((el = c('[data-modelo]'))) { s.modelo = +el.dataset.modelo; $$('[data-modelo]', pdp).forEach(b => { const on = +b.dataset.modelo === s.modelo; b.classList.toggle('ativa', on); b.setAttribute('aria-pressed', on); }); pintarProduto(p, true); return; }
      if ((el = c('[data-tam]'))) { s.tam = el.dataset.tam; $$('[data-tam]', pdp).forEach(b => { const on = b.dataset.tam === s.tam; b.classList.toggle('ativa', on); b.setAttribute('aria-pressed', on); }); $('#erro-tam').hidden = true; const mn = $('#tam-menu'); if (mn) { Mov.fechar(mn); $('#tam-txt').textContent = 'Tamanho ' + s.tam; } return; }

    }

    /* filtros */
    if (c('[data-abre-filtros]')) { S.filtroAberto = !S.filtroAberto; const pn = $('#painel-filtros'); pn.classList.toggle('aberto', S.filtroAberto); c('[data-abre-filtros]').setAttribute('aria-expanded', S.filtroAberto); return; }
    if ((el = c('[data-filtro]'))) { const g = el.dataset.filtro, v = el.dataset.valor; if (g === 'cor' && S.filtros.cor === v) return; S.filtros[g] = v; repintarLoja(el.dataset.foco); return; }
    if (c('[data-promo]')) { S.filtros.promo = !S.filtros.promo; repintarLoja('promo'); return; }
    if (c('[data-limpar]')) { Object.assign(S.filtros, { dep: '', estilo: '', publico: '', tam: '', cor: '', promo: false, q: '', ordem: 'relevancia' }); repintarLoja(); return; }
    if ((el = c('[data-modo]'))) { S.modoDep[el.dataset.dep] = el.dataset.modo; desenharRota(false); entrada(); scrollTo(0, 0); return; }

    /* sacola */
    if ((el = c('[data-qtd]'))) {
      const i = S.sacola[+el.dataset.qtd]; if (!i) return;
      i.qtd += +el.dataset.delta;
      if (i.qtd < 1) { const li = el.closest('.item'); li.classList.add('sai'); const ix = +el.dataset.qtd; setTimeout(() => { S.sacola.splice(ix, 1); atualizarSacola(); }, calmo() ? 0 : 320); return; }
      const ixq = +el.dataset.qtd;
      atualizarSacola();
      const saida = $$('#sacola-corpo .qtd output')[ixq]; if (saida) saida.classList.add('pula');
      return;
    }
    if ((el = c('[data-remover]'))) {
      const ix = +el.dataset.remover, li = el.closest('.item'), it = S.sacola[ix];
      li.classList.add('sai');
      setTimeout(() => { S.sacola.splice(ix, 1); atualizarSacola(); toast(`${porId(it.id).nome} saiu da sacola.`); }, calmo() ? 0 : 320);
      return;
    }
    if (c('[data-tirar-cupom]')) { S.cupom = null; S.cupomAviso = ''; S.cupomErro = ''; S.cupomDigitado = ''; atualizarSacola(); pintarEtapas(); return; }
    if ((el = c('[data-sugerir]'))) { tentarCupom(el.dataset.sugerir); return; }
    if ((el = c('[data-usar-cupom]'))) {
      const k = el.dataset.usarCupom;
      try { navigator.clipboard.writeText(k).catch(() => {}); } catch (x) { /* sem área de transferência */ }
      if (S.sacola.length) { tentarCupom(k); abrirSacola(); }
      else { S.cupomDigitado = k; atualizarSacola(); toast(`Cupom ${k} guardado. Ele fica pronto na sua sacola.`); }
      return;
    }

    /* checkout */
    if (c('[data-exemplo]')) {
      Object.assign(S.ck.dados, { nome: 'Maria Exemplo da Silva', email: 'maria.exemplo@email.com', cpf: '111.444.777-35', tel: '(11) 90000-0000' });
      Object.assign(S.ck.ent, { cep: '01000-000', rua: 'Rua das Flores', num: '100', comp: 'Apto 12', bairro: 'Centro', cidade: 'São Paulo', uf: 'SP' });
      Object.assign(S.ck.pag, { num: '4242 4242 4242 4242', titular: 'MARIA EXEMPLO', val: '12/30', cvv: '123' });
      S.ck.erros = {}; pintarEtapas(); return;
    }
    if ((el = c('[data-avancar]'))) {
      const n = +el.dataset.avancar;
      if (validaEtapa(n)) { S.ck.etapa = n + 1; pintarEtapas(); const eab = $('.etapa.aberta'); if (eab) { eab.scrollIntoView({ block: 'nearest', behavior: calmo() ? 'auto' : 'smooth' }); const cp = $('.etapa-corpo', eab); if (cp) cp.classList.add('abrindo'); } }
      else { pintarEtapas(); const f = $('.tem-erro input'); if (f) f.focus(); }
      return;
    }
    if ((el = c('[data-ir-etapa]'))) { S.ck.etapa = +el.dataset.irEtapa; S.ck.erros = {}; pintarEtapas(); const cp = $('.etapa.aberta .etapa-corpo'); if (cp) cp.classList.add('abrindo'); return; }
    if (c('[data-gerar-pix]')) { S.ck.pixGerado = true; pintarEtapas(); iniciarPixRelogio(); return; }
    if ((el = c('[data-pagar]'))) { pagar(el); return; }
  });

  function aplicarBusca() {
    Object.assign(S.filtros, { dep: '', estilo: '', publico: '', cor: '', promo: false, q: $('#busca-campo').value.trim() });
    fecharBusca();
    if ((location.hash.slice(1) || 'inicio') === 'loja') repintarLoja(); else location.hash = 'loja';
  }
  let lojaTransicaoTimer = 0, lojaTransicao = null;
  function repintarLoja(foco) {
    const rotaFiltro = location.hash;
    const loja = $('.loja'), resultados = $('.loja-resultados', loja || app);
    const opacidade = resultados ? getComputedStyle(resultados).opacity : '1';
    clearTimeout(lojaTransicaoTimer);
    if (lojaTransicao) { lojaTransicao.cancel(); lojaTransicao = null; }
    $$('[data-fb="publico"][data-ns="loja"]').forEach(b => {
      const ativo = b.dataset.v === S.filtros.publico;
      b.classList.toggle('ativa', ativo);
      b.setAttribute('aria-pressed', ativo);
    });
    const atualizar = () => {
      if ((loja && !loja.isConnected) || location.hash !== rotaFiltro) return;
      const y = scrollY, antes = Mov.fotografarGrade();
      if (location.hash.slice(1).startsWith('estilo-')) history.replaceState(null, '', '#loja');
      app.innerHTML = telaLoja();
      if (lojaTransicao) { lojaTransicao.cancel(); lojaTransicao = null; }
      scrollTo(0, y);
      Mov.animarGrade(antes);
      if (!calmo()) {
        lojaTransicao = $('.loja-resultados').animate([
          { opacity: 0, transform: 'translateY(12px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
      if (foco) { const a = $(`[data-foco="${foco}"]`); if (a) a.focus({ preventScroll: true }); }
    };
    if (calmo() || !resultados) { atualizar(); return; }
    resultados.setAttribute('aria-busy', 'true');
    lojaTransicao = resultados.animate([
      { opacity: opacidade, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6px)' }
    ], { duration: 140, easing: 'ease-in', fill: 'forwards' });
    lojaTransicaoTimer = setTimeout(atualizar, 140);
  }
  function tentarCupom(cod) {
    const k = (cod || '').trim().toUpperCase();
    S.cupomDigitado = k; S.cupomAviso = '';
    if (!k) { S.cupomErro = 'Digite o código do cupom.'; atualizarSacola(); return; }
    const r = checarCupom(k);
    if (!r.ok) { S.cupomErro = r.msg; atualizarSacola(); pintarEtapas(); return; }
    S.cupom = k; S.cupomErro = ''; S.cupomDigitado = '';
    atualizarSacola(); pintarEtapas();
    toast(`Cupom ${k} aplicado: ${CUPONS[k].texto}.`);
  }

  document.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (f.matches('[data-form-cupom]')) { tentarCupom(f.cupom.value); return; }
    if (f.id === 'form-busca') { aplicarBusca(); return; }
    if (f.id === 'compra') {
      const pdp = $('#pdp'), p = porId(pdp.dataset.id), s = selDe(p);
      if (!s.tam) {
        const er = $('#erro-tam'); er.hidden = false; const mn = $('#tam-menu'); if (mn) Mov.abrir(mn);
        if (!calmo()) $('.tamanhos').animate([{ transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: 260 });
        const pr = $('.tamanhos .opcao:not([disabled])'); if (pr) pr.focus();
        return;
      }
      adicionar(p, s);
      voarParaSacola($('#pdp-peca .arte'));
      toast(`${p.nome} na sacola.`, 'Ver sacola');
      const bs = $('#adicionar'), tx = $('#adicionar-txt');
      if (bs && tx) { tx.textContent = 'Na sacola'; bs.classList.add('feito'); setTimeout(() => { if (tx.isConnected) { tx.textContent = 'Colocar na sacola'; bs.classList.remove('feito'); } }, 1700); }
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'busca-campo') { pintarBusca(); return; }
    if (t.name === 'cupom') { S.cupomDigitado = t.value; return; }
    if (t.dataset.sec) {
      if (t.dataset.mask) { t.value = mascara[t.dataset.mask](t.value); }
      S.ck[t.dataset.sec][t.dataset.nome] = t.value;
      if (S.ck.erros[t.dataset.nome]) { delete S.ck.erros[t.dataset.nome]; const w = t.closest('.campo'); w.classList.remove('tem-erro'); const er = $('.erro', w); if (er) er.remove(); t.removeAttribute('aria-invalid'); }
      if (t.dataset.sec === 'ent' && t.dataset.nome === 'cep' && so(t.value).length === 8) {
        const r = regiaoCep(t.value);
        if (!S.ck.ent.cidade) S.ck.ent.cidade = r.cidade;
        if (!S.ck.ent.uf) S.ck.ent.uf = r.uf;
        pintarEtapas();
        const novo = $('#ck-ent-cep'); if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length); }
      }
      if (t.dataset.sec === 'ent' && t.dataset.nome === 'cep' && so(t.value).length === 7) { pintarEtapas(); const novo = $('#ck-ent-cep'); if (novo) { novo.focus(); novo.setSelectionRange(novo.value.length, novo.value.length); } }
      if (t.dataset.sec === 'pag') {
        const G = S.ck.pag;
        if ($('#c-num')) { $('#c-num').textContent = G.num || '•••• •••• •••• ••••'; $('#c-band').textContent = bandeira(G.num); $('#c-tit').textContent = G.titular.toUpperCase() || 'SEU NOME'; $('#c-val').textContent = G.val || 'MM/AA'; }
      }
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('[data-fb-sel]')) { const f = estadoFiltro(t.dataset.ns); f[t.dataset.fbSel] = t.value; aplicarFiltro(t.dataset.ns, t.dataset.foco, f.cor); return; }
    if (t.matches('[data-estilo]')) { S.filtros.estilo = t.value; repintarLoja('fb-estilo'); return; }
    if (t.matches('[data-ordem]')) { S.filtros.ordem = t.value; repintarLoja(); const o = $('#ordem'); if (o) o.focus(); return; }
    if (t.matches('[data-frete]')) { S.ck.ent.frete = t.value; pintarEtapas(); const a = $('[data-frete]:checked'); if (a) a.focus(); return; }
    if (t.matches('[data-metodo]')) { S.ck.pag.metodo = t.value; S.ck.pixGerado = false; S.ck.recusa = ''; S.ck.erros = {}; pintarEtapas(); const a = $('[data-metodo]:checked'); if (a) a.focus(); return; }
    if (t.matches('[data-parc]')) { S.ck.pag.parc = +t.value; }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { fecharSacola(); fecharBusca(); }
    if (e.key === 'Tab' && !$('#sacola').hidden) {
      const fs = $$('a[href],button:not([disabled]),input,select', $('#sacola')).filter(x => x.offsetParent !== null);
      if (!fs.length) return;
      const pri = fs[0], ult = fs[fs.length - 1];
      if (e.shiftKey && document.activeElement === pri) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); pri.focus(); }
    }
    if ($('#cena') && !$('#pdp') && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && $('#sacola').hidden && $('#busca').hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) irTela(e.key === 'ArrowLeft' ? -1 : 1);
    if ($('#pdp') && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && $('#sacola').hidden && $('#busca').hidden) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const vizinho = $(`.vizinho-${e.key === 'ArrowLeft' ? 'e' : 'd'}`);
        if (vizinho) { e.preventDefault(); vizinho.click(); return; }
        const [a, b] = vizinhos(porId($('#pdp').dataset.id));
        const al = e.key === 'ArrowLeft' ? a : b; location.hash = 'p-' + al.id;
      }
    }
  });
  addEventListener('hashchange', trocarRota);

  /* primeira pintura */
  Mov.iniciar();
  rotaAtual = desenharRota();
  atualizarSacola();
})();
