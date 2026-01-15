# Integração WhatsApp - Evolution API

Este documento descreve como configurar e usar a integração com WhatsApp através da Evolution API para cadastro de produtos.

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Evolution API (WhatsApp)
EVOLUTION_API_URL=https://victoralvesdev-evolution-api.36merq.easypanel.host
EVOLUTION_API_KEY=0F4A6FF5E2CB-46F5-85DF-86A34140ECA9
EVOLUTION_INSTANCE=Quiner

# Supabase (se ainda não configurado)
NEXT_PUBLIC_SUPABASE_URL=https://youvnaepznqfbpdacibs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Configurar Webhook na Evolution API

Para que a aplicação receba mensagens do WhatsApp, você precisa configurar o webhook na Evolution API.

#### URL do Webhook

Após fazer deploy da aplicação, a URL do webhook será:

```
https://SEU_DOMINIO/api/whatsapp/webhook
```

Para desenvolvimento local, você pode usar o ngrok ou similar:

```bash
# Exemplo com ngrok
ngrok http 3000

# A URL do webhook será:
https://SEU_NGROK_URL/api/whatsapp/webhook
```

#### Configurar na Evolution API

Faça uma requisição POST para configurar o webhook:

```bash
curl --location 'https://victoralvesdev-evolution-api.36merq.easypanel.host/webhook/set/Quiner' \
--header 'Content-Type: application/json' \
--header 'apikey: 0F4A6FF5E2CB-46F5-85DF-86A34140ECA9' \
--data '{
  "url": "https://SEU_DOMINIO/api/whatsapp/webhook",
  "webhook_by_events": false,
  "webhook_base64": false,
  "events": [
    "messages.upsert"
  ]
}'
```

### 3. Criar Tabela de Categorias no Supabase

Execute o seguinte SQL no Supabase para criar a tabela de categorias:

```sql
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

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
```

### 4. Atualizar Tabela de Produtos (se necessário)

Certifique-se de que a tabela de produtos existe e tem as colunas corretas:

```sql
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category_id UUID REFERENCES categories(id),
  available BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
```

## Como Usar

### Cadastrar Produto via WhatsApp

1. **Enviar comando**: O usuário envia uma mensagem para o WhatsApp com uma das seguintes variações:
   - "Cadastrar produto"
   - "Cadastrar Produto"
   - "cadastrar produto"
   - "Cadastra produto"
   - "Cadastrar poduto" (com erro de digitação)
   - E outras variações similares

2. **Selecionar categoria**: O bot responderá com uma mensagem contendo botões das categorias disponíveis:
   - Casquinhas
   - Potes
   - Q-Mix
   - Milkshakes

3. **Próximos passos** (em desenvolvimento):
   - Informar nome do produto
   - Informar descrição
   - Informar preço
   - Enviar imagem (opcional)
   - Confirmar cadastro

### Comandos Disponíveis

#### Cadastrar Produto

```
Usuário: "cadastrar produto"
Bot: "Qual categoria você quer adicionar o novo produto?"
     [Botões: Casquinhas | Potes | Q-Mix]
```

## Estrutura de Arquivos

```
QuinerApp/
├── app/
│   └── api/
│       └── whatsapp/
│           └── webhook/
│               └── route.ts          # Endpoint webhook
├── lib/
│   ├── evolution-api.ts              # Cliente Evolution API
│   └── supabase/
│       └── categories.ts             # Serviço de categorias
└── types/
    └── whatsapp.ts                   # Tipos TypeScript
```

## Fluxo de Funcionamento

1. **Usuário envia mensagem** → WhatsApp → Evolution API
2. **Evolution API** → Webhook (`/api/whatsapp/webhook`)
3. **Webhook detecta comando** → Busca categorias no Supabase
4. **Envia resposta** → Evolution API → WhatsApp → Usuário

## Desenvolvimento

### Testar Localmente

1. Iniciar servidor de desenvolvimento:
```bash
npm run dev
```

2. Expor localhost com ngrok:
```bash
ngrok http 3000
```

3. Configurar webhook com URL do ngrok (ver seção "Configurar na Evolution API")

4. Enviar mensagem de teste para o WhatsApp

### Verificar Logs

Os logs das mensagens recebidas e enviadas estão disponíveis no console do servidor:

```bash
# Webhook recebido
Webhook recebido: { ... }

# Erros
Erro ao processar comando: { ... }
```

## Troubleshooting

### Webhook não está recebendo mensagens

1. Verifique se o webhook está configurado corretamente na Evolution API
2. Teste o endpoint diretamente:
```bash
curl http://localhost:3000/api/whatsapp/webhook
```

### Categorias não aparecem

1. Verifique se a tabela `categories` existe no Supabase
2. Verifique se as categorias foram inseridas:
```sql
SELECT * FROM categories;
```

### Mensagens não são enviadas

1. Verifique as credenciais da Evolution API no `.env.local`
2. Verifique os logs do servidor para erros de autenticação

## Próximas Funcionalidades

- [ ] Fluxo completo de cadastro de produto
- [ ] Armazenamento de estado da conversa
- [ ] Upload de imagens para produtos
- [ ] Edição de produtos via WhatsApp
- [ ] Listagem de produtos via WhatsApp
- [ ] Gerenciamento de pedidos via WhatsApp

## Referências

- [Evolution API Documentation](https://doc.evolution-api.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
