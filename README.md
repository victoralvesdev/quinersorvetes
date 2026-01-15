# QuinerApp - Sistema de Gestão para Delivery de Sorveteria

Sistema completo de gestão para delivery de sorveteria, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Implementado

- **Cardápio Digital**
  - Visualização de produtos em grid responsivo
  - Filtragem por categorias
  - Busca de produtos
  - Carrinho de compras
  - Modal de detalhes do produto
  - Suporte a promoções e produtos em destaque

- **Layout e Navegação**
  - Header com navegação e carrinho
  - Footer
  - Design responsivo mobile-first
  - Sistema de cores customizado

- **Dashboard**
  - Visão geral do sistema
  - Cards de acesso rápido às funcionalidades

- **Gestão de Pedidos** (Estrutura básica)
  - Lista de pedidos
  - Status de pedidos
  - Informações do cliente

- **Entregadores** (Estrutura básica)
  - Lista de entregadores
  - Status de disponibilidade

- **Relatórios** (Estrutura básica)
  - Estatísticas de vendas
  - Produtos mais vendidos

## 🎨 Design

### Cores

- **Primary**: `#a36e6c` - Cor principal (botões, destaques)
- **Secondary**: `#5d7184` - Textos secundários
- **Background**: `#f3ebdd` - Fundo principal
- **White**: `#fff` - Textos claros, fundos brancos

## 🛠️ Tecnologias

- **Next.js 14+** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Zustand** - Gerenciamento de estado
- **Lucide React** - Ícones
- **React Hook Form + Zod** - Formulários e validação

## 📦 Instalação

1. Instale as dependências:

```bash
npm install
```

2. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
QuinerApp/
├── app/                    # Next.js App Router
│   ├── cardapio/          # Cardápio Digital
│   ├── pedidos/           # Gestão de Pedidos
│   ├── entregadores/      # Cadastro de Entregadores
│   └── relatorios/        # Relatórios
├── components/            # Componentes React
│   ├── ui/                # Componentes base
│   ├── cardapio/          # Componentes do cardápio
│   └── layout/            # Header, Footer
├── lib/                   # Utilitários
├── store/                 # Estado global (Zustand)
├── types/                 # TypeScript types
└── public/                # Assets estáticos
```

## 🚧 Próximos Passos

- [ ] Integração com backend/API
- [ ] Sistema de autenticação
- [ ] Checkout completo
- [ ] Pagamento online
- [ ] Notificações em tempo real
- [ ] Gestão de estoque
- [ ] Cupons e promoções
- [ ] Recuperador de vendas

## 📝 Scripts

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 📄 Licença

Este projeto é privado e proprietário.

