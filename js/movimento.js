/* HYPEX · camada de movimento
   Abertura, cortina entre páginas, cursor próprio, títulos palavra por palavra, parálax,
   botões magnéticos, inclinação 3D, sanfonas animadas, reordenação de grade e contagem de valores.
   Quem pede menos movimento no sistema recebe a página estática, completa. */
window.Mov = (function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EASE = 'cubic-bezier(.16,1,.3,1)';

  /* ---------- abertura ---------- */
  function abertura() {
    const el = $('#intro'); if (!el) return;
    let visto = false;
    try { visto = sessionStorage.getItem('hypex.intro') === '1'; sessionStorage.setItem('hypex.intro', '1'); } catch (e) { /* sem armazenamento */ }
    if (visto || calmo()) { el.remove(); return; }
    const num = $('.intro-num', el), t0 = performance.now(), dur = 1150;
    const passo = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      if (num) num.textContent = String(Math.round(k * 100)).padStart(3, '0');
      if (k < 1) setTimeout(passo, 40);
      else { el.classList.add('sai'); setTimeout(() => el.remove(), 900); }
    };
    passo();
  }

  /* ---------- cortina entre páginas ---------- */
  function cortina(troca) {
    if (calmo()) { troca(); return; }
    let c = $('#cortina');
    if (!c) {
      c = document.createElement('div'); c.id = 'cortina'; c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<i></i><b></b><span>HYPEX</span>';
      document.body.appendChild(c);
    }
    c.classList.remove('sai'); void c.offsetWidth; c.classList.add('cobre');
    setTimeout(() => {
      troca();
      c.classList.remove('cobre'); c.classList.add('sai');
      setTimeout(() => c.classList.remove('sai'), 820);
    }, 470);
  }

  /* ---------- títulos palavra por palavra e letras do rodapé ---------- */
  const TITULOS = '.titulo, .titulo-dep, .arara-grande, .looks-info h2, .corredor-texto h2, .pdp-nome, .cena-titulo h1, .hero.primeira .hero-esq h1, .pedido-titulo';
  function dividir(el) {
    if (el.dataset.dividido || el.children.length) return;
    const texto = el.textContent.trim(); if (!texto) return;
    el.dataset.dividido = '1';
    el.setAttribute('aria-label', texto);
    el.innerHTML = texto.split(/\s+/).map((p, i) => `<span class="pal" aria-hidden="true"><span style="--p:${i}">${p}</span></span>`).join(' ');
    el.classList.add('pal-pronto');
  }
  let io = null;
  function atualizar() {
    if (calmo()) return;
    if (io) io.disconnect();
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('pal-ver'); io.unobserve(en.target);
      }), { rootMargin: '0px 0px 6% 0px', threshold: .02 });
      $$(TITULOS).forEach(el => { dividir(el); if (el.classList.contains('pal-pronto') && !el.classList.contains('pal-ver')) io.observe(el); });
      const marca = $('.rodape-marca');
      if (marca) {
        if (!marca.dataset.dividido) {
          marca.dataset.dividido = '1';
          marca.innerHTML = [...marca.textContent.trim()].map((l, i) => `<span class="marca-l" style="--i:${i}">${l}</span>`).join('');
          marca.classList.add('pal-pronto');
        }
        if (!marca.classList.contains('pal-ver')) io.observe(marca);
      }
    }
    /* parálax: profundidade por elemento */
    $$('.ladrilho-peca').forEach((el, i) => { el.dataset.par = .05 + (i % 3) * .025; });
    $$('.looks-peca').forEach((el, i) => { el.dataset.par = [.05, .1, .15][i % 3]; });
    $$('.parede-cab').forEach(el => { el.dataset.par = .05; });
    aoRolar();
    ligarLooks();
  }
  function ligarLooks() {
    $$('.looks-lista li').forEach((li, i) => {
      if (li.dataset.ligado) return;
      li.dataset.ligado = '1';
      li.addEventListener('pointerenter', () => { const c = li.closest('.looks'); const pt = $$('.looks-ponto', c)[i], pc = $$('.looks-peca', c)[i]; if (pt) pt.classList.add('aceso'); if (pc) pc.classList.add('aceso'); });
      li.addEventListener('pointerleave', () => { const c = li.closest('.looks'); $$('.aceso', c).forEach(x => x.classList.remove('aceso')); });
    });
  }

  /* ---------- rolagem: progresso, parálax, cabeçalho e vento ---------- */
  let yAnt = 0, agendado = false, tAnt = 0, ventoT = 0;
  function aoRolar() {
    const y = scrollY, alt = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const barra = $('#progresso'); if (barra) barra.style.transform = `scaleX(${(y / alt).toFixed(4)})`;
    const vh = innerHeight;
    $$('[data-par]').forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      el.style.setProperty('--par', (((r.top + r.height / 2 - vh / 2) * -(+el.dataset.par)).toFixed(1)) + 'px');
    });
    const marca = $('.rodape-marca');
    if (marca) { const r = marca.getBoundingClientRect(); if (r.top < vh) marca.style.setProperty('--par', ((r.top - vh) * .1).toFixed(1) + 'px'); }
    const topo = $('.topo');
    if (topo) {
      const descendo = y > yAnt + 3, subindo = y < yAnt - 3;
      if (descendo && y > 260) topo.classList.add('some');
      else if (subindo || y < 120) topo.classList.remove('some');
    }
    /* letreiro acelera com a velocidade da rolagem */
    const v = y - yAnt, faixa = $('.letreiro-faixa');
    if (faixa && faixa.getAnimations) faixa.getAnimations().forEach(a => { a.playbackRate = 1 + Math.min(7, Math.abs(v) / 9); });
    const agora = performance.now();
    if (Math.abs(v) > 6 && agora - ventoT > 90) {
      ventoT = agora;
      dispatchEvent(new CustomEvent('hypex:vento', { detail: Math.max(-1.6, Math.min(1.6, v / 34)) }));
    }
    clearTimeout(tAnt);
    tAnt = setTimeout(() => { if (faixa && faixa.getAnimations) faixa.getAnimations().forEach(a => { a.playbackRate = 1; }); }, 180);
    yAnt = y;
  }
  addEventListener('scroll', () => {
    if (agendado || calmo()) return;
    agendado = true;
    const f = () => { agendado = false; aoRolar(); };
    if (document.visibilityState === 'hidden') setTimeout(f, 60); else requestAnimationFrame(f);
    setTimeout(() => { if (agendado) f(); }, 120);
  }, { passive: true });

  /* ---------- cursor próprio ---------- */
  let cur = null, cx = -100, cy = -100, ax = -100, ay = -100, loopCur = 0;
  function criarCursor() {
    if (cur || !fino() || calmo()) return;
    cur = document.createElement('div'); cur.id = 'cursor'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span></span>';
    document.body.appendChild(cur);
    document.documentElement.classList.add('com-cursor');
  }
  function tickCursor() {
    ax += (cx - ax) * .22; ay += (cy - ay) * .22;
    cur.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0)`;
    loopCur = (Math.abs(cx - ax) + Math.abs(cy - ay)) > .3 ? requestAnimationFrame(tickCursor) : 0;
  }
  function rotuloDe(alvo) {
    if (!alvo || !alvo.closest) return ['', ''];
    if (alvo.closest('input, select, textarea')) return ['oculto', ''];
    const cab = alvo.closest('.cabide');
    if (cab) return ['rotulo', 'Ver peça'];
    if (alvo.closest('.arara-trilho')) return ['rotulo', 'Arraste'];
    const ni = alvo.closest('.nicho');
    if (ni) return ni.classList.contains('atual') ? ['', ''] : ['rotulo', 'Ver'];
    if (alvo.closest('.card-peca, .looks-peca, .hero-peca, .ladrilho, .vizinho')) return ['rotulo', 'Ver'];
    if (alvo.closest('a, button, summary, label')) return ['anel', ''];
    return ['', ''];
  }

  /* ---------- magnetismo e inclinação ---------- */
  const IMA = '.botao, .botao-sacola, .redondo, .topo-botao, .looks-mais, .looks-ponto, .link-parede, .voltar-colecao';
  const INCLINA = '.card-peca, .ladrilho, .cartao-visual, .looks-palco';
  let imaAtual = null, inclAtual = null;
  function soltarIma() { if (imaAtual) { imaAtual.style.translate = ''; imaAtual = null; } }
  function soltarIncl() { if (inclAtual) { inclAtual.style.removeProperty('--trx'); inclAtual.style.removeProperty('--try'); inclAtual = null; } }
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || calmo()) return;
    criarCursor();
    if (cur) {
      cx = e.clientX; cy = e.clientY;
      const [modo, txt] = rotuloDe(e.target);
      if (cur.dataset.modo !== modo) cur.dataset.modo = modo;
      const sp = cur.firstChild; if (sp.textContent !== txt) sp.textContent = txt;
      if (!loopCur) loopCur = requestAnimationFrame(tickCursor);
    }
    const t = e.target.closest ? e.target : null; if (!t) return;
    const ima = t.closest(IMA);
    if (ima !== imaAtual) soltarIma();
    if (ima) {
      imaAtual = ima;
      const r = ima.getBoundingClientRect();
      ima.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .28).toFixed(1)}px`;
    }
    const inc = t.closest(INCLINA);
    if (inc !== inclAtual) soltarIncl();
    if (inc) {
      inclAtual = inc;
      const r = inc.getBoundingClientRect(), k = inc.matches('.looks-palco') ? 3 : 7;
      inc.style.setProperty('--trx', (((e.clientY - r.top) / r.height - .5) * -k).toFixed(2) + 'deg');
      inc.style.setProperty('--try', (((e.clientX - r.left) / r.width - .5) * k * 1.3).toFixed(2) + 'deg');
      inc.style.setProperty('--lx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      inc.style.setProperty('--ly', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }
    /* parede: a câmera acompanha o olhar; com a peça em foco, ela gira de leve */
    const cena = t.closest('#cena');
    if (cena) {
      const r = cena.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
      const gr = $('.cena-trilho', cena);
      if (cena.classList.contains('foco')) {
        if (gr) gr.style.translate = '';
        const a = $('#pdp-peca .arte', cena);
        if (a) { a.style.setProperty('--ry', (nx * 16).toFixed(2) + 'deg'); a.style.setProperty('--rx', (-ny * 9).toFixed(2) + 'deg'); }
      } else if (gr) gr.style.translate = `${(-nx * 22).toFixed(1)}px ${(-ny * 14).toFixed(1)}px`;
    }
    const hero = t.closest('#hero');
    if (hero) {
      const r = hero.getBoundingClientRect(), a = $('.hero-peca .arte', hero);
      if (a) { a.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 16).toFixed(2) + 'deg'); a.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - .5) * 9).toFixed(2) + 'deg'); }
    }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (cur) cur.dataset.modo = 'oculto'; soltarIma(); soltarIncl(); });

  /* ---------- onda ao clicar ---------- */
  document.addEventListener('pointerdown', e => {
    if (calmo() || !e.target.closest) return;
    const b = e.target.closest('.botao, .botao-sacola, .opcao, .pilula, .redondo, .frete, .metodo');
    if (!b) return;
    const r = b.getBoundingClientRect(), o = document.createElement('i');
    o.className = 'onda';
    o.style.left = (e.clientX - r.left) + 'px'; o.style.top = (e.clientY - r.top) + 'px';
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.appendChild(o);
    setTimeout(() => o.remove(), 750);
  });

  /* ---------- sanfonas ---------- */
  function abrir(d) {
    if (!d || d.open) return;
    if (calmo()) { d.open = true; return; }
    const s = d.querySelector('summary'), h0 = s.offsetHeight;
    d.open = true;
    const h1 = d.scrollHeight;
    d.style.overflow = 'hidden';
    const a = d.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 480, easing: EASE });
    const fim = () => { d.style.overflow = ''; }; a.onfinish = fim; setTimeout(fim, 560);
    [...d.children].slice(1).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 70 + i * 50, easing: EASE, fill: 'backwards' }));
  }
  function fechar(d) {
    if (!d || !d.open) return;
    if (calmo()) { d.open = false; return; }
    const s = d.querySelector('summary');
    d.classList.add('fechando'); d.style.overflow = 'hidden';
    const a = d.animate([{ height: d.offsetHeight + 'px' }, { height: s.offsetHeight + 'px' }], { duration: 320, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    let feito = false;
    const fim = () => { if (feito) return; feito = true; d.open = false; a.cancel(); d.style.overflow = ''; d.classList.remove('fechando'); };
    a.onfinish = fim; setTimeout(fim, 400);
  }
  document.addEventListener('click', e => {
    const s = e.target.closest && e.target.closest('summary'); if (!s) return;
    const d = s.parentElement; if (!d || d.tagName !== 'DETAILS') return;
    e.preventDefault();
    if (d.open) fechar(d); else abrir(d);
  });

  /* ---------- grade: as peças deslizam até o novo lugar ---------- */
  function fotografarGrade() {
    const m = new Map();
    $$('.grade .card').forEach(c => m.set(c.dataset.card, c.getBoundingClientRect()));
    return m;
  }
  function animarGrade(antes) {
    if (calmo()) return;
    $$('.grade .card').forEach((c, i) => {
      const a = antes && antes.get(c.dataset.card), r = c.getBoundingClientRect();
      if (r.top > innerHeight + 100) return;
      if (a) {
        const dx = a.left - r.left, dy = a.top - r.top;
        if (Math.abs(dx) + Math.abs(dy) > 1) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 720, easing: EASE });
      } else {
        c.animate([{ opacity: 0, transform: 'translateY(28px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 620, delay: Math.min(i, 10) * 34, easing: EASE, fill: 'backwards' });
      }
    });
  }

  /* ---------- contagem de valores ---------- */
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const ultimos = new WeakMap();
  const memo = {};
  function contar(el, chave, valor) {
    if (!el) return;
    const de = memo[chave];
    memo[chave] = valor;
    if (calmo() || de === undefined || de === valor) { el.textContent = fmt.format(valor / 100); return; }
    const t0 = performance.now(), dur = 620;
    ultimos.set(el, t0);
    el.classList.remove('conta'); void el.offsetWidth; el.classList.add('conta');
    const passo = () => {
      if (ultimos.get(el) !== t0 || !el.isConnected) return;
      const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt.format(Math.round(de + (valor - de) * e) / 100);
      if (k < 1) setTimeout(passo, 30);
    };
    passo();
  }

  /* cartão vira ao digitar o CVV */
  document.addEventListener('focusin', e => {
    const c = $('.cartao-visual'); if (!c || !e.target.id) return;
    c.classList.toggle('virado', e.target.id === 'ck-pag-cvv');
  });

  /* Troca a imagem de perfil, no meio do giro, sem espelhar a frente. */
  const trocas = new WeakMap();
  function trocaPeca(caixa, atualizar, animar = true) {
    if (!caixa) return;
    const anterior = trocas.get(caixa), imagem = $('.arte', caixa);
    const inicio = imagem ? getComputedStyle(imagem).transform : 'none';
    if (anterior) anterior.animacao.cancel();
    trocas.delete(caixa);
    if (!animar || calmo() || !imagem || imagem.classList.contains('costas-pendente')) { atualizar(); return; }
    const estado = {};
    trocas.set(caixa, estado);
    const valido = () => caixa.isConnected && trocas.get(caixa) === estado;
    estado.animacao = imagem.animate([
      { transform: inicio, transformOrigin: '50% 8%' },
      { transform: 'perspective(1000px) rotateY(90deg)', transformOrigin: '50% 8%' }
    ], { duration: 240, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
    estado.animacao.onfinish = () => {
      if (!valido()) return;
      atualizar();
      estado.animacao.cancel();
      const nova = $('.arte', caixa);
      if (!nova) { trocas.delete(caixa); return; }
      estado.animacao = nova.animate([
        { transform: 'perspective(1000px) rotateY(-90deg)', transformOrigin: '50% 8%' },
        { transform: 'perspective(1000px) rotateY(0deg)', transformOrigin: '50% 8%' }
      ], { duration: 380, easing: EASE });
      estado.animacao.onfinish = () => { if (trocas.get(caixa) === estado) trocas.delete(caixa); };
    };
  }

  function iniciar() {
    if (!$('#progresso')) { const p = document.createElement('div'); p.id = 'progresso'; p.setAttribute('aria-hidden', 'true'); document.body.appendChild(p); }
    /* roda de letras no menu */
    $$('.topo-deps a').forEach(a => {
      if (a.dataset.rolo) return;
      a.dataset.rolo = '1';
      const t = a.textContent;
      a.innerHTML = `<span class="rolo"><span>${t}</span><span aria-hidden="true">${t}</span></span>`;
    });
    abertura();
  }

  return { iniciar, atualizar, cortina, abrir, fechar, fotografarGrade, animarGrade, contar, trocaPeca, aoRolar };
})();
