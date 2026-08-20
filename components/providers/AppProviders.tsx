"use client";

import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { LoginModalProvider, useLoginModal } from "@/contexts/LoginModalContext";
import { CouponProvider } from "@/contexts/CouponContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { PointsProvider } from "@/contexts/PointsContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ToastProvider } from "@/components/ui/Toast";
import { CartAddedNotification } from "@/components/ui/CartAddedNotification";
import { BrowserPolyfill } from "@/components/polyfills/BrowserPolyfill";
import { CartHydration } from "@/components/cart/CartHydration";
import { LoginModal } from "@/components/auth/LoginModal";

function GlobalLoginModal() {
  const { isOpen, closeModal } = useLoginModal();
  return <LoginModal isOpen={isOpen} onClose={closeModal} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <CouponProvider>
                <FavoritesProvider>
                <PointsProvider>
                <LoginModalProvider>
                  <BrowserPolyfill />
                  <CartHydration />
                  <CartAddedNotification />
                  <GlobalLoginModal />
                  {children}
                </LoginModalProvider>
                </PointsProvider>
                </FavoritesProvider>
              </CouponProvider>
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}

