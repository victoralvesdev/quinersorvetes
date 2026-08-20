"use client";

import { useState, useRef, useEffect } from "react";
import { X, User, Phone, Mail, LogOut, ArrowLeft, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import type { User as UserType } from "@/types/user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

const recoverPhoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .regex(/^[\d\s()-]+$/, "Telefone inválido"),
});

const recoverEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type RecoverPhoneFormData = z.infer<typeof recoverPhoneSchema>;
type RecoverEmailFormData = z.infer<typeof recoverEmailSchema>;

type Step = "form" | "recoverPhone" | "recoverEmail" | "verification";

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
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    const newValue = value.split("");
    newValue[index] = digit;
    const newCode = newValue.join("").slice(0, codeLength);
    onChange(newCode);

    if (digit && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, codeLength);
    onChange(pastedData);

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
  const [notRegisteredInfo, setNotRegisteredInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [linkingUserId, setLinkingUserId] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { user, isAuthenticated, setSession, logout } = useAuth();

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
    setValue: setRegisterValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerRecoverPhone,
    handleSubmit: handleRecoverPhoneSubmit,
    formState: { errors: recoverPhoneErrors },
    reset: resetRecoverPhone,
  } = useForm<RecoverPhoneFormData>({
    resolver: zodResolver(recoverPhoneSchema),
  });

  const {
    register: registerRecoverEmail,
    handleSubmit: handleRecoverEmailSubmit,
    formState: { errors: recoverEmailErrors },
    reset: resetRecoverEmail,
  } = useForm<RecoverEmailFormData>({
    resolver: zodResolver(recoverEmailSchema),
  });

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (!isOpen) {
      setStep("form");
      setIsRegister(false);
      setVerificationCode("");
      setPendingEmail("");
      setPendingName("");
      setPendingPhone("");
      setLinkingUserId(null);
      setError(null);
      setSuccess(null);
      setNotRegisteredInfo(null);
      setResendCountdown(0);
      resetLogin();
      resetRegister();
      resetRecoverPhone();
      resetRecoverEmail();
    }
  }, [isOpen, resetLogin, resetRegister, resetRecoverPhone, resetRecoverEmail]);

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

  const sendVerificationCode = async (email: string) => {
    setIsSendingCode(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar código");
      }

      setStep("verification");
      setResendCountdown(60);
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao enviar código de verificação");
      return false;
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async (): Promise<UserType | null> => {
    try {
      const action: "login" | "register" | "link" = linkingUserId
        ? "link"
        : isRegister
        ? "register"
        : "login";

      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: pendingEmail,
          code: verificationCode,
          action,
          ...(action === "register" ? { name: pendingName, phone: pendingPhone } : {}),
          ...(action === "link" ? { phone: pendingPhone } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código inválido");
      }

      return data.user as UserType;
    } catch (err: any) {
      setError(err.message || "Código inválido");
      return null;
    }
  };

  // Login flow: verifica se o email existe -> envia código, ou oferece
  // cadastro/recuperação por telefone
  const onLoginSubmit = async (data: LoginFormData) => {
    const cleanedEmail = data.email.trim().toLowerCase();
    setIsSendingCode(true);
    setError(null);
    setNotRegisteredInfo(null);
    setLinkingUserId(null);

    try {
      const userRes = await fetch(`/api/users?email=${encodeURIComponent(cleanedEmail)}`);
      const existingUser = userRes.ok ? await userRes.json() : null;

      if (!existingUser) {
        setIsSendingCode(false);
        setPendingEmail(cleanedEmail);
        setNotRegisteredInfo("Não encontramos uma conta com esse email.");
        return;
      }
    } catch {
      setIsSendingCode(false);
      setPendingEmail(cleanedEmail);
      await sendVerificationCode(cleanedEmail);
      return;
    }

    setIsSendingCode(false);
    setPendingEmail(cleanedEmail);
    await sendVerificationCode(cleanedEmail);
  };

  // Register flow: nome + telefone + email -> envia código
  const onRegisterSubmit = async (data: RegisterFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    const cleanedEmail = data.email.trim().toLowerCase();
    setPendingPhone(cleanedPhone);
    setPendingName(data.name);
    setPendingEmail(cleanedEmail);
    setLinkingUserId(null);
    await sendVerificationCode(cleanedEmail);
  };

  // Recuperação passo 1: localiza a conta antiga pelo telefone
  const onRecoverPhoneSubmit = async (data: RecoverPhoneFormData) => {
    const cleanedPhone = data.phone.replace(/\D/g, "");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/users?phone=${encodeURIComponent(cleanedPhone)}`);
      const foundUser = res.ok ? await res.json() : null;

      if (!foundUser) {
        setError("Não encontramos nenhuma conta com esse telefone. Faça um novo cadastro.");
        setIsLoading(false);
        return;
      }

      setLinkingUserId(foundUser.id);
      setPendingName(foundUser.name);
      setPendingPhone(cleanedPhone);
      setStep("recoverEmail");
    } catch {
      setError("Erro ao buscar sua conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Recuperação passo 2: confirma o email a vincular e envia o código
  const onRecoverEmailSubmit = async (data: RecoverEmailFormData) => {
    const cleanedEmail = data.email.trim().toLowerCase();
    setPendingEmail(cleanedEmail);
    await sendVerificationCode(cleanedEmail);
  };

  // Verifica código e completa login/registro/vínculo de email
  const onVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Digite o código completo de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const verifiedUser = await verifyCode();
      if (!verifiedUser) {
        setIsLoading(false);
        return;
      }

      setSession(verifiedUser);

      if (linkingUserId) {
        setSuccess("Email vinculado com sucesso! Login realizado.");
      } else if (isRegister) {
        setSuccess("Cadastro realizado com sucesso! Bem-vindo!");
      } else {
        setSuccess("Login realizado com sucesso!");
      }

      resetLogin();
      resetRegister();
      resetRecoverPhone();
      resetRecoverEmail();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao completar autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    await sendVerificationCode(pendingEmail);
  };

  const handleBackFromVerification = () => {
    if (linkingUserId) {
      setStep("recoverEmail");
    } else {
      setStep("form");
      setLinkingUserId(null);
    }
    setVerificationCode("");
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setIsRegister(false);
    setStep("form");
    setVerificationCode("");
    setPendingEmail("");
    setPendingName("");
    setPendingPhone("");
    setLinkingUserId(null);
    resetLogin();
    resetRegister();
    resetRecoverPhone();
    resetRecoverEmail();
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

        {/* Back Button */}
        {(step === "verification" || step === "recoverPhone" || step === "recoverEmail") &&
          !isAuthenticated && (
            <button
              onClick={() => {
                if (step === "verification") {
                  handleBackFromVerification();
                } else if (step === "recoverEmail") {
                  setStep("recoverPhone");
                  setError(null);
                } else if (step === "recoverPhone") {
                  setStep("form");
                  setLinkingUserId(null);
                  setError(null);
                }
              }}
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
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">Email</p>
                  <p className="text-lg font-semibold text-secondary-dark">
                    {user.email || "—"}
                  </p>
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
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-secondary-dark mb-2">
                Verificação
              </h2>
              <p className="text-secondary/60 text-sm">
                Enviamos um código de 6 dígitos para o email
              </p>
              <p className="text-primary font-semibold mt-1">
                {pendingEmail}
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
        ) : step === "recoverPhone" ? (
          /* Recover step 1: locate old account by phone */
          <form onSubmit={handleRecoverPhoneSubmit(onRecoverPhoneSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Já tenho conta</h2>
              <p className="text-secondary/60 text-sm">
                Digite o telefone que você usava para localizar sua conta
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Telefone (WhatsApp)
              </label>
              <Input
                {...registerRecoverPhone("phone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className={cn(
                  "h-12 rounded-xl",
                  recoverPhoneErrors.phone && "border-red-500"
                )}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  e.target.value = formatted;
                  registerRecoverPhone("phone").onChange(e);
                }}
              />
              {recoverPhoneErrors.phone && (
                <p className="text-red-500 text-xs mt-1">
                  {recoverPhoneErrors.phone.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2",
                "bg-gradient-to-r from-primary to-primary-dark text-white",
                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                "disabled:opacity-70 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Localizar conta"
              )}
            </button>
          </form>
        ) : step === "recoverEmail" ? (
          /* Recover step 2: confirm the email to link */
          <form onSubmit={handleRecoverEmailSubmit(onRecoverEmailSubmit)} className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-dark">Confirme seu email</h2>
              <p className="text-secondary/60 text-sm">
                {pendingName ? `Encontramos sua conta, ${pendingName.split(" ")[0]}! ` : ""}
                Cadastre um email para entrar a partir de agora
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerRecoverEmail("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  recoverEmailErrors.email && "border-red-500"
                )}
              />
              {recoverEmailErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {recoverEmailErrors.email.message}
                </p>
              )}
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
                "Enviar código"
              )}
            </button>
          </form>
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
                Usaremos para as atualizações do seu pedido via WhatsApp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerForm("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  registerErrors.email && "border-red-500"
                )}
              />
              {registerErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {registerErrors.email.message}
                </p>
              )}
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação neste email
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
              <p className="text-secondary/60 text-sm">Digite seu email para continuar</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-dark mb-2">
                Email
              </label>
              <Input
                {...registerLogin("email")}
                type="email"
                placeholder="seu@email.com"
                className={cn(
                  "h-12 rounded-xl",
                  loginErrors.email && "border-red-500"
                )}
              />
              {loginErrors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {loginErrors.email.message}
                </p>
              )}
              <p className="text-xs text-secondary/50 mt-1">
                Você receberá um código de verificação neste email
              </p>
            </div>

            {notRegisteredInfo && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <p className="text-amber-700 text-sm text-center font-medium">{notRegisteredInfo}</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setNotRegisteredInfo(null);
                      resetRegister();
                      setRegisterValue("email", pendingEmail);
                    }}
                    className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    Criar conta com esse email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNotRegisteredInfo(null);
                      setStep("recoverPhone");
                    }}
                    className="w-full py-2.5 rounded-xl border-2 border-amber-300 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Já sou cliente, localizar por telefone
                  </button>
                </div>
              </div>
            )}

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
                setNotRegisteredInfo(null);
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
