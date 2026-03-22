"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { PointsTransaction } from "@/types/points";
import { getPointsBalance, getPointsHistory, redeemPoints as redeemPointsLib } from "@/lib/supabase/points";
import { useAuth } from "./AuthContext";
import { useSettings } from "./SettingsContext";

interface PointsContextType {
  balance: number;
  history: PointsTransaction[];
  isLoading: boolean;
  redeemPoints: () => Promise<boolean>;
  refreshPoints: () => Promise<void>;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const redeemPoints = useCallback(async (): Promise<boolean> => {
    if (!user?.phone || !settings) return false;
    const cost = settings.points_redemption_cost;
    const description = settings.points_redemption_description || "Resgate de pontos";
    const success = await redeemPointsLib(user.phone, cost, description);
    if (success) await loadPoints();
    return success;
  }, [user, settings, loadPoints]);

  const refreshPoints = useCallback(async () => {
    await loadPoints();
  }, [loadPoints]);

  return (
    <PointsContext.Provider value={{ balance, history, isLoading, redeemPoints, refreshPoints }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints deve ser usado dentro de PointsProvider");
  return ctx;
}
