"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/store/cartStore";

export function CartAddedNotification() {
  const lastAddedProduct = useCartStore((state) => state.lastAddedProduct);
  const clearLastAdded = useCartStore((state) => state.clearLastAdded);
  const [visible, setVisible] = useState(false);
  const [productName, setProductName] = useState("");

  useEffect(() => {
    if (!lastAddedProduct) return;

    setProductName(lastAddedProduct.name);
    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(clearLastAdded, 300);
    }, 1800);

    return () => clearTimeout(timer);
  }, [lastAddedProduct, clearLastAdded]);

  if (!lastAddedProduct && !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[300] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-3 bg-white rounded-2xl shadow-2xl px-8 py-6 mx-6 max-w-xs w-full transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-90 translate-y-4"
        }`}
      >
        {/* Ícone */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full" />
          <ShoppingBag className="w-8 h-8 text-primary" />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-base font-semibold text-secondary">
            Adicionado ao carrinho!
          </p>
          <p className="text-sm text-secondary/60 mt-0.5 line-clamp-2">
            {productName}
          </p>
        </div>
      </div>
    </div>
  );
}
