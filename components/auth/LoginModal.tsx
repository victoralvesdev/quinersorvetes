"use client";

import { useState, useRef, useEffect } from "react";
import { X, User, Phone, LogOut, ArrowLeft, MessageCircle, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

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

type Step = "form" | "verification";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente para input de código de verificação
function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const codeLength = 6;

  const handleChange = (index: number, inputValue: string) => {
    // Aceita apenas números
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const newValue = value.split("");
    newValue[index] = digit;
    const newCode = newValue.join("").slice(0, codeLength);
    onChange(newCode);

    // Move para o próximo input se digitou um número
    if (digit && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move para o input anterior no backspace
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, codeLength);
    onChange(pastedData);

    // Foca no próximo input vazio ou no último
    const nextIndex = Math.min(pastedData.length, codeLength - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: codeLength }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            value[index] ? "border-primary bg-primary/5" : "border-gray-200 bg-white",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
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

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("form");
      setVerificationCode("");
      setPendingPhone("");
      setPendingName("");
      setError(null);
      setSuccess(null);
      setResendCountdown(0);
    }
  }, [isOpen]);

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

  // Envia o código de verificação
  const sendVerificationCode = async (phone: string) => {
    setIsSendingCode(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar código");
      }

      setStep("verification");
      setResendCountdown(60); // 60 segundos para reenviar
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código de verificação");
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  // Verifica o código
  const verifyCode = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: pendingPhone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código inválido");
      }

      return true;
    } catch (err: any) {
      setError(err.message || "Código inválido");
      return false;
    }
  };

  // Login flow: solicita telefone -> envia código
  const onLoginSubmit = async (data: LoginFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    setPendingPhone(cleanedPhone);
    await sendVerificationCode(cleanedPhone);
  };

  // Register flow: solicita nome e telefone -> envia código
  const onRegisterSubmit = async (data: RegisterFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    setPendingPhone(cleanedPhone);
    setPendingName(data.name);
    await sendVerificationCode(cleanedPhone);
  };

  // Verifica código e completa login/registro
  const onVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await verifyCode();
      if (!isValid) {
        setIsLoading(false);
        return;
      }

      // Código verificado - procede com login ou registro
      if (isRegister) {
        await registerUser({
          name: pendingName,
          phone: pendingPhone,
        });
        setSuccess("Cadastro realizado com sucesso! Bem-vindo!");
      } else {
        await login(pendingPhone);
        setSuccess("Login realizado com sucesso!");
      }

      resetLogin();
      resetRegister();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao completar autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    await sendVerificationCode(pendingPhone);
  };

  // Voltar para o formulário
  const handleBack = () => {
    setStep("form");
    setVerificationCode("");
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setIsRegister(false);
    setStep("form");
    setVerificationCode("");
    setPendingPhone("");
    setPendingName("");
    resetLogin();
    resetRegister();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] md:z-[130] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5 text-secondary" />
        </button>

        {/* Back Button (verification step) */}
        {step === "verification" && !isAuthenticated && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-600 text-sm font-medium text-center">{success}</p>
          </div>
        )}

        {/* Authenticated Profile View */}
        {isAuthenticated && user ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Meu Perfil</h2>
              <p className="text-secondary/60 text-sm">Suas informações de conta</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Nome</p>
                  <p className="text-lg font-semibold text-secondary-dark">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark rounded-xl flex items-center justify-center shadow-lg">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Telefone</p>
                  <p className="text-lg font-semibold text-secondary-dark">
                    {formatPhone(user.phone)}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair da Conta
            </button>
          </div>
        ) : step === "verification" ? (
          /* Verification Step */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-dark mb-2">
                Verificação
              </h2>
              <p className="text-secondary/60 text-sm">
                Enviamos um código de 6 dígitos para o WhatsApp
              </p>
              <p className="text-primary font-semibold mt-1">
                {formatPhone(pendingPhone)}
              </p>
            </div>

            <div className="space-y-4">
              <CodeInput
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={isLoading}
              />

              <button
                onClick={onVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                  verificationCode.length === 6 && !isLoading
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verificar Código"
                )}
              </button>
            </div>

            {/* Resend Code */}
            <div className="text-center">
              {resendCountdown > 0 ? (
                <p className="text-sm text-secondary/60">
                  Reenviar código em <span className="font-semibold text-primary">{resendCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={isSendingCode}
                  className="text-sm text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
                >
                  {isSendingCode ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Reenviar código
                </button>
              )}
            </div>

            <p className="text-xs text-secondary/50 text-center">
              Todas as atualizações dos seus pedidos serão enviadas pelo WhatsApp
            </p>
          </div>
        ) : isRegister ? (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Cadastre-se</h2>
              <p className="text-secondary/60 text-sm">Preencha seus dados para continuar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Nome completo
              </label>
              <Input
                {...registerForm("name")}
                type="text"
                placeholder="Seu nome"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.name && "border-red-500"
                )}
              />
              {registerErrors.name && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Telefone (WhatsApp)
              </label>
              <Input
                {...registerForm("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.phone && "border-red-500"
                )}
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
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação via WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingCode}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSendingCode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Continuar"
              )}
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Entrar</h2>
              <p className="text-secondary/60 text-sm">Digite seu telefone para continuar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Telefone (WhatsApp)
              </label>
              <Input
                {...registerLogin("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  "h-12 rounded-xl",
                  loginErrors.phone && "border-red-500"
                )}
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
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação via WhatsApp
              </p>
            </div>

            <button
              type="submit"
              disabled={isSendingCode}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isSendingCode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando código...
                </>
              ) : (
                "Continuar"
              )}
            </button>
          </form>
        )}

        {/* Toggle Login/Register */}
        {!isAuthenticated && step === "form" && (
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                resetLogin();
                resetRegister();
              }}
              className="text-sm text-primary font-medium hover:underline"
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
