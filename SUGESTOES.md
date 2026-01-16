# Análise do Código - QuinerApp

Documento gerado com sugestões de melhorias para o projeto.

---

## NOVAS FUNCIONALIDADES IMPLEMENTADAS

### Webhook Mercado Pago [NOVO]

**Arquivo:** `app/api/mercadopago/webhook/route.ts`
**URL:** `https://www.quiner.com.br/api/mercadopago/webhook`
**Status:** Implementado - Recebe notificações de pagamento e atualiza pedidos automaticamente

**O que foi feito:**
- Criado endpoint webhook para receber notificações do Mercado Pago
- Adicionado campo `external_reference` (orderId) nos pagamentos PIX e Cartão
- Adicionados campos `is_paid` e `payment_id` na tabela orders
- Função `updateOrderPaymentStatus` para atualizar status de pagamento

---

## VULNERABILIDADES CRÍTICAS DE SEGURANÇA

### ~~1. Credenciais expostas no código fonte~~ [CORRIGIDO]

**Arquivo:** `lib/supabase/client.ts`
**Status:** Corrigido - Agora exige variáveis de ambiente obrigatórias

### ~~2. Credenciais da Evolution API hardcoded~~ [CORRIGIDO]

**Arquivo:** `lib/evolution-api.ts`
**Status:** Corrigido - Verifica configuração antes de cada chamada

### ~~3. CPF hardcoded nos pagamentos~~ [CORRIGIDO]

**Arquivos:** `app/api/mercadopago/create-pix/route.ts` e `create-card-payment/route.ts`
**Status:** Corrigido - CPF agora é obrigatório e validado

---

## PROBLEMAS DE ALTA PRIORIDADE

### 4. Webhook sem verificação de assinatura

