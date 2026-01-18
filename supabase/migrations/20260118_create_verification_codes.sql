-- Tabela para armazenar códigos de verificação
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Índice para busca rápida por telefone e código
CREATE INDEX idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX idx_verification_codes_phone_code ON verification_codes(phone, code);

-- Política RLS para permitir operações via API
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert verification codes" ON verification_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select verification codes" ON verification_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow update verification codes" ON verification_codes
  FOR UPDATE USING (true);
