"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { LowStockVariationItem } from "@/lib/supabase/variations";
import { Product } from "@/types/product";

interface NotificationsContextValue {
  lowStockProducts: Product[];
  lowStockVariationItems: LowStockVariationItem[];
  lowStockCount: number;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  lowStockProducts: [],
  lowStockVariationItems: [],
  lowStockCount: 0,
  refreshNotifications: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [lowStockVariationItems, setLowStockVariationItems] = useState<LowStockVariationItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/low-stock');
      const json = res.ok ? await res.json() : { products: [], variationItems: [] };
      const [products, variationItems]: [Product[], LowStockVariationItem[]] = [json.products, json.variationItems];
      setLowStockProducts(products);
      setLowStockVariationItems(variationItems);
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
        lowStockVariationItems,
        lowStockCount: lowStockProducts.length + lowStockVariationItems.length,
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
