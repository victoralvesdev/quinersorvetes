# Erros de Extensões do Navegador

## Problema

Você pode ver erros no console do navegador como:
- `myContent.js:1 Uncaught ReferenceError: browser is not defined`
- `pagehelper.js:1 Uncaught ReferenceError: browser is not defined`

## Causa

Esses erros são causados por **extensões do navegador** (como extensões do Chrome/Firefox) que tentam usar a API `browser` do Chrome/Firefox em páginas web. A API `browser` só está disponível no contexto das extensões, não em páginas web normais.

## Impacto

**Esses erros NÃO afetam a funcionalidade da aplicação.** São apenas avisos no console do desenvolvedor.

## Soluções

### Opção 1: Filtrar no Console (Recomendado)
No console do navegador, você pode filtrar esses erros:
1. Abra o Console (F12)
2. Clique no ícone de filtro
3. Adicione um filtro negativo: `-browser is not defined`

### Opção 2: Desabilitar Extensões Durante Desenvolvimento
1. Use uma janela anônima/privada para desenvolvimento
2. Ou desabilite temporariamente as extensões problemáticas

### Opção 3: Ignorar os Erros
Como esses erros não afetam a aplicação, você pode simplesmente ignorá-los.

## Nota Técnica

Content Scripts de extensões executam em um contexto isolado onde nosso código não pode interceptar ou suprimir erros. Por isso, não é possível suprimir esses erros programaticamente da aplicação.

