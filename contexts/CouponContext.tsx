"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UserCoupon } from "@/types/coupon";
import { getUserCoupons } from "@/lib/supabase/coupons";
import { useAuth } from "./AuthContext";

interface CouponContextType {
  coupons: UserCoupon[];
  couponsCount: number;
  isLoading: boolean;
  refreshCoupons: () => Promise<void>;
  selectedCoupon: UserCoupon | null;
  selectCoupon: (coupon: UserCoupon | null) => void;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export function CouponProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<UserCoupon | null>(null);

  const loadCoupons = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCoupons([]);
      return;
    }

    try {
      setIsLoading(true);
      const userCoupons = await getUserCoupons(user.id);
      setCoupons(userCoupons);
    } catch (error) {
      console.error("Erro ao carregar cupons:", error);
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const refreshCoupons = useCallback(async () => {
    await loadCoupons();
  }, [loadCoupons]);

  const selectCoupon = useCallback((coupon: UserCoupon | null) => {
    setSelectedCoupon(coupon);
  }, []);

  return (
    <CouponContext.Provider
      value={{
        coupons,
        couponsCount: coupons.length,
        isLoading,
        refreshCoupons,
        selectedCoupon,
        selectCoupon,
      }}
    >
      {children}
    </CouponContext.Provider>
  );
}

export function useCoupons() {
  const context = useContext(CouponContext);
  if (context === undefined) {
    throw new Error("useCoupons deve ser usado dentro de um CouponProvider");
  }
  return context;
}
