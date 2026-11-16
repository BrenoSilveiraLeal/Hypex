# Arquitetura

Hypex é um front-end estático. O navegador carrega o catálogo e executa as regras comerciais no cliente; não existe serviço de backend, API ou banco de dados.

## Camadas

1. `js/dados/catalogo.js` define catálogo, departamentos, opções e regras de cupom.
2. `js/dominio/comercio.js` contém funções puras para CEP, frete, cupom e total. Recebe dados como argumentos e não acessa a página.
3. `js/interface/app.js` monta páginas, rotas hash, estado e checkout simulado.
4. `js/interface/arte.js`, `movimento.js`, `seletor.js` e `tenis-cor.js` cuidam de renderização e interações específicas.
5. `css/` e `img/` contêm apresentação e mídia.

## Estado e segurança

Sacola e cupom ficam no `localStorage` do próprio navegador. O pedido de demonstração fica apenas em memória; dados pessoais e dados de cartão não são persistidos nem enviados para um servidor. Uma loja real precisaria de API, validação no servidor, persistência e provedor de pagamento.

## Rotas

A navegação usa hash: `#inicio`, `#loja`, departamentos, `#estilo-*`, `#p-<produto>`, `#checkout` e `#pedido`.
