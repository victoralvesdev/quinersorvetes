"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  DollarSign,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  Phone,
  Package,
  TrendingUp,
  Users,
  Timer,
  Sparkles,
  CreditCard,
  Banknote,
  QrCode
} from "lucide-react";
import { getAllOrders } from "@/lib/supabase/orders";
import { getProducts } from "@/lib/supabase/products";
import { Order } from "@/lib/supabase/orders";
import { Product } from "@/types/product";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { updateOrderStatus } from "@/lib/supabase/orders";

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded-lg" />
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100/50 animate-pulse">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 bg-gray-200 rounded-lg" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-24 bg-gray-200 rounded-lg" />
        </div>
        <div className="w-px bg-gray-100" />
        <div className="w-48 space-y-2">
          <div className="h-12 bg-gray-200 rounded-xl" />
          <div className="h-12 bg-gray-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function GestaoAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        getAllOrders(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showToast("Erro ao carregar dados", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      if (updated) {
        showToast("Status atualizado com sucesso!", "success");
        loadData();
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      showToast("Erro ao atualizar status", "error");
    }
  };

  const getProductImage = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.image || "/images/products/product-1.jpg";
  };

  // Calcular estatísticas do dia
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const todayRevenue = todayOrders
    .filter((o) => o.status === "entregue")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrdersCount = orders.filter(
    (o) => o.status === "novo" || o.status === "preparando"
  ).length;

  // Calcular tempo médio (mock - em produção viria do banco)
  const averageTime = "6";
  const queueTime = pendingOrdersCount * 2;

  // Pedidos atuais (novos e em preparo)
  const currentOrders = orders
    .filter((o) => o.status === "novo" || o.status === "preparando")
    .slice(0, 10);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderDate = new Date(dateString);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "pix":
        return <QrCode className="w-3.5 h-3.5" />;
      case "cartao":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "dinheiro":
        return <Banknote className="w-3.5 h-3.5" />;
      default:
        return <DollarSign className="w-3.5 h-3.5" />;
    }
  };

  const statCards = [
    {
      title: "Pedidos Hoje",
      value: todayOrders.length,
      suffix: "pedidos",
      icon: Package,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary",
      iconColor: "text-white",
      valueColor: "text-primary",
    },
    {
      title: "Tempo Médio",
      value: averageTime,
      suffix: "minutos",
      icon: Timer,
      gradient: "from-amber-100/80 to-amber-50/50",
      iconBg: "bg-amber-500",
      iconColor: "text-white",
      valueColor: "text-amber-600",
    },
    {
      title: "Fila Atual",
      value: queueTime,
      suffix: "min espera",
      icon: Clock,
      gradient: "from-blue-100/80 to-blue-50/50",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
      valueColor: "text-blue-600",
    },
    {
      title: "Vendas Hoje",
      value: formatCurrency(todayRevenue),
      suffix: "",
      icon: TrendingUp,
      gradient: "from-emerald-100/80 to-emerald-50/50",
      iconBg: "bg-emerald-500",
      iconColor: "text-white",
      valueColor: "text-emerald-600",
    },
  ];

  // Calcular produtos mais pedidos
  const productCounts: Record<string, { product: Product; count: number }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        if (!productCounts[item.product_id]) {
          productCounts[item.product_id] = { product, count: 0 };
        }
        productCounts[item.product_id].count += item.quantity;
      }
    });
  });

  const mostOrdered = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Função para obter saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return "Bom dia";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary">Visao Geral</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            {getGreeting()}! Aqui esta o resumo
          </h1>
          <p className="text-secondary/60 mt-1">
            Acompanhe os pedidos e vendas do seu negocio em tempo real
          </p>
        </div>
        <Link
          href="/gestao-admin/pedidos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
        >
          <Package className="w-4 h-4" />
          Ver Todos Pedidos
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Skeleton Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          {/* Skeleton Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 border border-white/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
                    stat.gradient
                  )}
                >
                  {/* Decorative circles */}
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
                  <div className="absolute -right-2 -bottom-6 w-16 h-16 bg-white/20 rounded-full blur-xl" />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary/70 mb-2">{stat.title}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-3xl font-bold", stat.valueColor)}>
                          {stat.value}
                        </span>
                        {stat.suffix && (
                          <span className="text-sm text-secondary/50">{stat.suffix}</span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl shadow-sm",
                      stat.iconBg
                    )}>
                      <Icon className={cn("w-5 h-5", stat.iconColor)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold text-secondary-dark">Pedidos Pendentes</h2>
                      <p className="text-xs text-secondary/50">{currentOrders.length} aguardando acao</p>
                    </div>
                  </div>
                  {currentOrders.length > 0 && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                      Acao Necessaria
                    </span>
                  )}
                </div>

                {/* Orders List */}
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {currentOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-secondary/70 font-medium">Nenhum pedido pendente</p>
                      <p className="text-sm text-secondary/50 mt-1">Novos pedidos aparecerao aqui</p>
                    </div>
                  ) : (
                    currentOrders.map((order) => {
                      const user = (order as any).users;
                      const isPaid = order.payment_method !== "cash_on_delivery" || order.status !== "novo";
                      const timeAgo = getTimeAgo(order.created_at);
                      const isExpanded = expandedOrders.has(order.id);
                      const isNew = order.status === "novo";

                      const toggleExpand = () => {
                        const newExpanded = new Set(expandedOrders);
                        if (isExpanded) {
                          newExpanded.delete(order.id);
                        } else {
                          newExpanded.add(order.id);
                        }
                        setExpandedOrders(newExpanded);
                      };

                      return (
                        <div
                          key={order.id}
                          className={cn(
                            "rounded-2xl border-2 transition-all duration-200 overflow-hidden",
                            isNew
                              ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          )}
                        >
                          {/* Order Header */}
                          <div className="p-4 flex flex-col lg:flex-row gap-4">
                            {/* Left - Info */}
                            <div className="flex-1 min-w-0">
                              {/* Top Row */}
                               <div className="flex items-start justify-between gap-3 mb-3">
                                 <div className="flex items-center gap-3">
                                   <div className={cn(
                                     "px-3 py-2 rounded-xl flex items-center justify-center font-bold text-base min-w-[70px]",
                                     isNew ? "bg-primary text-white" : "bg-amber-100 text-amber-700"
                                   )}>
                                     #{order.id.slice(0, 8).toUpperCase()}
                                   </div>
                                   <div>
                                     <p className="font-semibold text-secondary-dark">
                                       {user?.name || "Cliente"}
                                     </p>
                                     <p className="text-xs text-secondary/50">
                                       {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
                                     </p>
                                   </div>
                                 </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1",
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-red-100 text-red-700"
                                  )}>
                                    {getPaymentIcon(order.payment_method)}
                                    {isPaid ? "Pago" : "Pendente"}
                                  </span>
                                  <span className="px-2.5 py-1 bg-gray-100 text-secondary/70 rounded-lg text-xs font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo}
                                  </span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className={cn(
                                  "px-3 py-1.5 rounded-full text-xs font-semibold",
                                  isNew
                                    ? "bg-primary/10 text-primary"
                                    : "bg-amber-100 text-amber-700"
                                )}>
                                  {isNew ? "Aguardando Aprovacao" : "Em Preparo"}
                                </span>
                                <button
                                  onClick={toggleExpand}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <ChevronDown className={cn(
                                    "w-4 h-4 text-secondary/50 transition-transform duration-200",
                                    isExpanded && "rotate-180"
                                  )} />
                                </button>
                              </div>

                              {/* Expanded Info */}
                              {isExpanded && (
                                <div className="bg-white/80 rounded-xl p-3 space-y-2 border border-gray-100 mb-3">
                                  {user?.phone && (
                                    <div className="flex items-center gap-2 text-sm text-secondary/70">
                                      <Phone className="w-4 h-4 text-secondary/40" />
                                      <span>{user.phone}</span>
                                    </div>
                                  )}
                                  {order.address_data && (
                                    <div className="flex items-start gap-2 text-sm text-secondary/70">
                                      <MapPin className="w-4 h-4 text-secondary/40 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="font-medium text-secondary-dark">
                                          {order.address_data.street}, {order.address_data.number}
                                        </p>
                                        {order.address_data.complement && (
                                          <p className="text-xs">{order.address_data.complement}</p>
                                        )}
                                        <p className="text-xs">
                                          {order.address_data.neighborhood} - {order.address_data.city}
                                        </p>
                                        {order.address_data.reference && (
                                          <p className="text-xs mt-1 text-primary">
                                            Ref: {order.address_data.reference}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              {isNew && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, "preparando")}
                                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Aceitar Pedido
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(order.id, "cancelado")}
                                    className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    Recusar
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Divider */}
                            <div className="hidden lg:block w-px bg-gray-100" />

                            {/* Right - Products */}
                            <div className="lg:w-56 flex-shrink-0">
                              <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wide mb-2">Itens do Pedido</p>
                              <div className="space-y-2">
                                {order.items.slice(0, 3).map((item, index) => (
                                  <div key={index} className="flex items-center gap-2.5 bg-gray-50 rounded-xl p-2">
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-gray-100">
                                      <Image
                                        src={getProductImage(item.product_id)}
                                        alt={item.product_name}
                                        width={40}
                                        height={40}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = "/images/products/product-1.jpg";
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-secondary-dark truncate">{item.product_name}</p>
                                      <p className="text-xs text-secondary/50">{item.quantity}x {formatCurrency(item.price)}</p>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <p className="text-xs text-center text-secondary/50 py-1">
                                    +{order.items.length - 3} mais itens
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Top Products */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm overflow-hidden h-fit sticky top-24">
                {/* Section Header */}
                <div className="px-6 py-4 border-b border-gray-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-secondary-dark">Mais Vendidos</h2>
                      <p className="text-xs text-secondary/50">Ranking de produtos</p>
                    </div>
                  </div>
                  <Link
                    href="/gestao-admin/produtos"
                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Ver Todos
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Products List */}
                <div className="p-4 space-y-2">
                  {mostOrdered.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-secondary/70">Sem dados ainda</p>
                    </div>
                  ) : (
                    mostOrdered.map(({ product, count }, index) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        {/* Rank Badge */}
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                          index === 0 ? "bg-amber-100 text-amber-700" :
                          index === 1 ? "bg-gray-200 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-500"
                        )}>
                          {index + 1}
                        </div>

                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 group-hover:border-primary/20 transition-colors">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Package className="w-5 h-5 text-primary/40" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-dark truncate group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-secondary/50">
                            {formatCurrency(product.price)}
                          </p>
                        </div>

                        {/* Count */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-secondary-dark">{count}x</p>
                          <p className="text-xs text-secondary/40">vendas</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Stats Footer */}
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-br from-primary/5 to-accent-pink/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-secondary/70">Clientes Hoje</span>
                      </div>
                      <span className="text-lg font-bold text-primary">{todayOrders.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
