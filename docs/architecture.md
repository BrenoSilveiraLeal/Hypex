# Arquitetura

Hypex é um front-end estático. O navegador carrega o catálogo e executa as regras comerciais no cliente; não existe serviço de backend, API ou banco de dados.

## Camadas

1. `js/dados/catalogo.js` define catálogo, departamentos, opções e regras de cupom.
2. `js/dominio/comercio.js` contém funções puras para CEP, frete, cupom e total. Recebe dados como argumentos e não acessa a página.
3. `js/interface/app.js` monta páginas, rotas hash, estado e checkout simulado.
4. `js/interface/arte.js`, `movimento.js`, `seletor.js`, `tenis-cor.js` e `vitrine-cor.js` cuidam de renderização e interações específicas.
5. `css/` e `img/` contêm apresentação e mídia.

## Escala

O CSS usa `rem`. A partir de 1181 px de largura, `html { font-size: calc(100vw / 85) }` (em `css/estilo.css`) faz 1 rem valer 16 px na largura de referência de 1360 px e escalar proporcionalmente nas demais, mantendo a mesma composição em qualquer monitor. Consultas `@media` usam `px`; as de altura foram trocadas por `min-aspect-ratio` para não dependerem da resolução.

## Testes

`tests/comercio.test.cjs` cobre as regras comerciais e `tests/catalogo.test.cjs` confere a integridade do catálogo e a existência das fotos. Execute com `node --test tests/comercio.test.cjs tests/catalogo.test.cjs`.

## Estado e segurança

Sacola e cupom ficam no `localStorage` do próprio navegador. O pedido de demonstração fica apenas em memória; dados pessoais e dados de cartão não são persistidos nem enviados para um servidor. Uma loja real precisaria de API, validação no servidor, persistência e provedor de pagamento.

## Rotas

A navegação usa hash: `#inicio`, `#loja`, departamentos, `#estilo-*`, `#p-<produto>`, `#checkout` e `#pedido`.
