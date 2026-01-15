"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Package, Clock, Truck, CheckCircle, XCircle, MapPin, Phone, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Cart } from "@/components/cardapio/Cart";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { getUserOrders, Order } from "@/lib/supabase/orders";

const statusConfig = {
  novo: {
    label: "Novo",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
    bgColor: "#DBEAFE",
    textColor: "#1E40AF",
  },
  preparando: {
    label: "Preparando",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
    bgColor: "#FEF3C7",
    textColor: "#92400E",
  },
  saiu_entrega: {
    label: "Saiu para Entrega",
    icon: Truck,
    color: "bg-purple-100 text-purple-800",
    bgColor: "#E9D5FF",
    textColor: "#6B21A8",
  },
  entregue: {
    label: "Entregue",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
    bgColor: "#D1FAE5",
    textColor: "#065F46",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
    bgColor: "#FEE2E2",
    textColor: "#991B1B",
  },
};

export default function PedidosPage() {
  const { user, isAuthenticated } = useAuth();
  const { isCartOpen, closeCart } = useCartContext();
  const { isOpen: isLoginOpen, closeModal: closeLoginModal, openModal: openLoginModal } = useLoginModal();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar pedidos do usuário do Supabase
  useEffect(() => {
    const loadOrders = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userOrders = await getUserOrders(user.id);
        setOrders(userOrders);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, user]);

  const filteredOrders = selectedStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!isAuthenticated) {
    return (
      <>
        {/* Layout Mobile - Não autenticado */}
        <div className="min-h-screen pb-24 md:hidden" style={{ backgroundColor: '#FAF9F4' }}>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <Package className="w-16 h-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-bold text-secondary mb-2">
              Faça login para ver seus pedidos
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Entre com seu telefone para acessar o histórico de pedidos
            </p>
              <Button
                variant="primary"
                onClick={openLoginModal}
              >
                Fazer Login
              </Button>
          </div>
          <BottomNav />
        </div>

        {/* Layout Desktop - Não autenticado */}
        <div className="hidden md:block min-h-screen" style={{ backgroundColor: '#FAF9F4' }}>
          <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <Package className="w-16 h-16 text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-secondary mb-2">
                Faça login para ver seus pedidos
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Entre com seu telefone para acessar o histórico de pedidos
              </p>
            <Button
              variant="primary"
              onClick={openLoginModal}
            >
              Fazer Login
            </Button>
            </div>
          </div>
        </div>
        
        <Cart
          isOpen={isCartOpen}
          onClose={closeCart}
          onCheckout={openLoginModal}
        />
        
        <LoginModal
          isOpen={isLoginOpen}
          onClose={closeLoginModal}
        />
      </>
    );
  }

  return (
    <>
      {/* Layout Mobile */}
      <div className="min-h-screen pb-24 md:hidden" style={{ backgroundColor: '#FAF9F4', paddingTop: '80px' }}>
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-secondary mb-6">
            Meus Pedidos
          </h1>

        {/* Filtros de Status */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              selectedStatus === "all"
                ? "bg-primary text-white"
                : "bg-white text-secondary border border-gray-300"
            }`}
          >
            Todos
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedStatus(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedStatus === key
                  ? "bg-primary text-white"
                  : "bg-white text-secondary border border-gray-300"
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500 text-lg">Carregando pedidos...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {selectedStatus === "all"
                ? "Você ainda não fez nenhum pedido"
                : `Nenhum pedido com status "${statusConfig[selectedStatus as keyof typeof statusConfig]?.label}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className="w-5 h-5" style={{ color: status.textColor }} />
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.textColor,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono mb-2">
                        Pedido #{order.id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(new Date(order.created_at))}</span>
                      </div>
                      <div className="text-lg font-bold text-primary mt-2">
                        {formatCurrency(order.total)}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-secondary mb-2 text-sm">
                        Itens do pedido:
                      </h3>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm text-gray-600"
                          >
                            <span>
                              {item.quantity}x {item.product_name}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.address_data && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">
                          {order.address_data.street}, {order.address_data.number}
                          {order.address_data.complement && ` - ${order.address_data.complement}`}
                          <br />
                          {order.address_data.neighborhood}, {order.address_data.city} - {order.address_data.state}
                          <br />
                          CEP: {order.address_data.zip_code}
                        </span>
                      </div>
                    )}
                  </div>

                  {order.status === "entregue" && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => {
                        // Implementar reordenação rápida
                        alert("Funcionalidade de reordenar em breve!");
                      }}
                    >
                      Reordenar
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        </div>

        <BottomNav />
      </div>

      {/* Layout Desktop */}
      <div className="hidden md:block min-h-screen" style={{ backgroundColor: '#FAF9F4' }}>
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-secondary mb-6">
            Meus Pedidos
          </h1>

          {/* Filtros de Status */}
          <div className="flex gap-2 mb-6 pb-2">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedStatus === "all"
                  ? "bg-primary text-white"
                  : "bg-white text-secondary border border-gray-300"
              }`}
            >
              Todos
            </button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedStatus(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedStatus === key
                    ? "bg-primary text-white"
                    : "bg-white text-secondary border border-gray-300"
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-gray-500 text-lg">Carregando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {selectedStatus === "all"
                  ? "Você ainda não fez nenhum pedido"
                  : `Nenhum pedido com status "${statusConfig[selectedStatus as keyof typeof statusConfig]?.label}"`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map((order) => {
                const status = statusConfig[order.status];
                const StatusIcon = status.icon;

                return (
                  <Card key={order.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StatusIcon className="w-5 h-5" style={{ color: status.textColor }} />
                          <span
                            className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: status.bgColor,
                              color: status.textColor,
                            }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono mb-2">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(new Date(order.created_at))}</span>
                        </div>
                        <div className="text-lg font-bold text-primary mt-2">
                          {formatCurrency(order.total)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-secondary mb-2 text-sm">
                          Itens do pedido:
                        </h3>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-sm text-gray-600"
                            >
                              <span>
                                {item.quantity}x {item.product_name}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.address_data && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 pt-2 border-t border-gray-100">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="flex-1">
                            {order.address_data.street}, {order.address_data.number}
                            {order.address_data.complement && ` - ${order.address_data.complement}`}
                            <br />
                            {order.address_data.neighborhood}, {order.address_data.city} - {order.address_data.state}
                            <br />
                            CEP: {order.address_data.zip_code}
                          </span>
                        </div>
                      )}
                    </div>

                    {order.status === "entregue" && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={() => {
                          alert("Funcionalidade de reordenar em breve!");
                        }}
                      >
                        Reordenar
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais compartilhados */}
      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={openLoginModal}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeLoginModal}
      />
    </>
  );
}
