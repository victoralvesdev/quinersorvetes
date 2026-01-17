"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  BarChart3,
  Calendar,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Target,
  Award
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { getAllOrders, Order } from "@/lib/supabase/orders";
import { getProducts } from "@/lib/supabase/products";
import { getAllUsers } from "@/lib/supabase/users";
import { Product } from "@/types/product";
import { useToast } from "@/components/ui/Toast";

interface DailyStats {
  date: string;
  dayName: string;
  revenue: number;
  orders: number;
}

interface ProductStats {
  product: Product;
  quantity: number;
  revenue: number;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded-lg" />
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
          <div className="h-3 w-20 bg-gray-200 rounded-lg" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("week");
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersData, productsData, usersData] = await Promise.all([
        getAllOrders(),
        getProducts(),
        getAllUsers(),
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setUsers(usersData);
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
      await loadData();
      showToast("Dados atualizados!", "success");
    } catch (error) {
      showToast("Erro ao atualizar", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Date filtering
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateRange) {
      case "today":
        return { start: today, end: now };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        return { start: weekStart, end: now };
      case "month":
        const monthStart = new Date(today);
        monthStart.setDate(monthStart.getDate() - 30);
        return { start: monthStart, end: now };
      default:
        return { start: today, end: now };
    }
  };

  const { start, end } = getDateRange();

  // Filter orders by date range
  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    return orderDate >= start && orderDate <= end;
  });

  // Calculate stats
  const completedOrders = filteredOrders.filter((o) => o.status === "entregue");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = filteredOrders.length;
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelado").length;
  const conversionRate = totalOrders > 0 ? ((completedOrders.length / totalOrders) * 100) : 0;

  // Previous period comparison (for percentage change)
  const getPreviousPeriodOrders = () => {
    const periodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - periodLength);
    const prevEnd = new Date(start.getTime());

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= prevStart && orderDate < prevEnd;
    });
  };

  const prevOrders = getPreviousPeriodOrders();
  const prevCompletedOrders = prevOrders.filter((o) => o.status === "entregue");
  const prevRevenue = prevCompletedOrders.reduce((sum, o) => sum + o.total, 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const ordersChange = prevOrders.length > 0 ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 : 0;

  // Daily stats for chart
  const getDailyStats = (): DailyStats[] => {
    const days: DailyStats[] = [];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= date && orderDate < nextDate && o.status === "entregue";
      });

      days.push({
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        dayName: dayNames[date.getDay()],
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      });
    }

    return days;
  };

  const dailyStats = getDailyStats();
  const maxRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);

  // Top products
  const getTopProducts = (): ProductStats[] => {
    const productStats: Record<string, { quantity: number; revenue: number }> = {};

    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!productStats[item.product_id]) {
          productStats[item.product_id] = { quantity: 0, revenue: 0 };
        }
        productStats[item.product_id].quantity += item.quantity;
        productStats[item.product_id].revenue += item.price * item.quantity;
      });
    });

    return Object.entries(productStats)
      .map(([productId, stats]) => ({
        product: products.find((p) => p.id === productId) || { id: productId, name: "Produto", price: 0 } as Product,
        ...stats,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  const topProducts = getTopProducts();
  const maxQuantity = Math.max(...topProducts.map((p) => p.quantity), 1);

  // Payment methods breakdown
  const getPaymentBreakdown = () => {
    const breakdown: Record<string, { count: number; total: number }> = {
      pix: { count: 0, total: 0 },
      credit_card: { count: 0, total: 0 },
      debit_card: { count: 0, total: 0 },
      cash_on_delivery: { count: 0, total: 0 },
    };

    completedOrders.forEach((order) => {
      const method = order.payment_method || "cash_on_delivery";
      if (breakdown[method]) {
        breakdown[method].count++;
        breakdown[method].total += order.total;
      }
    });

    return breakdown;
  };

  const paymentBreakdown = getPaymentBreakdown();
  const totalPayments = Object.values(paymentBreakdown).reduce((sum, p) => sum + p.count, 0);

  const paymentMethods = [
    { key: "pix", label: "PIX", icon: QrCode, color: "emerald" },
    { key: "credit_card", label: "Credito", icon: CreditCard, color: "blue" },
    { key: "debit_card", label: "Debito", icon: CreditCard, color: "purple" },
    { key: "cash_on_delivery", label: "Dinheiro", icon: Banknote, color: "amber" },
  ];

  const statCards = [
    {
      title: "Faturamento",
      value: formatCurrency(totalRevenue),
      change: revenueChange,
      icon: DollarSign,
      gradient: "from-emerald-100/80 to-emerald-50/50",
      iconBg: "bg-emerald-500",
      valueColor: "text-emerald-600",
    },
    {
      title: "Pedidos",
      value: totalOrders,
      change: ordersChange,
      icon: Package,
      gradient: "from-blue-100/80 to-blue-50/50",
      iconBg: "bg-blue-500",
      valueColor: "text-blue-600",
    },
    {
      title: "Ticket Medio",
      value: formatCurrency(avgTicket),
      change: null,
      icon: Target,
      gradient: "from-primary/10 to-primary/5",
      iconBg: "bg-primary",
      valueColor: "text-primary",
    },
    {
      title: "Taxa de Conversao",
      value: `${conversionRate.toFixed(1)}%`,
      change: null,
      icon: Percent,
      gradient: "from-amber-100/80 to-amber-50/50",
      iconBg: "bg-amber-500",
      valueColor: "text-amber-600",
    },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Analytics</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Relatorios e Estatisticas
          </h1>
          <p className="text-secondary/60 mt-1">
            Acompanhe o desempenho do seu negocio
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
            {[
              { value: "today", label: "Hoje" },
              { value: "week", label: "7 dias" },
              { value: "month", label: "30 dias" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value as any)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  dateRange === option.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-secondary/70 hover:text-secondary hover:bg-gray-50"
                )}
              >
                {option.label}
              </button>
            ))}
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

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const isPositive = stat.change !== null && stat.change >= 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 border border-white/50 shadow-sm transition-all duration-300 hover:shadow-md",
                    stat.gradient
                  )}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-secondary/70 mb-2">{stat.title}</p>
                      <p className={cn("text-2xl font-bold mb-1", stat.valueColor)}>
                        {stat.value}
                      </p>
                      {stat.change !== null && (
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          isPositive ? "text-emerald-600" : "text-red-500"
                        )}>
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{Math.abs(stat.change).toFixed(1)}% vs periodo anterior</span>
                        </div>
                      )}
                    </div>
                    <div className={cn("p-3 rounded-xl shadow-sm", stat.iconBg)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-secondary-dark">Faturamento Semanal</h3>
                  <p className="text-sm text-secondary/50">Ultimos 7 dias</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(dailyStats.reduce((sum, d) => sum + d.revenue, 0))}
                  </p>
                  <p className="text-xs text-secondary/50">Total do periodo</p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="flex items-end justify-between gap-2 h-48">
                {dailyStats.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs font-semibold text-secondary-dark mb-1">
                        {formatCurrency(day.revenue)}
                      </span>
                      <div
                        className={cn(
                          "w-full rounded-t-lg transition-all duration-500",
                          index === dailyStats.length - 1
                            ? "bg-gradient-to-t from-primary to-primary/70"
                            : "bg-gradient-to-t from-gray-200 to-gray-100"
                        )}
                        style={{
                          height: `${Math.max((day.revenue / maxRevenue) * 140, 8)}px`,
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-secondary-dark">{day.dayName}</p>
                      <p className="text-xs text-secondary/50">{day.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-secondary-dark">Formas de Pagamento</h3>
                  <p className="text-sm text-secondary/50">{totalPayments} transacoes</p>
                </div>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((method) => {
                  const data = paymentBreakdown[method.key];
                  const percentage = totalPayments > 0 ? (data.count / totalPayments) * 100 : 0;
                  const Icon = method.icon;

                  const colorClasses = {
                    emerald: { bg: "bg-emerald-100", fill: "bg-emerald-500", text: "text-emerald-600" },
                    blue: { bg: "bg-blue-100", fill: "bg-blue-500", text: "text-blue-600" },
                    purple: { bg: "bg-purple-100", fill: "bg-purple-500", text: "text-purple-600" },
                    amber: { bg: "bg-amber-100", fill: "bg-amber-500", text: "text-amber-600" },
                  };

                  const colors = colorClasses[method.color as keyof typeof colorClasses];

                  return (
                    <div key={method.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-1.5 rounded-lg", colors.bg)}>
                            <Icon className={cn("w-4 h-4", colors.text)} />
                          </div>
                          <span className="text-sm font-medium text-secondary-dark">{method.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-secondary-dark">{data.count}</span>
                          <span className="text-xs text-secondary/50 ml-1">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className={cn("h-2 rounded-full", colors.bg)}>
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", colors.fill)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary/70">Total Recebido</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(Object.values(paymentBreakdown).reduce((sum, p) => sum + p.total, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Award className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-dark">Produtos Mais Vendidos</h3>
                    <p className="text-sm text-secondary/50">Ranking por quantidade</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {topProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-secondary/50">Sem dados no periodo</p>
                  </div>
                ) : (
                  topProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                        index === 0 ? "bg-amber-100 text-amber-700" :
                        index === 1 ? "bg-gray-200 text-gray-600" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-500"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-secondary-dark truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                index === 0 ? "bg-amber-500" :
                                index === 1 ? "bg-gray-400" :
                                index === 2 ? "bg-orange-400" :
                                "bg-gray-300"
                              )}
                              style={{ width: `${(item.quantity / maxQuantity) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-secondary/50 w-16 text-right">
                            {item.quantity} un.
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary-dark">Resumo do Periodo</h3>
                    <p className="text-sm text-secondary/50">Metricas importantes</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Entregues</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">{completedOrders.length}</p>
                  <p className="text-xs text-emerald-600/70">pedidos concluidos</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Cancelados</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{cancelledOrders}</p>
                  <p className="text-xs text-red-600/70">pedidos cancelados</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Clientes</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                  <p className="text-xs text-blue-600/70">cadastrados</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Produtos</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{products.length}</p>
                  <p className="text-xs text-purple-600/70">no catalogo</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary/70">Media diaria de pedidos</span>
                  <span className="font-bold text-secondary-dark">
                    {(totalOrders / 7).toFixed(1)} pedidos
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary/70">Faturamento medio diario</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(totalRevenue / 7)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
