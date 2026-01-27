"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  ChevronDown,
  RefreshCw,
  IceCream,
  RotateCcw
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Cart } from "@/components/cardapio/Cart";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { getUserOrders, Order } from "@/lib/supabase/orders";
import { useToast } from "@/components/ui/Toast";

const statusConfig = {
  novo: {
    label: "Aguardando",
    description: "Seu pedido foi recebido",
    icon: Package,
    gradient: "from-amber-400 to-orange-500",
    bgLight: "bg-amber-50",
    textColor: "text-amber-700",
    borderColor: "border-amber-200",
    step: 1,
  },
  preparando: {
    label: "Preparando",
    description: "Estamos preparando seu pedido",
    icon: Clock,
    gradient: "from-blue-400 to-indigo-500",
    bgLight: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    step: 2,
  },
  saiu_entrega: {
    label: "A caminho",
    description: "Seu pedido saiu para entrega",
    icon: Truck,
    gradient: "from-emerald-400 to-teal-500",
    bgLight: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    step: 3,
  },
  entregue: {
    label: "Entregue",
    description: "Pedido entregue com sucesso",
    icon: CheckCircle,
    gradient: "from-green-400 to-emerald-500",
    bgLight: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    step: 4,
  },
  cancelado: {
    label: "Cancelado",
    description: "Pedido foi cancelado",
    icon: XCircle,
    gradient: "from-red-400 to-rose-500",
    bgLight: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    step: 0,
  },
};

const statusFilters = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Em andamento" },
  { key: "entregue", label: "Entregues" },
  { key: "cancelado", label: "Cancelados" },
];

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded-full w-24" />
          <div className="h-5 bg-gray-200 rounded-lg w-20" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 h-1.5 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="h-20 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: "no-orders" | "no-filter" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-accent-pink/20 flex items-center justify-center">
          <IceCream className="w-14 h-14 text-primary/60" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-secondary-dark mb-2 text-center">
        {type === "no-orders"
          ? "Nenhum pedido ainda"
          : "Nenhum pedido encontrado"}
      </h3>
      <p className="text-secondary/60 text-center max-w-xs">
        {type === "no-orders"
          ? "Que tal experimentar nossas delícias? Seu próximo pedido aparecerá aqui!"
          : "Tente selecionar outro filtro para ver seus pedidos"}
      </p>
    </div>
  );
}

