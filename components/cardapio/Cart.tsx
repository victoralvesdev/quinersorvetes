"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag, Trash2, IceCream, ArrowRight, Store, Tag, CheckCircle, Truck, Trophy } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useCoupons } from "@/contexts/CouponContext";
import { calculateDiscount, markUserCouponAsUsed, incrementCouponUsage } from "@/lib/supabase/coupons";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { CheckoutData } from "@/types/checkout";
import { useToast } from "@/components/ui/Toast";
import { usePoints } from "@/contexts/PointsContext";
import { createOrder } from "@/lib/supabase/orders";
import { decrementProductStock } from "@/lib/supabase/products";
import { decrementVariationItemStock } from "@/lib/supabase/variations";
import { useRouter } from "next/navigation";

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-16">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-accent-pink/20 flex items-center justify-center">
          <ShoppingBag className="w-14 h-14 text-primary/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <IceCream className="w-5 h-5 text-white" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-secondary-dark mb-2 text-center">
        Carrinho vazio
      </h3>
      <p className="text-secondary/60 text-center mb-8 max-w-xs">
        Que tal adicionar algumas delícias geladas? Explore nosso cardápio!
      </p>
      <button
        onClick={onClose}
        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
      >
        Ver Cardápio
      </button>
    </div>
  );
}

