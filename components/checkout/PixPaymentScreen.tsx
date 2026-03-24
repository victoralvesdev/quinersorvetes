"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  QrCode,
  Clock,
  AlertCircle,
  ChevronDown,
  User,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, cn } from "@/lib/utils";
import Image from "next/image";

interface PixPaymentScreenProps {
  amount: number;
  orderId?: string;
  savedCpf?: string;
  onBack: () => void;
  onPaymentCreated?: (paymentId: string) => void;
  onCpfSaved?: (cpf: string) => Promise<void>;
  onContinue: () => void;
}

interface PixData {
  paymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

const steps = [
  {
    number: 1,
    title: "Copie o código",
    icon: Copy,
  },
  {
    number: 2,
    title: "Abra seu banco",
    icon: Smartphone,
  },
  {
    number: 3,
    title: "Cole e pague",
    icon: QrCode,
  },
];

function formatCPF(value: string) {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

function validarCPF(cpf: string) {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11 || /^(\d)\1{10}$/.test(nums)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(nums[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(nums[10]);
}

export function PixPaymentScreen({
  amount,
  orderId,
  savedCpf,
  onBack,
  onPaymentCreated,
  onCpfSaved,
  onContinue,
}: PixPaymentScreenProps) {
  const [cpf, setCpf] = useState(savedCpf || "");
  const [cpfConfirmado, setCpfConfirmado] = useState(!!savedCpf);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const { showToast } = useToast();

  // Só gera o PIX após o CPF ser confirmado
  useEffect(() => {
    if (cpfConfirmado && !pixData && !isLoading) {
      createPixPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfConfirmado]);

  // Polling automático a cada 10s para detectar pagamento sem o usuário clicar
  useEffect(() => {
    if (!pixData?.paymentId || paymentConfirmed) return;

    const intervalo = setInterval(async () => {
      try {
        const res = await fetch(`/api/mercadopago/check-payment?paymentId=${pixData.paymentId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "approved") {
          setPaymentConfirmed(true);
          clearInterval(intervalo);
          showToast("Pagamento confirmado! ✓", "success");
          setTimeout(() => onContinue(), 1500);
        }
      } catch {
        // silencia erros de polling
      }
    }, 10000);

    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixData?.paymentId, paymentConfirmed]);

  const createPixPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          description: `Pedido ${orderId || "N/A"}`,
          payerCpf: cpf.replace(/\D/g, ""),
          orderId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar pagamento PIX");
      }

      const data = await response.json();
      setPixData(data);

      if (onPaymentCreated) {
        onPaymentCreated(data.paymentId);
      }
    } catch (error: any) {
      console.error("Erro ao criar pagamento PIX:", error);
      showToast("Erro ao gerar código PIX. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      showToast("Código PIX copiado!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar:", error);
      showToast("Erro ao copiar código PIX", "error");
    }
  };

  // Tela de CPF — aparece antes de gerar o PIX
  if (!cpfConfirmado) {
    const cpfValido = validarCPF(cpf);
    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-secondary-dark">Pagamento PIX</h2>
            <p className="text-sm text-secondary/60">
              Valor: <span className="font-semibold text-primary">{formatCurrency(amount)}</span>
            </p>
          </div>
        </div>

        {/* CPF Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-secondary-dark text-sm">Identificação do pagador</p>
              <p className="text-xs text-secondary/60">Necessário para emitir o PIX</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">
              Seu CPF
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              maxLength={14}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary font-mono text-lg"
              autoFocus
            />
            {cpf.replace(/\D/g, "").length === 11 && !cpfValido && (
              <p className="text-xs text-red-500 mt-1.5">CPF inválido. Verifique o número.</p>
            )}
          </div>

          <button
            onClick={() => {
              if (!cpfValido) {
                showToast("CPF inválido. Verifique o número.", "error");
                return;
              }
              setCpfConfirmado(true);
              if (onCpfSaved) onCpfSaved(cpf.replace(/\D/g, ""));
            }}
            disabled={!cpfValido}
            className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Gerar QR Code PIX
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 text-secondary/60 hover:text-secondary font-medium text-sm transition-colors"
        >
          Escolher outra forma de pagamento
        </button>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/20 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-secondary-dark mb-2">Gerando código PIX</h3>
        <p className="text-secondary/60 text-center">Aguarde um momento...</p>
      </div>
    );
  }

  // Error State
  if (!pixData || !pixData.qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-secondary-dark mb-2">Erro ao gerar PIX</h3>
        <p className="text-secondary/60 text-center mb-6">
          Não foi possível gerar o código PIX. Tente novamente.
        </p>
        <button
          onClick={createPixPayment}
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-300"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-secondary" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-secondary-dark">Pagamento PIX</h2>
          <p className="text-sm text-secondary/60">
            Valor: <span className="font-semibold text-primary">{formatCurrency(amount)}</span>
          </p>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Aguardando pagamento</p>
            <p className="text-xs text-amber-600">
              Após o pagamento, você receberá a confirmação por WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex justify-between px-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  index === 0
                    ? "bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/25"
                    : "bg-gray-100 text-secondary/50"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-secondary/70 text-center max-w-[80px]">
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* PIX Code Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-secondary/70">Código PIX Copia e Cola</p>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Ativo
            </div>
          </div>

          {/* Code Display */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-24 overflow-y-auto">
            <p className="text-xs font-mono text-secondary break-all leading-relaxed">
              {pixData.qrCode}
            </p>
          </div>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className={cn(
              "w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3",
              copied
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98]"
            )}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Código Copiado!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copiar Código PIX
              </>
            )}
          </button>
        </div>

        {/* QR Code Toggle */}
        {pixData.qrCodeBase64 && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full px-5 py-3 flex items-center justify-between text-secondary/70 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showQrCode ? "Ocultar" : "Mostrar"} QR Code
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-300",
                  showQrCode && "rotate-180"
                )}
              />
            </button>

            {/* QR Code Image */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                showQrCode ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="p-5 pt-0 flex flex-col items-center">
                <div className="p-3 bg-white rounded-2xl border-2 border-primary/20 shadow-lg">
                  <Image
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>
                <p className="text-xs text-secondary/50 mt-3 text-center">
                  Escaneie com o app do seu banco
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Finalize Button */}
      <button
        onClick={async () => {
          if (paymentConfirmed) { onContinue(); return; }
          if (!pixData?.paymentId) return;
          setIsVerifying(true);
          try {
            const res = await fetch(`/api/mercadopago/check-payment?paymentId=${pixData.paymentId}`);
            const data = await res.json();
            if (data.status === "approved") {
              setPaymentConfirmed(true);
              showToast("Pagamento confirmado! ✓", "success");
              setTimeout(() => onContinue(), 800);
            } else {
              showToast("Pagamento ainda não confirmado. Aguarde alguns instantes.", "error");
            }
          } catch {
            showToast("Erro ao verificar pagamento. Tente novamente.", "error");
          } finally {
            setIsVerifying(false);
          }
        }}
        disabled={isVerifying || paymentConfirmed}
        className="w-full py-4 rounded-xl font-bold text-base bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-xl active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isVerifying ? (
          <>
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Verificando pagamento...
          </>
        ) : paymentConfirmed ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Pagamento confirmado!
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            Já realizei o pagamento
          </>
        )}
      </button>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="w-full py-3 text-secondary/60 hover:text-secondary font-medium text-sm transition-colors"
      >
        Escolher outra forma de pagamento
      </button>
    </div>
  );
}