function ProgressSteps({ currentStep, isCanceled }: { currentStep: number; isCanceled: boolean }) {
  const steps = [1, 2, 3, 4];

  if (isCanceled) {
    return (
      <div className="flex gap-2">
        {steps.map((step) => (
          <div
            key={step}
            className="flex-1 h-1.5 rounded-full bg-red-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {steps.map((step) => (
        <div
          key={step}
          className={cn(
            "flex-1 h-1.5 rounded-full transition-all duration-500",
            step <= currentStep
              ? "bg-gradient-to-r from-primary to-primary-dark"
              : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  formatDate,
  onConfirmDelivery
}: {
  order: Order;
  formatDate: (date: Date) => string;
  onConfirmDelivery?: (orderId: string) => Promise<void>;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const handleConfirmDelivery = async () => {
    if (!onConfirmDelivery) return;
    setIsConfirming(true);
    try {
      await onConfirmDelivery(order.id);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-lg",
        status.borderColor
      )}
    >
      {/* Header com gradiente */}
      <div className={cn("px-5 py-4 bg-gradient-to-r", status.gradient)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{status.label}</p>
              <p className="text-xs text-white/80">{status.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Order Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-secondary/50 font-medium uppercase tracking-wide">
              Pedido
            </p>
            <p className="font-mono font-bold text-secondary-dark">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-secondary/60">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-sm">{formatDate(new Date(order.created_at))}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <ProgressSteps
            currentStep={status.step}
            isCanceled={order.status === "cancelado"}
          />
        </div>

        {/* Items Preview */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full"
        >
          <div className={cn(
            "rounded-2xl p-4 transition-all duration-200",
            status.bgLight
          )}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-secondary-dark mb-1">
                  {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                </p>
                <p className="text-xs text-secondary/60 truncate">
                  {order.items.map(i => i.product_name).join(", ")}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-secondary/40 transition-transform duration-300",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </div>
        </button>

        {/* Expanded Details */}
        <div className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}>
          {/* Items List */}
          <div className="space-y-2 mb-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {item.quantity}x
                    </span>
                  </div>
                  <span className="text-sm font-medium text-secondary-dark">
                    {item.product_name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-secondary">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Address */}
          {order.address_data && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wide mb-1">
                    Endereço de entrega
                  </p>
                  <p className="text-sm text-secondary-dark">
                    {order.address_data.street}, {order.address_data.number}
                    {order.address_data.complement && ` - ${order.address_data.complement}`}
                  </p>
                  <p className="text-sm text-secondary/70">
                    {order.address_data.neighborhood}, {order.address_data.city}
                  </p>
                  <p className="text-xs text-secondary/50 mt-1">
                    CEP: {order.address_data.zip_code}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reorder Button (inside expanded) */}
          {order.status === "entregue" && (
            <button
              onClick={() => alert("Funcionalidade de reordenar em breve!")}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              Pedir novamente
            </button>
          )}
        </div>

        {/* Confirm Delivery Button - Always visible when status is "saiu_entrega" */}
        {order.status === "saiu_entrega" && onConfirmDelivery && (
          <button
            onClick={handleConfirmDelivery}
            disabled={isConfirming}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 disabled:opacity-70"
          >
            {isConfirming ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Confirmar Entrega
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/30 flex items-center justify-center">
          <Package className="w-16 h-16 text-primary/70" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl animate-bounce">
          <IceCream className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-secondary-dark mb-3 text-center">
        Acompanhe seus pedidos
      </h2>
      <p className="text-secondary/60 text-center mb-8 max-w-sm">
        Entre com seu telefone para ver o histórico e acompanhar suas entregas em tempo real
      </p>

      <button
        onClick={onLogin}
        className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
      >
        Fazer Login
      </button>
    </div>
  );
}

export default function PedidosPage() {
  const { user, isAuthenticated } = useAuth();
  const { isCartOpen, closeCart } = useCartContext();
  const { isOpen: isLoginOpen, closeModal: closeLoginModal, openModal: openLoginModal } = useLoginModal();
  const { showToast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const refreshOrders = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const userOrders = await getUserOrders(user.id);
      setOrders(userOrders);
    } catch (error) {
      console.error("Erro ao atualizar pedidos:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const confirmDelivery = async (orderId: string) => {
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: "entregue",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao confirmar entrega");
      }

      showToast("Entrega confirmada com sucesso!", "success");

      // Atualizar lista de pedidos
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: "entregue" as const } : order
        )
      );
    } catch (error) {
      console.error("Erro ao confirmar entrega:", error);
      showToast("Erro ao confirmar entrega", "error");
      throw error;
    }
  };

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "active") {
      return ["novo", "preparando", "saiu_entrega"].includes(order.status);
    }
    return order.status === selectedFilter;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const activeOrdersCount = orders.filter(o =>
    ["novo", "preparando", "saiu_entrega"].includes(o.status)
  ).length;

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen pb-24 md:hidden bg-background" style={{ paddingTop: "80px" }}>
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary-dark">
                Meus Pedidos
              </h1>
              {isAuthenticated && activeOrdersCount > 0 && (
                <p className="text-sm text-secondary/60">
                  {activeOrdersCount} {activeOrdersCount === 1 ? "pedido ativo" : "pedidos ativos"}
                </p>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={refreshOrders}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-5 h-5 text-secondary", isRefreshing && "animate-spin")} />
              </button>
            )}
          </div>

          {/* Filters */}
          {isAuthenticated && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setSelectedFilter(filter.key)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                    selectedFilter === filter.key
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/25"
                      : "bg-white text-secondary border border-gray-200 hover:border-primary/30"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          {!isAuthenticated ? (
            <LoginPrompt onLogin={openLoginModal} />
          ) : isLoading ? (
            <div className="px-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <EmptyState type={orders.length === 0 ? "no-orders" : "no-filter"} />
          ) : (
            <div className="px-4 space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} formatDate={formatDate} onConfirmDelivery={confirmDelivery} />
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-secondary-dark">
                Meus Pedidos
              </h1>
              {isAuthenticated && activeOrdersCount > 0 && (
                <p className="text-secondary/60 mt-1">
                  Você tem {activeOrdersCount} {activeOrdersCount === 1 ? "pedido em andamento" : "pedidos em andamento"}
                </p>
              )}
            </div>
            {isAuthenticated && (
              <button
                onClick={refreshOrders}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Atualizar
              </button>
            )}
          </div>

          {!isAuthenticated ? (
            <LoginPrompt onLogin={openLoginModal} />
          ) : (
            <>
              {/* Filters */}
              <div className="flex gap-3 mb-8">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      selectedFilter === filter.key
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25"
                        : "bg-white text-secondary border border-gray-200 hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Orders Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <OrderCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <EmptyState type={orders.length === 0 ? "no-orders" : "no-filter"} />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} formatDate={formatDate} onConfirmDelivery={confirmDelivery} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Shared Modals */}
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
