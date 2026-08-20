-- Adiciona email como identificador de login (substitui telefone/WhatsApp
-- como canal de verificação). Nullable porque contas existentes ainda não
-- têm email; UNIQUE impede duas contas com o mesmo email (Postgres permite
-- múltiplos NULLs em uma coluna UNIQUE, então não afeta contas legadas).
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Unicidade case-insensitive: sem isto, "Ana@x.com" e "ana@x.com" seriam
-- duas linhas distintas para o UNIQUE plain (byte-comparison), mas o mesmo
-- email para o Supabase Auth (que normaliza) — abrindo a possibilidade de
-- duas contas para o mesmo endereço. Substitui o índice redundante
-- idx_users_email (UNIQUE já cria um índice próprio) por este, que também
-- serve de índice de busca.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
