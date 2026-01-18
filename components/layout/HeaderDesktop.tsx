"use client";

import { useState, useEffect } from "react";
import { Search, Home, ClipboardList, ShoppingBag, User } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderDesktopProps {
  onSearchChange?: (value: string) => void;
}

export const HeaderDesktop = ({ onSearchChange }: HeaderDesktopProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { openCart, isCartOpen } = useCartContext();
  const { openModal: openLoginModal } = useLoginModal();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const navItems = [
    {
      icon: Home,
      label: "Início",
      active: pathname === "/" && !isCartOpen,
      onClick: () => router.push("/"),
    },
    {
      icon: ClipboardList,
      label: "Meus Pedidos",
      active: pathname === "/pedidos" && !isCartOpen,
      onClick: () => router.push("/pedidos"),
    },
    {
      icon: ShoppingBag,
      label: "Carrinho",
      badge: isMounted && itemCount > 0 ? itemCount : null,
      active: isCartOpen,
      onClick: openCart,
    },
    {
      icon: User,
      label: isAuthenticated && user ? user.name.split(" ")[0] : "Perfil",
      active: false,
      onClick: openLoginModal,
    },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-[110]">
      <div className="container mx-auto px-6 py-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100/50 px-6 py-3">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              className="flex-shrink-0 cursor-pointer group"
              onClick={() => router.push("/")}
            >
              <div className="relative">
                <Image
                  src="/images/logotipo.png"
                  alt="Quiner Logo"
                  width={110}
                  height={44}
                  style={{ width: "auto", height: "44px" }}
                  className="object-contain transition-transform duration-200 group-hover:scale-105"
                  priority
                  unoptimized
                />
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <div
                className={cn(
                  "relative transition-all duration-300",
                  searchFocused && "scale-[1.02]"
                )}
              >
                <input
                  type="text"
                  placeholder="Buscar produtos deliciosos..."
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={cn(
                    "w-full bg-gray-50 rounded-xl px-5 py-3 pr-12 text-sm",
                    "border-2 border-transparent transition-all duration-200",
                    "focus:outline-none focus:bg-white focus:border-primary/30 focus:shadow-lg focus:shadow-primary/10",
                    "placeholder:text-secondary/40"
                  )}
                />
                <div
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    searchFocused
                      ? "bg-primary text-white"
                      : "bg-gray-200/50 text-secondary/50"
                  )}
                >
                  <Search className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;

                return (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 relative group",
                      isActive
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                        : "text-secondary hover:bg-gray-100 hover:text-secondary-dark"
                    )}
                  >
                    <div className="relative">
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-transform duration-200",
                          !isActive && "group-hover:scale-110"
                        )}
                      />
                      {item.badge && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1 shadow-sm">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
