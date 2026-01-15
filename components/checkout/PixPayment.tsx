"use client";

import { useState, useEffect } from "react";
import { Copy, QrCode, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

interface PixPaymentProps {
  amount: number;
  orderId?: string;
  onPaymentCreated?: (paymentId: string) => void;
}

interface PixData {
  paymentId: string;
  status: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  ticketUrl: string | null;
}

export function PixPayment({ amount, orderId, onPaymentCreated }: PixPaymentProps) {
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Criar pagamento PIX quando o componente montar (apenas uma vez)
    let isMounted = true;
    
    if (!pixData && !isLoading) {
      createPixPayment();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-gray-600">Gerando código PIX...</p>
        </div>
      </Card>
    );
  }

  if (!pixData || !pixData.qrCode) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Erro ao gerar código PIX</p>
          <Button variant="outline" onClick={createPixPayment}>
            Tentar Novamente
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-secondary mb-2">
          Pagamento via PIX
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Copie o código abaixo e cole no app do seu banco para pagar
        </p>
      </div>

      {/* Código PIX Copia e Cola */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-secondary">
          Código PIX (Copia e Cola)
        </label>
        <div className="flex gap-2">
          <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 break-all">
            <p className="text-sm font-mono text-gray-800">{pixData.qrCode}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Botão para mostrar QR Code */}
      {pixData.qrCodeBase64 && (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowQrCode(!showQrCode)}
          >
            <QrCode className="w-4 h-4 mr-2" />
            {showQrCode ? 'Ocultar' : 'Mostrar'} QR Code
          </Button>

          {showQrCode && (
            <div className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200">
              <img
                src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Escaneie com o app do seu banco
              </p>
            </div>
          )}
        </div>
      )}

      {/* Informações adicionais */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Após o pagamento, seu pedido será processado automaticamente
        </p>
      </div>
    </Card>
  );
}

