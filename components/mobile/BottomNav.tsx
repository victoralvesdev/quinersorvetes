"use client";

import { useMemo, useState, useEffect } from "react";
import { Home, ClipboardList, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export const BottomNav = () => {
  const [isMounted, setIsMounted] = useState(false);
  const itemCount = useCartStore((state) => state.items.length);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { openCart, isCartOpen, closeCart } = useCartContext();
  const { openModal: openLoginModal } = useLoginModal();
  const pathname = usePathname();
  const router = useRouter();

  const navItems = useMemo(
    () => [
      {
        icon: Home,
        label: "Início",
        path: "/",
        active: pathname === "/" && !isCartOpen,
        onClick: () => router.push("/"),
      },
      {
        icon: ClipboardList,
        label: "Pedidos",
        path: "/pedidos",
        active: pathname === "/pedidos" && !isCartOpen,
        onClick: () => router.push("/pedidos"),
      },
      {
        icon: ShoppingBag,
        label: "Carrinho",
        path: null,
        active: isCartOpen,
        badge: isMounted && itemCount > 0 ? itemCount : null,
        onClick: openCart,
      },
      {
        icon: User,
        label: isAuthenticated && user ? user.name.split(" ")[0] : "Perfil",
        path: "/perfil",
        active: pathname === "/perfil" && !isCartOpen,
        onClick: openLoginModal,
      },
    ],
    [pathname, isCartOpen, itemCount, isMounted, router, openCart, openLoginModal, isAuthenticated, user]
  );

  const handleNavClick = (item: (typeof navItems)[0]) => {
    if (isCartOpen && item.path && item.label !== "Perfil") {
      closeCart();
    }

    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[110] safe-area-bottom">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50" />

      {/* Content */}
      <div className="relative flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;

          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 relative min-w-[72px]",
                isActive
                  ? "bg-gradient-to-r from-primary to-primary-dark scale-105"
                  : "active:scale-95"
              )}
            >
              {/* Icon Container */}
              <div
                className={cn(
                  "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "bg-white/20"
                    : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive ? "text-white" : "text-secondary/70"
                  )}
                />

                {/* Badge */}
                {item.badge && (
                  <span
                    className={cn(
                      "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center",
                      "bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full",
                      "shadow-lg shadow-red-500/30 animate-pulse"
                    )}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[11px] font-medium transition-all duration-300 truncate max-w-[64px]",
                  isActive ? "text-white" : "text-secondary/60"
                )}
              >
                {item.label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
