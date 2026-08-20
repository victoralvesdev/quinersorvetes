# Login/cadastro por email (OTP via Supabase Auth)

## Contexto e objetivo

Hoje o cadastro/login do QuinerApp usa apenas telefone: o usuário digita o
telefone, recebe um código de 6 dígitos via WhatsApp (Evolution API) e o
verifica contra a tabela própria `verification_codes`.

Objetivo: trocar o **canal de verificação** de WhatsApp para **email**,
mantendo o telefone como dado obrigatório de contato/entrega (WhatsApp
continua sendo usado para notificação de pedido, lembrete de entrega e o bot
de cadastro de produto do admin — nada disso muda).

O envio/verificação do código passa a usar o **Email OTP nativo do Supabase
Auth** (`signInWithOtp` / `verifyOtp`), em vez de escrever um sistema de
envio de email próprio (Resend ficou descartado deliberadamente).

## Fora de escopo

- Qualquer mudança no fluxo de notificação de pedido, lembrete de entrega ou
  bot de cadastro de produto via WhatsApp — permanecem como estão.
- Migração da sessão do app para o sistema de sessão/JWT do Supabase Auth. O
  app continua com seu modelo atual (tabela `users` própria +
  `localStorage`), usando o Supabase Auth só como mecanismo de
  envio/verificação do código.
- Migração em massa de usuários antigos sem email (tratamento é reativo, no
  próximo login de cada um).

## Arquitetura

### Banco de dados

Uma migration nova:

```sql
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
CREATE INDEX idx_users_email ON users(email);
```

- Nullable no banco (usuários antigos não têm email ainda), `UNIQUE` para
  impedir duas contas com o mesmo email.
- Formulário de cadastro passa a exigir email (validação no frontend/Zod),
  mesmo a coluna sendo nullable no banco.
- Tabela `verification_codes` **não muda**. Ela fica com o histórico de
  códigos por WhatsApp/telefone (não usada por email) — sem risco de quebrar
  nada existente, sem necessidade de remover.

### Envio/verificação do código (Supabase Auth)

Sem tabela própria, sem módulo de email próprio. As rotas de API existentes
passam a delegar pro Supabase Auth:

- `POST /api/auth/send-code` — recebe `{ email }`. Chama
  `supabaseAdmin.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })`.
  O Supabase gera o código, guarda e envia o email (usando o mailer
  padrão do projeto por enquanto).
- `POST /api/auth/verify-code` — recebe `{ email, code }`. Chama
  `supabaseAdmin.auth.verifyOtp({ email, token: code, type: "email" })`.
  Em caso de sucesso, o Supabase retorna uma sessão de `auth.users` — essa
  sessão é **descartada**; ela só serve como prova de que o email foi
  verificado. O app continua resolvendo a identidade do usuário pela sua
  própria tabela `users`.

**Dependência operacional (fora do código, feita pelo usuário no painel do
Supabase):** o template de email "Magic Link" (Authentication → Email
Templates) precisa ser editado para incluir `{{ .Token }}` — por padrão o
Supabase manda um link, não um código de 6 dígitos. Template sugerido:

```html
<h2>Seu código de verificação</h2>
<p>Use o código abaixo para entrar no Quiner Sorvetes:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>Este código expira em breve. Se você não solicitou, ignore este email.</p>
```

**Limite de envio:** o mailer padrão do Supabase é best-effort e limitado
(poucos emails/hora) — adequado para lançar/testar, não para volume real de
produção. Quando o uso crescer, configurar Custom SMTP no painel do Supabase
(Authentication → Settings → SMTP) — não exige nenhuma mudança de código.

### Fluxo de login/cadastro (merge de contas antigas)

Login passa a identificar o usuário por **email**, mas contas existentes só
têm telefone. Fluxo:

1. Usuário digita email no formulário de login.
2. `GET /api/users?email=` encontra a conta → envia código pro email →
   verifica → login normal (busca o registro em `users` por email).
3. Não encontra por email → tela oferece "já tenho conta" → usuário digita
   telefone → `GET /api/users?phone=`:
   - Encontra conta antiga → pede o email, envia código pra esse email →
     ao verificar, `UPDATE users SET email = ... WHERE id = ...` na conta
     **existente** (não cria uma nova — preserva pedidos, endereços,
     cupons).
   - Não encontra → fluxo de cadastro novo (nome + telefone + email, todos
     obrigatórios) → envia código pro email → ao verificar, cria o
     registro em `users` já com email preenchido.

### API routes afetadas

- `app/api/auth/send-code/route.ts` — reescrita: recebe email, chama
  `signInWithOtp`. Mantém rate limiting básico (reaproveita o padrão atual
  de rate limit em memória, agora por email).
- `app/api/auth/verify-code/route.ts` — reescrita: recebe email + code,
  chama `verifyOtp`.
- `app/api/users/route.ts` — `GET` passa a aceitar `?email=` além de
  `?phone=` (usado no passo de recuperação de conta antiga). `POST`
  (cadastro) passa a exigir `email` no payload.
- `lib/supabase/users.ts` — nova função `getUserByEmail(email)`, ao lado da
  `getUserByPhone` existente (que continua usada no passo 3 acima).

### Frontend

- `types/user.ts` — `User` e `UserFormData` ganham campo `email: string`.
- `contexts/AuthContext.tsx` — `login(email)` em vez de `login(phone)`;
  chave do localStorage muda de `quiner_user_phone` para
  `quiner_user_email`. `register()` continua recebendo `{ name, phone,
  email }`.
- `components/auth/LoginModal.tsx`:
  - Formulário de login: campo email (em vez de telefone).
  - Formulário de cadastro: nome, telefone e email (todos obrigatórios).
  - Novo estado "recuperar conta" para o passo 3 do fluxo acima (pedir
    telefone quando o email não é encontrado, depois confirmar vínculo).
  - Mensagens de erro/sucesso adaptadas para email.

## Testes

- Unit/integration nas rotas `send-code`, `verify-code`, `users` (mock do
  client do Supabase Auth) cobrindo: código enviado, código inválido,
  código expirado, criação de novo usuário, vínculo de email a conta
  existente via telefone.
- Teste manual do fluxo completo no browser: cadastro novo, login com conta
  existente com email, migração de conta antiga (login com email
  inexistente → telefone existente → vínculo).

## Deploy

Depois de implementado e testado localmente:
1. Aplicar a migration no Supabase (produção).
2. Editar o template "Magic Link" no painel do Supabase (usuário faz
   manualmente, conforme combinado).
3. Deploy para a Vercel (produção), conforme pedido separadamente pelo
   usuário.
