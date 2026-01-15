"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export function CartHydration() {
  useEffect(() => {
    // Hidrata o carrinho do localStorage após o componente montar
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}

