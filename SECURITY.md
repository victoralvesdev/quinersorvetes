# Registro de Vulnerabilidades de Segurança — QuinerApp

> Auditoria realizada em 2026-03-23. Resolva na ordem listada (Críticas primeiro).

---

## CRÍTICAS

### [x] C1 — Senha admin exposta no browser + autenticação só no localStorage
- **Arquivo**: `contexts/AdminContext.tsx`
- **Problema**: `NEXT_PUBLIC_ADMIN_PASSWORD` é enviada ao cliente (visível no bundle JS). A verificação acontece só no frontend, permitindo bypass via `localStorage.setItem("quiner_admin_auth", "true")`.
- **Correção**: Mover validação para API route server-side (`/api/admin/login`). Usar cookie `httpOnly` no lugar do localStorage.
- **Status**: ✅ Corrigido

### [ ] C2 — Webhook do Mercado Pago sem assinatura obrigatória
- **Arquivo**: `app/api/mercadopago/webhook/route.ts`
- **Problema**: Se `MERCADOPAGO_WEBHOOK_SECRET` não estiver configurado, o webhook aceita qualquer requisição. Atacante pode forjar um pagamento aprovado e receber pedido sem pagar.
- **Correção**: Tornar verificação de assinatura obrigatória — rejeitar se secret não estiver configurado.
- **Status**: ⏳ Pendente

### [ ] C3 — Tokens de produção no `.env.local` (Supabase, MP, WhatsApp, Google Maps)
- **Problema**: Se o arquivo vazar (via git, deploy, etc.), toda a infraestrutura fica exposta.
- **Correção**: Rotacionar todos os tokens. Adicionar `.env.local` ao `.gitignore` (verificar). Usar secrets do ambiente de deploy (Vercel env vars).
- **Status**: ⏳ Pendente

---

## ALTAS

### [ ] A1 — Sem Row Level Security (RLS) no Supabase
- **Arquivo**: `supabase-setup.sql`, migrations
- **Problema**: Políticas com `USING (true)` não restringem acesso. Qualquer um com a chave anon pode ler todos os pedidos/clientes ou alterar preços.
- **Correção**: Habilitar RLS em todas as tabelas com políticas restritivas por `user_phone` ou `user_id`.
- **Status**: ⏳ Pendente

### [ ] A2 — IDOR em update-status (alterar pedido de qualquer pessoa)
- **Arquivo**: `app/api/orders/update-status/route.ts`
- **Problema**: Não valida se o solicitante é dono do pedido. Qualquer um pode cancelar ou marcar como "entregue" pedidos alheios.
- **Correção**: Validar autoria do pedido antes de permitir atualização. Rota deve ser protegida para uso interno/admin.
- **Status**: ⏳ Pendente

### [ ] A3 — Webhook WhatsApp sem autenticação
- **Arquivo**: `app/api/whatsapp/webhook/route.ts`
- **Problema**: Qualquer pessoa pode chamar o endpoint e disparar o fluxo de cadastro de produtos, inserindo itens falsos no catálogo.
- **Correção**: Verificar header de autenticação da Evolution API em todas as requisições.
- **Status**: ⏳ Pendente

### [ ] A4 — Cron de lembrete sem autenticação forte
- **Arquivo**: `app/api/whatsapp/delivery-reminder/route.ts`
- **Problema**: Se `CRON_SECRET` não estiver configurado, a rota é pública. Pode ser chamada por qualquer um para enviar mensagens WhatsApp falsas.
- **Correção**: Tornar `CRON_SECRET` obrigatório — bloquear se não configurado.
- **Status**: ⏳ Pendente

---

## MÉDIAS

### [ ] M1 — Pontos de fidelidade manipuláveis via Supabase direto
- **Arquivo**: `lib/supabase/points.ts`
- **Problema**: Sem RLS, qualquer um pode inserir transações de pontos diretamente e resgatar produtos grátis.
- **Correção**: Depende da correção do A1 (RLS). Adicionar verificação server-side no resgate.
- **Status**: ⏳ Pendente (bloqueado pelo A1)

### [ ] M2 — Cupons sem limite de uso por usuário
- **Arquivo**: `lib/supabase/coupons.ts`
- **Problema**: Mesmo cupom pode ser aplicado infinitas vezes pelo mesmo usuário.
- **Correção**: Registrar uso por `user_phone` + `coupon_id` e validar antes de aplicar.
- **Status**: ⏳ Pendente

### [ ] M3 — Sem rate limiting nas rotas públicas
- **Arquivo**: Todos os arquivos em `app/api/`
- **Problema**: `/api/auth/send-code` pode ser chamado em loop para bombardear um número de WhatsApp. Sem proteção contra brute force.
- **Correção**: Implementar rate limiting (ex: `upstash/ratelimit` com Redis ou middleware simples por IP).
- **Status**: ⏳ Pendente

### [ ] M4 — Validação fraca de telefone no cadastro
- **Arquivo**: `app/api/auth/send-code/route.ts`
- **Problema**: Aceita qualquer string, podendo criar usuários com telefone vazio ou inválido.
- **Correção**: Validar formato E.164 e mínimo de dígitos antes de processar.
- **Status**: ⏳ Pendente

---

## BAIXAS

### [ ] B1 — Transições de status de pedido sem validação de fluxo
- **Arquivo**: `app/api/orders/update-status/route.ts`
- **Problema**: Permite ir de "novo" direto para "entregue", pulando etapas e concedendo pontos indevidamente.
- **Correção**: Implementar máquina de estados com transições válidas.
- **Status**: ⏳ Pendente

### [ ] B2 — Logs expondo dados sensíveis em produção
- **Arquivo**: Múltiplos arquivos em `app/api/`
- **Problema**: `console.log` expõe IDs de pedidos, status de pagamento e dados de transação nos logs do servidor.
- **Correção**: Remover ou substituir por logger estruturado que filtra dados sensíveis em produção.
- **Status**: ⏳ Pendente

### [ ] B3 — Rota preview-access desnecessária em produção
- **Arquivo**: `app/api/auth/preview-access/route.ts`
- **Problema**: Rota criada para acesso antecipado ainda está ativa, com telefone hardcoded.
- **Correção**: Remover a rota ou proteger adequadamente.
- **Status**: ⏳ Pendente
