/* HYPEX · menus personalizados.
   Cada <select> da página ganha um botão e uma lista com a cara da loja.
   O <select> continua no lugar, escondido, e segue avisando as trocas para o resto do site. */
(function () {
  'use strict';
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SETA = '<svg class="sel-seta" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK = '<svg class="sel-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  let aberto = null, contador = 0, busca = '', buscaT = 0;

  const textoAtual = sel => { const o = sel.options[sel.selectedIndex]; return o ? o.textContent : ''; };
  const nomeDe = sel => {
    if (sel.getAttribute('aria-label')) return sel.getAttribute('aria-label');
    const rot = sel.closest('label'), sp = rot && rot.querySelector('span:not(.sel)');
    if (sp) return sp.textContent.trim();
    const por = sel.id && document.querySelector(`label[for="${sel.id}"]`);
    return por ? por.textContent.trim() : 'Opções';
  };
  const pintarBotao = (sel, btn) => {
    btn.querySelector('.sel-valor').textContent = textoAtual(sel);
    btn.setAttribute('aria-label', `${nomeDe(sel)}: ${textoAtual(sel)}`);
  };

  function fechar(voltarFoco) {
    if (!aberto) return;
    const { menu, btn } = aberto;
    aberto = null;
    btn.setAttribute('aria-expanded', 'false');
    btn.removeAttribute('aria-activedescendant');
    btn.parentElement.classList.remove('aberto');
    menu.classList.add('saindo');
    setTimeout(() => menu.remove(), calmo() ? 0 : 180);
    if (voltarFoco && btn.isConnected) btn.focus();
  }
  function marcar(i, rolar) {
    if (!aberto) return;
    const itens = [...aberto.menu.querySelectorAll('.sel-op')];
    itens.forEach((el, n) => el.classList.toggle('ativo', n === i));
    aberto.ativo = i;
    if (itens[i]) {
      aberto.btn.setAttribute('aria-activedescendant', itens[i].id);
      if (rolar) itens[i].scrollIntoView({ block: 'nearest' });
    }
  }
  function escolher(i) {
    if (!aberto) return;
    const { sel, btn } = aberto, o = sel.options[i];
    if (!o || o.disabled) return;
    const mudou = sel.selectedIndex !== i;
    sel.selectedIndex = i;
    pintarBotao(sel, btn);
    fechar(true);
    if (mudou) sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function posicionar(menu, btn) {
    const r = btn.getBoundingClientRect(), grade = menu.classList.contains('sel-grade'), grupos = menu.classList.contains('sel-grupos');
    const largura = Math.min(innerWidth - 20, Math.max(r.width, grupos ? (innerWidth >= 700 ? 640 : 392) : grade ? 232 : 176));
    menu.style.width = largura + 'px';
    menu.style.maxHeight = 'none';
    const alto = menu.scrollHeight, baixo = innerHeight - r.bottom - 14, cima = r.top - 14;
    const acima = alto > baixo && cima > baixo;
    menu.classList.toggle('acima', acima);
    menu.style.maxHeight = Math.max(120, acima ? cima : baixo) + 'px';
    menu.style.left = Math.max(10, Math.min(innerWidth - largura - 10, r.left)) + 'px';
    if (acima) { menu.style.top = 'auto'; menu.style.bottom = (innerHeight - r.top + 7) + 'px'; }
    else { menu.style.bottom = 'auto'; menu.style.top = (r.bottom + 7) + 'px'; }
  }
  function abrir(sel, btn) {
    fechar();
    const ops = [...sel.options], id = 'sel-' + (++contador);
    const grade = ops.length > 7 && ops.every(o => o.textContent.length <= 6);
    const menu = document.createElement('div');
    const grupos = sel.querySelector('optgroup');
    menu.className = 'sel-menu' + (grade ? ' sel-grade' : '') + (grupos ? ' sel-grupos' : '');
    menu.id = id;
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', nomeDe(sel));
    const item = (o, i) => {
      const on = i === sel.selectedIndex, largo = grade && !o.value;
      return `<button type="button" tabindex="-1" role="option" id="${id}-${i}" class="sel-op${on ? ' escolhida' : ''}${o.disabled ? ' esgotada' : ''}${largo ? ' larga' : ''}" data-i="${i}" aria-selected="${on}"${o.disabled ? ' aria-disabled="true"' : ''} style="--i:${Math.min(i, 9)}"><span>${o.textContent}</span>${CHECK}</button>`;
    };
    /* opções soltas primeiro; depois cada grupo com o seu título */
    let html = '', n = 0;
    [...sel.children].forEach(filho => {
      if (filho.tagName === 'OPTGROUP') {
        const total = filho.children.length, colunas = total > 8 ? Math.ceil(total / 2) : total;
        html += `<div class="sel-grupo" role="group" aria-label="${filho.label}"><p>${filho.label}</p><div class="sel-grupo-ops" style="--sel-colunas:${colunas}">${[...filho.children].map(o => item(o, n++)).join('')}</div></div>`;
      } else html += item(filho, n++);
    });
    menu.innerHTML = html;
    document.body.appendChild(menu);
    posicionar(menu, btn);
    aberto = { sel, btn, menu, ativo: sel.selectedIndex, grade };
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-controls', id);
    btn.parentElement.classList.add('aberto');
    marcar(Math.max(0, sel.selectedIndex), true);
    menu.addEventListener('pointerdown', e => e.preventDefault());
    menu.addEventListener('click', e => { const op = e.target.closest('.sel-op'); if (op) escolher(+op.dataset.i); });
    menu.addEventListener('pointermove', e => { const op = e.target.closest('.sel-op'); if (op && +op.dataset.i !== aberto.ativo) marcar(+op.dataset.i); });
  }
  function teclado(e, sel, btn) {
    const k = e.key;
    if (!aberto || aberto.btn !== btn) {
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); abrir(sel, btn); }
      else if (k === 'ArrowLeft' || k === 'ArrowRight') e.stopPropagation();
      return;
    }
    const total = sel.options.length, caixa = aberto.grade && (aberto.menu.querySelector('.sel-grupo-ops') || aberto.menu);
    const passo = caixa ? getComputedStyle(caixa).gridTemplateColumns.split(' ').length : 1;
    const andar = d => {
      let i = aberto.ativo;
      for (let n = 0; n < total; n++) {
        i = Math.max(0, Math.min(total - 1, i + d));
        if (!sel.options[i].disabled) { marcar(i, true); return; }
        if (i === 0 || i === total - 1) return;
      }
    };
    if (k === 'ArrowDown') andar(passo);
    else if (k === 'ArrowUp') andar(-passo);
    else if (k === 'ArrowRight') andar(1);
    else if (k === 'ArrowLeft') andar(-1);
    else if (k === 'Home') marcar(0, true);
    else if (k === 'End') marcar(total - 1, true);
    else if (k === 'Enter' || k === ' ') escolher(aberto.ativo);
    else if (k === 'Escape') fechar(true);
    else if (k === 'Tab') { fechar(); return; }
    else if (k.length === 1) {
      clearTimeout(buscaT); busca += k.toLowerCase(); buscaT = setTimeout(() => { busca = ''; }, 600);
      const i = [...sel.options].findIndex(o => !o.disabled && o.textContent.toLowerCase().startsWith(busca));
      if (i >= 0) marcar(i, true);
    } else return;
    e.preventDefault(); e.stopPropagation();
  }
  function melhorar(sel) {
    if (sel.dataset.seletor) return;
    sel.dataset.seletor = '1';
    const caixa = document.createElement('span'), btn = document.createElement('button');
    caixa.className = 'sel';
    btn.type = 'button';
    btn.className = 'sel-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = `<span class="sel-valor"></span>${SETA}`;
    sel.parentNode.insertBefore(caixa, sel);
    caixa.append(btn, sel);
    sel.classList.add('sel-nativo');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');
    pintarBotao(sel, btn);
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (aberto && aberto.btn === btn) fechar(); else abrir(sel, btn);
    });
    btn.addEventListener('keydown', e => teclado(e, sel, btn));
    btn.addEventListener('blur', () => { if (aberto && aberto.btn === btn) fechar(); });
    sel.addEventListener('focus', () => btn.focus());
  }
  function varrer(raiz) {
    if (raiz.matches && raiz.matches('select')) melhorar(raiz);
    if (raiz.querySelectorAll) raiz.querySelectorAll('select').forEach(melhorar);
  }

  new MutationObserver(lista => {
    lista.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) varrer(n); }));
    if (aberto && !aberto.btn.isConnected) fechar();
  }).observe(document.documentElement, { childList: true, subtree: true });
  varrer(document);

  addEventListener('pointerdown', e => {
    if (aberto && !aberto.menu.contains(e.target) && !aberto.btn.contains(e.target)) fechar();
  }, true);
  addEventListener('scroll', e => {
    if (aberto && !(e.target.nodeType === 1 && aberto.menu.contains(e.target))) fechar();
  }, true);
  addEventListener('resize', () => fechar());
  addEventListener('hashchange', () => fechar());
})();
