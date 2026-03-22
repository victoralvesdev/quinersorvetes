"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Product } from "@/types/product";
import { getUserFavorites, addFavorite, removeFavorite } from "@/lib/supabase/favorites";
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
      const data = await getUserFavorites(user.id);
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
      await removeFavorite(user.id, product.id);
    } else {
      setFavorites((prev) => [product, ...prev]);
      await addFavorite(user.id, product.id);
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
