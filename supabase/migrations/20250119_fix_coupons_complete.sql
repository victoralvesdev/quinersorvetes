-- Migration completa para corrigir cupons e políticas RLS
-- Execute este SQL no Supabase SQL Editor

-- Primeiro, garantir que a tabela existe e tem os campos corretos
DO $$ 
BEGIN
  -- Adicionar coluna first_purchase_only se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'first_purchase_only'
  ) THEN
    ALTER TABLE coupons ADD COLUMN first_purchase_only BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Atualizar constraint de discount_type para incluir free_shipping
DO $$
BEGIN
  -- Remover constraint antiga se existir
  ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
  
  -- Adicionar nova constraint
  ALTER TABLE coupons 
  ADD CONSTRAINT coupons_discount_type_check 
  CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping'));
END $$;

-- Tornar discount_value opcional
ALTER TABLE coupons ALTER COLUMN discount_value DROP NOT NULL;

-- Adicionar constraint para discount_value
DO $$
BEGIN
  ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_discount_value_check;
  
  ALTER TABLE coupons 
  ADD CONSTRAINT coupons_discount_value_check 
  CHECK (
    (discount_type = 'free_shipping' AND discount_value IS NULL) OR
    (discount_type != 'free_shipping' AND discount_value IS NOT NULL AND discount_value > 0)
  );
END $$;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Cupons ativos são visíveis para todos" ON coupons;
DROP POLICY IF EXISTS "Admin pode ver todos os cupons" ON coupons;
DROP POLICY IF EXISTS "Admin pode criar cupons" ON coupons;
DROP POLICY IF EXISTS "Admin pode atualizar cupons" ON coupons;
DROP POLICY IF EXISTS "Admin pode deletar cupons" ON coupons;
DROP POLICY IF EXISTS "Permitir SELECT completo em cupons" ON coupons;
DROP POLICY IF EXISTS "Permitir INSERT em cupons" ON coupons;
DROP POLICY IF EXISTS "Permitir UPDATE em cupons" ON coupons;
DROP POLICY IF EXISTS "Permitir DELETE em cupons" ON coupons;

-- Criar políticas corretas
-- Política para público ver apenas cupons ativos e válidos
CREATE POLICY "Cupons ativos são visíveis para todos" ON coupons
  FOR SELECT
  USING (is_active = true AND valid_until >= NOW());

-- Política para permitir SELECT completo (admin precisa ver todos)
CREATE POLICY "Permitir SELECT completo em cupons" ON coupons
  FOR SELECT
  USING (true);

-- Política para permitir INSERT
CREATE POLICY "Permitir INSERT em cupons" ON coupons
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir UPDATE
CREATE POLICY "Permitir UPDATE em cupons" ON coupons
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir DELETE
CREATE POLICY "Permitir DELETE em cupons" ON coupons
  FOR DELETE
  USING (true);

-- Comentários para documentação
COMMENT ON COLUMN coupons.discount_type IS 'Tipo de desconto: percentage (%), fixed (BRL), ou free_shipping (frete grátis)';
COMMENT ON COLUMN coupons.discount_value IS 'Valor do desconto (obrigatório para percentage e fixed, NULL para free_shipping)';
COMMENT ON COLUMN coupons.first_purchase_only IS 'Se true, o cupom só pode ser usado na primeira compra do usuário';



