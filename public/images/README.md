# Diretório de Imagens

Este diretório contém todas as imagens utilizadas no QuinerApp.

## Estrutura de Pastas

Coloque as imagens nas seguintes pastas:

### Imagens do Sistema
- `logotipo.png` - Logo principal do Quiner (já presente)

### Imagens de Produtos
Coloque as imagens dos produtos na pasta `products/`:
- `products/milkshake-morango.jpg`
- `products/milkshake-chocolate.jpg`
- `products/pote-morango-baunilha.jpg`
- `products/casquinha-3-sabores.jpg`
- `products/acai-500.jpg`
- etc.

### Imagens Promocionais
Coloque as imagens dos banners promocionais na pasta `promo/`:
- `promo/banner-1.jpg`
- `promo/banner-2.jpg`
- etc.

## Formatos Suportados
- PNG (recomendado para logos e ícones com transparência)
- JPG/JPEG (recomendado para fotos de produtos)
- WebP (otimizado para web)

## Tamanhos Recomendados

### Logo
- Largura: 200-300px
- Altura: proporcional
- Formato: PNG com transparência

### Imagens de Produtos
- Largura: 400-600px
- Altura: 400-600px
- Formato: JPG ou WebP
- Proporção: 1:1 (quadrado)

### Banners Promocionais
- Largura: 800-1200px
- Altura: 300-400px
- Formato: JPG ou WebP
- Proporção: 16:9 ou 3:1

## Como Adicionar Novas Imagens

1. Faça o upload da imagem na pasta apropriada
2. Atualize o caminho no código (ex: `/images/products/nome-do-produto.jpg`)
3. Certifique-se de que o nome do arquivo está em minúsculas e sem espaços (use hífens)

## Observações

- Use nomes de arquivo descritivos e em minúsculas
- Evite espaços nos nomes dos arquivos (use hífens)
- Mantenha os arquivos otimizados para web (tamanho reduzido)
- O Next.js otimiza automaticamente as imagens quando usando o componente `Image`

