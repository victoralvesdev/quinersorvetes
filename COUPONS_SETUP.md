# Configuração de Cupons - Resolução de Erro 404

## Problema
Erro 404 ao tentar listar cupons na página de gestão admin.

## Causa
As políticas RLS (Row Level Security) do Supabase estão muito restritivas ou a tabela não foi criada corretamente.

## Solução

### Passo 1: Executar as Migrations no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute as migrations na seguinte ordem:

#### 1. Primeiro, execute a migration inicial (se ainda não executou):
```sql
-- Arquivo: supabase/migrations/create_coupons_tables.sql
```

#### 2. Depois, execute a migration de atualização:
```sql
-- Arquivo: supabase/migrations/20250119_update_coupons_add_features.sql
```

#### 3. Por fim, execute a migration de correção completa:
```sql
-- Arquivo: supabase/migrations/20250119_fix_coupons_complete.sql
```

**OU** execute tudo de uma vez copiando o conteúdo do arquivo `supabase/migrations/20250119_fix_coupons_complete.sql` que já inclui todas as correções necessárias.

### Passo 2: Verificar se a Tabela Existe

Execute esta query para verificar:

```sql
SELECT * FROM coupons LIMIT 1;
```

Se retornar erro, a tabela não existe e você precisa executar a migration inicial primeiro.

### Passo 3: Verificar Políticas RLS

Execute esta query para ver as políticas ativas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'coupons';
```

Você deve ver pelo menos estas políticas:
- "Cupons ativos são visíveis para todos"
- "Permitir SELECT completo em cupons"
- "Permitir INSERT em cupons"
- "Permitir UPDATE em cupons"
- "Permitir DELETE em cupons"

### Passo 4: Testar

Após executar as migrations, recarregue a página `/gestao-admin/cupons` e verifique se o erro foi resolvido.

## Nota Importante

Como o sistema de admin não usa autenticação Supabase (usa localStorage), as políticas RLS permitem acesso completo. A segurança está sendo feita no nível da aplicação através do componente `AdminProtected`.

Em produção, considere implementar autenticação Supabase com roles para melhor segurança.

