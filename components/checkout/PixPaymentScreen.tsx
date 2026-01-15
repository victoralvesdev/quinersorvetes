"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, QrCode, Check, Loader2, ArrowLeft, CheckCircle2, Smartphone, CreditCard, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";

interface PixPaymentScreenProps {
  amount: number;
  orderId?: string;
  onBack: () => void;
  onPaymentCreated?: (paymentId: string) => void;
  onContinue: () => void;
}

interface PixData {
  paymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'in_process' | 'checking';

const steps = [
  {
    number: 1,
    title: "Copie o código PIX",
    description: "Clique no botão de copiar ao lado do código",
    icon: Copy,
  },
  {
    number: 2,
    title: "Abra o app do seu banco",
    description: "Acesse a área PIX no aplicativo do seu banco",
    icon: Smartphone,
  },
  {
    number: 3,
    title: "Cole o código e confirme",
    description: "Cole o código copiado e confirme o pagamento",
    icon: CreditCard,
  },
  {
    number: 4,
    title: "Aguarde a confirmação",
    description: "Seu pedido será processado automaticamente",
    icon: Clock,
  },
];

export function PixPaymentScreen({
  amount,
  orderId,
  onBack,
  onPaymentCreated,
  onContinue
}: PixPaymentScreenProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  // Função para verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!pixData?.paymentId) return;

    try {
      setIsCheckingStatus(true);
      const response = await fetch(`/api/mercadopago/check-payment?paymentId=${pixData.paymentId}`);

      if (!response.ok) {
        console.error('Erro ao verificar status do pagamento');
        return;
      }

      const data = await response.json();
      const newStatus = data.status as PaymentStatus;

      setPaymentStatus(newStatus);

      // Se pagamento foi aprovado, para o polling e finaliza
      if (newStatus === 'approved') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        showToast('Pagamento confirmado!', 'success');
        // Aguarda um momento para o usuário ver a confirmação
        setTimeout(() => {
          onContinue();
        }, 1500);
      } else if (newStatus === 'rejected' || newStatus === 'cancelled') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        showToast('Pagamento não aprovado. Tente novamente.', 'error');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [pixData?.paymentId, onContinue, showToast]);

  useEffect(() => {
    // Criar pagamento PIX quando o componente montar
    if (!pixData && !isLoading) {
      createPixPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicia polling quando o PIX é gerado
  useEffect(() => {
    if (pixData?.paymentId && paymentStatus === 'pending') {
      // Verifica a cada 5 segundos
      pollingRef.current = setInterval(() => {
        checkPaymentStatus();
      }, 5000);

      // Faz primeira verificação após 3 segundos
      setTimeout(() => {
        checkPaymentStatus();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [pixData?.paymentId, paymentStatus, checkPaymentStatus]);

  const createPixPayment = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mercadopago/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount.toFixed(2),
          description: `Pedido ${orderId || 'N/A'}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar pagamento PIX');
      }

      const data = await response.json();
      setPixData(data);
      
      if (onPaymentCreated) {
        onPaymentCreated(data.paymentId);
      }
    } catch (error: any) {
      console.error('Erro ao criar pagamento PIX:', error);
      showToast('Erro ao gerar código PIX. Tente novamente.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.qrCode) return;

    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      showToast('Código PIX copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      showToast('Erro ao copiar código PIX', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-secondary">Pagamento via PIX</h2>
          <p className="text-sm text-gray-600">Valor: {formatCurrency(amount)}</p>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Gerando código PIX...</p>
            <p className="text-sm text-gray-500 mt-2">Aguarde um momento</p>
          </div>
        </Card>
      ) : !pixData || !pixData.qrCode ? (
        <Card className="p-8">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4 text-lg">Erro ao gerar código PIX</p>
            <Button variant="outline" onClick={createPixPayment}>
              Tentar Novamente
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Código PIX Copia e Cola */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-secondary mb-2">
                  Código PIX (Copia e Cola)
                </h3>
                <p className="text-sm text-gray-600">
                  Copie o código abaixo e cole no app do seu banco
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">
                  Código PIX
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 p-4 bg-gray-50 rounded-lg border-2 border-gray-200 break-all">
                    <p className="text-sm font-mono text-gray-800 leading-relaxed">
                      {pixData.qrCode}
                    </p>
                  </div>
                  <Button
                    variant={copied ? "primary" : "outline"}
                    size="lg"
                    onClick={copyToClipboard}
                    className="flex-shrink-0 h-auto px-4"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Botão para mostrar QR Code */}
              {pixData.qrCodeBase64 && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowQrCode(!showQrCode)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showQrCode ? 'Ocultar' : 'Mostrar'} QR Code
                  </Button>

                  {/* QR Code - só aparece quando showQrCode for true */}
                  {showQrCode && (
                    <div className="flex flex-col items-center pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-secondary mb-4">
                        Escaneie o QR Code
                      </h3>
                      <div className="p-4 bg-white rounded-lg border-2 border-primary mb-4">
                        <img
                          src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                          alt="QR Code PIX"
                          className="w-64 h-64"
                        />
                      </div>
                      <p className="text-sm text-gray-600 text-center">
                        Abra o app do seu banco e escaneie o código acima
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          {/* Passo a Passo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary mb-6 text-center">
              Como pagar com PIX
            </h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-secondary">{step.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Status do Pagamento */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              {paymentStatus === 'approved' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">
                    Pagamento Confirmado!
                  </h3>
                  <p className="text-gray-600">
                    Seu pagamento foi aprovado. Finalizando pedido...
                  </p>
                </>
              ) : paymentStatus === 'rejected' || paymentStatus === 'cancelled' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">
                    Pagamento não aprovado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    O pagamento foi recusado ou cancelado.
                  </p>
                  <Button variant="primary" onClick={createPixPayment}>
                    Gerar novo código PIX
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    {isCheckingStatus ? (
                      <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                    ) : (
                      <Clock className="w-10 h-10 text-yellow-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-yellow-600 mb-2">
                    Aguardando Pagamento
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Realize o pagamento usando o código PIX acima.
                  </p>
                  <p className="text-sm text-gray-500">
                    {isCheckingStatus ? 'Verificando...' : 'Verificando automaticamente a cada 5 segundos'}
                  </p>
                </>
              )}
            </div>
          </Card>

          {/* Botão Voltar */}
          {paymentStatus !== 'approved' && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                Voltar e escolher outra forma de pagamento
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

