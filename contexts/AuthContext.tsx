"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserFormData } from "@/types/user";
import { useCartStore } from "@/store/cartStore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (data: UserFormData) => Promise<void>;
  setSession: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (typeof window === "undefined") {
          setIsLoading(false);
          return;
        }

        const savedEmail = localStorage.getItem("quiner_user_email");
        if (savedEmail) {
          const res = await fetch(`/api/users?email=${encodeURIComponent(savedEmail)}`);
          const userData: User | null = res.ok ? await res.json() : null;
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("quiner_user_email");
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const userData: User | null = res.ok ? await res.json() : null;
      if (userData) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("quiner_user_email", email);
        }
      } else {
        throw new Error("Usuário não encontrado. Faça o cadastro primeiro.");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: UserFormData) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao registrar usuário');
      const userData: User = await res.json();
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("quiner_user_email", data.email);
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setSession = (userData: User) => {
    setUser(userData);
    if (typeof window !== "undefined" && userData.email) {
      localStorage.setItem("quiner_user_email", userData.email);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quiner_user_email");
    }
  };

  const refreshUser = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(user.email)}`);
      const userData: User | null = res.ok ? await res.json() : null;
      if (userData) setUser(userData);
    } catch {
      // silencia
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        setSession,
        logout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

