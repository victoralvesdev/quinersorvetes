-- Criação das tabelas de cupons
-- Execute este SQL no Supabase SQL Editor

-- Tabela de cupons
CREATE TABLE IF NOT EXISTS coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_value DECIMAL(10, 2),
  max_discount DECIMAL(10, 2),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cupons atribuídos a usuários
CREATE TABLE IF NOT EXISTS user_coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon_id ON user_coupons(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_is_used ON user_coupons(is_used);

-- RLS (Row Level Security) Policies
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- Políticas para coupons (público pode ver cupons ativos)
CREATE POLICY "Cupons ativos são visíveis para todos" ON coupons
  FOR SELECT
  USING (is_active = true AND valid_until >= NOW());

-- Políticas para user_coupons (usuário vê seus próprios cupons)
CREATE POLICY "Usuários podem ver seus próprios cupons" ON user_coupons
  FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios cupons" ON user_coupons
  FOR UPDATE
  USING (true);

CREATE POLICY "Permitir inserção de cupons para usuários" ON user_coupons
  FOR INSERT
  WITH CHECK (true);

-- Exemplo: Criar um cupom de boas-vindas
-- INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, valid_from, valid_until, is_active)
-- VALUES ('BEMVINDO10', 'Cupom de boas-vindas - 10% de desconto', 'percentage', 10, 30.00, NOW(), NOW() + INTERVAL '30 days', true);
