# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QuinerApp is an ice cream shop delivery management system built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. It's a Portuguese-language application for "Quiner" sorveteria, providing product catalog, shopping cart, order management, WhatsApp integration, and admin dashboard features.

## Development Commands

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm start        # Production server
npm run lint     # Run linter
```

## Architecture Overview

### State Management

**Hybrid approach**:
1. **Zustand** (`store/cartStore.ts`) - Shopping cart state with methods: `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `getTotal`, `getItemCount`
2. **React Context** (`contexts/`) - Cross-cutting concerns
   - `AuthContext` - Phone-based authentication with localStorage persistence (key: `quiner_user_phone`)
   - `CartContext` - Convenience wrapper around Zustand cart store
   - Provider order in `app/layout.tsx`: `AuthProvider` > `CartProvider`

### Data Layer

**Supabase** (`lib/supabase/`):
- `client.ts` - Supabase client configuration
- `users.ts`, `addresses.ts`, `orders.ts`, `products.ts`, `categories.ts` - CRUD operations
- `conversation-state.ts` - WhatsApp conversation flow state
- `storage.ts` - Image upload to Supabase Storage

**Database Tables**: `users`, `addresses`, `orders`, `products`, `categories`, `conversation_state`

### API Routes

```
app/api/
├── mercadopago/create-pix/route.ts   # PIX payment creation via Mercado Pago REST API
└── whatsapp/
    ├── send-order/route.ts           # Send order notifications
    └── webhook/route.ts              # Evolution API webhook for WhatsApp bot
```

### External Integrations

**Mercado Pago** (PIX Payments):
- Direct REST API integration (no SDK) at `/api/mercadopago/create-pix`
- Uses `MERCADOPAGO_ACCESS_TOKEN` environment variable
- Endpoint: `https://api.mercadopago.com/v1/payments`

**Evolution API** (WhatsApp):
- Client in `lib/evolution-api.ts`
- Functions: `sendTextMessage`, `sendImageMessage`, `sendListMessage`, `sendButtonMessage`, `sendOrderMessage`, `getMediaBase64`
- Environment variables: `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`
- Webhook at `/api/whatsapp/webhook` handles product registration flow via WhatsApp

**WhatsApp Bot Commands**:
- "cadastrar produto" - Initiates product registration flow
- Conversation state machine: `awaiting_category` → `awaiting_name` → `awaiting_description` → `awaiting_price` → `awaiting_image`

### Routing Structure

```
/                          # Home page
/cardapio                  # Product catalog/menu
/pedidos                   # User orders
/entregadores              # Delivery personnel
/relatorios                # Reports
/gestao-admin/             # Admin dashboard
  ├── entregadores/        # Delivery management
  ├── pedidos/             # Order management
  ├── produtos/            # Product management
  └── relatorios/          # Reports
```

### Component Organization

**Path Alias**: Use `@/` for imports (e.g., `import { Product } from "@/types/product"`)

**Categories**:
- `/components/auth/` - Authentication (LoginModal)
- `/components/cardapio/` - Product catalog (Cart, ProductCard, CategoryFilter, SearchBar, ProductModal)
- `/components/checkout/` - Checkout flow (AddressForm, PaymentMethodSelector, CheckoutModal, PixPayment, PixPaymentScreen)
- `/components/layout/` - App structure (Header, Footer)
- `/components/mobile/` - Mobile-specific (BottomNav, HeaderMobile, ProductCardMobile)
- `/components/ui/` - Reusable primitives (Button, Card, Input)

**Client Components**: Add `"use client"` directive when using React hooks, browser APIs, or event handlers.

## Styling

**Color Palette** (defined in `tailwind.config.ts`):
```typescript
primary: "#a36e6c"      // Warm brown/rose
secondary: "#5d7184"    // Slate blue
background: "#FFF8F0"   // Cream/beige
accent.orange: "#FF6B35"
accent.pink: "#FFB6C1"
```

**Patterns**:
- Mobile-first design with `md:`, `lg:` breakpoints
- Class merging with `clsx` and `tailwind-merge`

## TypeScript

**Type Definitions** (`/types`):
- `product.ts` - Product, Category, CartItem
- `user.ts` - User, UserFormData
- `address.ts` - Address, AddressFormData
- `checkout.ts` - PaymentMethod (`'credit_card' | 'debit_card' | 'pix' | 'cash_on_delivery'`), CheckoutData
- `whatsapp.ts` - WhatsApp message types

**Key Types**:
```typescript
CartItem = { product: Product; quantity: number; }
Order = { id, user_id, items: OrderItem[], total, status, payment_method, address_data, ... }
OrderStatus = "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado"
```

## Form Handling

Use React Hook Form + Zod:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://youvnaepznqfbpdacibs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your_access_token

# Evolution API (WhatsApp)
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_api_key
EVOLUTION_INSTANCE=Quiner
```

## Known Issues

1. **localStorage SSR**: Auth relies on localStorage - use `typeof window !== "undefined"` checks
2. **Portuguese language**: All UI text and strings are in Portuguese (Brazil)
3. **Phone-based auth**: No email/password - uses phone numbers as identifiers
4. **Hardcoded fallbacks**: Some API keys have hardcoded fallbacks in code - always use environment variables in production
