# Visualizador 3D cancelado

O usuario pediu para retirar os modelos 3D e restaurar as fotografias. A integracao foi removida do site. O registro abaixo e apenas historico, nao uma tarefa ativa.

# Roupas em 3D

O usuário autorizou reconstruções tridimensionais com frente e costas para todas as roupas. O visualizador usa geometria procedural, não fotografias planas giradas. São 35 produtos e 51 combinações de produto/modelo, construídos em `js/roupas3d.js` a partir dos atributos do catálogo.

As reconstruções são aproximadas. Não foram obtidas por escaneamento nem por fotografias traseiras. A interface identifica isso e mantém o modo Foto para consultar a imagem original. Não apresentar a aparência das costas modeladas como comprovação dos detalhes reais de fabricação.

Recursos: rotação livre por arraste, toque, teclado, botões Frente/Costas, zoom, restauração da câmera, seleção de cor e variantes. Há costuras e elementos traseiros tridimensionais. A rotação de cor respeita movimento reduzido. O render é acionado por interação, redimensionamento e mudanças; para quando o objeto fica fora da tela ou a aba está oculta.

Three.js 0.180.0 e OrbitControls estão incluídos localmente em `js/vendor/three`; sua licença MIT está na mesma pasta. A biblioteca só é carregada ao abrir uma roupa. Não há API externa nem geração de imagens necessária para construir estes modelos.

Para maior fidelidade futura, substituir o construtor procedural por arquivos GLB/GLTF produzidos a partir de referências de todos os lados. Os tênis mantêm a apresentação própria da prateleira.

Verificação realizada: construção das 51 variantes, coordenadas finitas e profundidade real em todas; frente/costas, teclado sem navegação acidental, troca de cor, troca de variante, modo Foto e funcionamento no viewport de celular.
