const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

global.window = {};
require('../js/dados/catalogo.js');
const { PRODUTOS, CORES, DEPARTAMENTOS, ESTILOS } = global.window.Loja;

const raiz = path.join(__dirname, '..');
const existe = rel => fs.existsSync(path.join(raiz, rel.split('?')[0]));

test('ids de produto são únicos', () => {
  const ids = PRODUTOS.map(p => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('todo produto usa cores, departamento e estilos que existem', () => {
  for (const p of PRODUTOS) {
    assert.ok(DEPARTAMENTOS[p.dep], `${p.id}: departamento ${p.dep}`);
    for (const c of p.cores) assert.ok(CORES[c], `${p.id}: cor ${c}`);
    for (const e of p.estilos) assert.ok(ESTILOS[e], `${p.id}: estilo ${e}`);
    assert.ok(Number.isInteger(p.preco) && p.preco > 0, `${p.id}: preço em centavos`);
  }
});

test('toda foto do catálogo existe em img/', () => {
  for (const p of PRODUTOS) {
    assert.ok(existe(p.foto), p.foto);
    assert.ok(existe(p.fotoLeve), p.fotoLeve);
    p.modelos.forEach(m => { if (m.foto) { assert.ok(existe(m.foto), m.foto); assert.ok(existe(m.fotoLeve), m.fotoLeve); } });
    if (p.fotoZoom) assert.ok(existe(p.fotoZoom), p.fotoZoom);
  }
});

test('todo tênis tem as fotos de cada cor usadas pela vitrine', () => {
  for (const p of PRODUTOS.filter(p => p.dep === 'tenis')) {
    for (const cor of p.cores) {
      const base = cor === p.cores[0] ? 'base' : cor;
      assert.ok(existe(`img/tenis-variantes/${p.id}-${base}-produto-canonico.png`), `${p.id} ${base} canônico`);
      assert.ok(existe(`img/modelo/variantes/${p.id}-${cor}.webp`), `${p.id} ${cor} no modelo`);
    }
  }
});
