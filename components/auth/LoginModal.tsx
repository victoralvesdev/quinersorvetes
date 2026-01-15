"use client";

import { useState } from "react";
import { X, User, Phone, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const phoneRegex = /^(\d{2})\s?(\d{4,5})-?(\d{4})$/;

const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, login, register: registerUser, logout } = useAuth();

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegister,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  if (!isOpen) return null;

  const formatPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const onLogin = async (data: LoginFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const cleanedPhone = data.phone.replace(/\D/g, "");
      await login(cleanedPhone);
      resetLogin();
      setSuccess("Login realizado com sucesso!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    try {
      setError(null);
      setSuccess(null);
      setIsLoading(true);
      const cleanedPhone = data.phone.replace(/\D/g, "");
      await registerUser({
        name: data.name,
        phone: cleanedPhone,
      });
      resetRegister();
      setSuccess("Cadastro realizado com sucesso! Bem-vindo!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsRegister(false);
    resetLogin();
    resetRegister();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[120] md:z-[130] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative shadow-xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 bg-white hover:bg-gray-100 rounded-full p-1 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-secondary mb-2">
            {isAuthenticated ? "Meu Perfil" : isRegister ? "Cadastre-se" : "Entrar"}
          </h2>
          <p className="text-gray-600 text-sm">
            {isAuthenticated
              ? "Suas informações de conta"
              : isRegister
              ? "Preencha seus dados para continuar"
              : "Digite seu telefone para continuar"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{success}</p>
          </div>
        )}

        {isAuthenticated && user ? (
          // Tela de perfil quando autenticado
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="text-lg font-semibold text-secondary">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="text-lg font-semibold text-secondary">
                    {formatPhone(user.phone)}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </Button>
          </div>
        ) : isRegister ? (
          <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Nome completo
              </label>
              <Input
                {...registerForm("name")}
                type="text"
                placeholder="Seu nome"
                className={registerErrors.name ? "border-red-500" : ""}
              />
              {registerErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Telefone
              </label>
              <Input
                {...registerForm("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={registerErrors.phone ? "border-red-500" : ""}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  registerForm("phone").onChange(e);
                }}
              />
              {registerErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.phone.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Telefone
              </label>
              <Input
                {...registerLogin("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={loginErrors.phone ? "border-red-500" : ""}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  registerLogin("phone").onChange(e);
                }}
              />
              {loginErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {loginErrors.phone.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        {!isAuthenticated && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                resetLogin();
                resetRegister();
              }}
              className="text-sm text-primary hover:underline"
            >
              {isRegister
                ? "Já tem conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

