"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CardPaymentScreenProps {
  amount: number;
  orderId?: string;
  onBack: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  paymentType: 'credit_card' | 'debit_card';
}

interface PaymentResult {
  paymentId: string;
  status: string;
  statusDetail: string;
}

export function CardPaymentScreen({
  amount,
  orderId,
  onBack,
  onPaymentSuccess,
  paymentType
}: CardPaymentScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [expirationMonth, setExpirationMonth] = useState("");
  const [expirationYear, setExpirationYear] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [identificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [email, setEmail] = useState("");
  const [installments, setInstallments] = useState("1");

  // Mercado Pago instance
  const mpRef = useRef<any>(null);

  // Load Mercado Pago SDK
  useEffect(() => {
    const loadMercadoPagoSDK = async () => {
      if (window.MercadoPago) {
        initializeMercadoPago();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        initializeMercadoPago();
      };
      script.onerror = () => {
        setError("Erro ao carregar SDK do Mercado Pago");
      };
      document.body.appendChild(script);
    };

    const initializeMercadoPago = () => {
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
      if (!publicKey) {
        setError("Chave pública do Mercado Pago não configurada");
        return;
      }

      try {
        mpRef.current = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });
        setSdkLoaded(true);
      } catch (err) {
        console.error("Erro ao inicializar Mercado Pago:", err);
        setError("Erro ao inicializar pagamento");
      }
    };

    loadMercadoPagoSDK();
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(" ").substring(0, 19) : "";
  };

  // Format CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mpRef.current) {
      showToast("SDK não carregado. Tente novamente.", "error");
      return;
    }

    // Validation
    if (!cardNumber || !cardholderName || !expirationMonth || !expirationYear || !securityCode || !identificationNumber || !email) {
      showToast("Preencha todos os campos", "error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create card token
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardholderName: cardholderName.toUpperCase(),
        cardExpirationMonth: expirationMonth,
        cardExpirationYear: expirationYear.length === 2 ? `20${expirationYear}` : expirationYear,
        securityCode: securityCode,
        identificationType: identificationType,
        identificationNumber: identificationNumber.replace(/\D/g, ""),
      };

      console.log("Criando token do cartão...");

      const tokenResponse = await mpRef.current.createCardToken(cardData);

      if (tokenResponse.error) {
        const errorMsg = tokenResponse.error.message || "Erro ao processar cartão";
        throw new Error(translateSDKError(errorMsg));
      }

      console.log("Token criado:", tokenResponse.id);

      // Get payment method from card number
      const bin = cardNumber.replace(/\s/g, "").substring(0, 6);
      let paymentMethodId = paymentType === 'credit_card' ? 'visa' : 'debvisa';
      let issuerId = null;

      try {
        const paymentMethods = await mpRef.current.getPaymentMethods({ bin });
        if (paymentMethods.results && paymentMethods.results.length > 0) {
          const method = paymentMethods.results[0];
          paymentMethodId = method.id;
          issuerId = method.issuer?.id;
        }
      } catch (err) {
        console.warn("Não foi possível detectar bandeira, usando padrão");
      }

      // Send payment to backend
      const response = await fetch("/api/mercadopago/create-card-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: tokenResponse.id,
          amount: amount.toFixed(2),
          description: `Pedido ${orderId || "Quiner"}`,
          installments: paymentType === 'credit_card' ? parseInt(installments) : 1,
          paymentMethodId,
          issuerId,
          payerEmail: email,
          payerName: cardholderName,
          payerCpf: identificationNumber.replace(/\D/g, ""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao processar pagamento");
      }

      setPaymentResult(result);

      if (result.status === "approved") {
        showToast("Pagamento aprovado!", "success");
        // Não chama onPaymentSuccess automaticamente - espera o usuário clicar em Continuar
      } else if (result.status === "in_process" || result.status === "pending") {
        showToast("Pagamento em análise", "info");
      } else {
        const errorMessage = getStatusMessage(result.statusDetail);
        setError(errorMessage);
        showToast(errorMessage, "error");
      }
    } catch (err: any) {
      console.error("Erro no pagamento:", err);
      const rawMessage = err.message || "Erro ao processar pagamento";
      const errorMessage = translateSDKError(rawMessage);
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = (statusDetail: string): string => {
    const messages: Record<string, string> = {
      cc_rejected_bad_filled_card_number: "Número do cartão incorreto",
      cc_rejected_bad_filled_date: "Data de validade incorreta",
      cc_rejected_bad_filled_other: "Dados do cartão incorretos",
      cc_rejected_bad_filled_security_code: "Código de segurança incorreto",
      cc_rejected_blacklist: "Cartão não permitido",
      cc_rejected_call_for_authorize: "Ligue para autorizar",
      cc_rejected_card_disabled: "Cartão desabilitado",
      cc_rejected_card_error: "Erro no cartão",
      cc_rejected_duplicated_payment: "Pagamento duplicado",
      cc_rejected_high_risk: "Pagamento recusado por segurança",
      cc_rejected_insufficient_amount: "Saldo insuficiente",
      cc_rejected_invalid_installments: "Parcelas inválidas",
      cc_rejected_max_attempts: "Limite de tentativas excedido",
      cc_rejected_other_reason: "Pagamento recusado",
    };
    return messages[statusDetail] || "Pagamento recusado. Tente novamente.";
  };

  // Traduz erros do SDK do Mercado Pago
  const translateSDKError = (errorMessage: string): string => {
    const translations: Record<string, string> = {
      "Invalid user identification number": "CPF inválido. Verifique o número informado.",
      "Invalid card number": "Número do cartão inválido.",
      "Invalid cardholder name": "Nome do titular inválido.",
      "Invalid security code": "Código de segurança (CVV) inválido.",
      "Invalid expiration month": "Mês de validade inválido.",
      "Invalid expiration year": "Ano de validade inválido.",
      "Invalid card expiration": "Data de validade inválida.",
      "Card token creation failed": "Erro ao processar cartão. Verifique os dados.",
      "Invalid parameter": "Dados do cartão inválidos.",
      "Parameter cardNumber can not be null/empty": "Número do cartão é obrigatório.",
      "Parameter securityCode can not be null/empty": "Código de segurança é obrigatório.",
      "Parameter cardExpirationMonth can not be null/empty": "Mês de validade é obrigatório.",
      "Parameter cardExpirationYear can not be null/empty": "Ano de validade é obrigatório.",
      "Invalid card_number_validation": "Número do cartão inválido.",
      "Invalid security_code_validation": "Código de segurança inválido.",
    };

    // Verifica correspondência exata
    if (translations[errorMessage]) {
      return translations[errorMessage];
    }

    // Verifica correspondência parcial (case insensitive)
    const lowerMessage = errorMessage.toLowerCase();
    for (const [key, value] of Object.entries(translations)) {
      if (lowerMessage.includes(key.toLowerCase())) {
        return value;
      }
    }

    // Tradução genérica para erros não mapeados
    if (lowerMessage.includes("invalid")) {
      return "Dados inválidos. Verifique as informações do cartão.";
    }
    if (lowerMessage.includes("card")) {
      return "Erro no cartão. Verifique os dados informados.";
    }
    if (lowerMessage.includes("identification") || lowerMessage.includes("cpf")) {
      return "CPF inválido. Verifique o número informado.";
    }

    return errorMessage;
  };

  // Success screen
  if (paymentResult?.status === "approved") {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-secondary mb-2">Pagamento Aprovado!</h2>
            <p className="text-gray-600 text-center">
              Seu pagamento foi processado com sucesso.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              ID: {paymentResult.paymentId}
            </p>
          </div>
        </Card>
        <Button
          variant="primary"
          className="w-full"
          size="lg"
          onClick={() => onPaymentSuccess(paymentResult.paymentId)}
        >
          Continuar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-secondary">
            {paymentType === 'credit_card' ? 'Cartão de Crédito' : 'Cartão de Débito'}
          </h2>
          <p className="text-sm text-gray-600">Valor: {formatCurrency(amount)}</p>
        </div>
      </div>

      {!sdkLoaded ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Carregando...</p>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-4">
            {/* Card Number */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Número do Cartão
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="pl-10"
                />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Nome no Cartão
              </label>
              <Input
                type="text"
                placeholder="NOME COMO ESTÁ NO CARTÃO"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
              />
            </div>

            {/* Expiration and CVV */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Mês
                </label>
                <Input
                  type="text"
                  placeholder="MM"
                  value={expirationMonth}
                  onChange={(e) => setExpirationMonth(e.target.value.replace(/\D/g, "").substring(0, 2))}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Ano
                </label>
                <Input
                  type="text"
                  placeholder="AA"
                  value={expirationYear}
                  onChange={(e) => setExpirationYear(e.target.value.replace(/\D/g, "").substring(0, 2))}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  CVV
                </label>
                <Input
                  type="text"
                  placeholder="123"
                  value={securityCode}
                  onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, "").substring(0, 4))}
                  maxLength={4}
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                CPF do Titular
              </label>
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={identificationNumber}
                onChange={(e) => setIdentificationNumber(formatCPF(e.target.value))}
                maxLength={14}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Installments - only for credit card */}
            {paymentType === 'credit_card' && (
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Parcelas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="1">1x de {formatCurrency(amount)} (sem juros)</option>
                  <option value="2">2x de {formatCurrency(amount / 2)} (sem juros)</option>
                  <option value="3">3x de {formatCurrency(amount / 3)} (sem juros)</option>
                </select>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </Card>

          {/* Submit button */}
          <div className="pt-4">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                `Pagar ${formatCurrency(amount)}`
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-3">
              Pagamento processado com segurança pelo Mercado Pago
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
