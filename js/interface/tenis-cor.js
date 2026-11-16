/* Cada cor usa a mesma fotografia, recorte e posicao do tenis original. */
window.TenisCor = (() => {
  let pedido = 0;
  const aquecidas = new Set();
  const centros = [710, 1745, 2790, 3825, 4864];

  async function carregar(imagem) {
    if (!imagem.complete) {
      await new Promise((resolve, reject) => {
        imagem.addEventListener('load', resolve, { once: true });
        imagem.addEventListener('error', reject, { once: true });
      });
    }
    if (!imagem.naturalWidth) throw new Error('Imagem de cor indisponível');
    try { await imagem.decode(); } catch (_) {
      // Alguns navegadores rejeitam decode() apesar de a imagem já estar carregada.
      if (!imagem.complete || !imagem.naturalWidth) throw _;
    }
  }

  function apagar(parede) {
    parede.querySelectorAll('.tenis-cor').forEach(el => {
      el.classList.remove('pronta');
      setTimeout(() => { if (!el.classList.contains('pronta')) el.remove(); }, 600);
    });
  }

  function posicionar(imagem, p, movel) {
    const i = p.indiceParede;
    if (movel) {
      imagem.style.left = (i % 2 * 50) + '%';
      imagem.style.top = (Math.floor(i / 2) * 20) + '%';
      imagem.style.width = '50%';
      imagem.style.height = '20%';
    } else {
      imagem.style.left = ((centros[i % 5] - 688) / 5504 * 100) + '%';
      imagem.style.top = (((i < 5 ? 970 : 2010) - 384) / 3072 * 100) + '%';
    }
  }

  function precargar(p, movel) {
    p.cores.slice(1).forEach(cor => {
      const src = 'img/tenis-variantes/' + p.id + '-' + cor + (movel ? '-foto-mobile.webp' : '-camera.webp?v=9');
      if (aquecidas.has(src)) return;
      aquecidas.add(src);
      const imagem = new Image();
      imagem.src = src;
    });
  }

  async function pintar(p, cor) {
    const parede = document.querySelector('.cena-tenis .tenis-parede');
    if (!parede) return;
    const movel = innerWidth <= 860;
    const chave = p ? p.id + '-' + cor + '-' + (movel ? 'mobile' : 'desktop') : '';
    if (parede.dataset.corAtual === chave) return;
    const vez = ++pedido;
    parede.dataset.corAtual = chave;
    if (p) precargar(p, movel);
    if (!p || cor === p.cores[0]) { apagar(parede); return; }

    const imagem = new Image();
    imagem.className = 'tenis-aproximacao tenis-cor';
    imagem.alt = '';
    imagem.setAttribute('aria-hidden', 'true');
    posicionar(imagem, p, movel);
    imagem.src = 'img/tenis-variantes/' + p.id + '-' + cor + (movel ? '-foto-mobile.webp' : '-camera.webp?v=9');
    try { await carregar(imagem); } catch (_) {
      if (vez === pedido) delete parede.dataset.corAtual;
      return;
    }
    if (vez !== pedido || !parede.isConnected) return;
    const anteriores = [...parede.querySelectorAll('.tenis-cor')];
    parede.append(imagem);
    requestAnimationFrame(() => {
      if (vez !== pedido) { imagem.remove(); return; }
      // Garante um estado inicial opacity: 0 antes de iniciar o fade.
      void imagem.offsetWidth;
      imagem.classList.add('pronta');
      anteriores.forEach(el => {
        el.classList.remove('pronta');
        setTimeout(() => el.remove(), 600);
      });
    });
  }

  return { pintar, precargar };
})();
