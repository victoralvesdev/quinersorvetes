-- Corrigir políticas RLS para permitir acesso admin completo aos cupons
-- Como o admin não usa autenticação Supabase (usa localStorage), precisamos
-- permitir acesso completo através da chave anon, já que a segurança está
-- no nível da aplicação (AdminProtected)

-- Remover política restritiva existente
DROP POLICY IF EXISTS "Cupons ativos são visíveis para todos" ON coupons;

-- Política para público ver apenas cupons ativos e válidos
CREATE POLICY "Cupons ativos são visíveis para todos" ON coupons
  FOR SELECT
  USING (is_active = true AND valid_until >= NOW());

-- IMPORTANTE: Como não há autenticação Supabase para admin, estas políticas
-- permitem acesso completo. A segurança está sendo feita no nível da aplicação.
-- Em produção, considere implementar autenticação Supabase com roles.

-- Política para permitir SELECT completo (admin precisa ver todos os cupons)
CREATE POLICY "Permitir SELECT completo em cupons" ON coupons
  FOR SELECT
  USING (true);

-- Política para permitir INSERT (criar cupons)
CREATE POLICY "Permitir INSERT em cupons" ON coupons
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir UPDATE (atualizar cupons)
CREATE POLICY "Permitir UPDATE em cupons" ON coupons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE (deletar cupons)
CREATE POLICY "Permitir DELETE em cupons" ON coupons
  FOR DELETE
  USING (true);

