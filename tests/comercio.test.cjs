const { test } = require('node:test');
const assert = require('node:assert/strict');
const Comercio = require('../js/dominio/comercio.js');

const produtos = {
  tenis: { id: 'tenis', dep: 'tenis', preco: 20000 },
  casaco: { id: 'casaco', dep: 'casacos', preco: 10000 },
};
const produtoPorId = id => produtos[id];
const cupoes = {
  PENOCHAO25: { tipo: 'pct', valor: 25, minimo: 0, deps: ['tenis'] },
  FRETEGRATIS: { tipo: 'frete', valor: 0, minimo: 0 },
  BEMVINDO50: { tipo: 'fixo', valor: 5000, minimo: 20000 },
};
const sacola = [{ id: 'tenis', qtd: 1 }, { id: 'casaco', qtd: 1 }];
const contexto = {
  sacola, cupoes, produtoPorId, freteGratisApartir: 29900,
  descontoPix: .05, entrega: { cep: '20000-000', frete: 'econ' },
  pagamento: { metodo: 'pix' }, checkout: true,
};

test('CEP válido determina zona e opções de frete', () => {
  assert.deepEqual(Comercio.regiaoCep('20000-000'), { cidade: 'Rio de Janeiro', uf: 'RJ', zona: 1 });
  assert.equal(Comercio.regiaoCep('123'), null);
  assert.equal(Comercio.opcoesFrete('20000-000')[0].valor, 1990);
});

test('cupom por departamento desconta apenas itens elegíveis', () => {
  assert.deepEqual(Comercio.totais({ ...contexto, cupom: 'PENOCHAO25' }), {
    sub: 30000, desc: 5000, frete: 0, pix: 1250, total: 23750,
    gratisPorValor: true, freteGratisCupom: false,
  });
  assert.equal(Comercio.checarCupom('PENOCHAO25', {
    sacola: [{ id: 'casaco', qtd: 1 }], cupoes, produtoPorId,
    departamentos: { tenis: { nome: 'Tênis' } }, formatarPreco: v => String(v),
  }).ok, false);
});

test('frete grátis vale apenas na modalidade econômica', () => {
  assert.equal(Comercio.totais({ ...contexto, sacola: [{ id: 'casaco', qtd: 1 }], cupom: 'FRETEGRATIS' }).frete, 0);
  assert.equal(Comercio.totais({ ...contexto, sacola: [{ id: 'casaco', qtd: 1 }], cupom: 'FRETEGRATIS', entrega: { cep: '20000-000', frete: 'expr' } }).frete, 3890);
});

test('sem CEP válido não se inventa valor de frete', () => {
  const totais = Comercio.totais({ ...contexto, entrega: { cep: '', frete: 'econ' } });
  assert.equal(totais.frete, null);
  assert.equal(totais.total, 28500);
});
