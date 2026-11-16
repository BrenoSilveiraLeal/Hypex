/* Regras da loja demonstrativa. Recebem dados explícitos e não acessam o DOM. */
(function (raiz) {
  'use strict';

  const REGIOES = [
    ['São Paulo', 'SP', 0], ['Campinas', 'SP', 0], ['Rio de Janeiro', 'RJ', 1],
    ['Belo Horizonte', 'MG', 1], ['Salvador', 'BA', 2], ['Recife', 'PE', 2],
    ['Fortaleza', 'CE', 3], ['Brasília', 'DF', 2], ['Curitiba', 'PR', 1],
    ['Porto Alegre', 'RS', 1]
  ];

  function regiaoCep(cep) {
    const digitos = (cep || '').replace(/\D/g, '');
    if (digitos.length !== 8) return null;
    const [cidade, uf, zona] = REGIOES[Number(digitos[0])];
    return { cidade, uf, zona };
  }

  function opcoesFrete(cep) {
    const zona = regiaoCep(cep)?.zona || 0;
    return [
      { id: 'econ', nome: 'Econômica', valor: 1490 + zona * 500, prazo: `${5 + zona * 2} a ${8 + zona * 2} dias úteis` },
      { id: 'expr', nome: 'Expressa', valor: 2990 + zona * 900, prazo: `${1 + zona} a ${2 + zona} dias úteis` },
      { id: 'loja', nome: 'Retirar na loja', valor: 0, prazo: 'Pronto em 2 horas, na Hypex Centro' }
    ];
  }

  function subtotal(sacola, produtoPorId) {
    return sacola.reduce((total, item) => total + produtoPorId(item.id).preco * item.qtd, 0);
  }

  function checarCupom(codigo, { sacola, cupoes, produtoPorId, departamentos, formatarPreco }) {
    const cupom = cupoes[codigo];
    if (!cupom) return { ok: false, msg: 'Esse cupom não existe. Confira o código ou escolha um da lista.' };
    const valor = subtotal(sacola, produtoPorId);
    if (!sacola.length) return { ok: false, msg: 'Coloque uma peça na sacola para usar este cupom.' };
    if (cupom.minimo && valor < cupom.minimo) {
      return { ok: false, msg: `Este cupom vale a partir de ${formatarPreco(cupom.minimo)}. Faltam ${formatarPreco(cupom.minimo - valor)}.` };
    }
    if (cupom.deps && !sacola.some(item => cupom.deps.includes(produtoPorId(item.id).dep))) {
      return { ok: false, msg: `Este cupom vale só para ${cupom.deps.map(dep => departamentos[dep].nome.toLowerCase()).join(' e ')}.` };
    }
    return { ok: true };
  }

  function totais({ sacola, cupom, checkout, entrega, pagamento, cupoes, produtoPorId, freteGratisApartir, descontoPix }) {
    const sub = subtotal(sacola, produtoPorId);
    let desc = 0;
    let freteGratisCupom = false;
    const regra = cupom && cupoes[cupom];
    if (regra) {
      const base = regra.deps
        ? sacola.filter(item => regra.deps.includes(produtoPorId(item.id).dep))
          .reduce((valor, item) => valor + produtoPorId(item.id).preco * item.qtd, 0)
        : sub;
      if (regra.tipo === 'pct') desc = Math.round(base * regra.valor / 100);
      if (regra.tipo === 'fixo') desc = Math.min(regra.valor, sub);
      if (regra.tipo === 'frete') freteGratisCupom = true;
    }
    const liquido = sub - desc;
    const gratisPorValor = sub >= freteGratisApartir;
    let frete = null;
    if (checkout && regiaoCep(entrega.cep)) {
      const opcoes = opcoesFrete(entrega.cep);
      const opcao = opcoes.find(item => item.id === entrega.frete) || opcoes[0];
      frete = opcao.valor;
      if (opcao.id === 'econ' && (freteGratisCupom || gratisPorValor)) frete = 0;
    }
    const pix = checkout && pagamento.metodo === 'pix' ? Math.round(liquido * descontoPix) : 0;
    return { sub, desc, frete, pix, total: liquido - pix + (frete || 0), gratisPorValor, freteGratisCupom };
  }

  const Comercio = { regiaoCep, opcoesFrete, subtotal, checarCupom, totais };
  raiz.Comercio = Comercio;
  if (typeof module !== 'undefined' && module.exports) module.exports = Comercio;
})(typeof window === 'undefined' ? globalThis : window);
