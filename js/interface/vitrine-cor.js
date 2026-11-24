/* HYPEX · vitrine de cor
   Desenha, num canvas atrás da peça, a neve que cai devagar e o estouro de flocos e fumaça
   que esconde a troca de cor. Não conhece o catálogo: recebe posição e cores de quem chama.
   Quem pede menos movimento no sistema não recebe neve nem estouro. */
window.VitrineCor = (function () {
  'use strict';
  const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function montar(canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, rodando = false, visivel = false, quadro = 0, antes = 0;
    let flocos = [], estouro = [], fumaca = [];
    let corNeve = '255,255,255';

    function medir() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const alvo = Math.round(Math.min(70, w * h / 22000));
      while (flocos.length < alvo) flocos.push(novoFloco(true));
      flocos.length = alvo;
    }
    function novoFloco(qualquerAltura) {
      return {
        x: Math.random() * w, y: qualquerAltura ? Math.random() * h : -10,
        r: .6 + Math.random() * 1.8, vy: .25 + Math.random() * .55,
        fase: Math.random() * 6.28, a: .25 + Math.random() * .45
      };
    }

    /* dt mede o tempo em quadros de 60 Hz: a animação dura o mesmo em telas de 60 ou 120 Hz */
    function passo(agora) {
      if (!rodando) return;
      const dt = Math.min(3, Math.max(.25, (agora - (antes || agora - 16.7)) / 16.7));
      antes = agora; quadro += dt;
      ctx.clearRect(0, 0, w, h);

      /* neve de fundo */
      for (const f of flocos) {
        f.y += f.vy * dt; f.x += Math.sin(quadro / 60 + f.fase) * .25 * dt;
        if (f.y > h + 10) Object.assign(f, novoFloco(false));
        ctx.fillStyle = `rgba(${corNeve},${f.a})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
      }

      /* fumaça: nuvens macias que crescem, cobrem a peça e somem */
      for (let i = fumaca.length - 1; i >= 0; i--) {
        const s = fumaca[i];
        s.t += dt;
        const k = s.t / s.vida;
        if (k >= 1) { fumaca.splice(i, 1); continue; }
        const freio = Math.pow(.96, dt);
        s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= freio; s.vy *= freio;
        const raio = s.r0 + (s.r1 - s.r0) * (1 - Math.pow(1 - k, 3));
        const alfa = s.a * (k < .18 ? k / .18 : Math.pow(1 - (k - .18) / .82, 1.6));
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, raio);
        g.addColorStop(0, `rgba(${s.cor},${alfa})`);
        g.addColorStop(.55, `rgba(${s.cor},${alfa * .55})`);
        g.addColorStop(1, `rgba(${s.cor},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, raio, 0, 6.283); ctx.fill();
      }

      /* flocos do estouro: saem rápido e freiam no ar */
      for (let i = estouro.length - 1; i >= 0; i--) {
        const p = estouro[i];
        p.t += dt;
        if (p.t >= p.vida) { estouro.splice(i, 1); continue; }
        const freio = Math.pow(p.atrito, dt);
        p.vx *= freio; p.vy = p.vy * freio + .035 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const alfa = p.a * (1 - p.t / p.vida);
        ctx.fillStyle = `rgba(${p.cor},${alfa})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }

      const ocupado = estouro.length || fumaca.length;
      if (visivel || ocupado) requestAnimationFrame(passo);
      else rodando = false;
    }
    function ligar() {
      if (rodando || calmo()) return;
      rodando = true; antes = 0; requestAnimationFrame(passo);
    }

    const rgb = hex => {
      const n = parseInt(hex.replace('#', ''), 16);
      return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`;
    };

    /* x, y: centro da peça. largura, altura: tamanho da peça. cores: hex usados nos flocos. */
    function explodir({ x, y, largura, altura, cores }) {
      if (calmo()) return;
      const tons = cores.map(rgb);
      const branco = '255,255,255';
      const escala = Math.max(.6, Math.min(1.4, largura / 420));
      for (let i = 0; i < 34; i++) {
        const ang = Math.random() * 6.283, d = Math.random();
        fumaca.push({
          x: x + Math.cos(ang) * largura * .32 * d, y: y + Math.sin(ang) * altura * .36 * d,
          vx: Math.cos(ang) * (1 + Math.random() * 3) * escala, vy: Math.sin(ang) * (1 + Math.random() * 2.4) * escala - .4,
          r0: 20 * escala, r1: (110 + Math.random() * 120) * escala,
          a: .5 + Math.random() * .35, t: 0, vida: 46 + Math.random() * 30,
          cor: Math.random() < .78 ? branco : tons[i % tons.length]
        });
      }
      for (let i = 0; i < 320; i++) {
        const ang = Math.random() * 6.283, v = (3 + Math.pow(Math.random(), 1.8) * 22) * escala;
        estouro.push({
          x: x + (Math.random() - .5) * largura * .4, y: y + (Math.random() - .5) * altura * .5,
          vx: Math.cos(ang) * v, vy: Math.sin(ang) * v * .8 - 1,
          r: .7 + Math.random() * 2.6 * escala, a: .55 + Math.random() * .45,
          atrito: .9 + Math.random() * .06, t: 0, vida: 50 + Math.random() * 60,
          cor: Math.random() < .7 ? branco : tons[i % tons.length]
        });
      }
      ligar();
    }

    medir();
    const obsTamanho = 'ResizeObserver' in window ? new ResizeObserver(medir) : null;
    if (obsTamanho) obsTamanho.observe(canvas);
    const obsVista = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      if (visivel) ligar();
    }) : null;
    if (obsVista) obsVista.observe(canvas); else { visivel = true; ligar(); }

    return {
      explodir,
      neve(hex) { corNeve = rgb(hex); },
      desligar() { visivel = false; rodando = false; estouro = []; fumaca = []; obsTamanho?.disconnect(); obsVista?.disconnect(); }
    };
  }

  return { montar };
})();