function CartItem({
  item,
  index,
  onUpdateQuantity,
  onRemove,
}: {
  item: {
    product: {
      id: string;
      name: string;
      image: string;
      price: number;
      variations?: Array<{
        id?: string;
        name: string;
        has_price: boolean;
        items: Array<{
          id?: string;
          name: string;
          price: number;
        }>;
      }>;
    };
    quantity: number;
    selectedVariations?: Record<string, string>;
    additionalPrice?: number;
  };
  index: number;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}) {
  const unitPrice = item.product.price + (item.additionalPrice || 0);
  const totalPrice = unitPrice * item.quantity;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent-pink/10">
          {item.product.image ? (
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl">🍦</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-dark line-clamp-1">
                {item.product.name}
              </h3>

              {/* Selected Variations */}
              {item.selectedVariations && item.product.variations && (
                <div className="mt-1 space-y-0.5">
                  {item.product.variations.map((variation) => {
                    const selectedItemId = item.selectedVariations![variation.id!];
                    if (!selectedItemId) return null;
                    const selectedItem = variation.items.find(
                      (i) => i.id === selectedItemId
                    );
                    if (!selectedItem) return null;
                    return (
                      <p
                        key={variation.id}
                        className="text-xs text-secondary/60"
                      >
                        <span className="font-medium">{variation.name}:</span>{" "}
                        {selectedItem.name}
                        {variation.has_price && selectedItem.price > 0 && (
                          <span className="text-primary ml-1">
                            +{formatCurrency(selectedItem.price)}
                          </span>
                        )}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Remove Button */}
            <button
              onClick={() => onRemove(index)}
              className="p-1.5 rounded-lg text-secondary/40 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Price & Quantity */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totalPrice)}
            </span>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onUpdateQuantity(index, -1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5 text-secondary" />
              </button>
              <span className="w-8 text-center font-bold text-secondary-dark">
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(index, 1)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-secondary" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const { openModal: openLoginModal } = useLoginModal();
  const { settings } = useSettings();
  const { selectedCoupon, selectCoupon, coupons } = useCoupons();
  const { balance, pointsEnabled, rewardsByProductId, redeemForProduct } = usePoints();
  const isStoreOnline = settings.store_online !== false;
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const clearCart = useCartStore((state) => state.clearCart);
  const pointsRedeemedProductId = useCartStore((state) => state.pointsRedeemedProductId);
  const setPointsRedeemedProduct = useCartStore((state) => state.setPointsRedeemedProduct);
  const { showToast } = useToast();
  const router = useRouter();

  // Calcula desconto do produto resgatado com pontos (1 unidade do produto)
  const redeemedItem = pointsRedeemedProductId
    ? items.find((i) => i.product.id === pointsRedeemedProductId)
    : null;
  const pointsProductDiscount = redeemedItem
    ? redeemedItem.product.price + (redeemedItem.additionalPrice || 0)
    : 0;

  // Animation control
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close with ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  // Auto-deselect free_shipping coupon when cart drops below minimum
  useEffect(() => {
    if (!selectedCoupon || selectedCoupon.coupon.discount_type !== 'free_shipping') return;
    const minValue = selectedCoupon.coupon.min_order_value || 0;
    if (minValue > 0 && getTotal() < minValue) {
      selectCoupon(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleUpdateQuantity = (index: number, delta: number) => {
    const state = useCartStore.getState();
    const newItems = state.items
      .map((item, idx) =>
        idx === index
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      )
      .filter((item) => item.quantity > 0);
    useCartStore.setState({ items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const state = useCartStore.getState();
    const newItems = state.items.filter((_, idx) => idx !== index);
    useCartStore.setState({ items: newItems });
  };

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      onClose();
      showToast("Para finalizar o pedido, faça login ou cadastre-se.", "info");
      setTimeout(() => {
        openLoginModal();
      }, 100);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutComplete = async (checkoutData: CheckoutData) => {
    if (!user || items.length === 0) return;

    setIsCreatingOrder(true);
    try {
      const orderItems = items.map((item) => {
        // Converte IDs de variação para nomes legíveis
        const variationNames: Record<string, string> = {};
        if (item.selectedVariations && item.product.variations) {
          for (const variation of item.product.variations) {
            const selectedItemId = item.selectedVariations[variation.id!];
            if (!selectedItemId) continue;
            const selectedItem = variation.items.find((vi) => vi.id === selectedItemId);
            if (selectedItem) variationNames[variation.name] = selectedItem.name;
          }
        }
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price + (item.additionalPrice || 0),
          base_price: item.product.price,
          additional_price: item.additionalPrice || 0,
          selected_variations: variationNames,
        };
      });

      const subtotal = getTotal();
      const couponDiscount = selectedCoupon ? calculateDiscount(selectedCoupon.coupon, subtotal) : 0;
      const totalFinal = Math.max(0, subtotal - couponDiscount - pointsProductDiscount);

      const freightFee = checkoutData.freightFee || 0;
      const newOrder = await createOrder({
        user_id: user.id,
        items: orderItems,
        total: totalFinal + freightFee,
        status: "novo",
        payment_method: checkoutData.paymentMethod,
        address_id: checkoutData.addressId,
        address_data: checkoutData.address,
        is_paid: checkoutData.isPaid || false,
        coupon_code: selectedCoupon?.coupon.code || undefined,
        discount_amount: couponDiscount > 0 ? couponDiscount : undefined,
        freight_fee: freightFee,
      });

      // Decrementa estoque de produtos e variações em background
      (async () => {
        const sendStockAlert = async (productName: string, variationItemName: string | undefined, qty: number, threshold: number) => {
          try {
            await fetch('/api/whatsapp/low-stock-alert', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productName, variationItemName, stockQuantity: qty, threshold }),
            });
          } catch { /* silencia */ }
        };

        for (const item of items) {
          // Decrementa estoque do produto base
          const productResult = await decrementProductStock(item.product.id, item.quantity);
          if (productResult && productResult.threshold !== null && productResult.newStock <= productResult.threshold) {
            await sendStockAlert(item.product.name, undefined, productResult.newStock, productResult.threshold);
          }

          // Decrementa estoque de cada variação selecionada
          if (item.selectedVariations && item.product.variations) {
            for (const variation of item.product.variations) {
              const selectedItemId = item.selectedVariations[variation.id!];
              if (!selectedItemId) continue;
              const variationItem = variation.items.find((vi) => vi.id === selectedItemId);
              if (!variationItem?.id) continue;

              const varResult = await decrementVariationItemStock(variationItem.id, item.quantity);
              if (varResult && varResult.threshold !== null && varResult.newStock <= varResult.threshold) {
                await sendStockAlert(item.product.name, variationItem.name, varResult.newStock, varResult.threshold);
              }
            }
          }
        }
      })();

      // Marcar cupom como usado após pedido criado com sucesso
      if (selectedCoupon) {
        try {
          // Cupons globais (id começa com "global_") não têm registro em user_coupons
          if (!selectedCoupon.id.startsWith('global_')) {
            await markUserCouponAsUsed(selectedCoupon.id);
          }
          await incrementCouponUsage(selectedCoupon.coupon.id);
          selectCoupon(null);
        } catch (couponError) {
          console.error("[Cart] Erro ao marcar cupom como usado:", couponError);
        }
      }

      // Send WhatsApp message (background) — retenta 1x em caso de falha
      const sendWhatsApp = async () => {
        const body = JSON.stringify({
          orderId: newOrder.id,
          customerPhone: user.phone,
          orderData: {
            customerName: user.name,
            items: orderItems,
            total: getTotal(),
            paymentMethod: checkoutData.paymentMethod,
            isPaid: checkoutData.isPaid || false,
            address: checkoutData.address,
            isStorePickup: checkoutData.isStorePickup || false,
          },
        });
        const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
        try {
          const res = await fetch("/api/whatsapp/send-order", opts);
          if (!res.ok) throw new Error(`status ${res.status}`);
        } catch (err) {
          console.error("[Cart] Falha no WhatsApp, tentando novamente...", err);
          try {
            await new Promise((r) => setTimeout(r, 3000));
            await fetch("/api/whatsapp/send-order", opts);
          } catch (retryErr) {
            console.error("[Cart] WhatsApp falhou após retry. Pedido:", newOrder.id, retryErr);
            showToast("Pedido criado, mas notificação WhatsApp falhou. Anote o pedido.", "error");
          }
        }
      };
      sendWhatsApp();

      // Deduzir pontos pelo produto resgatado
      if (pointsRedeemedProductId && redeemedItem) {
        const reward = rewardsByProductId[pointsRedeemedProductId];
        if (reward) {
          await redeemForProduct(
            pointsRedeemedProductId,
            redeemedItem.product.name,
            reward.points_required
          );
        }
      }

      clearCart();
      setIsCheckoutOpen(false);
      onClose();
      showToast("Pedido realizado com sucesso!");
      setTimeout(() => {
        router.push("/pedidos");
      }, 1000);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      showToast("Erro ao criar pedido. Tente novamente.", "error");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (!isOpen) return null;

  const itemCount = getItemCount();
  const total = getTotal();
  const isFreeShippingCoupon = selectedCoupon?.coupon.discount_type === 'free_shipping';
  const discount = selectedCoupon && !isFreeShippingCoupon
    ? calculateDiscount(selectedCoupon.coupon, total)
    : 0;
  const finalTotal = Math.max(0, total - discount - pointsProductDiscount);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[115] transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-[116] flex flex-col shadow-2xl",
          "transform transition-transform duration-300 ease-out",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-secondary-dark">
                  Carrinho
                </h2>
                {itemCount > 0 && (
                  <p className="text-xs text-secondary/60">
                    {itemCount} {itemCount === 1 ? "item" : "itens"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyCart onClose={onClose} />
          ) : (
            <div className="p-4 space-y-3">
              {items.map((item, index) => (
                <CartItem
                  key={`${item.product.id}_${JSON.stringify(item.selectedVariations)}_${index}`}
                  item={item}
                  index={index}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-white p-5 pb-24 md:pb-5 space-y-4">
            {/* Banner de Frete Grátis */}
            {isAuthenticated && (() => {
              const fsc = coupons.find(uc => uc.coupon.discount_type === 'free_shipping');
              if (!fsc) return null;
              const minValue = fsc.coupon.min_order_value || 0;
              const isEligible = !minValue || total >= minValue;
              const progress = minValue > 0 ? Math.min(100, (total / minValue) * 100) : 100;
              const remaining = Math.max(0, minValue - total);
              const isActive = selectedCoupon?.id === fsc.id;
              return (
                <div className={cn(
                  "rounded-xl border-2 p-3 transition-all duration-300",
                  isActive
                    ? "border-emerald-400 bg-emerald-50"
                    : isEligible
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-dashed border-secondary/20 bg-gray-50/50"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className={cn("w-4 h-4 flex-shrink-0", isEligible ? "text-emerald-600" : "text-secondary/40")} />
                    <span className={cn("text-sm font-semibold flex-1", isEligible ? "text-emerald-700" : "text-secondary/60")}>
                      {isActive ? "Frete grátis ativado! 🎉" : isEligible ? "Frete grátis disponível!" : "Frete grátis"}
                    </span>
                    {isEligible && (
                      <button
                        onClick={() => selectCoupon(isActive ? null : fsc)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                          isActive ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        )}
                      >
                        {isActive ? "✓ Ativo" : "Ativar"}
                      </button>
                    )}
                  </div>
                  {minValue > 0 && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1.5 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", isEligible ? "bg-emerald-500" : "bg-primary")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-secondary/60">
                        {isEligible
                          ? `Pedido atingiu o mínimo de ${formatCurrency(minValue)} — frete grátis!`
                          : `Adicione mais ${formatCurrency(remaining)} em produtos para frete grátis`
                        }
                      </p>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Banner de Resgate de Pontos — card único */}
            {isAuthenticated && pointsEnabled && (() => {
              const redeemableItems = items.filter((item) => rewardsByProductId[item.product.id]);
              if (redeemableItems.length === 0) return null;

              const eligible = redeemableItems.filter((item) => balance >= rewardsByProductId[item.product.id].points_required);
              const ineligible = redeemableItems.filter((item) => balance < rewardsByProductId[item.product.id].points_required);
              // Produto mais próximo de atingir os pontos (menor diferença)
              const closest = ineligible.length > 0
                ? ineligible.reduce((a, b) =>
                    (rewardsByProductId[a.product.id].points_required - balance) <=
                    (rewardsByProductId[b.product.id].points_required - balance) ? a : b
                  )
                : null;
              const closestReward = closest ? rewardsByProductId[closest.product.id] : null;
              const closestProgress = closestReward ? Math.min(100, (balance / closestReward.points_required) * 100) : 0;
              const othersCount = ineligible.length - (closest ? 1 : 0);

              const hasActive = !!pointsRedeemedProductId;

              return (
                <div className={cn(
                  "rounded-xl border-2 overflow-hidden transition-all duration-300",
                  hasActive ? "border-violet-400" : eligible.length > 0 ? "border-violet-200" : "border-gray-200"
                )}>
                  {/* Header */}
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2",
                    hasActive ? "bg-violet-500" : eligible.length > 0 ? "bg-violet-50" : "bg-gray-50"
                  )}>
                    <Trophy className={cn("w-3.5 h-3.5 flex-shrink-0", hasActive || eligible.length > 0 ? "text-violet-600" : "text-gray-400", hasActive && "text-white")} />
                    <span className={cn("text-xs font-bold flex-1", hasActive ? "text-white" : eligible.length > 0 ? "text-violet-700" : "text-gray-500")}>
                      {hasActive ? "Resgate ativo! 🎉" : eligible.length > 0 ? "Resgate disponível!" : "Pontos de fidelidade"}
                    </span>
                    <span className={cn("text-xs font-semibold", hasActive ? "text-violet-100" : "text-violet-500")}>
                      {balance} pts
                    </span>
                  </div>

                  <div className="bg-white divide-y divide-gray-50">
                    {/* Produtos elegíveis — linha compacta por produto */}
                    {eligible.map((item) => {
                      const reward = rewardsByProductId[item.product.id];
                      const isRedeemed = pointsRedeemedProductId === item.product.id;
                      return (
                        <div key={item.product.id} className={cn("flex items-center gap-2 px-3 py-2", isRedeemed && "bg-violet-50")}>
                          <span className={cn("text-xs flex-1 font-medium line-clamp-1", isRedeemed ? "text-violet-700" : "text-gray-700")}>
                            {isRedeemed && "✓ "}{item.product.name}
                          </span>
                          <span className="text-[10px] text-violet-500 font-semibold flex-shrink-0">{reward.points_required} pts</span>
                          <button
                            onClick={() => setPointsRedeemedProduct(isRedeemed ? null : item.product.id)}
                            className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0",
                              isRedeemed ? "bg-violet-500 text-white" : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                            )}
                          >
                            {isRedeemed ? "Ativo" : "Ativar"}
                          </button>
                        </div>
                      );
                    })}

                    {/* Produto mais próximo com barra de progresso */}
                    {closest && closestReward && (
                      <div className="px-3 py-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex-1 line-clamp-1">{closest.product.name}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            faltam {closestReward.points_required - balance} pts
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-400 transition-all duration-500"
                            style={{ width: `${closestProgress}%` }}
                          />
                        </div>
                        {othersCount > 0 && (
                          <p className="text-[10px] text-gray-400">
                            + {othersCount} outro{othersCount > 1 ? "s" : ""} produto{othersCount > 1 ? "s" : ""} com resgate
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Cupons de desconto */}
            {isAuthenticated && coupons.some(uc => uc.coupon.discount_type !== 'free_shipping') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-secondary/70">
                  <Tag className="w-4 h-4" />
                  <span>Cupons disponíveis</span>
                </div>
                <div className="space-y-2">
                  {coupons.filter(uc => uc.coupon.discount_type !== 'free_shipping').map((uc) => {
                    const isSelected = selectedCoupon?.id === uc.id;
                    const couponDiscount = calculateDiscount(uc.coupon, total);
                    return (
                      <button
                        key={uc.id}
                        onClick={() => selectCoupon(isSelected ? null : uc)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 text-left",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-gray-200 bg-white hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", isSelected ? "bg-primary" : "bg-gray-100")}>
                            {isSelected
                              ? <CheckCircle className="w-4 h-4 text-white" />
                              : <Tag className="w-3.5 h-3.5 text-secondary/50" />
                            }
                          </div>
                          <div>
                            <p className="text-xs font-bold text-secondary-dark">{uc.coupon.code}</p>
                            <p className="text-xs text-secondary/60">{uc.coupon.description}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-green-600 ml-2 whitespace-nowrap">
                          -{formatCurrency(couponDiscount)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-secondary/70">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Desconto ({selectedCoupon?.coupon.code})</span>
                  <span className="text-green-600 font-semibold">-{formatCurrency(discount)}</span>
                </div>
              )}
              {pointsProductDiscount > 0 && redeemedItem && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-violet-600">🏆 Resgate ({redeemedItem.product.name})</span>
                  <span className="text-violet-600 font-semibold">-{formatCurrency(pointsProductDiscount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-secondary/70">
                <span>Entrega</span>
                {isFreeShippingCoupon
                  ? <span className="text-emerald-600 font-semibold flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Grátis</span>
                  : <span className="text-secondary/50 italic">A calcular</span>
                }
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-secondary-dark">
                  Total
                </span>
                <div className="text-right">
                  {discount > 0 && (
                    <p className="text-xs text-secondary/40 line-through">{formatCurrency(total)}</p>
                  )}
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Checkout Button / Store Closed Banner */}
            {isStoreOnline ? (
              <button
                onClick={handleCheckoutClick}
                disabled={isCreatingOrder}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3",
                  "bg-gradient-to-r from-primary to-primary-dark text-white",
                  "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                  "active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                )}
              >
                {isCreatingOrder ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Finalizar Pedido
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            ) : (
              <div className="w-full rounded-2xl bg-gray-100 border border-gray-200 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Loja fechada no momento</p>
                  <p className="text-xs text-gray-500 mt-0.5">Volte em breve para finalizar seu pedido.</p>
                </div>
              </div>
            )}

            {/* Clear Cart */}
            <button
              onClick={() => {
                clearCart();
                showToast("Carrinho limpo", "info");
              }}
              className="w-full py-2 text-sm text-secondary/60 hover:text-red-500 transition-colors"
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {isAuthenticated && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onComplete={handleCheckoutComplete}
          finalAmount={finalTotal}
        />
      )}
    </>
  );
};
