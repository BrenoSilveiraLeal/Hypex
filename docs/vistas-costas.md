# Giro removido

O usuario pediu a retirada da opcao de girar. Os controles e o gesto foram removidos. A lista de imagens abaixo e apenas referencia historica; a geracao nao e uma tarefa ativa.

# Vistas das costas

O giro por arraste e os botões Frente / Costas estão implementados nas páginas das roupas. As imagens traseiras ainda não foram geradas: o limite da ferramenta de geração está esgotado. O usuário escolheu gerar as imagens quando o serviço estiver disponível.

A fila em `vistas-costas-pendentes.json` contém cada peça e cada modelo, com referência frontal e destino esperado. Não reutilizar a frente, não espelhá-la e não apresentar uma ilustração como fotografia verificada do produto.

Para gerar, carregar a referência com `view_image` e usar a ferramenta de imagem com fundo transparente. Preservar identidade da peça, tecido, cor, proporções, mangas, comprimento e cabide. Pedir uma vista traseira, com iluminação e escala compatíveis. Conferir visualmente cada resultado antes de publicar. A aparência traseira gerada é ilustrativa, inferida da referência frontal.

Salvar o arquivo aprovado no destino da fila e cadastrar sua chave no objeto `FOTOS_COSTAS` de `js/catalogo.js`. A chave do modelo padrão é o ID do produto; a dos outros modelos é `<id>-m<índice>`. Exemplo de formato: `camisa: 'img/camisa-costas.png'`.

O seletor de cor também recolore a imagem traseira. Modelos alternativos precisam de sua própria imagem das costas. Até existir uma imagem cadastrada, a interface informa a indisponibilidade sem repetir a frente.
