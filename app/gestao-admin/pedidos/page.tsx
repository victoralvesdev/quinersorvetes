"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Search,
  Package,
  ChevronDown,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  RefreshCw,
  Filter
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { getAllOrders, Order } from "@/lib/supabase/orders";
import { getProducts } from "@/lib/supabase/products";
import { Product } from "@/types/product";
import { useToast } from "@/components/ui/Toast";

const statusConfig = {
  novo: {
    label: "Novos",
    fullLabel: "Aguardando Aprovacao",
    icon: ShoppingBag,
    color: "amber",
    bgGradient: "from-amber-50 to-orange-50",
    headerBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
  },
  preparando: {
    label: "Em Preparo",
    fullLabel: "Sendo Preparado",
    icon: Clock,
    color: "blue",
    bgGradient: "from-blue-50 to-indigo-50",
    headerBg: "bg-gradient-to-r from-blue-500 to-indigo-500",
    badge: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  saiu_entrega: {
    label: "Em Entrega",
    fullLabel: "Saiu para Entrega",
    icon: Truck,
    color: "emerald",
    bgGradient: "from-emerald-50 to-teal-50",
    headerBg: "bg-gradient-to-r from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
  },
  entregue: {
    label: "Entregue",
    fullLabel: "Pedido Entregue",
    icon: CheckCircle,
    color: "gray",
    bgGradient: "from-gray-50 to-slate-50",
    headerBg: "bg-gradient-to-r from-gray-500 to-slate-500",
    badge: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
  },
  cancelado: {
    label: "Cancelado",
    fullLabel: "Pedido Cancelado",
    icon: XCircle,
    color: "red",
    bgGradient: "from-red-50 to-rose-50",
    headerBg: "bg-gradient-to-r from-red-500 to-rose-500",
    badge: "bg-red-100 text-red-700",
    border: "border-red-200",
  },
};

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col">
          <div className="h-14 bg-gray-200 rounded-t-2xl animate-pulse" />
          <div className="flex-1 bg-gray-100 rounded-b-2xl p-4 min-h-[400px] space-y-4">
            {[1, 2].map((j) => (
              <div key={j} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded-lg w-2/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded-lg w-1/3" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PedidosAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        getAllOrders(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      showToast("Dados atualizados!", "success");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      showToast("Erro ao atualizar dados", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Status atualizado com sucesso!", "success");
        loadData();
      } else {
        showToast(result.error || "Erro ao atualizar status", "error");
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "pix":
        return <QrCode className="w-3.5 h-3.5" />;
      case "credit_card":
      case "debit_card":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "cash_on_delivery":
        return <Banknote className="w-3.5 h-3.5" />;
      default:
        return <DollarSign className="w-3.5 h-3.5" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "pix":
        return "PIX";
      case "credit_card":
        return "Crédito";
      case "debit_card":
        return "Débito";
      case "cash_on_delivery":
        return "Na Entrega";
      default:
        return method;
    }
  };

  const isOrderPaid = (order: Order): boolean => {
    // Se for pagamento na entrega, só é pago após status "entregue"
    if (order.payment_method === "cash_on_delivery") {
      return order.status === "entregue";
    }
    // Para PIX e cartão, considera pago (ou usar order.is_paid se disponível)
    return (order as any).is_paid !== false;
  };

  const toggleExpand = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (expandedOrders.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Filtrar pedidos por busca e status
  const filteredOrders = orders.filter((order) => {
    const user = (order as any).users;
    const matchesSearch =
      searchQuery === "" ||
      user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.phone?.includes(searchQuery) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Agrupar pedidos por status
  const ordersByStatus = {
    novo: filteredOrders.filter((o) => o.status === "novo"),
    preparando: filteredOrders.filter((o) => o.status === "preparando"),
    saiu_entrega: filteredOrders.filter((o) => o.status === "saiu_entrega"),
    concluidos: filteredOrders.filter(
      (o) => o.status === "entregue" || o.status === "cancelado"
    ),
  };

  // Estatisticas rapidas
  const stats = {
    total: orders.length,
    novos: orders.filter((o) => o.status === "novo").length,
    emPreparo: orders.filter((o) => o.status === "preparando").length,
    emEntrega: orders.filter((o) => o.status === "saiu_entrega").length,
  };

  const kanbanColumns = [
    {
      key: "novo" as const,
      configKey: "novo" as keyof typeof statusConfig,
      title: "Novos Pedidos",
      orders: ordersByStatus.novo,
    },
    {
      key: "preparando" as const,
      configKey: "preparando" as keyof typeof statusConfig,
      title: "Em Preparo",
      orders: ordersByStatus.preparando,
    },
    {
      key: "saiu_entrega" as const,
      configKey: "saiu_entrega" as keyof typeof statusConfig,
      title: "Em Entrega",
      orders: ordersByStatus.saiu_entrega,
    },
    {
      key: "concluidos" as const,
      configKey: "entregue" as keyof typeof statusConfig,
      title: "Finalizados",
      orders: ordersByStatus.concluidos,
    },
  ];

  const filterOptions = [
    { value: "all", label: "Todos", icon: Package, color: "gray" },
    { value: "novo", label: "Novos", icon: ShoppingBag, color: "amber" },
    { value: "preparando", label: "Em Preparo", icon: Clock, color: "blue" },
    { value: "saiu_entrega", label: "Em Entrega", icon: Truck, color: "emerald" },
    { value: "entregue", label: "Entregues", icon: CheckCircle, color: "gray" },
    { value: "cancelado", label: "Cancelados", icon: XCircle, color: "red" },
  ];

  const renderOrderCard = (order: Order, columnKey: string) => {
    const user = (order as any).users;
    const config = statusConfig[order.status];
    const isExpanded = expandedOrders.has(order.id);
    const isPaid = isOrderPaid(order);

    return (
      <div
        key={order.id}
        className={cn(
          "bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden hover:shadow-md",
          config.border
        )}
      >
        {/* Card Header */}
        <div className="p-4">
          {/* Top Row - ID & Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold",
                config.badge
              )}>
                #{order.id.slice(0, 6).toUpperCase()}
              </span>
              <span className={cn(
                "px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1",
                isPaid ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              )}>
                {getPaymentIcon(order.payment_method)}
                {isPaid ? "Pago" : getPaymentLabel(order.payment_method)}
              </span>
            </div>
            <span className="text-xs text-secondary/50">{formatDate(order.created_at)}</span>
          </div>

          {/* Customer Info */}
          <div className="mb-3">
            <p className="font-semibold text-secondary-dark">{user?.name || "Cliente"}</p>
            <p className="text-xs text-secondary/50">
              {order.items.length} {order.items.length === 1 ? "item" : "itens"}
            </p>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-3">
            <span className="text-sm text-secondary/70">Total do Pedido</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
          </div>

          {/* Expand Button */}
          <button
            onClick={() => toggleExpand(order.id)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-secondary/60 hover:text-secondary hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>{isExpanded ? "Ocultar detalhes" : "Ver detalhes"}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} />
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              {/* Contact Info */}
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm text-secondary/70">
                  <Phone className="w-4 h-4 text-secondary/40" />
                  <span>{user.phone}</span>
                </div>
              )}

              {/* Address */}
              {order.address_data && (
                <div className="flex items-start gap-2 text-sm text-secondary/70">
                  <MapPin className="w-4 h-4 text-secondary/40 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-secondary-dark">
                      {order.address_data.street}, {order.address_data.number}
                    </p>
                    <p className="text-xs">{order.address_data.neighborhood}</p>
                    {order.address_data.reference && (
                      <p className="text-xs text-primary mt-1">Ref: {order.address_data.reference}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wide">Itens</p>
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
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
                      <p className="text-xs text-secondary/50">{formatCurrency(item.price)}</p>
                    </div>
                    <span className="text-xs font-bold text-secondary/70">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4">
          {order.status === "novo" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(order.id, "preparando")}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Aceitar
              </button>
              <button
                onClick={() => handleStatusUpdate(order.id, "cancelado")}
                className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {order.status === "preparando" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(order.id, "saiu_entrega")}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <Truck className="w-4 h-4" />
                Saiu p/ Entrega
              </button>
              <button
                onClick={() => handleStatusUpdate(order.id, "cancelado")}
                className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {order.status === "saiu_entrega" && (
            <button
              onClick={() => handleStatusUpdate(order.id, "entregue")}
              className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Marcar como Entregue
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Gestao de Pedidos</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Todos os Pedidos
          </h1>
          <p className="text-secondary/60 mt-1">
            Gerencie e acompanhe todos os pedidos em tempo real
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-6 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.novos}</p>
              <p className="text-xs text-secondary/50">Novos</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.emPreparo}</p>
              <p className="text-xs text-secondary/50">Preparo</p>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{stats.emEntrega}</p>
              <p className="text-xs text-secondary/50">Entrega</p>
            </div>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-secondary", isRefreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                Buscar Pedidos
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome, telefone ou ID do pedido..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="lg:w-auto">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Filtrar por Status
              </label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = filterStatus === option.value;
                  const colorClasses = {
                    gray: isSelected ? "bg-gray-600 text-white border-gray-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400",
                    amber: isSelected ? "bg-amber-500 text-white border-amber-500" : "bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400",
                    blue: isSelected ? "bg-blue-500 text-white border-blue-500" : "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400",
                    emerald: isSelected ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400",
                    red: isSelected ? "bg-red-500 text-white border-red-500" : "bg-red-50 text-red-600 border-red-200 hover:border-red-400",
                  };

                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterStatus(option.value)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                        colorClasses[option.color as keyof typeof colorClasses]
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results Count */}
          {(searchQuery || filterStatus !== "all") && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-secondary/60">
                Encontrado{filteredOrders.length !== 1 ? "s" : ""}{" "}
                <span className="font-semibold text-secondary-dark">{filteredOrders.length}</span>{" "}
                pedido{filteredOrders.length !== 1 ? "s" : ""}
                {searchQuery && (
                  <span> para &quot;<span className="font-medium text-primary">{searchQuery}</span>&quot;</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((column) => {
            const config = statusConfig[column.configKey];
            const ColumnIcon = config.icon;

            return (
              <div key={column.key} className="flex flex-col">
                {/* Column Header */}
                <div className={cn(
                  "px-4 py-3 rounded-t-2xl flex items-center gap-3 text-white font-semibold shadow-sm",
                  config.headerBg
                )}>
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <ColumnIcon className="w-4 h-4" />
                  </div>
                  <span className="flex-1">{column.title}</span>
                  <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs font-bold">
                    {column.orders.length}
                  </span>
                </div>

                {/* Column Content */}
                <div className={cn(
                  "flex-1 p-3 rounded-b-2xl min-h-[500px] max-h-[70vh] overflow-y-auto space-y-3 bg-gradient-to-b",
                  config.bgGradient
                )}>
                  {column.orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 bg-white/80 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-secondary/50">Nenhum pedido</p>
                    </div>
                  ) : (
                    column.orders.map((order) => renderOrderCard(order, column.key))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
