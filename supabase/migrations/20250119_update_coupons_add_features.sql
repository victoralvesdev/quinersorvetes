-- Migration para adicionar suporte a frete grátis e primeira compra nos cupons

-- Adicionar 'free_shipping' ao tipo de desconto
ALTER TABLE coupons 
DROP CONSTRAINT IF EXISTS coupons_discount_type_check;

ALTER TABLE coupons 
ADD CONSTRAINT coupons_discount_type_check 
CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping'));

-- Tornar discount_value opcional quando for frete grátis
ALTER TABLE coupons 
ALTER COLUMN discount_value DROP NOT NULL;

-- Adicionar constraint para garantir que discount_value seja obrigatório quando não for frete grátis
ALTER TABLE coupons 
ADD CONSTRAINT coupons_discount_value_check 
CHECK (
  (discount_type = 'free_shipping' AND discount_value IS NULL) OR
  (discount_type != 'free_shipping' AND discount_value IS NOT NULL AND discount_value > 0)
);

-- Adicionar campo para indicar se é apenas para primeira compra
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS first_purchase_only BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN coupons.discount_type IS 'Tipo de desconto: percentage (%), fixed (BRL), ou free_shipping (frete grátis)';
COMMENT ON COLUMN coupons.discount_value IS 'Valor do desconto (obrigatório para percentage e fixed, NULL para free_shipping)';
COMMENT ON COLUMN coupons.first_purchase_only IS 'Se true, o cupom só pode ser usado na primeira compra do usuário';



