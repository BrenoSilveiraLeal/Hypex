/* Recoloração seletiva dos materiais. A fotografia da parede nunca recebe filtro. */
window.TenisCor = (() => {
  const fontes = new Map();
  let pedido = 0;
  const matizes = [20, 140, 230, 290, 75, 340, 230, null, 20, 355];
  function hsv(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = !d ? 0 : max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, max ? d / max : 0, max];
  }
  async function fonte(p, movel) {
    const chave = `${p.id}-${movel}`;
    if (!fontes.has(chave)) fontes.set(chave, (async () => {
      const img = new Image();
      img.src = movel ? 'img/tenis-parede-mobile.webp' : p.fotoZoom;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = movel ? 1120 : 1920;
      canvas.height = movel ? 960 : 1072;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const i = p.indiceParede;
      if (movel) ctx.drawImage(img, i % 2 * 1120, Math.floor(i / 2) * 960, 1120, 960, 0, 0, 1120, 960);
      else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return { width: canvas.width, height: canvas.height, pixels: ctx.getImageData(0, 0, canvas.width, canvas.height) };
    })());
    return fontes.get(chave);
  }
  async function pintar(p, cor, hex) {
    const vez = ++pedido, parede = document.querySelector('.cena-tenis .tenis-parede');
    if (!parede) return;
    if (!p) { parede.querySelectorAll('.tenis-cor').forEach(el => el.remove()); delete parede.dataset.corAtual; return; }
    const movel = innerWidth <= 860;
    const chave = `${p.id}-${cor}-${movel ? 'mobile' : 'desktop'}`;
    if (parede.dataset.corAtual === chave) return;
    let original;
    try { original = await fonte(p, movel); } catch (_) { return; }
    if (vez !== pedido || !parede.isConnected) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'tenis-aproximacao tenis-cor';
    canvas.width = original.width; canvas.height = original.height;
    canvas.setAttribute('aria-hidden', 'true');
    const i = p.indiceParede, centros = [710, 1745, 2790, 3825, 4864];
    Object.assign(canvas.style, movel ? { left: `${i % 2 * 50}%`, top: `${Math.floor(i / 2) * 20}%`, width: '50%', height: '20%' } : { left: `${(centros[i % 5] - 688) / 5504 * 100}%`, top: `${((i < 5 ? 970 : 2010) - 384) / 3072 * 100}%` });
    const pixels = new ImageData(new Uint8ClampedArray(original.pixels.data), original.width, original.height);
    const rgb = [1, 3, 5].map(n => parseInt(hex.slice(n, n + 2), 16) / 255);
    const alvo = Math.max(...rgb), hue = matizes[i];
    if (cor !== p.cores[0]) for (let y = 0; y < pixels.height; y++) {
      // Mantém a prateleira e a iluminação original. A seleção vem da cor real dos pixels.
      if (y / pixels.height > (movel ? .87 : .835)) continue;
      for (let x = 0; x < pixels.width; x++) {
        if (!movel && (x / pixels.width < .14 || x / pixels.width > .86)) continue;
        const n = (y * pixels.width + x) * 4, d = pixels.data;
        const [h, s, v] = hsv(d[n] / 255, d[n + 1] / 255, d[n + 2] / 255);
        const distancia = hue === null ? 0 : Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue));
        const peso = hue === null ? Math.min(1, Math.max(0, (v - .60) / .12)) : Math.min(1, Math.max(0, (s - .22) / .13)) * Math.min(1, Math.max(0, (42 - distancia) / 14));
        if (!peso) continue;
        for (let c = 0; c < 3; c++) {
          const novo = 255 * Math.min(1, v * (.18 + .82 * rgb[c] / Math.max(.15, alvo)) * (.55 + .65 * alvo));
          d[n + c] += (novo - d[n + c]) * peso;
        }
      }
    }
    canvas.getContext('2d').putImageData(pixels, 0, 0);
    const anteriores = [...parede.querySelectorAll('.tenis-cor')];
    parede.append(canvas);
    parede.dataset.corAtual = chave;
    const anim = canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650, easing: 'ease-in-out', fill: 'forwards' });
    anim.finished.then(() => anteriores.forEach(el => el.remove())).catch(() => {});
  }
  return { pintar };
})();
