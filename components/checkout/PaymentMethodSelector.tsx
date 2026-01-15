"use client";

import { PaymentMethod } from "@/types/checkout";
import { Card } from "@/components/ui/Card";
import { CreditCard, Smartphone, DollarSign, Check } from "lucide-react";

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}

const paymentMethods: {
  value: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "credit_card",
    label: "Cartão de Crédito",
    description: "Pague com cartão de crédito",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    value: "debit_card",
    label: "Cartão de Débito",
    description: "Pague com cartão de débito",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    value: "pix",
    label: "PIX",
    description: "Pagamento instantâneo",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    value: "cash_on_delivery",
    label: "Pagar na Entrega",
    description: "Dinheiro ou cartão na entrega",
    icon: <DollarSign className="w-5 h-5" />,
  },
];

export function PaymentMethodSelector({
  selectedMethod,
  onSelectMethod,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-secondary">Forma de Pagamento</h3>
      
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <Card
            key={method.value}
            className={`p-4 cursor-pointer transition-all ${
              selectedMethod === method.value
                ? "border-2 border-primary bg-primary/5"
                : "border border-gray-200 hover:border-primary/50"
            }`}
            onClick={() => onSelectMethod(method.value)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedMethod === method.value
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {method.icon}
                </div>
                <div>
                  <p className="font-semibold text-secondary">{method.label}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>
              {selectedMethod === method.value && (
                <div className="ml-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

