"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { Address, AddressFormData } from "@/types/address";
import { PaymentMethod } from "@/types/checkout";
import { getUserAddresses, createAddress } from "@/lib/supabase/addresses";
import { AddressForm } from "./AddressForm";
import { AddressSelector } from "./AddressSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PixPaymentScreen } from "./PixPaymentScreen";
import { CardPaymentScreen } from "./CardPaymentScreen";
import { CashPaymentScreen } from "./CashPaymentScreen";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (checkoutData: {
    addressId?: string;
    address?: AddressFormData;
    paymentMethod: PaymentMethod;
    isPaid?: boolean;
    freightFee?: number;
  }) => Promise<void>;
  finalAmount?: number;
}

type CheckoutStep = "address" | "payment" | "pix" | "card" | "cash";

interface ChangeData {
  needsChange: boolean;
  changeFor?: number;
}

interface FreightInfo {
  fee: number;
  label: string;
  distance_km: number;
}

export function CheckoutModal({ isOpen, onClose, onComplete, finalAmount }: CheckoutModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [newAddress, setNewAddress] = useState<AddressFormData | undefined>();
  const [pixPaymentId, setPixPaymentId] = useState<string | undefined>();
  const [cardPaymentId, setCardPaymentId] = useState<string | undefined>();
  const [isPaid, setIsPaid] = useState(false);
  const [changeData, setChangeData] = useState<ChangeData | undefined>();

  const [freightInfo, setFreightInfo] = useState<FreightInfo | null>(null);
  const [isCalculatingFreight, setIsCalculatingFreight] = useState(false);
  const [freightError, setFreightError] = useState<string | null>(null);

  const getTotal = useCartStore((state) => state.getTotal());
  const subtotal = finalAmount !== undefined ? finalAmount : getTotal;
  const amount = subtotal + (freightInfo?.fee || 0);

  const loadAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userAddresses = await getUserAddresses(user.id);
      setAddresses(userAddresses);

      const defaultAddress = userAddresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      console.error("Erro ao carregar endereços:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      loadAddresses();
    }
  }, [isOpen, isAuthenticated, user, loadAddresses]);

  useEffect(() => {
    if (!isOpen) {
      setStep("address");
      setShowAddressForm(false);
      setSelectedAddressId(undefined);
      setPaymentMethod(undefined);
      setNewAddress(undefined);
      setPixPaymentId(undefined);
      setCardPaymentId(undefined);
      setIsPaid(false);
      setChangeData(undefined);
      setFreightInfo(null);
      setFreightError(null);
      setIsCalculatingFreight(false);
    }
  }, [isOpen]);

  if (!isAuthenticated || !user || !isOpen) {
    return null;
  }

  const calculateFreight = async (cep: string): Promise<boolean> => {
    setIsCalculatingFreight(true);
    setFreightError(null);
    setFreightInfo(null);

    try {
      const res = await fetch("/api/freight/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFreightError(data.error || "Erro ao calcular frete");
        return false;
      }

      setFreightInfo({
        fee: data.freight_fee,
        label: data.zone_label,
        distance_km: data.distance_km,
      });
      return true;
    } catch {
      setFreightError("Não foi possível calcular o frete. Tente novamente.");
      return false;
    } finally {
      setIsCalculatingFreight(false);
    }
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const createdAddress = await createAddress(user.id, data);
      setAddresses((prev) => [createdAddress, ...prev]);
      setSelectedAddressId(createdAddress.id);
      setNewAddress(undefined);
      setShowAddressForm(false);
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToPayment = async () => {
    if (!selectedAddressId && !newAddress) return;

    let cep: string | undefined;

    if (selectedAddressId) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      cep = addr?.zip_code;
    } else if (newAddress) {
      cep = newAddress.zip_code;
    }

    if (cep) {
      const ok = await calculateFreight(cep);
      if (!ok) return; // não avança se o frete não foi calculado
    }

    setStep("payment");
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleFinishCheckout = async (paymentCompleted?: boolean) => {
    if (!paymentMethod) return;

    if (!selectedAddressId && !newAddress) {
      alert("Por favor, selecione ou cadastre um endereço.");
      return;
    }

    let addressData = newAddress;
    if (selectedAddressId && !newAddress) {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId);
      if (selectedAddress) {
        addressData = {
          street: selectedAddress.street,
          number: selectedAddress.number,
          complement: selectedAddress.complement || undefined,
          neighborhood: selectedAddress.neighborhood,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zip_code: selectedAddress.zip_code,
          reference: selectedAddress.reference || undefined,
        };
      }
    }

    const checkoutData: any = {
      addressId: selectedAddressId,
      address: addressData,
      paymentMethod,
      isPaid: paymentCompleted ?? isPaid,
      freightFee: freightInfo?.fee || 0,
    };

    if (changeData) {
      checkoutData.changeData = changeData;
    }

    await onComplete(checkoutData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[130] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#FAF9F4" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {step !== "pix" && step !== "card" && step !== "cash" && (
          <div className="sticky top-0 border-b p-4 flex items-center justify-between z-10" style={{ backgroundColor: "#FAF9F4" }}>
            <h2 className="text-xl font-bold text-secondary">
              {step === "address" ? "Endereço de Entrega" : "Forma de Pagamento"}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="p-4 space-y-4">
          {step === "pix" ? (
            <PixPaymentScreen
              amount={amount}
              onBack={() => {
                setStep("payment");
                setPixPaymentId(undefined);
              }}
              onPaymentCreated={(paymentId) => {
                setPixPaymentId(paymentId);
              }}
              onContinue={() => handleFinishCheckout(true)}
            />
          ) : step === "card" ? (
            <CardPaymentScreen
              amount={amount}
              onBack={() => {
                setStep("payment");
                setCardPaymentId(undefined);
              }}
              onPaymentSuccess={(paymentId) => {
                setCardPaymentId(paymentId);
                setIsPaid(true);
                handleFinishCheckout(true);
              }}
              paymentType={paymentMethod as 'credit_card' | 'debit_card'}
            />
          ) : step === "cash" ? (
            <CashPaymentScreen
              amount={amount}
              onBack={() => {
                setStep("payment");
                setChangeData(undefined);
              }}
              onContinue={(data) => {
                setChangeData(data);
                handleFinishCheckout();
              }}
            />
          ) : step === "address" ? (
            <>
              {showAddressForm ? (
                <AddressForm
                  onSubmit={handleAddressSubmit}
                  onCancel={() => {
                    setShowAddressForm(false);
                    setNewAddress(undefined);
                  }}
                  initialData={newAddress}
                  isLoading={isLoading}
                />
              ) : (
                <>
                  <AddressSelector
                    addresses={addresses}
                    selectedAddressId={selectedAddressId}
                    onSelectAddress={(id) => {
                      setSelectedAddressId(id);
                      setNewAddress(undefined);
                      setFreightInfo(null);
                      setFreightError(null);
                    }}
                    onAddNew={() => setShowAddressForm(true)}
                  />

                  {freightError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                      {freightError}
                    </div>
                  )}

                  {(selectedAddressId || newAddress) && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleContinueToPayment}
                      disabled={isCalculatingFreight}
                    >
                      {isCalculatingFreight ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Calculando frete...
                        </span>
                      ) : (
                        "Continuar para Pagamento"
                      )}
                    </Button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelectMethod={handlePaymentSelect}
              />

              {/* Resumo */}
              <div className="border-t pt-4 mt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm text-secondary/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {freightInfo && (
                    <div className="flex justify-between items-center text-sm text-secondary/70">
                      <span>Frete</span>
                      {freightInfo.fee === 0 ? (
                        <span className="text-emerald-600 font-medium">Grátis</span>
                      ) : (
                        <span>{formatCurrency(freightInfo.fee)}</span>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                    <span className="text-lg font-semibold text-secondary">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>

                {paymentMethod === "pix" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setStep("pix")}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Carregando..." : "Continuar Pagamento"}
                  </Button>
                ) : paymentMethod === "credit_card" || paymentMethod === "debit_card" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setStep("card")}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Carregando..." : "Continuar Pagamento"}
                  </Button>
                ) : paymentMethod === "cash_on_delivery" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setStep("cash")}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Carregando..." : "Continuar"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleFinishCheckout()}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Finalizando..." : "Finalizar Pedido"}
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setStep("address");
                    setPixPaymentId(undefined);
                    setCardPaymentId(undefined);
                  }}
                >
                  Voltar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
