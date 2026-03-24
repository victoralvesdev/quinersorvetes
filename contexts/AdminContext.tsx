"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica no servidor se o cookie de sessão é válido
    fetch("/api/admin/check")
      .then((res) => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (password: string): Promise<boolean> => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  return (
    <AdminContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
