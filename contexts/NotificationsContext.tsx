"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getLowStockProducts } from "@/lib/supabase/products";
import { Product } from "@/types/product";

interface NotificationsContextValue {
  lowStockProducts: Product[];
  lowStockCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  lowStockProducts: [],
  lowStockCount: 0,
  refreshNotifications: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const products = await getLowStockProducts();
      setLowStockProducts(products);
    } catch (error) {
      console.error("Erro ao buscar notificações de estoque:", error);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 60000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        lowStockProducts,
        lowStockCount: lowStockProducts.length,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
