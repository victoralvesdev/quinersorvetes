"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Senha admin padrão (em produção, isso deve ser mais seguro)
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se está autenticado no localStorage
    if (typeof window !== "undefined") {
      const adminAuth = localStorage.getItem("quiner_admin_auth");
      setIsAuthenticated(adminAuth === "true");
    }
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<boolean> => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("quiner_admin_auth", "true");
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quiner_admin_auth");
    }
  };

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin deve ser usado dentro de um AdminProvider");
  }
  return context;
};

