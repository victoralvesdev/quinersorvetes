"use client";

import { useState } from "react";
import { X, Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
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

export const Cart: React.FC<CartProps> = ({ isOpen, onClose, onCheckout }) => {
  const { isAuthenticated, user } = useAuth();
  const { openModal: openLoginModal } = useLoginModal();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const getTotal = useCartStore((state) => state.getTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const { showToast } = useToast();
  const router = useRouter();

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      // Se não estiver autenticado, fecha o carrinho, mostra notificação e abre modal de login
      onClose();
      showToast("Para finalizar o pedido, faça login ou cadastre-se.", "info");
      // Pequeno delay para o toast aparecer antes do modal
      setTimeout(() => {
        openLoginModal();
      }, 100);
      return;
    }

    // Se estiver autenticado, abre o modal de checkout
    setIsCheckoutOpen(true);
  };

  const handleCheckoutComplete = async (checkoutData: CheckoutData) => {
    if (!user || items.length === 0) return;

    setIsCreatingOrder(true);
    try {
      // Preparar itens do pedido
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      // Criar pedido no Supabase
      const newOrder = await createOrder({
        user_id: user.id,
        items: orderItems,
        total: getTotal(),
        status: "novo",
        payment_method: checkoutData.paymentMethod,
        address_id: checkoutData.addressId,
        address_data: checkoutData.address,
      });

      // Enviar mensagem via WhatsApp (em background, não bloqueia o fluxo)
      console.log('[Cart] Enviando mensagem WhatsApp...');
      console.log('[Cart] Dados:', { orderId: newOrder.id, customerPhone: user.phone, isPaid: checkoutData.isPaid });
      try {
        const whatsappResponse = await fetch('/api/whatsapp/send-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
        const whatsappResult = await whatsappResponse.json();
        console.log('[Cart] Resposta do WhatsApp:', whatsappResult);
      } catch (whatsappError) {
        // Não bloqueia o fluxo se houver erro no WhatsApp
        console.error('[Cart] Erro ao enviar mensagem WhatsApp:', whatsappError);
      }

      // Limpar carrinho
      clearCart();

      // Fechar modais
      setIsCheckoutOpen(false);
      onClose();

      // Mostrar notificação de sucesso
      showToast("Pedido realizado com sucesso! Em breve você receberá a confirmação.");

      // Redirecionar para Meus Pedidos após 1 segundo
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

  return (
    <>
      {/* Overlay - ajustado para desktop */}
      <div 
        className="fixed bg-black bg-opacity-50 z-[100] md:z-[120]" 
        onClick={onClose} 
        style={{ 
          top: 0,
          left: 0, 
          right: 0, 
          bottom: 0
        }} 
      />
      {/* Cart - ajustado para desktop */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-full max-w-md shadow-xl overflow-y-auto z-[101] md:z-[121] md:h-full" 
        style={{ backgroundColor: '#FAF9F4' }}
      >
        <div className="sticky top-0 border-b p-4 flex items-center justify-between z-10 md:pt-6" style={{ backgroundColor: '#FAF9F4' }}>
          <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrinho
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <Card key={item.product.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Imagem do produto */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          Sem imagem
                        </div>
                      )}
                    </div>
                    
                    {/* Nome e preço */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-secondary">
                            {item.product.name}
                          </h3>
                          <p className="text-sm font-bold text-primary mt-1">
                            {formatCurrency(item.product.price * item.quantity)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Controles de quantidade */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="sticky bottom-0 border-t pt-4 mt-4" style={{ backgroundColor: '#FAF9F4' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-secondary">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(getTotal())}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckoutClick}
                >
                  Finalizar Pedido
                </Button>
              </div>
            </>
          )}
        </div>
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

