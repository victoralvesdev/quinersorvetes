-- ===================================
-- QuinerApp - Setup do Banco de Dados
-- ===================================

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir categorias padrão
INSERT INTO categories (name) VALUES
  ('Casquinhas'),
  ('Potes'),
  ('Q-Mix'),
  ('Milkshakes')
ON CONFLICT (name) DO NOTHING;

-- Criar índice para busca rápida por nome
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ===================================

-- Criar ou atualizar tabela de produtos
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

-- ===================================

-- Criar tabela para armazenar estado das conversas do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_conversation_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  step TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  product_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_number)
);

-- Criar índice para busca rápida por telefone
CREATE INDEX IF NOT EXISTS idx_conversation_states_phone ON whatsapp_conversation_states(phone_number);

-- ===================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_states_updated_at ON whatsapp_conversation_states;
CREATE TRIGGER update_conversation_states_updated_at
  BEFORE UPDATE ON whatsapp_conversation_states
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================

-- Habilitar Row Level Security (RLS) - Opcional
-- Descomente as linhas abaixo se quiser usar RLS

-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE whatsapp_conversation_states ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura (para desenvolvimento)
-- Em produção, você deve criar políticas mais restritivas

-- CREATE POLICY "Allow public read access on categories" ON categories
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public read access on products" ON products
--   FOR SELECT USING (available = true);

-- ===================================

-- Verificar se as tabelas foram criadas corretamente
DO $$
BEGIN
  RAISE NOTICE 'Setup concluído com sucesso!';
  RAISE NOTICE 'Tabelas criadas:';
  RAISE NOTICE '  - categories';
  RAISE NOTICE '  - products';
  RAISE NOTICE '  - whatsapp_conversation_states';
END $$;

-- Mostrar categorias criadas
SELECT 'Categorias disponíveis:' as info;
SELECT id, name, created_at FROM categories ORDER BY name;
