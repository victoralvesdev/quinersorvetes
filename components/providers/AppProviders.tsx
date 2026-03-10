"use client";

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { LoginModalProvider } from "@/contexts/LoginModalContext";
import { CouponProvider } from "@/contexts/CouponContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";
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
                <LoginModalProvider>
                  <BrowserPolyfill />
                  <CartHydration />
                  {children}
                </LoginModalProvider>
              </CouponProvider>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

