"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag, Trash2, IceCream, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { CheckoutData } from "@/types/checkout";
import { useToast } from "@/components/ui/Toast";
import { createOrder } from "@/lib/supabase/orders";
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
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const items = useCartStore((state) => state.items);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);
  const clearCart = useCartStore((state) => state.clearCart);
  const { showToast } = useToast();
  const router = useRouter();

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
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price + (item.additionalPrice || 0),
        base_price: item.product.price,
        additional_price: item.additionalPrice || 0,
        selected_variations: item.selectedVariations || {},
      }));

      const newOrder = await createOrder({
        user_id: user.id,
        items: orderItems,
        total: getTotal(),
        status: "novo",
        payment_method: checkoutData.paymentMethod,
        address_id: checkoutData.addressId,
        address_data: checkoutData.address,
      });

      // Send WhatsApp message (background)
      try {
        await fetch("/api/whatsapp/send-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: newOrder.id,
            customerPhone: user.phone,
            orderData: {
              customerName: user.name,
              items: orderItems,
              total: getTotal(),
              paymentMethod: checkoutData.paymentMethod,
              isPaid: checkoutData.isPaid || false,
              address: checkoutData.address,
            },
          }),
        });
      } catch (whatsappError) {
        console.error("[Cart] Erro ao enviar WhatsApp:", whatsappError);
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-[101] flex flex-col shadow-2xl",
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
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-secondary/70">
                <span>Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-secondary/70">
                <span>Entrega</span>
                <span className="text-green-600 font-medium">Grátis</span>
              </div>
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-secondary-dark">
                  Total
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
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
        />
      )}
    </>
  );
};
