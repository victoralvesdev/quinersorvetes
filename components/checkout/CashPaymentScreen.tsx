"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Coins,
  HandCoins,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface CashPaymentScreenProps {
  amount: number;
  onBack: () => void;
  onContinue: (changeData: { needsChange: boolean; changeFor?: number }) => void;
}

export function CashPaymentScreen({
  amount,
  onBack,
  onContinue,
}: CashPaymentScreenProps) {
  const [needsChange, setNeedsChange] = useState<boolean | null>(null);
  const [changeFor, setChangeFor] = useState("");

  // Format currency input
  const formatCurrencyInput = (value: string) => {
    // Remove non-numeric characters
    const cleaned = value.replace(/\D/g, "");

    if (!cleaned) return "";

    // Convert to number (cents to reais)
    const number = parseInt(cleaned, 10) / 100;

    // Format as BRL
    return number.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChangeForInput = (value: string) => {
    const formatted = formatCurrencyInput(value);
    setChangeFor(formatted);
  };

  const getChangeForValue = (): number => {
    if (!changeFor) return 0;
    // Convert formatted string back to number
    const cleaned = changeFor.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  };

  const handleContinue = () => {
    if (needsChange === null) return;

    const changeValue = getChangeForValue();

    onContinue({
      needsChange,
      changeFor: needsChange ? changeValue : undefined,
    });
  };

  const changeValue = getChangeForValue();
  const changeAmount = changeValue > amount ? changeValue - amount : 0;
  const isValidChange = !needsChange || (changeValue >= amount);

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
          <h2 className="text-xl font-bold text-secondary-dark">Pagar na Entrega</h2>
          <p className="text-sm text-secondary/60">
            Valor: <span className="font-semibold text-primary">{formatCurrency(amount)}</span>
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Pagamento na entrega</p>
            <p className="text-xs text-green-600">
              Pague em dinheiro ou cartão quando receber seu pedido
            </p>
          </div>
        </div>
      </div>

      {/* Change Question */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <p className="font-semibold text-secondary">Vai precisar de troco?</p>

        <div className="grid grid-cols-2 gap-3">
          {/* No Change Option */}
          <button
            type="button"
            onClick={() => {
              setNeedsChange(false);
              setChangeFor("");
            }}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
              needsChange === false
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                needsChange === false
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white"
                  : "bg-gray-100 text-secondary/50"
              )}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "font-medium text-sm",
                needsChange === false ? "text-primary" : "text-secondary/70"
              )}
            >
              Não preciso
            </span>
          </button>

          {/* Needs Change Option */}
          <button
            type="button"
            onClick={() => setNeedsChange(true)}
            className={cn(
              "p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2",
              needsChange === true
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                needsChange === true
                  ? "bg-gradient-to-br from-primary to-primary-dark text-white"
                  : "bg-gray-100 text-secondary/50"
              )}
            >
              <Coins className="w-6 h-6" />
            </div>
            <span
              className={cn(
                "font-medium text-sm",
                needsChange === true ? "text-primary" : "text-secondary/70"
              )}
            >
              Sim, preciso
            </span>
          </button>
        </div>

        {/* Change Amount Input */}
        {needsChange && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="flex items-center gap-2 text-sm font-medium text-secondary">
              <Banknote className="w-4 h-4" />
              Troco para quanto?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/50 font-medium">
                R$
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={changeFor}
                onChange={(e) => handleChangeForInput(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-secondary text-xl font-semibold text-right"
              />
            </div>

            {/* Change Calculation */}
            {changeValue > 0 && (
              <div
                className={cn(
                  "p-4 rounded-xl",
                  isValidChange
                    ? "bg-green-50 border border-green-100"
                    : "bg-red-50 border border-red-100"
                )}
              >
                {isValidChange ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">Seu troco será:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 text-center">
                    O valor deve ser maior que {formatCurrency(amount)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        disabled={needsChange === null || (needsChange && !isValidChange)}
        className={cn(
          "w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3",
          needsChange === null || (needsChange && !isValidChange)
            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-[0.98]"
        )}
      >
        <CheckCircle2 className="w-5 h-5" />
        Finalizar Pedido
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
