"use client";

import { useState, useEffect } from "react";
import { Search, Home, Package, ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderDesktopProps {
  onSearchChange?: (value: string) => void;
}

export const HeaderDesktop = ({
  onSearchChange
}: HeaderDesktopProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { openCart } = useCartContext();
  const { openModal: openLoginModal } = useLoginModal();
  const pathname = usePathname();
  const router = useRouter();

  // Evita hydration mismatch - só mostra badge após montar no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
      active: pathname === "/",
      onClick: () => router.push("/"),
    },
    {
      icon: Package,
      label: "Meus Pedidos",
      path: "/pedidos",
      active: pathname === "/pedidos",
      onClick: () => router.push("/pedidos"),
    },
    {
      icon: ShoppingCart,
      label: "Carrinho",
      badge: isMounted && itemCount > 0 ? itemCount : null,
      onClick: openCart,
    },
    {
      icon: User,
      label: "Perfil",
      onClick: openLoginModal,
    },
  ];

  return (
    <header className="bg-primary-pink hidden md:block sticky top-0 z-[110] shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image
              src="/images/logotipo.png"
              alt="Quiner Logo"
              width={120}
              height={48}
              style={{ width: "auto", height: "48px" }}
              className="object-contain cursor-pointer"
              priority
              unoptimized
              onClick={() => router.push("/")}
            />
          </div>

          {/* Barra de Pesquisa - Centralizada */}
          <div className="relative flex-1 flex justify-center">
            <div className="relative max-w-lg w-full">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                onChange={handleSearchChange}
                className="w-full bg-white rounded-full px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary border-0"
              />
            </div>
          </div>

          {/* Navegação - Lado Direito */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors relative min-w-[70px]",
                    isActive 
                      ? "bg-primary text-white shadow-md" 
                      : "text-secondary hover:bg-white/50"
                  )}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

