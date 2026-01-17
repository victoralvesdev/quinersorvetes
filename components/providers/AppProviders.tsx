"use client";

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { LoginModalProvider } from "@/contexts/LoginModalContext";
import { ToastProvider } from "@/components/ui/Toast";
import { BrowserPolyfill } from "@/components/polyfills/BrowserPolyfill";
import { CartHydration } from "@/components/cart/CartHydration";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <LoginModalProvider>
              <BrowserPolyfill />
              <CartHydration />
              {children}
            </LoginModalProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

