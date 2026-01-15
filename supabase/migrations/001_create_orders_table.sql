-- Criar tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('novo', 'preparando', 'saiu_entrega', 'entregue', 'cancelado')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('credit_card', 'pix', 'cash_on_delivery')),
  address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  address_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscar pedidos por usuário
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Criar índice para buscar pedidos por status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Criar índice para ordenar por data de criação
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios pedidos
-- Como estamos usando autenticação por telefone, permitimos acesso baseado no user_id
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (true); -- Por enquanto, permitir acesso a todos (ajustar quando implementar autenticação adequada)

-- Política: usuários podem criar seus próprios pedidos
CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (true); -- Por enquanto, permitir criação (ajustar quando implementar autenticação adequada)