**Arquivo:** `app/api/whatsapp/webhook/route.ts` (Linhas 22-24)
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Sem verificação de assinatura!
```
**Problema:** Qualquer um pode enviar eventos falsos para o webhook
**Risco:** Alto
**Solução:** Implementar verificação de assinatura do webhook

### 5. Autorização opcional no endpoint de lembrete

**Arquivo:** `app/api/whatsapp/delivery-reminder/route.ts` (Linhas 21-23)
```typescript
if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```
**Problema:** Autorização só funciona se CRON_SECRET estiver definido
**Risco:** Alto - Endpoint pode ser chamado sem autenticação
**Solução:** Tornar autorização obrigatória

### 6. Sem validação de requisições nas APIs

**Problema:** Nenhuma validação de schema nas requisições POST
**Exemplo:** `app/api/whatsapp/send-order/route.ts`
```typescript
const body = await request.json();  // Sem validação
const { orderId, orderData, customerPhone } = body;
```
**Solução:** Adicionar validação com Zod em todos os endpoints POST

---

## PROBLEMAS DE MÉDIA PRIORIDADE

### 7. Excesso de console.log em produção

**Arquivos afetados:**
- `app/api/whatsapp/webhook/route.ts` - 26+ console.log
- `lib/supabase/storage.ts` - 6 console.log
- `lib/evolution-api.ts` - 20+ console.log
- `app/api/mercadopago/create-pix/route.ts` - 10+ console.log

**Problema:** Output de debug em produção
**Risco:** Médio - Impacto na performance, vazamento de informações
**Solução:** Usar logging baseado em ambiente (pino, winston)

### 8. Sem rate limiting nas APIs

**Problema:** Todos os endpoints vulneráveis a brute force/DoS
**Solução:** Adicionar middleware de rate limiting

### 9. Polling agressivo no PIX

**Arquivo:** `components/checkout/PixPaymentScreen.tsx` (Linha 126)
```typescript
pollingRef.current = setInterval(() => {
  checkPaymentStatus();
}, 5000);  // A cada 5 segundos = 720 requisições/hora por usuário
```
**Problema:** Polling consome muita banda e quota de API
**Solução:** Aumentar para 15-30 segundos, implementar exponential backoff

### 10. Falta paginação em queries grandes

**Arquivo:** `lib/supabase/orders.ts` (Linha 105)
```typescript
.limit(100);  // Só busca 100 pedidos
```
**Problema:** Usuários com mais de 100 pedidos podem ter problemas
**Solução:** Implementar paginação cursor-based

### 11. Sem transação no fluxo de pedidos

**Arquivo:** `components/cardapio/Cart.tsx` (Linhas 67-98)
**Problema:** Se criar pedido funciona mas WhatsApp falha, não há rollback
**Solução:** Usar transações de banco ou implementar retry logic

### 12. Validação de CEP faltando

**Arquivo:** `components/checkout/AddressForm.tsx`
**Problema:** Sem validação ou lookup de CEP
**Solução:** Integrar API ViaCEP para validação

---

## QUALIDADE DE CÓDIGO

### 13. Código duplicado

**Locais:**
- Lógica de formatação de telefone duplicada em múltiplos arquivos
- Fluxo de cadastro de produto similar entre criar e editar

**Solução:** Extrair para funções utilitárias (`formatPhone`, `validatePhone`)

### 14. Números mágicos sem constantes

**Arquivo:** `app/api/whatsapp/webhook/route.ts`
**Solução:** Definir constantes para todos os valores fixos

### 15. Falta Error Boundaries

**Problema:** Erro em um componente pode quebrar toda a aplicação
**Solução:** Implementar componentes de error boundary

### 16. Página "Relatórios" incompleta

**Arquivo:** `app/relatorios/page.tsx`
**Problema:** Página existe mas funcionalidade não implementada
**Solução:** Implementar ou remover

---

## PERFORMANCE

### 17. Sem otimização de imagens

**Problema:** Imagens carregadas sem otimização
**Solução:** Usar componente Image do Next.js com sizes

### 18. Filtragem ineficiente de produtos

**Arquivo:** `app/cardapio/page.tsx` (Linhas 46-56)
**Problema:** Filtragem O(n) a cada mudança
**Solução:** Implementar filtragem server-side ou busca indexada

---

## BOAS PRÁTICAS DE SEGURANÇA FALTANDO

### 19. Sem configuração de CORS

**Problema:** APIs não configuram headers CORS explicitamente
**Solução:** Configurar middleware CORS

### 20. Sem proteção CSRF

**Problema:** Sem tokens CSRF em operações que mudam estado
**Solução:** Implementar validação de token CSRF

### 21. Sem Content Security Policy

**Problema:** Sem headers CSP configurados
**Solução:** Adicionar headers CSP no `next.config.js`

---

## FUNCIONALIDADES FALTANDO

### 22. Sem sanitização de input

**Problema:** Input do usuário não sanitizado antes de enviar para WhatsApp
**Risco:** Injeção de mensagens possível
**Solução:** Sanitizar strings antes de enviar

### 23. Sem logging estruturado

**Problema:** Apenas console.log, sem logging estruturado
**Solução:** Implementar Sentry, LogRocket ou similar

### 24. Sem sistema de migrations

**Problema:** Schema do banco gerenciado manualmente
**Solução:** Usar migrations do Supabase ou Prisma

### 25. Sem testes

**Problema:** Nenhum arquivo de teste encontrado
**Risco:** Alto - Sem proteção contra regressões
**Solução:** Adicionar testes Jest e E2E com Cypress/Playwright

---

## RESUMO

| Severidade | Quantidade | Categoria |
|------------|------------|-----------|
| ~~Crítico~~ | ~~3~~ 0 | ~~Segurança (Credenciais Expostas)~~ CORRIGIDO |
| Alto | 3 | Segurança (Validação, Auth, Webhooks) |
| Médio | 10 | Qualidade, Performance, Segurança |
| Baixo | 9 | Qualidade de Código, Acessibilidade |
| **Total** | **22** | **Problemas Restantes** |

---

## TOP 5 AÇÕES IMEDIATAS

1. ~~**REMOVER TODAS AS CREDENCIAIS HARDCODED**~~ [CONCLUÍDO]

2. **ADICIONAR VERIFICAÇÃO DE ASSINATURA NO WEBHOOK** em `app/api/whatsapp/webhook/route.ts`

3. **TORNAR CRON_SECRET OBRIGATÓRIO** no endpoint de lembrete de entrega

4. **ADICIONAR VALIDAÇÃO DE REQUISIÇÕES** em todos os endpoints POST usando Zod

5. **IMPLEMENTAR LOGGING ESTRUTURADO** para substituir console.log
