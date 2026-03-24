"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Loader2, Truck, Store, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { Address, AddressFormData } from "@/types/address";
import { PaymentMethod } from "@/types/checkout";
import { AddressForm } from "./AddressForm";
import { AddressSelector } from "./AddressSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { PixPaymentScreen } from "./PixPaymentScreen";
import { CardPaymentScreen } from "./CardPaymentScreen";
import { CashPaymentScreen } from "./CashPaymentScreen";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useCoupons } from "@/contexts/CouponContext";
import { usePoints } from "@/contexts/PointsContext";

const STORE_ADDRESS = {
  street: "Rua Argemiro Egidio Gonçalves",
  number: "422",
  neighborhood: "Parque Brasil",
  city: "Jacareí",
  state: "SP",
  zip_code: "12908020",
  reference: "Retirada na loja",
};

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
  const { user, isAuthenticated, refreshUser } = useAuth();
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
  const [isStorePickup, setIsStorePickup] = useState(false);

  const getTotal = useCartStore((state) => state.getTotal());
  const cartItems = useCartStore((state) => state.items);
  const pointsRedeemedProductId = useCartStore((state) => state.pointsRedeemedProductId);
  const subtotal = finalAmount !== undefined ? finalAmount : getTotal;
  const { selectedCoupon } = useCoupons();
  const isFreeShipping = selectedCoupon?.coupon.discount_type === 'free_shipping';
  const effectiveFreightFee = isFreeShipping ? 0 : (freightInfo?.fee || 0);
  const baseAmount = subtotal + effectiveFreightFee;

  // Points product redemption
  const { pointsEnabled, rewardsByProductId } = usePoints();
  const redeemedCartItem = pointsRedeemedProductId
    ? cartItems.find((i) => i.product.id === pointsRedeemedProductId)
    : null;
  const redeemedReward = pointsRedeemedProductId ? rewardsByProductId[pointsRedeemedProductId] : null;
  const amount = baseAmount;

  const loadAddresses = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/addresses?userId=${encodeURIComponent(user.id)}`);
      const userAddresses: Address[] = res.ok ? await res.json() : [];
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
      setIsStorePickup(false);
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

      if (data.out_of_range) {
        setFreightError(data.error || "Infelizmente não realizamos delivery para essa região.");
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
      const addrRes = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...data }),
      });
      if (!addrRes.ok) throw new Error('Erro ao salvar endereço');
      const createdAddress: Address = await addrRes.json();
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
    if (isStorePickup) {
      setStep("payment");
      return;
    }

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
      if (!ok) return;
    }

    setStep("payment");
  };

  const handlePaymentSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const handleFinishCheckout = async (paymentCompleted?: boolean) => {
    if (!paymentMethod) return;

    if (!isStorePickup && !selectedAddressId && !newAddress) {
      alert("Por favor, selecione ou cadastre um endereço.");
      return;
    }

    let addressData = isStorePickup ? STORE_ADDRESS : newAddress;
    if (!isStorePickup && selectedAddressId && !newAddress) {
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
      addressId: isStorePickup ? undefined : selectedAddressId,
      address: addressData,
      paymentMethod,
      isPaid: paymentCompleted ?? isPaid,
      freightFee: isStorePickup ? 0 : effectiveFreightFee,
      isStorePickup,
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
              {step === "address"
                ? (isStorePickup ? "Retirar na Loja" : "Entrega")
                : "Forma de Pagamento"}
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
              savedCpf={user?.cpf}
              onBack={() => {
                setStep("payment");
                setPixPaymentId(undefined);
              }}
              onPaymentCreated={(paymentId) => {
                setPixPaymentId(paymentId);
              }}
              onCpfSaved={async (cpf) => {
                if (!user) return;
                try {
                  await fetch('/api/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, cpf }),
                  });
                  await refreshUser();
                } catch {
                  // silencia — CPF já foi usado para gerar o PIX
                }
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
              isStorePickup={isStorePickup}
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
              {/* Toggle Delivery / Retirar no Local */}
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className={cn(
                    "flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                    !isStorePickup
                      ? "bg-primary text-white"
                      : "bg-white text-secondary/70 hover:bg-gray-50"
                  )}
                  onClick={() => {
                    setIsStorePickup(false);
                    setFreightInfo(null);
                    setFreightError(null);
                  }}
                >
                  <Truck className="w-4 h-4" />
                  Delivery
                </button>
                <button
                  className={cn(
                    "flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                    isStorePickup
                      ? "bg-primary text-white"
                      : "bg-white text-secondary/70 hover:bg-gray-50"
                  )}
                  onClick={() => setIsStorePickup(true)}
                >
                  <Store className="w-4 h-4" />
                  Retirar no Local
                </button>
              </div>

              {isStorePickup ? (
                <>
                  {/* Card com endereço da loja */}
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-secondary-dark text-sm">Endereço da Loja</p>
                        <p className="text-secondary/80 text-sm mt-0.5">
                          Rua Argemiro Egidio Gonçalves, 422
                        </p>
                        <p className="text-secondary/80 text-sm">
                          Parque Brasil — CEP 12908-020
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
                      <Store className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">
                        Sem taxa de entrega — Retire direto na loja!
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleContinueToPayment}
                  >
                    Continuar para Pagamento
                  </Button>
                </>
              ) : (
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
              )}
            </>
          ) : (
            <>
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onSelectMethod={handlePaymentSelect}
                isStorePickup={isStorePickup}
              />

              {/* Points Product Redemption Indicator */}
              {pointsEnabled && redeemedCartItem && redeemedReward && (
                <div className="rounded-xl border-2 border-violet-400 bg-violet-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-sm font-semibold text-violet-700">Resgate de pontos ativo</p>
                      <p className="text-xs text-violet-600/70">
                        1x {redeemedCartItem.product.name} grátis — {redeemedReward.points_required} pts
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumo */}
              <div className="border-t pt-4 mt-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm text-secondary/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {isStorePickup ? (
                    <div className="flex justify-between items-center text-sm text-secondary/70">
                      <span>Entrega</span>
                      <span className="text-emerald-600 font-medium">Retirada na loja</span>
                    </div>
                  ) : freightInfo ? (
                    <div className="flex justify-between items-center text-sm text-secondary/70">
                      <span>Frete</span>
                      {isFreeShipping ? (
                        <span className="text-emerald-600 font-medium">Grátis 🎉 (cupom)</span>
                      ) : freightInfo.fee === 0 ? (
                        <span className="text-emerald-600 font-medium">Grátis</span>
                      ) : (
                        <span>{formatCurrency(freightInfo.fee)}</span>
                      )}
                    </div>
                  ) : null}
                  {redeemedCartItem && redeemedReward && (
                    <div className="flex justify-between items-center text-sm text-violet-600">
                      <span>🏆 Resgate ({redeemedCartItem.product.name})</span>
                      <span className="text-xs font-semibold">{redeemedReward.points_required} pts</span>
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
