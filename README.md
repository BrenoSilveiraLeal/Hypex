# Hypex

Loja fictícia de moda criada para portfólio. A interface demonstra uma vitrine interativa, catálogo de 45 produtos, filtros, variantes de cor e modelo, sacola e checkout simulado.

![Página inicial da Hypex](docs/preview.png)

## Executar localmente

```powershell
python -m http.server 8000
```

Abra [http://localhost:8000](http://localhost:8000). O site usa HTML, CSS e JavaScript sem framework e pode ser publicado em GitHub Pages.

## Organização

- `index.html`: documento e ordem de carregamento.
- `css/`: estilos por área da interface.
- `js/dados/catalogo.js`: produtos, cores, tamanhos, cupons e departamentos.
- `js/dominio/comercio.js`: cálculo de frete, descontos e totais; lógica sem dependência do DOM.
- `js/interface/`: renderização, navegação, animações e interações do navegador.
- `img/`: fotos do catálogo, modelos e variações usadas pelo site.
- `tests/`: verificações das regras comerciais.
- `docs/architecture.md`: arquitetura, persistência e limites do protótipo.

## Verificação

```powershell
node --test tests/comercio.test.cjs
```

As capturas locais ficam em `output/` e não fazem parte do site publicado.

## Demonstração e privacidade

Não há backend, API ou banco de dados. Nenhum pagamento é processado nem pedido enviado. Use o botão de dados de exemplo no checkout; não informe dados reais de cartão. A sacola e o cupom ficam no `localStorage`. O pedido simulado existe apenas enquanto a página está aberta; nome, e-mail e endereço não são gravados no armazenamento local.

As fotos são referências geradas para a demonstração. Um uso comercial exigiria fotos verificadas, validação de preços e estoque no servidor e um provedor de pagamento.

## Publicação

Publique a raiz do repositório como site estático. A navegação usa rotas com `#`, que funcionam no GitHub Pages sem configuração de redirecionamento. O `.gitignore` exclui arquivos locais de ambiente, credenciais, capturas e imagens antigas sem uso.

Ao recarregar o site, a visualização começa no topo da página. Esse comportamento é intencional; ao navegar entre seções durante a mesma visita, a interface controla a posição de rolagem de cada rota.
