"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, Menu, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export const BottomNav = () => {
  const [isMounted, setIsMounted] = useState(false);
  const itemCount = useCartStore((state) => state.items.length);

  // Evita hydration mismatch - só mostra badge após montar no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { openCart, isCartOpen, closeCart } = useCartContext();
  const { openModal: openLoginModal } = useLoginModal();
  const pathname = usePathname();
  const router = useRouter();

  // Define os itens de navegação com lógica de ativo baseada no estado do carrinho
  // useMemo garante que recalcule quando isCartOpen ou pathname mudarem
  const navItems = useMemo(() => [
    { 
      icon: Home, 
      label: "Início", 
      path: "/", 
      active: pathname === "/" && !isCartOpen,
      onClick: () => router.push("/"),
    },
    { 
      icon: Menu, 
      label: "Meus Pedidos", 
      path: "/pedidos", 
      active: pathname === "/pedidos" && !isCartOpen,
      onClick: () => router.push("/pedidos"),
    },
    {
      icon: ShoppingCart,
      label: "Carrinho",
      path: null,
      active: isCartOpen, // Sempre ativo quando o carrinho está aberto
      badge: isMounted && itemCount > 0 ? itemCount : null,
      onClick: openCart,
    },
    { 
      icon: User, 
      label: "Perfil", 
      path: "/perfil", 
      active: pathname === "/perfil" && !isCartOpen,
      onClick: openLoginModal,
    },
  ], [pathname, isCartOpen, itemCount, isMounted, router, openCart, openLoginModal]);

  const handleNavClick = (item: typeof navItems[0]) => {
    // Se clicar em uma aba de navegação (com path) enquanto o carrinho está aberto, fecha o carrinho
    // Mas não fecha se for Perfil - Perfil abre modal sem fechar o carrinho
    if (isCartOpen && item.path && item.label !== "Perfil") {
      closeCart();
    }
    
    // Se for Perfil, apenas executa o onClick (abre modal) sem navegar
    if (item.label === "Perfil" && item.onClick) {
      item.onClick();
      return;
    }
    
    // Executa a ação do item
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 text-secondary-dark z-[110] safe-area-bottom" style={{ backgroundColor: '#F3F0DF' }}>
      <div className="flex items-center justify-around h-20 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative rounded-lg",
                isActive ? "text-white" : ""
              )}
              style={isActive ? { backgroundColor: '#587187' } : { color: '#A46F71' }}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

