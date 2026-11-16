/* HYPEX · ilustrações das peças
   Cada peça é um SVG desenhado por código, com materiais definidos em index.html
   (malha, nylon, couro, sólido). Recebe as cores da variação (a, b, c) e as opções
   do modelo, por isso a troca de cor e de modelo é instantânea.
   Para usar fotos reais depois, basta trocar window.Arte.desenhar por uma <img>. */
(function () {
  'use strict';
  let uid = 0;
  const novoId = l => l + (++uid);

  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const lum = h => { const [r, g, b] = rgb(h); return (.299 * r + .587 * g + .114 * b) / 255; };
  const mix = (h1, h2, t) => {
    const a = rgb(h1), b = rgb(h2);
    return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const esc = (h, t = .3) => mix(h, '#000000', t);
  const cla = (h, t = .3) => mix(h, '#ffffff', t);
  const contra = h => lum(h) > .55 ? '#14112b' : '#ffffff';

  const p = (d, f, x = '') => `<path d="${d}" fill="${f}" ${x}/>`;
  const pano = (d, f, s = 's-v') => p(d, f) + p(d, `url(#${s})`);
  const tr = (d, c, w = 2, o = 1, x = '') =>
    `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round" stroke-linejoin="round" ${x}/>`;
  const circ = (x, y, r, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${ex}/>`;
  const elip = (x, y, a, b, f, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${f}" ${ex}/>`;
  const ret = (x, y, w, h, f, rx = 0, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${ex}/>`;
  const espelho = s => `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>`;
  const mat = (nome, s) => `<g filter="url(#f-${nome})">${s}</g>`;
  const camada = s => mat('camada', s);
  const svg = (vb, s, cls = '', espelhado) =>
    `<svg class="arte ${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false"${espelhado ? ' style="--espelho:-1"' : ''}>${s}</svg>`;
  /* inverte as coordenadas x de um caminho com comandos absolutos, em torno de x = 0 */
  const inverter = d => { let i = 0; return d.replace(/-?\d*\.?\d+/g, n => (i++ % 2 === 0 ? String(-parseFloat(n)) : n)); };

  /* costura: linha tracejada que aparece em qualquer cor de fundo */
  const costura = (d, base, o = .5) => tr(d, contra(base), 1.1, o, 'stroke-dasharray="3.5 3"');
  const recorte = (d, o = .32) => tr(d, '#000', 1.2, o);

  /* dobras suaves: sombra e luz desfocadas, recortadas pela forma da peça */
  function dobras(lista, base, clipId) {
    const escuro = lum(base) < .22;
    /* a sombra usa um tom mais escuro da própria cor, para o amarelo não ficar sujo */
    const tom = escuro ? '#000000' : mix(base, '#1a0a30', .62);
    const oS = escuro ? .7 : .5, oL = escuro ? .12 : .3;
    let g = `<g filter="url(#f-dobra)"${clipId ? ` clip-path="url(#${clipId})"` : ''}>`;
    lista.forEach(([d, w = 7, k = 1]) => {
      g += tr(d, tom, w, oS * k);
      g += `<g transform="translate(-4 -3)">${tr(d, '#fff', w * .7, oL * k)}</g>`;
    });
    return g + '</g>';
  }
  const envolver = (clipId, s) => `<g clip-path="url(#${clipId})">${s}</g>`;
  const clip = (id, ...ds) => `<clipPath id="${id}">${ds.join('')}</clipPath>`;

  /* estampa de penas do vestido e pingente do colar */
  const PENA = 'M0 10 C4 -2 14 -8 26 -9 C24 2 16 10 4 12 L-4 18 Z';
  /* marca da loja: o X da Hypex, com um braço que sobe */
  const XIS = 'M-1 -9 H8 L13 -1 L19 -11 H29 L18 5 L27 18 H18 L13 10 L8 18 H-1 L8 5 Z';
  const pena = (x, y, e, c) => `<g transform="translate(${x} ${y}) scale(${e})"><path d="${XIS}" fill="${c}"/></g>`;
  const marcaGrande = (x, y, e, cor, cor2) => `<g transform="translate(${x - 14 * e} ${y - 4 * e}) scale(${e})"><path d="${XIS}" fill="${cor}"/><path d="M19 -11 H29 L18 5 L13 -1 Z" fill="${cor2}"/></g>`;

  const gancho = () => tr('M200 62 L200 38 C200 28 215 26 215 14 C215 4 200 1 192 9', '#8d92a3', 4) + tr('M200 62 L200 38 C200 28 215 26 215 14', '#fff', 1, .55);
  const cabide = () => {
    const m = '#c98f55';
    return gancho() + tr('M200 58 L118 88', esc(m, .25), 11) + tr('M200 58 L282 88', esc(m, .25), 11) + tr('M200 57 L118 86', m, 9) + tr('M200 57 L282 86', m, 9) + tr('M196 56 L126 82', '#fff', 1.6, .35) + ret(195, 50, 10, 12, '#8d92a3', 2);
  };
  const pregador = (x, y) =>
    mat('solido', `<rect x="${x - 7}" y="${y - 13}" width="14" height="26" rx="2" fill="#2a2740"/>`) + ret(x - 7, y - 2, 14, 3, '#7b7899') + tr(`M${x - 3} ${y - 10} V${y - 4}`, '#fff', 1, .3);
  const barraPregadores = (y, x1, x2) => gancho() + tr(`M${x1} ${y} H${x2}`, '#8d92a3', 5) + tr(`M${x1} ${y - 1} H${x2}`, '#fff', 1, .5);

  /* ---------- PARTE DE CIMA: camisetas, moletons, casacos ---------- */
  function top(c, o = {}, vista) {
    const costas = vista === 'costas';
    const cx = 200, ny = 62, l = o.largo || 0;
    const regata = o.manga === 'regata', curta = o.manga === 'curta';
    const nw = regata ? 37 : (o.gola === 'capuz' ? 32 : 30);
    const sw = regata ? 58 + l : 86 + l, sy = regata ? 74 : 88;
    const bw = 75 + l, ay = curta ? 152 : 158;
    const hw = (o.barraL || 77) + l, hy = o.hy || 340;
    const sx = cx + sw, bx = cx + bw;
    const corpo = o.corpo || c.a, mangaCor = o.bloco ? c.b : corpo;
    const material = o.material || (o.brilho || o.puffer ? 'nylon' : 'malha');
    const idT = novoId('t'), idM = novoId('m');
    const queda = o.gola === 'v' ? 62 : (costas ? 8 : 26);

    const torso =
      `M${cx - nw} ${ny} Q${cx} ${ny + queda} ${cx + nw} ${ny} C${cx + nw + 12} ${ny + 6} ${sx - 16} ${sy - 12} ${sx} ${sy} ` +
      (regata
        ? `C${bx - 36} ${sy + 34} ${bx - 26} ${ay - 22} ${bx} ${ay}`
        : `C${bx + 7} ${sy + 18} ${bx + 3} ${ay - 18} ${bx} ${ay}`) +
      ` C${bx - 2} ${ay + 60} ${cx + hw + 1} ${hy - 80} ${cx + hw} ${hy} Q${cx} ${hy + 8} ${cx - hw} ${hy} C${cx - hw - 1} ${hy - 80} ${cx - bw + 2} ${ay + 60} ${cx - bw} ${ay} ` +
      (regata
        ? `C${cx - bw + 26} ${ay - 22} ${cx - bw + 36} ${sy + 34} ${cx - sw} ${sy}`
        : `C${cx - bw - 3} ${ay - 18} ${cx - bw - 7} ${sy + 18} ${cx - sw} ${sy}`) +
      ` C${cx - sw + 16} ${sy - 12} ${cx - nw - 12} ${ny + 6} ${cx - nw} ${ny} Z`;

    let manga = '', punho = '', dobrasManga = [];
    if (curta) {
      manga = `M${sx - 6} ${sy - 5} C${sx + 16} ${sy + 1} ${sx + 40} ${sy + 40} ${sx + 60} ${sy + 80} C${sx + 48} ${sy + 92} ${sx + 34} ${sy + 99} ${sx + 20} ${sy + 103} C${sx + 12} ${sy + 86} ${bx + 8} ${ay - 8} ${bx - 3} ${ay + 8} Z`;
      punho = tr(`M${sx + 55} ${sy + 72} C${sx + 44} ${sy + 83} ${sx + 30} ${sy + 91} ${sx + 17} ${sy + 94}`, contra(mangaCor), 1.1, .42, 'stroke-dasharray="3.5 3"');
      dobrasManga = [[`M${bx + 1} ${ay - 8} C${sx + 8} ${ay - 14} ${sx + 22} ${ay - 18} ${sx + 34} ${ay - 34}`, 7], [`M${sx + 2} ${sy + 20} C${sx + 14} ${sy + 36} ${sx + 26} ${sy + 60} ${sx + 28} ${sy + 86}`, 6, .8]];
    } else if (!regata) {
      manga = `M${sx - 6} ${sy - 5} C${sx + 18} ${sy + 2} ${sx + 28} ${sy + 46} ${sx + 36} ${ay + 34} C${sx + 44} ${ay + 78} ${sx + 54} ${hy - 72} ${sx + 62} ${hy - 26} C${sx + 48} ${hy - 19} ${sx + 34} ${hy - 15} ${sx + 19} ${hy - 13} C${sx + 13} ${hy - 72} ${sx + 3} ${ay + 66} ${bx - 3} ${ay + 8} Z`;
      if (o.punho !== false) {
        const cf = `M${sx + 56} ${hy - 50} C${sx + 58} ${hy - 40} ${sx + 61} ${hy - 30} ${sx + 63} ${hy - 22} C${sx + 48} ${hy - 15} ${sx + 33} ${hy - 11} ${sx + 18} ${hy - 9} L${sx + 14} ${hy - 37} C${sx + 30} ${hy - 39} ${sx + 43} ${hy - 44} ${sx + 56} ${hy - 50} Z`;
        punho = p(cf, o.corPunho || esc(mangaCor, .1)) + p(cf, 'url(#p-canelado)') + recorte(`M${sx + 56} ${hy - 50} C${sx + 43} ${hy - 44} ${sx + 30} ${hy - 39} ${sx + 14} ${hy - 37}`, .3);
      } else {
        punho = costura(`M${sx + 58} ${hy - 40} C${sx + 45} ${hy - 33} ${sx + 32} ${hy - 29} ${sx + 17} ${hy - 26}`, mangaCor, .4);
      }
      dobrasManga = [
        [`M${bx + 2} ${ay + 6} C${sx + 4} ${ay - 6} ${sx + 18} ${ay - 2} ${sx + 26} ${ay - 24}`, 8],
        [`M${sx + 6} ${ay + 58} C${sx + 18} ${ay + 66} ${sx + 32} ${ay + 58} ${sx + 42} ${ay + 40}`, 8],
        [`M${sx + 12} ${ay + 92} C${sx + 24} ${ay + 96} ${sx + 38} ${ay + 88} ${sx + 48} ${ay + 72}`, 6, .75],
        [`M${sx + 17} ${hy - 60} C${sx + 26} ${hy - 58} ${sx + 40} ${hy - 62} ${sx + 54} ${hy - 72}`, 6, .7],
        [`M${sx + 4} ${sy + 12} C${sx + 12} ${sy + 34} ${sx + 18} ${sy + 56} ${sx + 22} ${ay + 16}`, 6, .55]
      ];
    }

    let s = '';
    if (o.cabide !== false) s += cabide();

    /* capuz ou gola alta atrás do pescoço */
    if (o.gola === 'capuz') {
      const cap = o.corCapuz || corpo;
      const fora = `M${cx - 52} ${ny + 24} C${cx - 72} ${ny - 20} ${cx - 42} ${ny - 48} ${cx} ${ny - 48} C${cx + 42} ${ny - 48} ${cx + 72} ${ny - 20} ${cx + 52} ${ny + 24} Q${cx} ${ny + 56} ${cx - 52} ${ny + 24} Z`;
      s += mat(material, p(fora, cap));
      if (!costas) {
        const dentro = `M${cx - 31} ${ny + 26} C${cx - 42} ${ny - 8} ${cx - 22} ${ny - 32} ${cx} ${ny - 32} C${cx + 22} ${ny - 32} ${cx + 42} ${ny - 8} ${cx + 31} ${ny + 26} Q${cx} ${ny + 44} ${cx - 31} ${ny + 26} Z`;
        s += p(dentro, esc(cap, .62));
        s += `<g filter="url(#f-dobra)">${tr(`M${cx - 30} ${ny + 8} C${cx - 34} ${ny - 12} ${cx - 16} ${ny - 26} ${cx} ${ny - 26} C${cx + 16} ${ny - 26} ${cx + 34} ${ny - 12} ${cx + 30} ${ny + 8}`, '#000', 7, .4)}</g>`;
        s += tr(`M${cx - 31} ${ny + 26} C${cx - 42} ${ny - 8} ${cx - 22} ${ny - 32} ${cx} ${ny - 32} C${cx + 22} ${ny - 32} ${cx + 42} ${ny - 8} ${cx + 31} ${ny + 26}`, esc(cap, .2), 4);
        s += costura(`M${cx - 37} ${ny + 22} C${cx - 48} ${ny - 12} ${cx - 25} ${ny - 38} ${cx} ${ny - 38} C${cx + 25} ${ny - 38} ${cx + 48} ${ny - 12} ${cx + 37} ${ny + 22}`, cap, .42);
      } else {
        s += recorte(`M${cx} ${ny - 48} V${ny + 40}`, .28);
      }
    } else if (o.gola === 'alta') {
      const cg = o.corGola || corpo;
      s += mat(material, p(`M${cx - 40} ${ny + 12} L${cx - 36} ${ny - 24} Q${cx} ${ny - 35} ${cx + 36} ${ny - 24} L${cx + 40} ${ny + 12} Q${cx} ${ny + 32} ${cx - 40} ${ny + 12} Z`, cg));
      s += p(`M${cx - 29} ${ny - 18} Q${cx} ${ny - 29} ${cx + 29} ${ny - 18} Q${cx} ${ny - 6} ${cx - 29} ${ny - 18} Z`, esc(cg, .62));
      s += ret(cx - 7, ny - 23, 14, 8, cla(cg, .75), 1);
    } else if (!costas) {
      s += p(`M${cx - nw} ${ny} Q${cx} ${ny - 11} ${cx + nw} ${ny} Q${cx} ${ny + queda + 5} ${cx - nw} ${ny} Z`, esc(corpo, .58));
      s += `<g filter="url(#f-dobra)">${tr(`M${cx - nw + 4} ${ny + 3} Q${cx} ${ny - 6} ${cx + nw - 4} ${ny + 3}`, '#000', 6, .4)}</g>`;
      s += ret(cx - 9, ny - 3, 18, 10, cla(corpo, .78), 1);
    }

    /* mangas, com a sombra projetada pelo tronco */
    if (manga) {
      let m = p(manga, mangaCor) + p(manga, 'url(#s-h)');
      if (o.puffer) {
        const mid = novoId('pm');
        m += clip(mid, `<path d="${manga}"/>`) + `<g clip-path="url(#${mid})">`;
        for (let y = sy + 22; y < hy; y += 31) {
          m += `<g filter="url(#f-dobra)">${tr(`M${sx - 34} ${y + 8} Q${sx + 30} ${y - 6} ${sx + 96} ${y + 14}`, '#000', 7, .5)}${tr(`M${sx - 34} ${y - 11} Q${sx + 30} ${y - 22} ${sx + 96} ${y - 7}`, '#fff', 7, .34)}</g>`;
          m += tr(`M${sx - 34} ${y + 8} Q${sx + 30} ${y - 6} ${sx + 96} ${y + 14}`, '#000', 1.3, .4);
        }
        m += '</g>';
      }
      m += punho;
      const bloco = mat(material, m + espelho(m));
      s += bloco;
      s += clip(idM, `<path d="${manga}"/>`, `<path d="${manga}" transform="matrix(-1 0 0 1 400 0)"/>`);
      if (!o.puffer) s += dobras(dobrasManga, mangaCor, idM) + espelho(dobras(dobrasManga, mangaCor, idM));
      s += `<g clip-path="url(#${idM})"><path d="${torso}" fill="#000" opacity=".42" filter="url(#f-sombra)"/></g>`;
    }

    /* tronco */
    s += clip(idT, `<path d="${torso}"/>`);
    let corpoS = p(torso, corpo) + p(torso, 'url(#s-h)') + p(torso, 'url(#s-v)');
    if (o.listras) {
      corpoS += '<g>' + envolver(idT, Array.from({ length: 14 }, (_, i) => ret(60, sy + 14 + i * 28, 280, 11, c.b)).join('')) + '</g>';
    }
    s += mat(material, corpoS);

    let int = '';
    if (o.bloco) {
      int += p(`M50 30 L350 30 L350 ${ay - 22} C300 ${ay - 2} 240 ${ay + 14} ${cx} ${ay + 14} C160 ${ay + 14} 100 ${ay - 2} 50 ${ay - 22} Z`, c.b);
    }
    if (o.painel) {
      int += p(`M${cx - hw - 6} ${ay + 26} L${cx - hw + 42} ${ay + 16} L${cx - hw + 34} ${hy + 8} L${cx - hw - 6} ${hy + 8} Z`, c.c);
      int += p(`M${cx + hw + 6} ${ay + 26} L${cx + hw - 42} ${ay + 16} L${cx + hw - 34} ${hy + 8} L${cx + hw + 6} ${hy + 8} Z`, c.c);
    }
    if (int) s += envolver(idT, mat('camada', int) + (o.bloco ? costura(`M50 ${ay - 26} C100 ${ay - 6} 160 ${ay + 10} ${cx} ${ay + 10} C240 ${ay + 10} 300 ${ay - 6} 350 ${ay - 26}`, c.b, .5) : ''));

    /* gomos do puffer */
    if (o.puffer) {
      let g = '';
      for (let y = ny + 40; y < hy; y += 33) {
        g += `<g filter="url(#f-dobra)">${tr(`M50 ${y + 6} Q${cx} ${y + 20} 350 ${y + 6}`, '#000', 7, .5)}${tr(`M50 ${y - 13} Q${cx} ${y + 1} 350 ${y - 13}`, '#fff', 8, .38)}</g>`;
        g += tr(`M50 ${y + 6} Q${cx} ${y + 20} 350 ${y + 6}`, '#000', 1.4, .42);
      }
      s += envolver(idT, g);
    }

    /* dobras do tronco */
    const fold = [
      [`M${cx - bw + 4} ${ay + 8} C${cx - bw + 28} ${ay + 32} ${cx - 50} ${ay + 54} ${cx - 34} ${ay + 92}`, 8],
      [`M${cx + bw - 4} ${ay + 8} C${cx + bw - 28} ${ay + 32} ${cx + 50} ${ay + 54} ${cx + 34} ${ay + 92}`, 8]
    ];
    if (hy > 260) {
      fold.push([`M${cx - 42} ${hy - 104} C${cx - 32} ${hy - 72} ${cx - 48} ${hy - 40} ${cx - 38} ${hy - 6}`, 7, .75]);
      fold.push([`M${cx + 46} ${hy - 124} C${cx + 34} ${hy - 80} ${cx + 52} ${hy - 40} ${cx + 42} ${hy - 6}`, 7, .75]);
      fold.push([`M${cx + 8} ${ay + 66} C${cx - 8} ${ay + 104} ${cx + 10} ${hy - 62} ${cx - 2} ${hy - 18}`, 6, .4]);
    }
    if (!regata) fold.push([`M${cx - sw + 10} ${sy + 8} C${cx - 58} ${sy + 22} ${cx - 54} ${sy + 42} ${cx - 44} ${sy + 62}`, 6, .4], [`M${cx + sw - 10} ${sy + 8} C${cx + 58} ${sy + 22} ${cx + 54} ${sy + 42} ${cx + 44} ${sy + 62}`, 6, .4]);
    if (!o.puffer) s += dobras(fold, corpo, idT);
    if (o.brilho && !o.puffer) {
      s += `<g filter="url(#f-dobra)" clip-path="url(#${idT})">${tr(`M${cx - 58} ${ay - 30} C${cx - 46} ${ay + 30} ${cx - 64} ${ay + 92} ${cx - 72} ${ay + 150}`, '#fff', 11, .4)}${tr(`M${cx + 52} ${ay + 20} C${cx + 62} ${ay + 60} ${cx + 52} ${ay + 110} ${cx + 44} ${ay + 150}`, '#fff', 7, .28)}</g>`;
    }

    /* cava da manga */
    if (manga) {
      s += recorte(`M${sx} ${sy} C${bx + 7} ${sy + 18} ${bx + 3} ${ay - 18} ${bx} ${ay}`, .32) + recorte(`M${cx - sw} ${sy} C${cx - bw - 7} ${sy + 18} ${cx - bw - 3} ${ay - 18} ${cx - bw} ${ay}`, .32);
      s += costura(`M${sx - 5} ${sy + 2} C${bx + 1} ${sy + 20} ${bx - 3} ${ay - 18} ${bx - 6} ${ay - 2}`, corpo, .32) + costura(`M${cx - sw + 5} ${sy + 2} C${cx - bw - 1} ${sy + 20} ${cx - bw + 3} ${ay - 18} ${cx - bw + 6} ${ay - 2}`, corpo, .32);
    }

    /* barra */
    if (o.barra) {
      const h = o.barra === true ? 24 : o.barra;
      const b = `M${cx - hw + 1} ${hy - h} Q${cx} ${hy - h + 8} ${cx + hw - 1} ${hy - h} L${cx + hw} ${hy} Q${cx} ${hy + 8} ${cx - hw} ${hy} Z`;
      s += p(b, esc(corpo, .08)) + p(b, 'url(#p-canelado)') + recorte(`M${cx - hw + 1} ${hy - h} Q${cx} ${hy - h + 8} ${cx + hw - 1} ${hy - h}`, .28);
    } else {
      s += costura(`M${cx - hw + 2} ${hy - 9} Q${cx} ${hy - 1} ${cx + hw - 2} ${hy - 9}`, corpo, .42);
    }
    if (regata) {
      s += costura(`M${sx - 6} ${sy + 6} C${bx - 42} ${sy + 38} ${bx - 32} ${ay - 22} ${bx - 6} ${ay - 4}`, corpo, .38) + costura(`M${cx - sw + 6} ${sy + 6} C${cx - bw + 42} ${sy + 38} ${cx - bw + 32} ${ay - 22} ${cx - bw + 6} ${ay - 4}`, corpo, .38);
    }

    /* frente */
    if (!costas) {
      const cg = o.corGola || corpo;
      if (o.gola === 'careca' || !o.gola) {
        s += tr(`M${cx - nw + 1} ${ny + 2} Q${cx} ${ny + queda + 4} ${cx + nw - 1} ${ny + 2}`, esc(corpo, .08), 10);
        for (let t = .06; t < 1; t += .045) {
          const x = (1 - t) * (1 - t) * (cx - nw + 1) + 2 * t * (1 - t) * cx + t * t * (cx + nw - 1);
          const y = (1 - t) * (1 - t) * (ny + 2) + 2 * t * (1 - t) * (ny + queda + 4) + t * t * (ny + 2);
          s += tr(`M${x.toFixed(1)} ${(y - 4).toFixed(1)} L${x.toFixed(1)} ${(y + 4).toFixed(1)}`, '#000', 1, .16);
        }
        s += tr(`M${cx - nw + 1} ${ny + 7} Q${cx} ${ny + queda + 9} ${cx + nw - 1} ${ny + 7}`, '#000', 1.1, .25);
      }
      if (o.gola === 'v') s += tr(`M${cx - nw} ${ny} L${cx} ${ny + 42} L${cx + nw} ${ny}`, esc(corpo, .14), 7);
      if (o.gola === 'polo') {
        s += ret(cx - 8, ny + 20, 16, 56, esc(corpo, .06)) + recorte(`M${cx - 8} ${ny + 22} V${ny + 76} H${cx + 8} V${ny + 22}`, .28);
        s += circ(cx, ny + 38, 3, cla(corpo, .85), 'stroke="#000" stroke-opacity=".3"') + circ(cx, ny + 60, 3, cla(corpo, .85), 'stroke="#000" stroke-opacity=".3"');
        s += camada(p(`M${cx - nw - 3} ${ny - 5} L${cx - 1} ${ny + 22} L${cx - 15} ${ny + 44} L${cx - nw - 20} ${ny + 17} Z`, o.corGola || esc(corpo, .06)) + p(`M${cx + nw + 3} ${ny - 5} L${cx + 1} ${ny + 22} L${cx + 15} ${ny + 44} L${cx + nw + 20} ${ny + 17} Z`, o.corGola || esc(corpo, .06)));
      }
      if (o.gola === 'camisa') {
        s += recorte(`M${cx - 7} ${ny + 18} V${hy + 4}`, .2) + recorte(`M${cx + 7} ${ny + 18} V${hy + 4}`, .24);
        for (let y = ny + 42; y < hy - 10; y += 42) s += circ(cx, y, 3, cla(corpo, .75), 'stroke="#000" stroke-opacity=".32"');
        s += camada(p(`M${cx - nw - 2} ${ny - 7} L${cx - 1} ${ny + 16} L${cx - 20} ${ny + 36} L${cx - nw - 15} ${ny + 9} Z`, cla(corpo, .12)) + p(`M${cx + nw + 2} ${ny - 7} L${cx + 1} ${ny + 16} L${cx + 20} ${ny + 36} L${cx + nw + 15} ${ny + 9} Z`, cla(corpo, .12)));
      }
      if (o.gola === 'capuz') {
        const pp = o.cordao || cla(o.corCapuz || corpo, .7);
        s += circ(cx - 15, ny + 28, 3, 'url(#s-metal)') + circ(cx + 15, ny + 28, 3, 'url(#s-metal)');
        s += tr(`M${cx - 15} ${ny + 28} C${cx - 18} ${ny + 48} ${cx - 15} ${ny + 64} ${cx - 18} ${ny + 84}`, pp, 3.4) + tr(`M${cx + 15} ${ny + 28} C${cx + 18} ${ny + 44} ${cx + 15} ${ny + 60} ${cx + 18} ${ny + 76}`, pp, 3.4);
        s += ret(cx - 21, ny + 83, 6, 12, esc(pp, .15), 1.5) + ret(cx + 15, ny + 75, 6, 12, esc(pp, .15), 1.5);
      }
      if (o.gola === 'alfaiate') {
        s += camada(p(`M${cx - nw} ${ny - 3} L${cx - 2} ${ny + 120} L${cx - 44} ${ny + 68} L${cx - 31} ${ny + 47} L${cx - nw - 24} ${ny + 19} Z`, cla(corpo, .07)) + p(`M${cx + nw} ${ny - 3} L${cx + 2} ${ny + 120} L${cx + 44} ${ny + 68} L${cx + 31} ${ny + 47} L${cx + nw + 24} ${ny + 19} Z`, cla(corpo, .07)));
        s += recorte(`M${cx - 44} ${ny + 68} L${cx - 31} ${ny + 47}`, .4) + recorte(`M${cx + 44} ${ny + 68} L${cx + 31} ${ny + 47}`, .4);
        s += recorte(`M${cx} ${ny + 120} C${cx - 4} ${ny + 180} ${cx - 8} ${hy - 40} ${cx - 16} ${hy}`, .42);
        if (!o.trespasse) {
          for (const y of [ny + 138, ny + 180]) s += circ(cx + 7, y, 4.5, esc(c.c, .1), 'stroke="#000" stroke-opacity=".3"') + circ(cx + 6, y - 1, 1.6, '#fff', 'opacity=".5"');
        }
      }
      if (o.ziper) {
        const zc = o.corZiper || (lum(corpo) > .6 ? '#2a2740' : '#e8e6f2');
        const y0 = o.gola === 'alta' ? ny - 14 : ny + 18;
        s += tr(`M${cx} ${y0} L${cx} ${hy + 2}`, esc(corpo, .28), 8, .75) + tr(`M${cx} ${y0} L${cx} ${hy + 2}`, zc, 3.4) + tr(`M${cx} ${y0} L${cx} ${hy + 2}`, '#000', 3.4, .35, 'stroke-dasharray="1.2 2.4"');
        s += ret(cx - 3, y0 + 8, 6, 17, o.corPuxador || 'url(#s-metal)', 2) + circ(cx, y0 + 7, 2.6, 'url(#s-metal)');
      }
      if (o.botoes) for (let y = ny + 34; y < hy - 10; y += o.botoes) s += circ(cx + 3, y, 3.6, 'url(#s-metal)', 'stroke="#000" stroke-opacity=".35"');
      if (o.trespasse) {
        for (const y of [ny + 110, ny + 158, ny + 206]) for (const dx of [-24, 24]) s += circ(cx + dx, y, 4.8, esc(c.c, .1), 'stroke="#000" stroke-opacity=".3"') + circ(cx + dx - 1, y - 1, 1.5, '#fff', 'opacity=".5"');
      }
      if (o.cinto) {
        const yb = o.cinto;
        s += envolver(idT, camada(ret(40, yb, 320, 20, esc(corpo, .14)))) + tr(`M${cx - hw} ${yb + 3} H${cx + hw}`, contra(corpo), 1, .3, 'stroke-dasharray="3.5 3"');
        s += `<rect x="${cx - 17}" y="${yb - 4}" width="34" height="28" rx="4" fill="none" stroke="${esc(corpo, .45)}" stroke-width="4.5"/>`;
        s += tr(`M${cx + 12} ${yb + 20} C${cx + 20} ${yb + 56} ${cx + 16} ${yb + 74} ${cx + 22} ${yb + 96}`, esc(corpo, .14), 16);
      }
      if (o.bolso === 'canguru') {
        const b = `M${cx - 58} ${hy - 104} L${cx + 58} ${hy - 104} L${cx + 78} ${hy - 54} L${cx + 74} ${hy - 26} L${cx - 74} ${hy - 26} L${cx - 78} ${hy - 54} Z`;
        s += camada(p(b, esc(corpo, .04)));
        s += costura(`M${cx - 54} ${hy - 100} L${cx - 73} ${hy - 54}`, corpo, .4) + costura(`M${cx + 54} ${hy - 100} L${cx + 73} ${hy - 54}`, corpo, .4);
        s += tr(`M${cx - 58} ${hy - 104} L${cx + 58} ${hy - 104}`, '#000', 1, .2);
      }
      if (o.bolso === 'laterais') {
        for (const k of [-1, 1]) s += tr(`M${cx + k * 58} ${hy - 104} L${cx + k * 42} ${hy - 44}`, esc(corpo, .4), 3.6) + costura(`M${cx + k * 64} ${hy - 102} L${cx + k * 48} ${hy - 42}`, corpo, .32);
      }
      if (o.bolso === 'peito') {
        const b = `M${cx + 22} ${ny + 66} h44 v44 l-22 8 l-22 -8 Z`;
        s += camada(p(b, o.bloco ? c.c : esc(corpo, .22))) + ret(cx + 22, ny + 66, 44, 6, c.c);
      }
      if (o.bolso === 'jeans') {
        const fio = c.c;
        const st = 'stroke-dasharray="3.5 2.5"';
        s += tr(`M${cx - bw + 2} ${ny + 58} L${cx + bw - 2} ${ny + 58}`, fio, 1.3, .85, st);
        s += tr(`M${cx - bw + 2} ${ny + 62} L${cx + bw - 2} ${ny + 62}`, fio, 1.3, .85, st);
        for (const k of [-1, 1]) {
          const x = cx + k * 48;
          s += camada(p(`M${x - 28} ${ny + 68} h56 v24 l-28 12 l-28 -12 Z`, esc(corpo, .08)));
          s += tr(`M${x - 25} ${ny + 72} h50 v18 l-25 10 l-25 -10 Z`, fio, 1.2, .9, st);
          s += circ(x, ny + 90, 3.4, 'url(#s-metal)');
          s += tr(`M${x + k * 12} ${ny + 118} L${x + k * 18} ${hy - 22}`, fio, 1.2, .8, st);
        }
      }
      if (o.bolso === 'tecnico') {
        for (const k of [-1, 1]) {
          const x = cx + k * 45;
          s += camada(p(`M${x - 30} ${ny + 148} h60 l5 68 h-70 Z`, c.b));
          s += costura(`M${x - 26} ${ny + 160} h52`, c.b, .5);
          s += ret(x - 27, ny + 150, 54, 5, c.c, 1) + ret(x + 16, ny + 155, 5, 15, 'url(#s-metal)', 1.5);
        }
        s += camada(p(`M${cx - 80} ${ny + 66} h42 v36 h-42 Z`, esc(corpo, .28)));
        s += ret(cx - 80, ny + 66, 42, 4, c.c, 1) + ret(cx - 44, ny + 70, 4, 11, 'url(#s-metal)', 1);
        s += `<g transform="translate(${cx + 40} ${ny + 80})">${ret(-1, -8, 30, 16, c.c, 2)}${pena(6, -2, .7, contra(c.c))}</g>`;
        s += tr(`M${cx - hw + 4} ${hy - 22} Q${cx} ${hy - 15} ${cx + hw - 4} ${hy - 22}`, '#000', 1, .28);
        for (const k of [-1, 1]) s += ret(cx + k * (hw - 14) - 3, hy - 21, 6, 13, c.c, 2);
      }
      if (o.marca) s += pena(cx + 40, ny + 48, 1.1, o.marca === true ? c.c : o.marca);
      if (o.estampa) {
        s += marcaGrande(cx, ny + 96, 2.9, c.c, c.b);
      }
    } else {
      s += tr(`M${cx - nw + 1} ${ny} Q${cx} ${ny + 10} ${cx + nw - 1} ${ny}`, esc(corpo, .12), 9);
      s += costura(`M${cx - bw + 8} ${ny + 42} Q${cx} ${ny + 56} ${cx + bw - 8} ${ny + 42}`, corpo, .35);
      s += pena(cx - 13, hy - 62, 1, contra(corpo));
    }
    return svg('0 0 400 460', s, o.classe);
  }

  /* Jaqueta técnica do destaque: nylon brilhante, recortes e cordões */
  function tecnica(c, o = {}, vista) {
    return top(c, Object.assign({
      manga: 'longa', gola: 'capuz', largo: 14, hy: 330, bloco: true, ziper: true, barra: 14, brilho: true,
      bolso: 'tecnico', corCapuz: c.b, cordao: c.c, corPuxador: c.c, barraL: 86, cabide: o.cabide
    }, o), vista);
  }

  /* ---------- PARTE DE BAIXO ---------- */
  function calca(c, o = {}, vista) {
    const costas = vista === 'costas';
    const a = c.a, cx = 200, wy = 66, ww = o.cintura || 66, hip = o.quadril || 80;
    const fim = o.hy || 436, gc = wy + 118, ab = o.boca || 46, ctr = o.vao || 8;
    const bocaX = cx - hip - 6 - (ab - 40);
    const pernaE = `M${cx - ww} ${wy + 16} C${cx - hip - 3} ${wy + 54} ${cx - hip - 8} ${wy + 112} ${bocaX} ${fim} Q${(bocaX + cx - ctr) / 2} ${fim + 5} ${cx - ctr - 2} ${fim} C${cx - ctr + 1} ${fim - 90} ${cx - 2} ${gc + 40} ${cx - 1} ${gc} L${cx - 1} ${wy + 16} Z`;
    const idP = novoId('p');
    const mat1 = o.jeans ? 'couro' : 'malha';
    let s = barraPregadores(44, cx - ww + 16, cx + ww - 16);
    s += tr(`M${cx - ww + 16} ${wy - 12} V44 M${cx + ww - 16} ${wy - 12} V44`, '#8d92a3', 3);
    s += pregador(cx - ww + 16, wy - 2) + pregador(cx + ww - 16, wy - 2);

    let perna = p(pernaE, a) + p(pernaE, 'url(#s-h)');
    if (o.jeans) perna += p(pernaE, 'url(#p-sarja)');
    s += mat(mat1, perna + espelho(perna));
    s += clip(idP, `<path d="${pernaE}"/>`, `<path d="${pernaE}" transform="matrix(-1 0 0 1 400 0)"/>`);

    /* desbotado do jeans */
    if (o.jeans) {
      s += `<g clip-path="url(#${idP})"><g filter="url(#f-sombra)">${elip(cx - hip / 2 - 2, wy + 180, 22, 110, '#fff', 'opacity=".26"')}${elip(cx + hip / 2 + 2, wy + 180, 22, 110, '#fff', 'opacity=".26"')}</g></g>`;
    }
    const lista = [
      [`M${cx - 6} ${gc + 6} C${cx - 24} ${gc + 26} ${cx - 42} ${gc + 26} ${cx - 62} ${gc + 12}`, 7],
      [`M${cx + 6} ${gc + 6} C${cx + 24} ${gc + 26} ${cx + 42} ${gc + 26} ${cx + 62} ${gc + 12}`, 7],
      [`M${cx - 10} ${gc - 6} C${cx - 28} ${gc - 26} ${cx - 44} ${gc - 34} ${cx - 62} ${gc - 36}`, 6, .6],
      [`M${cx + 10} ${gc - 6} C${cx + 28} ${gc - 26} ${cx + 44} ${gc - 34} ${cx + 62} ${gc - 36}`, 6, .6]
    ];
    if (fim > 300) {
      lista.push([`M${cx - hip + 8} ${fim - 138} C${cx - 58} ${fim - 122} ${cx - 42} ${fim - 124} ${cx - 22} ${fim - 146}`, 7, .8]);
      lista.push([`M${cx + hip - 8} ${fim - 122} C${cx + 58} ${fim - 110} ${cx + 42} ${fim - 112} ${cx + 22} ${fim - 134}`, 7, .8]);
      lista.push([`M${cx - hip - 2} ${fim - 52} C${cx - 64} ${fim - 42} ${cx - 44} ${fim - 42} ${cx - 24} ${fim - 58}`, 6, .6]);
      lista.push([`M${cx + hip + 2} ${fim - 62} C${cx + 64} ${fim - 50} ${cx + 44} ${fim - 50} ${cx + 24} ${fim - 68}`, 6, .6]);
    }
    s += dobras(lista, a, idP);
    s += recorte(`M${cx} ${wy + 18} V${gc}`, .34);
    s += `<g clip-path="url(#${idP})">`;
    if (o.vinco) {
      const v = cx - hip / 2 - 4;
      s += tr(`M${v} ${wy + 30} L${v - (ab - 46) / 2 - 2} ${fim}`, '#000', 1.3, .3) + tr(`M${v + 1.5} ${wy + 30} L${v - (ab - 46) / 2 - .5} ${fim}`, '#fff', 1, .3);
      s += espelho(tr(`M${v} ${wy + 30} L${v - (ab - 46) / 2 - 2} ${fim}`, '#000', 1.3, .3) + tr(`M${v + 1.5} ${wy + 30} L${v - (ab - 46) / 2 - .5} ${fim}`, '#fff', 1, .3));
    }
    s += '</g>';
    let lado = '';
    if (o.cargo && !costas && fim > 300) {
      const b = `M${cx - hip - 9} ${wy + 188} L${cx - 34} ${wy + 184} L${cx - 34} ${wy + 268} L${cx - hip - 13} ${wy + 270} Z`;
      /* o filtro fica fora do espelhamento: dentro dele a luz sai invertida */
      const bolsoC = p(b, esc(a, .06));
      const abaC = p(`M${cx - hip - 11} ${wy + 180} L${cx - 32} ${wy + 176} L${cx - 32} ${wy + 208} L${cx - hip - 11} ${wy + 212} Z`, esc(a, .12));
      s += camada(bolsoC + espelho(bolsoC)) + camada(abaC + espelho(abaC));
      lado += costura(`M${cx - hip - 7} ${wy + 204} L${cx - 36} ${wy + 201}`, a, .4) + circ(cx - hip / 2 - 22, wy + 196, 3.2, 'url(#s-metal)');
    }
    if (o.jogger) {
      const cf = `M${bocaX + 2} ${fim - 24} Q${(bocaX + cx - ctr) / 2} ${fim - 20} ${cx - ctr - 3} ${fim - 24} L${cx - ctr - 2} ${fim} Q${(bocaX + cx - ctr) / 2} ${fim + 5} ${bocaX} ${fim} Z`;
      lado += p(cf, esc(a, .1)) + p(cf, 'url(#p-canelado)');
    } else {
      lado += tr(`M${bocaX + 2} ${fim - 9} Q${(bocaX + cx - ctr) / 2} ${fim - 4} ${cx - ctr - 3} ${fim - 9}`, o.jeans ? c.c : contra(a), 1.1, o.jeans ? .9 : .4, 'stroke-dasharray="3.5 3"');
    }
    if (o.jeans) {
      const st = 'stroke-dasharray="3.5 2.5"';
      lado += tr(`M${cx - hip + 2} ${wy + 40} C${cx - hip - 4} ${wy + 120} ${cx - hip - 6} ${wy + 200} ${bocaX + 4} ${fim - 10}`, c.c, 1.1, .7, st);
      lado += tr(`M${cx - 5} ${gc + 4} C${cx - 6} ${gc + 60} ${cx - ctr - 2} ${fim - 90} ${cx - ctr - 6} ${fim - 10}`, c.c, 1.1, .7, st);
    }
    s += lado + espelho(lado);

    /* cós */
    const cos = `M${cx - ww} ${wy - 7} Q${cx} ${wy - 3} ${cx + ww} ${wy - 7} L${cx + ww + 3} ${wy + 19} Q${cx} ${wy + 24} ${cx - ww - 3} ${wy + 19} Z`;
    s += camada(p(cos, o.elastico ? esc(a, .1) : esc(a, .03)));
    if (o.elastico) {
      s += p(cos, 'url(#p-canelado)');
      if (!costas) s += circ(cx - 6, wy + 9, 2.4, 'url(#s-metal)') + circ(cx + 6, wy + 9, 2.4, 'url(#s-metal)') + tr(`M${cx - 6} ${wy + 9} C${cx - 14} ${wy + 30} ${cx - 12} ${wy + 46} ${cx - 22} ${wy + 62}`, c.c, 3.2) + tr(`M${cx + 6} ${wy + 9} C${cx + 14} ${wy + 26} ${cx + 12} ${wy + 42} ${cx + 22} ${wy + 54}`, c.c, 3.2);
    } else {
      s += costura(`M${cx - ww + 2} ${wy - 3} Q${cx} ${wy + 1} ${cx + ww - 2} ${wy - 3}`, a, .4) + costura(`M${cx - ww} ${wy + 15} Q${cx} ${wy + 20} ${cx + ww} ${wy + 15}`, a, .4);
      for (const x of [cx - ww + 14, cx - 26, cx + 26, cx + ww - 14]) s += ret(x - 3, wy - 9, 6, 31, esc(a, .12), 1);
      if (!costas) {
        s += circ(cx, wy + 7, 4.6, o.jeans ? 'url(#s-metal)' : esc(c.c, .05), 'stroke="#000" stroke-opacity=".35"');
        s += tr(`M${cx + 17} ${wy + 20} C${cx + 18} ${wy + 66} ${cx + 16} ${wy + 84} ${cx + 1} ${wy + 98}`, o.jeans ? c.c : contra(a), 1.1, o.jeans ? .85 : .4, 'stroke-dasharray="3.5 2.5"');
      }
    }
    if (!costas && o.bolsoFrente !== false) {
      const bf = `M${cx - ww - 4} ${wy + 40} C${cx - ww + 10} ${wy + 42} ${cx - ww + 28} ${wy + 38} ${cx - ww + 32} ${wy + 20}`;
      const lb = tr(bf, '#000', 2.4, .28) + (o.jeans ? tr(`M${cx - ww - 4} ${wy + 44} C${cx - ww + 12} ${wy + 46} ${cx - ww + 32} ${wy + 42} ${cx - ww + 36} ${wy + 20}`, c.c, 1.1, .85, 'stroke-dasharray="3.5 2.5"') : '');
      s += lb + espelho(lb);
    }
    if (costas) {
      for (const k of [-1, 1]) {
        const x = cx + k * 38;
        s += camada(p(`M${x - 24} ${wy + 42} h48 v40 l-24 12 l-24 -12 Z`, esc(a, .05)));
        if (o.jeans) s += tr(`M${x - 21} ${wy + 46} h42 v34 l-21 10 l-21 -10 Z`, c.c, 1.1, .85, 'stroke-dasharray="3.5 2.5"');
      }
    }
    return svg('0 0 400 460', s, o.classe);
  }

  function saia(c, o = {}, vista) {
    const cx = 200, wy = 72, ww = 60, fim = o.hy || 372, bw = o.boca || 118;
    const id = novoId('sa');
    let s = barraPregadores(50, cx - 50, cx + 50) + tr(`M${cx - 44} 60 V50 M${cx + 44} 60 V50`, '#8d92a3', 3) + pregador(cx - 44, 70) + pregador(cx + 44, 70);
    const d = `M${cx - ww} ${wy} L${cx + ww} ${wy} C${cx + ww + 20} ${wy + 90} ${cx + bw - 6} ${fim - 80} ${cx + bw} ${fim} Q${cx + bw * .75} ${fim + 11} ${cx + bw / 2} ${fim + 3} Q${cx + bw / 4} ${fim + 11} ${cx} ${fim + 3} Q${cx - bw / 4} ${fim + 11} ${cx - bw / 2} ${fim + 3} Q${cx - bw * .75} ${fim + 11} ${cx - bw} ${fim} C${cx - bw + 6} ${fim - 80} ${cx - ww - 20} ${wy + 90} ${cx - ww} ${wy} Z`;
    let base = p(d, c.a) + p(d, 'url(#s-h)') + p(d, 'url(#s-v)');
    s += mat('malha', base) + clip(id, `<path d="${d}"/>`);
    let g = '';
    const n = o.plissado ? 22 : 7;
    for (let i = 1; i < n; i++) {
      const t = i / n, xa = cx - ww + 2 * ww * t, xb = cx - bw + 2 * bw * t;
      const q = `M${xa} ${wy + 18} Q${(xa + xb) / 2 + (t - .5) * 16} ${(wy + fim) / 2} ${xb} ${fim + 8}`;
      if (o.plissado) {
        const larg = (2 * bw) / n;
        g += tr(q, '#000', larg * .42, .13) + `<g transform="translate(${larg * .45} 0)">${tr(q, '#fff', larg * .22, .15)}</g>` + tr(q, '#000', 1, .32);
      }
    }
    if (!o.plissado) g += dobras(Array.from({ length: 6 }, (_, i) => { const t = (i + 1) / 7, xa = cx - ww + 2 * ww * t, xb = cx - bw + 2 * bw * t; return [`M${xa} ${wy + 26} Q${(xa + xb) / 2} ${(wy + fim) / 2} ${xb} ${fim}`, 8]; }), c.a);
    s += envolver(id, g);
    s += camada(p(`M${cx - ww} ${wy - 7} H${cx + ww} L${cx + ww + 3} ${wy + 20} H${cx - ww - 3} Z`, c.b));
    s += costura(`M${cx - ww + 2} ${wy - 3} H${cx + ww - 2}`, c.b, .4) + costura(`M${cx - ww} ${wy + 16} H${cx + ww}`, c.b, .4);
    if (vista !== 'costas') s += pena(cx - 10, wy + 40, 1, c.c);
    return svg('0 0 400 460', s, o.classe);
  }

  function vestido(c, o = {}, vista) {
    const cx = 200, costas = vista === 'costas';
    const hy = o.hy || 430, bw = o.boca || 122, ww = 46, wy = 186;
    const id = novoId('v');
    let s = cabide();
    s += tr(`M${cx - 54} 66 C${cx - 52} 84 ${cx - 50} 100 ${cx - 46} 120`, esc(c.a, .1), 7) + tr(`M${cx + 54} 66 C${cx + 52} 84 ${cx + 50} 100 ${cx + 46} 120`, esc(c.a, .1), 7);
    const corpo = `M${cx - 66} 112 C${cx - 40} ${costas ? 104 : 140} ${cx + 40} ${costas ? 104 : 140} ${cx + 66} 112 C${cx + 62} 138 ${cx + ww + 8} 164 ${cx + ww + 6} ${wy} C${cx + ww + 26} ${wy + 90} ${cx + bw - 6} ${hy - 80} ${cx + bw} ${hy} Q${cx + bw * .5} ${hy + 15} ${cx} ${hy + 6} Q${cx - bw * .5} ${hy + 15} ${cx - bw} ${hy} C${cx - bw + 6} ${hy - 80} ${cx - ww - 26} ${wy + 90} ${cx - ww - 6} ${wy} C${cx - ww - 8} 164 ${cx - 62} 138 ${cx - 66} 112 Z`;
    s += mat('malha', p(corpo, c.a) + p(corpo, 'url(#s-h)') + p(corpo, 'url(#s-v)'));
    s += clip(id, `<path d="${corpo}"/>`);
    let g = '';
    if (o.estampa) {
      for (let i = 0; i < 44; i++) {
        const x = cx - 128 + (i * 61) % 256, y = 124 + (i * 47) % 310;
        g += `<g transform="translate(${x} ${y}) rotate(${(i * 53) % 360}) scale(.58)"><path d="${PENA}" fill="${i % 3 === 0 ? c.c : i % 3 === 1 ? c.b : cla(c.a, .5)}"/></g>`;
      }
    }
    const pregas = [];
    for (let i = 1; i < 7; i++) {
      const t = i / 7, xa = cx - ww + 2 * ww * t, xb = cx - bw + 2 * bw * t;
      pregas.push([`M${xa} ${wy + 14} Q${(xa + xb) / 2 + (t - .5) * 10} ${(wy + hy) / 2} ${xb} ${hy + 6}`, 9, 1.1]);
    }
    pregas.push([`M${cx - 38} 150 C${cx - 26} 166 ${cx - 18} 176 ${cx - 14} ${wy}`, 5, .5], [`M${cx + 38} 150 C${cx + 26} 166 ${cx + 18} 176 ${cx + 14} ${wy}`, 5, .5]);
    s += envolver(id, g) + dobras(pregas, c.a, id);
    s += camada(p(`M${cx - ww - 7} ${wy - 5} Q${cx} ${wy - 1} ${cx + ww + 7} ${wy - 5} L${cx + ww + 8} ${wy + 9} Q${cx} ${wy + 13} ${cx - ww - 8} ${wy + 9} Z`, o.estampa ? c.b : esc(c.a, .12)));
    s += tr(`M${cx - 66} 112 C${cx - 40} ${costas ? 104 : 140} ${cx + 40} ${costas ? 104 : 140} ${cx + 66} 112`, esc(c.a, .22), 2.4);
    return svg('0 0 400 460', s, o.classe);
  }

  /* ---------- ROUPA ÍNTIMA ---------- */
  const cintura = (cx, y, w, h, cor, cc) => camada(ret(cx - w, y, 2 * w, h, cor, 3)) + ret(cx - w, y, 2 * w, h, 'url(#p-canelado)', 3) +
    `<text x="${cx}" y="${y + h * .68}" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="800" font-size="${h * .42}" letter-spacing="${h * .22}" fill="${cc}">HYPEX</text>`;

  function cueca(c, o = {}, vista) {
    const cx = 200, wy = 104, ww = 92, slip = o.corte === 'slip';
    const id = novoId('c');
    let s = barraPregadores(62, cx - 76, cx + 76) + tr(`M${cx - 70} 62 V${wy - 12} M${cx + 70} 62 V${wy - 12}`, '#8d92a3', 2.6);
    const fim = slip ? wy + 138 : (o.corte === 'longa' ? wy + 282 : wy + 220);
    const d = slip
      ? `M${cx - ww} ${wy + 26} L${cx + ww} ${wy + 26} L${cx + ww + 2} ${wy + 66} C${cx + 60} ${wy + 82} ${cx + 30} ${wy + 118} ${cx + 24} ${fim} Q${cx} ${fim + 5} ${cx - 24} ${fim} C${cx - 30} ${wy + 118} ${cx - 60} ${wy + 82} ${cx - ww - 2} ${wy + 66} Z`
      : `M${cx - ww} ${wy + 26} L${cx + ww} ${wy + 26} C${cx + ww + 10} ${wy + 92} ${cx + ww + 16} ${fim - 50} ${cx + ww + 18} ${fim} Q${cx + 58} ${fim + 9} ${cx + 12} ${fim + 2} C${cx + 8} ${fim - 40} ${cx + 3} ${wy + 148} ${cx} ${wy + 128} C${cx - 3} ${wy + 148} ${cx - 8} ${fim - 40} ${cx - 12} ${fim + 2} Q${cx - 58} ${fim + 9} ${cx - ww - 18} ${fim} C${cx - ww - 16} ${fim - 50} ${cx - ww - 10} ${wy + 92} ${cx - ww} ${wy + 26} Z`;
    let base = p(d, c.a) + p(d, 'url(#s-h)');
    s += clip(id, `<path d="${d}"/>`);
    if (o.listras) base += envolver(id, Array.from({ length: 10 }, (_, i) => ret(84 + i * 26, wy + 20, 9, 300, c.b)).join(''));
    s += mat('malha', base);
    const f = [[`M${cx - 8} ${wy + 118} C${cx - 28} ${wy + 132} ${cx - 54} ${wy + 132} ${cx - 76} ${wy + 118}`, 6, .8], [`M${cx + 8} ${wy + 118} C${cx + 28} ${wy + 132} ${cx + 54} ${wy + 132} ${cx + 76} ${wy + 118}`, 6, .8]];
    if (!slip) f.push([`M${cx - 72} ${fim - 54} C${cx - 58} ${fim - 34} ${cx - 44} ${fim - 34} ${cx - 26} ${fim - 48}`, 6, .6], [`M${cx + 72} ${fim - 46} C${cx + 58} ${fim - 28} ${cx + 44} ${fim - 28} ${cx + 26} ${fim - 40}`, 6, .6]);
    s += dobras(f, c.a, id);
    if (vista !== 'costas' && !slip) {
      s += costura(`M${cx - 30} ${wy + 30} Q${cx - 26} ${wy + 90} ${cx - 2} ${wy + 124} Q${cx + 2} ${wy + 90} ${cx + 30} ${wy + 30}`, c.a, .45);
      s += recorte(`M${cx} ${wy + 32} V${wy + 96}`, .22);
    }
    if (!slip) s += costura(`M${cx - ww - 16} ${fim - 10} Q${cx - 58} ${fim - 2} ${cx - 13} ${fim - 7}`, c.a, .42) + costura(`M${cx + ww + 16} ${fim - 10} Q${cx + 58} ${fim - 2} ${cx + 13} ${fim - 7}`, c.a, .42);
    else s += tr(`M${cx - ww - 1} ${wy + 66} C${cx - 60} ${wy + 82} ${cx - 30} ${wy + 118} ${cx - 24} ${fim}`, c.b, 4) + tr(`M${cx + ww + 1} ${wy + 66} C${cx + 60} ${wy + 82} ${cx + 30} ${wy + 118} ${cx + 24} ${fim}`, c.b, 4);
    s += cintura(cx, wy - 8, ww + 2, 36, c.b, c.c);
    s += pregador(cx - 70, wy - 6) + pregador(cx + 70, wy - 6);
    return svg('0 0 400 460', s, o.classe);
  }

  function calcinha(c, o = {}) {
    const cx = 200, wy = 124, ww = 92, alta = o.corte === 'alta';
    const id = novoId('ca');
    let s = barraPregadores(62, cx - 76, cx + 76) + tr(`M${cx - 70} 62 V${wy - 12} M${cx + 70} 62 V${wy - 12}`, '#8d92a3', 2.6);
    const topo = alta ? wy - 2 : wy + 6, fim = wy + 186, lado = alta ? 92 : 46;
    const d = `M${cx - ww} ${topo} L${cx + ww} ${topo} L${cx + ww + 2} ${topo + lado} C${cx + 62} ${topo + lado + 22} ${cx + 32} ${fim - 42} ${cx + 25} ${fim} Q${cx} ${fim + 6} ${cx - 25} ${fim} C${cx - 32} ${fim - 42} ${cx - 62} ${topo + lado + 22} ${cx - ww - 2} ${topo + lado} Z`;
    s += mat('malha', p(d, c.a) + p(d, 'url(#s-h)')) + clip(id, `<path d="${d}"/>`);
    s += dobras([[`M${cx - 18} ${fim - 22} C${cx - 28} ${fim - 54} ${cx - 44} ${topo + lado + 16} ${cx - 62} ${topo + lado + 2}`, 6, .7], [`M${cx + 18} ${fim - 22} C${cx + 28} ${fim - 54} ${cx + 44} ${topo + lado + 16} ${cx + 62} ${topo + lado + 2}`, 6, .7]], c.a, id);
    s += tr(`M${cx - ww - 1} ${topo + lado} C${cx - 62} ${topo + lado + 22} ${cx - 32} ${fim - 42} ${cx - 25} ${fim}`, c.b, 4.5) + tr(`M${cx + ww + 1} ${topo + lado} C${cx + 62} ${topo + lado + 22} ${cx + 32} ${fim - 42} ${cx + 25} ${fim}`, c.b, 4.5);
    s += camada(ret(cx - ww - 2, topo - 10, 2 * ww + 4, 20, c.b, 2)) + ret(cx - ww - 2, topo - 10, 2 * ww + 4, 20, 'url(#p-canelado)', 2);
    s += pena(cx - 10, topo + 28, .9, c.c);
    s += pregador(cx - 70, topo - 2) + pregador(cx + 70, topo - 2);
    return svg('0 0 400 460', s, o.classe);
  }

  function sutia(c, o = {}) {
    const cx = 200, y = 158;
    let s = gancho() + tr(`M200 58 L118 88 M200 58 L282 88`, '#c98f55', 8);
    const al = tr(`M${cx - 64} ${y - 36} C${cx - 72} ${y - 60} ${cx - 76} ${y - 72} ${cx - 76} 86`, esc(c.b, .15), 6.5);
    s += al + espelho(al);
    const conchaE = `M${cx - 3} ${y + 60} C${cx - 8} ${y + 10} ${cx - 42} ${y - 42} ${cx - 66} ${y - 42} C${cx - 98} ${y - 18} ${cx - 118} ${y + 22} ${cx - 120} ${y + 58} C${cx - 88} ${y + 78} ${cx - 34} ${y + 80} ${cx - 3} ${y + 60} Z`;
    s += mat('malha', p(conchaE, c.a) + espelho(p(conchaE, c.a)));
    const det = `<g filter="url(#f-dobra)">${elip(cx - 70, y + 16, 26, 28, '#fff', 'opacity=".22"')}</g>` + costura(`M${cx - 66} ${y - 40} C${cx - 76} ${y - 6} ${cx - 74} ${y + 34} ${cx - 62} ${y + 72}`, c.a, .4) + costura(`M${cx - 8} ${y + 54} C${cx - 36} ${y + 72} ${cx - 86} ${y + 70} ${cx - 116} ${y + 54}`, c.a, .4);
    s += det + espelho(det);
    s += camada(p(`M${cx - 122} ${y + 58} C${cx - 86} ${y + 78} ${cx - 34} ${y + 82} ${cx} ${y + 62} C${cx + 34} ${y + 82} ${cx + 86} ${y + 78} ${cx + 122} ${y + 58} L${cx + 124} ${y + 84} C${cx + 80} ${y + 106} ${cx - 80} ${y + 106} ${cx - 124} ${y + 84} Z`, c.b));
    s += `<g opacity=".9">${p(`M${cx - 122} ${y + 58} C${cx - 86} ${y + 78} ${cx - 34} ${y + 82} ${cx} ${y + 62} C${cx + 34} ${y + 82} ${cx + 86} ${y + 78} ${cx + 122} ${y + 58} L${cx + 124} ${y + 84} C${cx + 80} ${y + 106} ${cx - 80} ${y + 106} ${cx - 124} ${y + 84} Z`, 'url(#p-canelado)')}</g>`;
    s += pena(cx - 10, y + 70, .8, c.c);
    return svg('0 0 400 460', s, o.classe);
  }

  /* ---------- MEIAS ---------- */
  function meia(c, o = {}) {
    const t = o.cano === 'soquete' ? 186 : (o.cano === 'medio' ? 128 : 70);
    const forma = `M112 ${t} L204 ${t} C205 ${t + 60} 204 210 206 258 C208 282 236 294 276 304 C326 316 354 340 342 368 C333 387 304 392 268 386 L166 368 C126 362 106 330 108 292 C109 ${t + 80} 111 ${t + 40} 112 ${t} Z`;
    const uma = (a, b, cc, trans) => {
      const id = novoId('mi');
      let dentro = p(forma, a) + p(forma, 'url(#s-h)');
      if (o.felpa) dentro += p(forma, 'url(#p-tricot)');
      let det = p('M98 296 C112 342 140 374 182 378 C190 340 166 300 112 274 Z', b);
      det += p('M302 298 L364 298 L364 402 L288 402 C304 372 314 340 302 298 Z', b);
      if (o.listras) for (let i = 0; i < o.listras; i++) det += ret(90, t + 58 + i * 24, 140, 11, i % 2 ? cc : b);
      if (o.bolinhas) for (let y = t + 64; y < 272; y += 24) for (let x = 122; x < 204; x += 24) det += circ(x + (y % 48 ? 10 : 0), y, 5.5, cc);
      let g = `<g transform="${trans}">` + clip(id, `<path d="${forma}"/>`);
      g += mat(o.felpa ? 'couro' : 'malha', dentro + envolver(id, det));
      g += dobras([[`M112 ${Math.max(t + 70, 226)} C138 ${Math.max(t + 84, 240)} 176 ${Math.max(t + 80, 238)} 204 ${Math.max(t + 66, 226)}`, 7, .7], ['M208 270 C232 276 250 288 262 310', 7, .55], [`M116 ${t + 60} C140 ${t + 66} 176 ${t + 66} 202 ${t + 58}`, 5, .35]], a, id);
      const pu = `M108 ${t - 2} Q158 ${t + 3} 208 ${t - 2} L207 ${t + 46} Q158 ${t + 50} 107 ${t + 46} Z`;
      g += mat('malha', p(pu, esc(a, .05))) + p(pu, 'url(#p-canelado)');
      g += recorte(`M107 ${t + 46} Q158 ${t + 50} 207 ${t + 46}`, .22);
      if (o.faixa) g += ret(107, t + 14, 100, 10, cc);
      return g + '</g>';
    };
    let s = tr(`M158 ${t - 20} L158 44 C158 30 176 28 176 14 C176 2 158 -1 150 8`, '#8d92a3', 3.6);
    s += uma(esc(c.a, .08), esc(c.b, .08), esc(c.c, .08), 'translate(44 -12)');
    s += pregador(158, t - 6);
    s += uma(c.a, c.b, c.c, 'translate(-22 8)');
    return svg('0 0 400 460', s, o.classe);
  }

  /* ---------- TÊNIS ---------- */
  const CAB_BAIXO = 'M70 238 C60 208 58 172 68 138 C72 124 70 110 74 98 C76 89 89 87 95 94 C112 116 150 122 182 104 C190 98 198 90 208 88 C236 116 276 148 322 168 C366 182 414 188 434 214 C442 224 444 234 438 242 L70 242 Z';
  const CAB_ALTO = 'M70 238 C60 188 60 118 72 56 C74 46 84 43 94 43 C126 39 160 41 190 47 C197 48 199 54 199 60 C199 72 202 80 208 88 C236 116 276 148 322 168 C366 182 414 188 434 214 C442 224 444 234 438 242 L70 242 Z';

  function solaTenis(sola, c, o) {
    const m = o.corSola || '#f4f2ea', ext = o.corExt || c.c;
    let s = '';
    if (sola === 'lisa') {
      const d = 'M54 228 C150 232 300 232 442 224 C454 230 456 248 448 258 C438 270 412 274 380 274 L78 274 C56 274 46 250 54 228 Z';
      s += p('M66 268 L414 268 C430 272 424 284 400 284 L88 284 C72 284 62 278 66 268 Z', ext);
      s += mat('solido', p(d, m));
      s += tr('M58 244 C160 248 300 248 448 240', '#000', 1.2, .18);
      s += tr('M58 234 C160 238 300 238 444 230', '#000', 1, .4, 'stroke-dasharray="3 3.5"');
    } else if (sola === 'ar') {
      const d = 'M52 226 C150 232 300 230 442 222 C456 228 456 248 446 260 C430 274 400 278 360 278 L270 276 L270 256 L78 256 C54 252 44 240 52 226 Z';
      s += p('M64 272 L278 272 L278 286 L86 286 C72 286 62 282 64 272 Z', ext);
      s += p('M270 272 L400 276 C428 276 442 268 448 258 C442 276 416 288 370 288 L270 286 Z', ext);
      s += p('M68 244 H270 V276 H68 Z', esc(m, .55));
      s += mat('solido', p(d, m));
      for (const x of [72, 170]) {
        s += `<rect x="${x}" y="250" width="94" height="30" rx="15" fill="${cla(c.b, .35)}" fill-opacity=".92"/>`;
        s += `<rect x="${x}" y="250" width="94" height="30" rx="15" fill="url(#s-vidro)" stroke="${esc(c.b, .25)}" stroke-width="1.6"/>`;
        s += ret(x + 12, 254, 58, 4, '#fff', 2, 'opacity=".92"') + ret(x + 22, 272, 38, 2.4, '#fff', 1.2, 'opacity=".5"');
      }
      s += tr('M56 238 C150 244 300 242 448 234', '#000', 1, .16);
    } else if (sola === 'chunky') {
      const d = 'M50 220 C90 234 120 218 170 224 C220 232 260 216 320 222 C370 228 410 212 446 220 C458 234 456 252 446 262 L62 262 C46 254 42 236 50 220 Z';
      s += mat('solido', p('M58 258 L446 258 C446 276 432 286 412 286 L88 286 C70 286 58 274 58 258 Z', ext));
      for (let x = 74; x < 426; x += 40) s += p(`M${x} 276 h26 l-3 10 h-20 Z`, esc(ext, .3));
      s += mat('solido', p(d, m));
      s += `<g filter="url(#f-dobra)">${tr('M70 242 C120 256 180 236 240 246 C300 256 370 236 438 240', '#000', 6, .28)}</g>`;
      for (let x = 86; x < 430; x += 42) s += ret(x, 240, 22, 13, '#000', 6, 'opacity=".12"');
    } else if (sola === 'onda') {
      const d = 'M52 228 C150 234 300 232 442 224 C456 234 454 254 444 264 L420 282 L72 282 C50 268 44 248 52 228 Z';
      const id = novoId('on');
      s += clip(id, `<path d="${d}"/>`);
      s += mat('solido', p(d, m));
      let g = '';
      for (let i = 0; i < 18; i++) {
        const x = 54 + i * 23;
        g += tr(`M${x + 10} 236 C${x - 4} 252 ${x + 14} 268 ${x - 2} 288`, ext, 9) + tr(`M${x + 7} 236 C${x - 7} 252 ${x + 11} 268 ${x - 5} 288`, '#fff', 1.6, .4);
      }
      s += envolver(id, g);
    } else if (sola === 'trilha') {
      const d = 'M52 228 C150 232 300 232 442 224 C454 232 454 250 444 258 L66 258 C50 254 46 242 52 228 Z';
      let t = 'M60 256 ';
      for (let x = 60; x < 438; x += 36) t += `L${x + 5} 284 L${x + 25} 284 L${x + 32} 260 `;
      s += mat('solido', p(t + 'L446 256 Z', ext));
      s += mat('solido', p(d, m));
      s += tr('M60 244 C160 246 300 246 446 240', ext, 3);
    } else if (sola === 'fina') {
      const d = 'M52 226 C150 232 300 234 442 228 C450 236 450 254 440 262 L300 268 L70 272 C52 262 46 244 52 226 Z';
      s += p('M62 268 L300 264 L438 258 C434 274 424 280 408 280 L80 284 C68 284 62 278 62 268 Z', ext);
      s += mat('solido', p(d, o.corSola || cla(c.a, .6)));
    } else if (sola === 'crepe') {
      const d = 'M52 226 L442 224 C452 234 450 268 440 280 L66 282 C50 270 46 244 52 226 Z';
      s += mat('couro', p(d, o.corSola || '#b98d56'));
      s += p('M51 232 L444 230 L446 240 L50 242 Z', ext);
      for (let x = 64; x < 438; x += 9) s += circ(x, 268 + (x % 18 ? 3 : 0), 1.6, '#000', 'opacity=".2"');
    }
    return s;
  }

  function tenis(c, o = {}, vista) {
    const alto = o.alto, sola = o.sola || 'lisa', est = o.estilo || 'run';
    const cabedal = alto ? CAB_ALTO : CAB_BAIXO;
    const id = novoId('s');
    const material = { run: 'malha', tricot: 'malha', retro: 'malha', pilar: 'malha', trilha: 'malha' }[est] || 'couro';
    const cadarco = o.cadarco || (lum(c.b) > .6 ? cla(c.b, .55) : (lum(c.a) > .7 ? '#3a3850' : '#f5f3ec'));
    let s = '';

    /* língua */
    if (est !== 'slip' && est !== 'tricot') {
      const lg = alto ? 'M186 56 C190 30 212 20 232 28 C240 32 244 42 244 54 L258 112 L212 112 Z' : 'M190 104 C192 80 206 62 228 60 C240 60 248 70 250 82 L258 116 L214 114 Z';
      s += mat('malha', p(lg, esc(c.b, .03)));
      s += alto ? ret(203, 34, 26, 15, c.c, 2, 'transform="rotate(-6 216 41)"') : ret(208, 68, 24, 13, c.c, 2, 'transform="rotate(-10 220 74)"');
    }
    /* forro do colarinho */
    s += alto
      ? p('M78 56 C110 42 160 42 196 54 L194 66 C160 58 110 58 80 70 Z', esc(c.a, .68))
      : p('M90 92 C112 100 170 94 208 84 L208 92 C198 92 190 100 182 106 C150 124 112 118 92 96 Z', esc(c.a, .68));

    /* cabedal */
    let base = p(cabedal, c.a) + p(cabedal, 'url(#s-v)');
    if (est === 'tricot') base += p(cabedal, 'url(#p-tricot)');
    s += clip(id, `<path d="${cabedal}"/>`);
    s += mat(material, base);

    let pn = '', sobre = '';
    if (est === 'run') {
      sobre += p('M178 240 C196 186 250 152 312 164 L300 244 Z', 'url(#p-tela)');
      pn += p('M308 160 C352 172 412 190 444 222 L446 248 L262 248 C270 214 284 182 308 160 Z', c.b);
      pn += p('M40 250 L40 118 C76 122 124 158 142 250 Z', c.b);
      pn += tr('M62 150 C78 148 92 150 106 158', c.c, 7);
      sobre += tr('M136 232 C172 190 226 170 292 178', c.c, 12) + tr('M172 240 C200 212 238 198 286 200', c.c, 6);
      sobre += costura('M314 170 C292 188 276 214 268 244', c.b, .45) + costura('M134 244 C118 168 78 130 46 124', c.b, .45);
    }
    if (est === 'quadra') {
      pn += p('M332 166 C380 182 424 192 444 224 L446 248 L298 248 C302 214 314 186 332 166 Z', cla(c.a, .1));
      pn += p('M40 256 L40 90 C78 100 106 150 116 256 Z', c.b);
      pn += p('M136 244 C150 200 196 170 262 152 L290 174 C234 190 198 214 180 244 Z', c.c);
      if (alto) pn += p('M56 40 L128 38 L134 104 L60 108 Z', c.b);
      else pn += p('M60 90 L100 84 C112 104 118 112 124 118 L76 134 Z', c.b);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) sobre += circ(352 + i * 12 + j * 4, 198 + j * 11 + i * 2, 1.7, '#000', 'opacity=".42"');
      sobre += costura('M338 172 C320 192 310 216 306 244', c.a, .42) + costura('M110 244 C102 170 76 118 46 100', c.b, .45);
    }
    if (est === 'bolha') {
      pn += p('M40 250 L446 250 L446 212 C390 176 330 158 262 112 C200 122 90 134 40 124 Z', esc(c.a, .1));
    }
    if (est === 'retro') {
      sobre += p('M170 200 C200 160 250 140 300 156 L320 244 L170 244 Z', 'url(#p-tela)');
      pn += p('M284 152 C340 170 412 186 446 224 L446 248 L322 248 C338 214 320 178 284 152 Z', c.b);
      pn += p('M40 256 L40 120 C78 122 106 172 112 256 Z', c.b);
      pn += p('M126 244 L232 142 L262 158 L180 244 Z', c.c) + p('M194 244 L272 168 L288 176 L220 244 Z', c.c);
      sobre += costura('M292 160 C326 180 344 214 328 244', c.b, .45);
    }
    if (est === 'pilar') {
      pn += p('M40 256 L40 36 L122 36 C126 110 136 180 152 256 Z', c.b);
      pn += p('M304 156 C352 172 416 186 446 224 L446 248 L282 248 C284 210 290 180 304 156 Z', cla(c.b, .1));
      sobre += tr('M152 242 C168 194 212 160 272 150', c.c, 9) + costura('M146 244 C132 180 124 110 118 42', c.b, .45);
      sobre += camada(ret(70, 66, 44, 26, c.c, 3)) + pena(82, 74, .62, contra(c.c));
      for (let y = 112; y < 200; y += 22) sobre += circ(94, y, 2, '#000', 'opacity=".3"');
    }
    if (est === 'slip') {
      pn += p('M304 150 C352 170 420 190 446 224 L446 248 L268 248 C270 206 282 174 304 150 Z', c.b);
      sobre += `<g filter="url(#f-dobra)">${tr('M322 176 C362 186 402 198 430 222', '#fff', 8, .75)}</g>`;
      pn += p('M204 88 L292 142 L268 188 C232 158 198 138 172 130 C178 112 190 96 204 88 Z', esc(c.a, .26));
      for (let i = 0; i < 10; i++) sobre += tr(`M${208 + i * 9} ${94 + i * 5.2} L${182 + i * 9} ${140 + i * 5}`, '#000', 1.2, .24);
      sobre += costura('M60 200 C110 190 170 200 262 236', c.a, .35);
    }
    if (est === 'tricot') {
      for (let i = 0; i < 12; i++) sobre += tr(`M${36 + i * 6} 262 C${86 + i * 18} ${200 - i * 2} ${176 + i * 16} ${150 + i * 2} ${256 + i * 20} ${120 + i * 9}`, c.b, 3.4, .92);
      pn += p('M58 30 H226 L214 106 C180 132 126 136 96 112 L62 108 Z', c.c);
      sobre += p('M58 30 H226 L214 106 C180 132 126 136 96 112 L62 108 Z', 'url(#p-canelado)');
    }
    if (est === 'chunky') {
      pn += p('M284 150 C340 170 412 186 446 224 L446 248 L250 248 C252 206 264 174 284 150 Z', c.b);
      pn += p('M40 256 L40 112 C84 120 138 170 152 256 Z', c.c);
      pn += p('M138 248 C150 192 200 172 258 178 C252 202 246 224 246 248 Z', cla(c.a, .42));
      pn += p('M208 96 L304 158 C282 172 264 192 256 216 L172 128 C180 114 192 102 208 96 Z', c.b);
      sobre += costura('M300 164 C276 180 258 200 250 224', c.b, .45) + costura('M144 244 C154 196 202 178 252 182', c.a, .4);
      sobre += `<g transform="translate(164 196)">${tr('M0 34 L40 -2 M18 40 L56 8', c.c, 6)}</g>`;
    }
    if (est === 'trilha') {
      pn += p('M322 164 C378 182 426 192 446 224 L446 248 L270 248 C288 218 302 190 322 164 Z', c.b);
      pn += p('M40 256 L40 112 C84 126 120 182 126 256 Z', c.b);
      pn += p('M124 248 C170 216 240 202 302 208 L288 248 Z', esc(c.a, .36));
      sobre += tr('M136 184 L206 138 M152 202 L234 152', c.c, 5);
      sobre += costura('M330 172 C304 200 292 222 280 244', c.b, .45);
    }
    if (est === 'couro') {
      pn += p('M40 256 L40 108 C92 112 114 182 122 256 Z', c.b);
      sobre += recorte('M210 92 C196 150 190 196 192 242', .2);
      sobre += costura('M216 96 C204 150 198 196 200 242', c.a, .4) + costura('M112 244 C104 180 86 134 46 114', c.b, .45);
      sobre += recorte('M342 172 C324 194 318 216 318 242', .2) + costura('M348 176 C330 196 324 218 324 242', c.a, .35);
    }
    s += envolver(id, (pn ? camada(pn) : '') + sobre);

    /* gomos do modelo Bolha ficam por cima, com volume próprio */
    if (est === 'bolha') {
      const gomos = [[112, 198, 42, 28, -8], [176, 216, 36, 22, 2], [150, 160, 30, 18, -24], [226, 186, 34, 19, -22], [272, 216, 36, 19, -6], [334, 216, 32, 16, 6], [290, 176, 21, 11, 24], [388, 222, 26, 12, 12]];
      let g = '';
      gomos.forEach(q => { g += `<g transform="translate(${q[0]} ${q[1]}) rotate(${q[4]})">${elip(0, 0, q[2], q[3], c.a)}</g>`; });
      s += envolver(id, mat('nylon', g));
      for (let x = 344; x < 424; x += 8) for (let y = 188; y < 206; y += 7) s += circ(x + (y % 14 ? 3 : 0), y, 1.5, c.b);
    }

    /* colarinho acolchoado */
    if (!alto && est !== 'tricot') {
      s += mat('couro', tr('M95 96 C112 118 150 124 183 106 C190 100 198 94 207 91', o.corColarinho || esc(c.a, .14), 9));
      s += mat('couro', p('M72 104 C72 92 92 84 97 96 L88 116 L72 122 Z', o.corTab || c.c));
    } else if (alto) {
      s += mat('couro', tr('M76 56 C110 44 160 44 196 54', esc(c.b, .1), 10));
    }

    /* passante de calcanhar */
    if (est === 'tricot') s += tr('M82 76 C76 58 92 50 100 62', c.c, 6);

    /* ilhós e cadarço */
    if (est !== 'slip' && est !== 'tricot') {
      const ey = alto
        ? 'M196 46 L222 98 L338 172 L322 194 L204 124 L172 58 Z'
        : 'M207 88 L222 98 L338 172 L322 194 L196 118 C198 106 202 96 207 88 Z';
      s += camada(p(ey, est === 'bolha' || est === 'chunky' ? c.b : esc(c.a, lum(c.a) > .7 ? .12 : .22)));
      s += costura(alto ? 'M170 62 L202 128 L318 198' : 'M194 120 L318 196', c.a, .3);
      const n = alto ? 8 : 6, ini = alto ? 0 : .3;
      for (let i = 0; i < n; i++) {
        const k = ini + (1 - ini) * i / (n - 1);
        const x = 194 + 132 * k, y = 58 + 108 * k;
        const ex = x - 7, ey2 = y + 10;
        s += tr(`M${ex + 1} ${ey2 + 1} L${x + 10} ${y - 10}`, '#000', 5.6, .28);
        s += tr(`M${ex} ${ey2} L${x + 9} ${y - 11}`, cadarco, 4.6);
        s += circ(ex, ey2, 2.6, 'url(#s-metal)') + circ(ex, ey2, 1.1, '#14112b');
      }
      /* laço */
      const lx = alto ? 186 : 222, ly = alto ? 42 : 90;
      s += tr(`M${lx} ${ly} C${lx - 18} ${ly - 18} ${lx - 34} ${ly - 8} ${lx - 24} ${ly + 4} C${lx - 18} ${ly + 10} ${lx - 6} ${ly + 6} ${lx} ${ly}`, cadarco, 3.2);
      s += tr(`M${lx} ${ly} C${lx + 18} ${ly - 20} ${lx + 34} ${ly - 12} ${lx + 26} ${ly + 2} C${lx + 20} ${ly + 8} ${lx + 8} ${ly + 6} ${lx} ${ly}`, cadarco, 3.2);
      s += tr(`M${lx} ${ly} C${lx - 6} ${ly + 16} ${lx - 14} ${ly + 22} ${lx - 22} ${ly + 30}`, cadarco, 3.2);
      s += circ(lx, ly, 3.6, cadarco);
    }
    if (est === 'pilar' && o.tira) s += camada(ret(150, 86, 88, 24, c.c, 4, 'transform="rotate(30 194 98)"')) + ret(186, 92, 16, 12, 'url(#s-metal)', 2, 'transform="rotate(30 194 98)"');

    s += solaTenis(sola, c, o);
    return svg('10 18 480 268', s, o.classe, vista === 'costas');
  }

  /* ---------- CHINELOS ---------- */
  function chinelo(c, o = {}) {
    const tipo = o.tipo || 'dedo';
    const sola = 'M0 -128 C44 -128 60 -84 56 -42 C54 -12 42 20 42 62 C42 102 30 128 0 128 C-30 128 -42 102 -42 62 C-42 20 -54 -12 -56 -42 C-60 -84 -44 -128 0 -128 Z';
    const cama = 'M0 -116 C36 -116 50 -80 46 -42 C44 -12 32 22 32 62 C32 96 24 116 0 116 C-24 116 -32 96 -32 62 C-32 22 -44 -12 -46 -42 C-50 -80 -36 -116 0 -116 Z';
    const pe = (x, rot, flip) => {
      const esp = o.espessura || 7, base = o.corBase || c.a;
      const id = novoId('k');
      /* o pé direito é redesenhado invertido, porque filtro dentro de espelhamento perde a luz */
      const fx = d => flip ? inverter(d) : d, sx = v => flip ? -v : v;
      const pSola = fx(sola), pCama = fx(cama);
      let g = `<g transform="translate(${x} 136) rotate(${rot})">`;
      g += `<g filter="url(#f-sombra)" opacity=".35"><path d="${pSola}" fill="#000" transform="translate(7 ${esp + 7})"/></g>`;
      for (let k = esp; k > 0; k -= 2) g += `<g transform="translate(${k * .55} ${k})">${p(pSola, esc(o.corBase ? base : c.b, .12 + (k / esp) * .18))}</g>`;
      g += mat('solido', p(pSola, base));
      g += clip(id, `<path d="${pCama}"/>`);
      g += p(pCama, esc(base, .1));
      let t = `<g filter="url(#f-dobra)">${elip(sx(-2), -68, 28, 34, '#fff', 'opacity=".2"')}${elip(0, 64, 22, 36, '#000', 'opacity=".2"')}</g>`;
      if (o.textura !== false) for (let y = -116; y < 120; y += 12) for (let i = -48; i < 50; i += 12) t += circ(i + (y % 24 ? 6 : 0), y, 1.9, '#000', 'opacity=".14"');
      g += envolver(id, t);
      if (tipo === 'dedo') {
        const fino = o.fina;
        const w = fino ? 7 : 13;
        const a1 = fx('M4 -82 C20 -66 42 -40 53 -12'), a2 = fx('M4 -82 C-12 -66 -36 -40 -50 -12');
        g += `<g filter="url(#f-dobra)" opacity=".5" transform="translate(3 6)">${tr(a1, '#000', w)}${tr(a2, '#000', w)}</g>`;
        g += mat('solido', tr(a1, c.b, w) + tr(a2, c.b, w));
        g += mat('solido', circ(sx(4), -82, fino ? 6 : 8, c.c));
      }
      if (tipo === 'slide') {
        const fa = fx('M-58 -60 C-30 -86 30 -86 58 -60 L52 22 C24 10 -24 10 -50 22 Z');
        g += `<g filter="url(#f-dobra)" opacity=".5" transform="translate(2 8)">${p(fa, '#000')}</g>`;
        g += mat('couro', p(fa, c.b));
        g += costura(fx('M-52 -54 C-28 -76 28 -76 52 -54'), c.b, .45) + costura(fx('M-46 14 C-24 3 24 3 48 14'), c.b, .45);
        g += marcaGrande(sx(-2), -36, 1.5, c.c, c.c);
      }
      if (tipo === 'papete') {
        for (const [y1, y2] of [[-72, -64], [-10, -16], [58, 48]]) {
          const q = `M-54 ${y1} Q0 ${y2 - 16} 54 ${y1}`;
          g += `<g filter="url(#f-dobra)" opacity=".5" transform="translate(2 6)">${tr(q, '#000', 16)}</g>`;
          g += mat('malha', tr(q, c.b, 16)) + costura(`M-50 ${y1 + 6} Q0 ${y2 - 10} 50 ${y1 + 6}`, c.b, .42) + costura(`M-50 ${y1 - 6} Q0 ${y2 - 22} 50 ${y1 - 6}`, c.b, .42);
        }
        g += mat('solido', ret(sx(35) - 11, -42, 22, 15, c.c, 2)) + ret(sx(35) - 6, -38, 12, 7, '#000', 1, 'opacity=".35"');
      }
      return g + '</g>';
    };
    return svg('0 0 480 276', pe(164, -7, false) + pe(324, 7, true), o.classe);
  }

  /* ---------- ACESSÓRIOS ---------- */
  function bone(c, o = {}, vista) {
    const copa = 'M92 202 C80 110 150 62 232 62 C312 62 372 112 374 200 C300 218 170 218 92 202 Z';
    const id = novoId('b');
    let s = '';
    s += `<g filter="url(#f-sombra)" opacity=".4">${p('M186 216 C250 218 330 216 380 208 C414 212 450 232 460 250 C410 242 300 240 204 248 Z', '#000')}</g>`;
    s += clip(id, `<path d="${copa}"/>`);
    s += mat('malha', p(copa, c.a) + p(copa, 'url(#p-sarja)'));
    if (o.tela) s += envolver(id, p('M70 220 C60 120 150 50 232 62 C200 100 188 150 190 216 Z', c.b) + p('M70 220 C60 120 150 50 232 62 C200 100 188 150 190 216 Z', 'url(#p-tela)'));
    s += recorte('M232 62 C200 100 188 150 190 210', .3) + recorte('M232 62 C288 94 308 150 308 212', .3);
    s += costura('M226 66 C196 104 183 150 184 208', c.a, .38) + costura('M238 66 C294 98 314 150 314 210', c.a, .38);
    for (const [cxi, cyi] of [[150, 130], [262, 112]]) s += circ(cxi, cyi, 2.4, esc(c.a, .45));
    s += mat('solido', elip(232, 60, 9, 5.5, c.b));
    /* aba */
    const aba = 'M182 206 C240 210 320 208 376 198 C414 202 454 226 464 246 C410 236 300 234 202 242 C188 234 180 220 182 206 Z';
    s += mat('couro', p(aba, c.b));
    s += costura('M192 216 C260 220 340 216 396 212', c.b, .42) + costura('M202 228 C270 228 350 224 420 224', c.b, .32);
    s += `<g transform="translate(246 122)">${pena(0, 0, 2, c.c)}</g>`;
    return svg('40 40 440 216', s, o.classe, vista === 'costas');
  }
  function bucket(c, o = {}) {
    const copa = 'M146 172 C148 92 182 66 240 66 C298 66 332 92 334 172 C300 192 180 192 146 172 Z';
    const aba = 'M64 240 C104 192 130 172 150 162 L330 162 C350 172 376 192 416 240 C340 270 140 270 64 240 Z';
    let s = mat('malha', p(aba, c.b) + p(aba, 'url(#p-sarja)'));
    for (let i = 0; i < 3; i++) s += costura(`M${90 + i * 9} ${240 - i * 11} C180 ${262 - i * 14} 300 ${262 - i * 14} ${390 - i * 9} ${240 - i * 11}`, c.b, .42);
    s += `<g filter="url(#f-dobra)">${tr('M146 176 C180 196 300 196 334 176', '#000', 9, .45)}</g>`;
    s += mat('malha', p(copa, c.a) + p(copa, 'url(#p-sarja)'));
    s += recorte('M146 172 C180 192 300 192 334 172', .36);
    s += `<g filter="url(#f-dobra)">${tr('M170 120 C180 100 200 86 222 80', '#fff', 7, .38)}</g>`;
    s += recorte('M240 66 V180', .14);
    s += circ(164, 150, 3, 'url(#s-metal)') + circ(316, 150, 3, 'url(#s-metal)');
    s += pena(222, 112, 1.7, c.c);
    return svg('40 40 400 228', s, o.classe);
  }
  function gorro(c, o = {}) {
    const copa = 'M130 202 C124 96 176 60 240 60 C304 60 356 96 350 202 Z';
    const bar = 'M114 190 C176 176 304 176 366 190 L372 268 C300 282 180 282 108 268 Z';
    const id = novoId('g');
    let s = '';
    if (o.pompom) {
      s += mat('couro', circ(240, 48, 31, c.c));
      for (let i = 0; i < 34; i++) { const a = i * 2.4, r = 6 + (i * 13) % 27; s += tr(`M${240 + Math.cos(a) * r} ${48 + Math.sin(a) * r} l${Math.cos(a) * 5} ${Math.sin(a) * 5}`, '#fff', 1.2, .3); }
    }
    s += mat('malha', p(copa, c.a)) + clip(id, `<path d="${copa}"/>`);
    let g = '';
    for (let x = 140; x < 346; x += 12) { const d = `M${x} 198 C${x} 130 ${(x + 240) / 2} 86 ${x * .2 + 240 * .8} 62`; g += tr(d, '#000', 2.4, .16) + `<g transform="translate(5 0)">${tr(d, '#fff', 1.4, .12)}</g>`; }
    s += envolver(id, g);
    s += `<g filter="url(#f-dobra)" clip-path="url(#${id})">${tr('M130 192 C176 178 304 178 350 192', '#000', 9, .45)}</g>`;
    s += mat('malha', p(bar, c.b));
    const idB = novoId('gb');
    s += clip(idB, `<path d="${bar}"/>`);
    let b = '';
    for (let x = 118; x < 368; x += 9) b += tr(`M${x} 184 L${x - 2} 278`, '#000', 2.4, .17) + tr(`M${x + 4} 184 L${x + 2} 278`, '#fff', 1.2, .14);
    s += envolver(idB, b);
    s += camada(ret(212, 212, 56, 30, c.c, 2)) + pena(226, 222, 1, contra(c.c));
    return svg('60 8 360 276', s, o.classe);
  }
  function tote(c, o = {}) {
    const corpo = 'M104 100 H376 L394 284 H86 Z';
    const al = (d, w = 13) => mat('malha', tr(d, c.b, w)) + tr(d, contra(c.b), 1, .35, 'stroke-dasharray="3.5 3"');
    let s = al('M184 112 C176 16 304 16 296 112');
    s += mat('malha', p(corpo, c.a) + p(corpo, 'url(#p-sarja)'));
    const idTo = novoId('tt');
    s += clip(idTo, `<path d="${corpo}"/>`);
    s += dobras([['M130 130 C150 190 136 240 150 284', 8, .8], ['M348 120 C330 180 352 230 336 284', 8, .8], ['M240 120 C232 150 246 170 238 196', 6, .4]], c.a, idTo);
    s += costura('M106 114 H374', c.a, .45) + costura('M105 108 H375', c.a, .32);
    if (o.grafico !== false) s += marcaGrande(240, 204, 2.5, c.c, c.b);
    s += al('M188 142 C184 96 188 74 200 40');
    s += al('M292 142 C296 96 292 74 280 40');
    s += camada(ret(180, 104, 18, 40, c.b, 1) + ret(282, 104, 18, 40, c.b, 1));
    return svg('60 18 360 268', s, o.classe);
  }
  function mochila(c, o = {}) {
    const corpo = 'M136 98 C136 50 180 34 240 34 C300 34 344 50 344 98 L356 266 C356 280 344 284 332 284 H148 C136 284 124 280 124 266 Z';
    const bolso = 'M154 172 H326 L334 262 C334 272 326 276 318 276 H162 C154 276 146 272 146 262 Z';
    let s = mat('couro', tr('M194 52 C194 6 286 6 286 52', esc(c.b, .1), 12));
    s += mat('malha', tr('M124 150 C94 170 90 232 110 266', esc(c.a, .28), 14) + tr('M356 150 C386 170 390 232 370 266', esc(c.a, .28), 14));
    s += mat('nylon', p(corpo, c.a) + p(corpo, 'url(#s-h)'));
    s += tr('M142 112 C190 82 290 82 338 112', esc(c.a, .35), 8) + tr('M142 112 C190 82 290 82 338 112', c.c, 3.4, 1, 'stroke-dasharray="1.6 2.6"');
    s += ret(326, 104, 7, 26, 'url(#s-metal)', 2);
    s += `<g filter="url(#f-dobra)">${tr('M160 60 C190 44 230 42 262 46', '#fff', 8, .35)}</g>`;
    s += camada(p(bolso, c.b));
    s += costura('M158 180 H322', c.b, .4);
    s += tr('M160 192 H320', esc(c.b, .35), 7) + tr('M160 192 H320', c.c, 3, 1, 'stroke-dasharray="1.6 2.6"');
    s += ret(228, 188, 26, 10, 'url(#s-metal)', 2);
    s += pena(222, 216, 1.5, c.c);
    return svg('60 8 360 278', s, o.classe);
  }
  function transversal(c, o = {}) {
    const corpo = 'M112 174 C112 150 130 144 150 144 H330 C350 144 368 150 368 174 V256 C368 276 350 284 330 284 H150 C130 284 112 276 112 256 Z';
    const aba = 'M112 174 C112 150 130 144 150 144 H330 C350 144 368 150 368 174 V194 C330 236 150 236 112 194 Z';
    let s = tr('M132 164 C70 40 410 40 348 164', esc(c.c, .15), 7) + tr('M132 164 C70 40 410 40 348 164', '#fff', 1.2, .3, 'stroke-dasharray="1.5 7"');
    for (const x of [132, 348]) s += `<rect x="${x - 7}" y="150" width="14" height="16" rx="3" fill="none" stroke="url(#s-metal)" stroke-width="3.4"/>`;
    s += mat('couro', p(corpo, c.a));
    s += costura('M122 202 V252 C122 268 138 274 152 274 H328 C342 274 358 268 358 252 V202', c.a, .4);
    s += `<g filter="url(#f-dobra)">${tr('M124 208 C170 244 310 244 356 208', '#000', 9, .42)}</g>`;
    s += camada(p(aba, c.b));
    s += costura('M122 172 C122 158 136 154 152 154 H328 C344 154 358 158 358 172 V190 C322 224 158 224 122 190 Z', c.b, .42);
    s += mat('solido', circ(240, 216, 13, 'url(#s-metal)')) + circ(240, 216, 6, c.c);
    return svg('60 30 360 256', s, o.classe);
  }
  function oculos(c, o = {}) {
    const lente = novoId('lente');
    const red = o.formato === 'redondo';
    const arm = red
      ? ['M90 136 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0', 'M390 136 m-62 0 a62 62 0 1 0 124 0 a62 62 0 1 0 -124 0']
      : ['M28 96 C60 84 122 84 152 96 C162 130 150 190 100 194 C60 194 26 150 28 96 Z', 'M452 96 C420 84 358 84 328 96 C318 130 330 190 380 194 C420 194 454 150 452 96 Z'];
    let s = `<defs><linearGradient id="${lente}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esc(c.b, .2)}"/><stop offset="1" stop-color="${c.c}"/></linearGradient></defs>`;
    s += arm.map(d => `<g filter="url(#f-dobra)" opacity=".35" transform="translate(4 8)">${p(d, '#000')}</g>`).join('');
    s += mat('solido', tr('M152 112 C190 90 290 90 328 112', c.a, 12) + tr('M26 100 L4 90 M454 100 L476 90', c.a, 12));
    arm.forEach(d => {
      const idc = novoId('l');
      s += clip(idc, `<path d="${d}"/>`);
      s += p(d, `url(#${lente})`) + p(d, 'url(#s-lente)');
      s += `<g clip-path="url(#${idc})">${tr('M30 100 L170 190 M400 80 L500 160', '#fff', 18, .14)}</g>`;
    });
    s += mat('solido', arm.map(d => tr(d, c.a, 12)).join(''));
    s += circ(36, 100, 3, 'url(#s-metal)') + circ(444, 100, 3, 'url(#s-metal)');
    return svg('-4 64 488 150', s, o.classe);
  }
  function relogio(c, o = {}) {
    let s = mat('couro', p('M198 14 H282 L276 118 H204 Z', c.a) + p('M204 206 H276 L282 284 H198 Z', c.a));
    for (let y = 226; y < 280; y += 16) s += circ(240, y, 3.4, esc(c.a, .55));
    s += costura('M204 18 L208 110', c.a, .4) + costura('M276 18 L272 110', c.a, .4);
    s += mat('solido', circ(240, 162, 74, 'url(#s-metal)'));
    s += circ(240, 162, 66, esc(c.c, .05));
    s += circ(240, 162, 60, c.b) + circ(240, 162, 60, 'url(#s-bojo)');
    for (let i = 0; i < 60; i++) {
      const a = i * Math.PI / 30, r1 = 54, r2 = i % 5 ? 51 : 44;
      s += tr(`M${(240 + Math.sin(a) * r1).toFixed(1)} ${(162 - Math.cos(a) * r1).toFixed(1)} L${(240 + Math.sin(a) * r2).toFixed(1)} ${(162 - Math.cos(a) * r2).toFixed(1)}`, contra(c.b), i % 5 ? .8 : 3);
    }
    s += `<g transform="translate(232 126)">${pena(0, 0, .7, contra(c.b))}</g>`;
    s += tr('M240 162 L240 118', contra(c.b), 5) + tr('M240 162 L272 180', contra(c.b), 4) + tr('M240 182 L240 110', c.c, 1.6) + circ(240, 162, 5, c.c);
    s += p('M180 130 A68 68 0 0 1 262 98 A90 90 0 0 0 180 130 Z', '#fff', 'opacity=".35"');
    s += mat('solido', ret(312, 152, 11, 20, 'url(#s-metal)', 3));
    return svg('60 8 360 278', s, o.classe);
  }
  function cinto(c, o = {}) {
    let s = `<g filter="url(#f-dobra)"><ellipse cx="240" cy="184" rx="150" ry="84" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="28"/></g>`;
    s += `<ellipse cx="240" cy="178" rx="150" ry="86" fill="none" stroke="${esc(c.a, .4)}" stroke-width="28"/>`;
    s += mat('couro', `<ellipse cx="240" cy="166" rx="150" ry="86" fill="none" stroke="${c.a}" stroke-width="28"/>`);
    s += `<ellipse cx="240" cy="166" rx="162" ry="97" fill="none" stroke="${contra(c.a)}" stroke-opacity=".38" stroke-width="1.1" stroke-dasharray="3.5 3"/>`;
    s += `<ellipse cx="240" cy="166" rx="138" ry="75" fill="none" stroke="${contra(c.a)}" stroke-opacity=".38" stroke-width="1.1" stroke-dasharray="3.5 3"/>`;
    s += mat('solido', ret(322, 206, 86, 62, 'none', 8, 'stroke="url(#s-metal)" stroke-width="12"'));
    s += mat('solido', tr('M330 238 L400 238', 'url(#s-metal)', 6));
    return svg('60 60 400 226', s, o.classe);
  }
  function colar(c, o = {}) {
    let s = `<g filter="url(#f-dobra)" opacity=".28" transform="translate(4 6)"><path d="M116 40 C110 150 190 214 240 214 C290 214 370 150 364 40" fill="none" stroke="#000" stroke-width="5"/></g>`;
    const elo = 'M116 40 C110 150 190 214 240 214 C290 214 370 150 364 40';
    s += `<path d="${elo}" fill="none" stroke="${esc(c.a, .25)}" stroke-width="6.5" stroke-dasharray="7 3.4" stroke-linecap="round"/>`;
    s += `<path d="${elo}" fill="none" stroke="${c.a}" stroke-width="3.6" stroke-dasharray="7 3.4" stroke-linecap="round"/>`;
    s += `<path d="${elo}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.1" stroke-dasharray="4 6.4"/>`;
    s += `<g transform="translate(240 222)">${mat('solido', `<path d="M-30 36 C-20 0 6 -20 36 -22 C34 10 12 34 -14 40 L-28 52 Z" fill="${c.c}"/><path d="M-18 30 C-10 10 6 -4 24 -10 C20 6 8 22 -8 30 Z" fill="${c.b}"/>`)}<circle cx="0" cy="-6" r="4.4" fill="none" stroke="${c.a}" stroke-width="2.4"/></g>`;
    return svg('80 24 320 262', s, o.classe);
  }

  const artes = { top, tecnica, calca, saia, vestido, cueca, calcinha, sutia, meia, tenis, chinelo, bone, bucket, gorro, tote, mochila, transversal, oculos, relogio, cinto, colar };

  window.Arte = {
    mix, lum, esc, cla, contra,
    desenhar(nome, cores, opcoes, vista) {
      const f = artes[nome] || top;
      return f(cores, opcoes || {}, vista);
    }
  };
})();
