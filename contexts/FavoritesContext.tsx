"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/types/product";
import { useAuth } from "./AuthContext";

interface FavoritesContextType {
  favorites: Product[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  toggleFavorite: (product: Product) => Promise<void>;
  isFavorited: (productId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const favoriteIds = new Set(favorites.map((p) => p.id));

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setFavorites([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/favorites?userId=${encodeURIComponent(user.id)}`);
      const data: Product[] = res.ok ? await res.json() : [];
      setFavorites(data);
    } catch (err) {
      console.error("Erro ao carregar favoritos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (product: Product) => {
    if (!user) return;

    const alreadyFav = favoriteIds.has(product.id);

    // Otimistic update
    if (alreadyFav) {
      setFavorites((prev) => prev.filter((p) => p.id !== product.id));
      await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
    } else {
      setFavorites((prev) => [product, ...prev]);
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId: product.id }),
      });
    }
  }, [user, favoriteIds]);

  const isFavorited = useCallback(
    (productId: string) => favoriteIds.has(productId),
    [favoriteIds]
  );

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider
      value={{ favorites, favoriteIds, isLoading, toggleFavorite, isFavorited, refreshFavorites }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites deve ser usado dentro de FavoritesProvider");
  return ctx;
}
