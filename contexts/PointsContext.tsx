"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { PointsTransaction, ProductPointsReward } from "@/types/points";
import {
  getPointsBalance,
  getPointsHistory,
  redeemPoints as redeemPointsLib,
  getProductPointsRewards,
} from "@/lib/supabase/points";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";

interface PointsContextType {
  balance: number;
  history: PointsTransaction[];
  isLoading: boolean;
  pointsEnabled: boolean;
  pointsRatio: number;
  productRewards: ProductPointsReward[];
  rewardsByProductId: Record<string, ProductPointsReward>;
  redeemForProduct: (productId: string, productName: string, pointsRequired: number) => Promise<boolean>;
  refreshPoints: () => Promise<void>;
  refreshRewards: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productRewards, setProductRewards] = useState<ProductPointsReward[]>([]);

  const pointsEnabled = settings?.points_enabled ?? false;
  const pointsRatio = settings?.points_ratio ?? 10;

  const rewardsByProductId: Record<string, ProductPointsReward> = Object.fromEntries(
    productRewards.map((r) => [r.product_id, r])
  );

  const loadPoints = useCallback(async () => {
    if (!isAuthenticated || !user?.phone) {
      setBalance(0);
      setHistory([]);
      return;
    }
    setIsLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        getPointsBalance(user.phone),
        getPointsHistory(user.phone),
      ]);
      setBalance(bal);
      setHistory(hist);
    } catch (err) {
      console.error("Erro ao carregar pontos:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadRewards = useCallback(async () => {
    try {
      const rewards = await getProductPointsRewards();
      setProductRewards(rewards);
    } catch (err) {
      console.error("Erro ao carregar resgates:", err);
    }
  }, []);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const redeemForProduct = useCallback(async (
    productId: string,
    productName: string,
    pointsRequired: number
  ): Promise<boolean> => {
    if (!user?.phone) return false;
    const success = await redeemPointsLib(
      user.phone,
      pointsRequired,
      `Resgate: ${productName} grátis`
    );
    if (success) await loadPoints();
    return success;
  }, [user, loadPoints]);

  const refreshPoints = useCallback(async () => {
    await loadPoints();
  }, [loadPoints]);

  const refreshRewards = useCallback(async () => {
    await loadRewards();
  }, [loadRewards]);

  return (
    <PointsContext.Provider value={{
      balance,
      history,
      isLoading,
      pointsEnabled,
      pointsRatio,
      productRewards,
      rewardsByProductId,
      redeemForProduct,
      refreshPoints,
      refreshRewards,
    }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints deve ser usado dentro de PointsProvider");
  return ctx;
}
