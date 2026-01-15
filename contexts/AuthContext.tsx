"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/user";
import { findOrCreateUser, getUserByPhone } from "@/lib/supabase/users";
import { UserFormData } from "@/types/user";
import { useCartStore } from "@/store/cartStore";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  register: (data: UserFormData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Verificar se está no cliente antes de acessar localStorage
        if (typeof window === "undefined") {
          setIsLoading(false);
          return;
        }

        const savedPhone = localStorage.getItem("quiner_user_phone");
        if (savedPhone) {
          const userData = await getUserByPhone(savedPhone);
          if (userData) {
            setUser(userData);
          } else {
            localStorage.removeItem("quiner_user_phone");
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

  const login = async (phone: string) => {
    try {
      setIsLoading(true);
      const userData = await getUserByPhone(phone);
      if (userData) {
        setUser(userData);
        if (typeof window !== "undefined") {
          localStorage.setItem("quiner_user_phone", phone);
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
      const userData = await findOrCreateUser(data);
      setUser(userData);
      if (typeof window !== "undefined") {
        localStorage.setItem("quiner_user_phone", data.phone);
      }
    } catch (error) {
      console.error("Erro ao registrar:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("quiner_user_phone");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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

