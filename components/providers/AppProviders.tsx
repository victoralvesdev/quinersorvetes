"use client";

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { LoginModalProvider } from "@/contexts/LoginModalContext";
import { CouponProvider } from "@/contexts/CouponContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";
import { CartAddedNotification } from "@/components/ui/CartAddedNotification";
import { BrowserPolyfill } from "@/components/polyfills/BrowserPolyfill";
import { CartHydration } from "@/components/cart/CartHydration";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <CouponProvider>
                <FavoritesProvider>
                <LoginModalProvider>
                  <BrowserPolyfill />
                  <CartHydration />
                  <CartAddedNotification />
                  {children}
                </LoginModalProvider>
                </FavoritesProvider>
              </CouponProvider>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

