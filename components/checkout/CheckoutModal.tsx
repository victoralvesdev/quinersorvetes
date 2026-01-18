"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
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
  }) => Promise<void>;
}

type CheckoutStep = "address" | "payment" | "pix" | "card" | "cash";

interface ChangeData {
  needsChange: boolean;
  changeFor?: number;
}

export function CheckoutModal({ isOpen, onClose, onComplete }: CheckoutModalProps) {
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

  const getTotal = useCartStore((state) => state.getTotal());

  const loadAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userAddresses = await getUserAddresses(user.id);
      setAddresses(userAddresses);

      // Selecionar endereço padrão automaticamente se existir
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

  // Carregar endereços quando o modal abrir e o usuário estiver autenticado
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      loadAddresses();
    }
  }, [isOpen, isAuthenticated, user, loadAddresses]);

  // Resetar estado quando o modal fechar
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
    }
  }, [isOpen]);

  // Não renderizar se não estiver autenticado ou modal fechado
  if (!isAuthenticated || !user || !isOpen) {
    return null;
  }

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const createdAddress = await createAddress(user.id, data);
      setAddresses((prev) => [createdAddress, ...prev]);
      setSelectedAddressId(createdAddress.id);
      setNewAddress(undefined);
      setShowAddressForm(false);
      // Não precisa continuar para pagamento automaticamente, o usuário pode escolher
    } catch (error) {
      console.error("Erro ao salvar endereço:", error);
      alert("Erro ao salvar endereço. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToPayment = () => {
    if (selectedAddressId || newAddress) {
      setStep("payment");
    }
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Não vai direto para PIX, espera o usuário clicar em "Continuar Pagamento"
  };

  const handleFinishCheckout = async (paymentCompleted?: boolean) => {
    if (!paymentMethod) return;

    // Se não tiver endereço selecionado nem novo endereço, não pode finalizar
    if (!selectedAddressId && !newAddress) {
      alert("Por favor, selecione ou cadastre um endereço.");
      return;
    }

    // Se tiver um endereço selecionado, busca os dados do endereço
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
    };

    // Incluir dados de troco se for pagamento na entrega
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
        {/* Header - Não mostrar quando estiver na tela PIX, Cartão ou Dinheiro */}
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
              amount={getTotal}
              onBack={() => {
                setStep("payment");
                setPixPaymentId(undefined);
              }}
              onPaymentCreated={(paymentId) => {
                setPixPaymentId(paymentId);
              }}
              onContinue={() => handleFinishCheckout()}
            />
          ) : step === "card" ? (
            <CardPaymentScreen
              amount={getTotal}
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
              amount={getTotal}
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
                    }}
                    onAddNew={() => setShowAddressForm(true)}
                  />

                  {/* Botão Continuar */}
                  {(selectedAddressId || newAddress) && (
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleContinueToPayment}
                    >
                      Continuar para Pagamento
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
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-secondary">Total:</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(getTotal)}
                  </span>
                </div>

                {/* Botão Continuar - Para PIX e Cartão, vai para tela específica */}
                {paymentMethod === "pix" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setStep("pix");
                    }}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Carregando..." : "Continuar Pagamento"}
                  </Button>
                ) : paymentMethod === "credit_card" || paymentMethod === "debit_card" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setStep("card");
                    }}
                    disabled={!paymentMethod || isLoading}
                  >
                    {isLoading ? "Carregando..." : "Continuar Pagamento"}
                  </Button>
                ) : paymentMethod === "cash_on_delivery" ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      setStep("cash");
                    }}
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

                {/* Botão Voltar */}
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

