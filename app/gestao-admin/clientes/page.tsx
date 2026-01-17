"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Phone,
  ShoppingBag,
  Search,
  RefreshCw,
  TrendingUp,
  Calendar,
  DollarSign,
  Crown,
  Star,
  ChevronRight,
  Mail,
  MapPin,
  Clock,
  Award
} from "lucide-react";
import { getAllUsers } from "@/lib/supabase/users";
import { getAllOrders } from "@/lib/supabase/orders";
import { User as UserType } from "@/types/user";
import { Order } from "@/lib/supabase/orders";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface ClientWithStats extends UserType {
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-lg w-32" />
            <div className="h-3 bg-gray-200 rounded-lg w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-28" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-24" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded-lg w-20" /></td>
    </tr>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  gradient,
  iconBg,
  valueColor
}: {
  icon: any;
  label: string;
  value: string | number;
  suffix?: string;
  gradient: string;
  iconBg: string;
  valueColor: string;
}) {
  return (
    <div className={cn(
      "relative overflow-hidden bg-gradient-to-br rounded-2xl p-5 border border-white/50 shadow-sm",
      gradient
    )}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-secondary/70 mb-2">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-2xl font-bold", valueColor)}>{value}</span>
            {suffix && <span className="text-sm text-secondary/50">{suffix}</span>}
          </div>
        </div>
        <div className={cn("p-3 rounded-xl shadow-sm", iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<"orders" | "spent" | "recent">("orders");
  const { showToast } = useToast();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const [users, orders] = await Promise.all([
        getAllUsers(),
        getAllOrders(),
      ]);

      const clientsWithStats: ClientWithStats[] = users.map((user) => {
        const userOrders = orders.filter((order: Order) => order.user_id === user.id);
        const orderCount = userOrders.length;
        const totalSpent = userOrders
          .filter((o: Order) => o.status === "entregue")
          .reduce((sum: number, o: Order) => sum + o.total, 0);
        const lastOrder = userOrders
          .sort((a: Order, b: Order) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

        return {
          ...user,
          orderCount,
          totalSpent,
          lastOrderDate: lastOrder?.created_at,
        };
      });

      setClients(clientsWithStats);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showToast("Erro ao carregar clientes", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadClients();
      showToast("Dados atualizados!", "success");
    } catch (error) {
      showToast("Erro ao atualizar", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nunca";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return null;
    const now = new Date();
    const date = new Date(dateString);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses`;
    return `${Math.floor(diffDays / 365)} anos`;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return phone;
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  // Sort clients
  const sortedClients = [...filteredClients].sort((a, b) => {
    switch (sortBy) {
      case "orders":
        return b.orderCount - a.orderCount;
      case "spent":
        return b.totalSpent - a.totalSpent;
      case "recent":
        if (!a.lastOrderDate) return 1;
        if (!b.lastOrderDate) return -1;
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      default:
        return 0;
    }
  });

  // Stats
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.orderCount > 0).length,
    totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
    avgOrderValue: clients.length > 0
      ? clients.reduce((sum, c) => sum + c.totalSpent, 0) / clients.filter(c => c.orderCount > 0).length || 0
      : 0,
  };

  // Top client
  const topClient = clients.reduce((top, client) =>
    client.totalSpent > (top?.totalSpent || 0) ? client : top
  , clients[0]);

  const getClientTier = (totalSpent: number) => {
    if (totalSpent >= 500) return { label: "VIP", color: "bg-amber-500", icon: Crown };
    if (totalSpent >= 200) return { label: "Ouro", color: "bg-yellow-500", icon: Star };
    if (totalSpent >= 100) return { label: "Prata", color: "bg-gray-400", icon: Award };
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Base de Clientes</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Gerenciar Clientes
          </h1>
          <p className="text-secondary/60 mt-1">
            Visualize e acompanhe seus clientes e historico de compras
          </p>
        </div>

        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4 text-secondary", isRefreshing && "animate-spin")} />
          <span className="text-sm font-medium text-secondary">Atualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total de Clientes"
          value={stats.totalClients}
          suffix="cadastrados"
          gradient="from-primary/10 to-primary/5"
          iconBg="bg-primary"
          valueColor="text-primary"
        />
        <StatCard
          icon={ShoppingBag}
          label="Clientes Ativos"
          value={stats.activeClients}
          suffix="com pedidos"
          gradient="from-emerald-100/80 to-emerald-50/50"
          iconBg="bg-emerald-500"
          valueColor="text-emerald-600"
        />
        <StatCard
          icon={DollarSign}
          label="Receita Total"
          value={formatCurrency(stats.totalRevenue)}
          gradient="from-blue-100/80 to-blue-50/50"
          iconBg="bg-blue-500"
          valueColor="text-blue-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket Medio"
          value={formatCurrency(stats.avgOrderValue)}
          gradient="from-amber-100/80 to-amber-50/50"
          iconBg="bg-amber-500"
          valueColor="text-amber-600"
        />
      </div>

      {/* Top Client Highlight */}
      {topClient && topClient.totalSpent > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Cliente Top</span>
                  <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">VIP</span>
                </div>
                <p className="text-lg font-bold text-secondary-dark">{topClient.name}</p>
                <p className="text-sm text-secondary/60">{topClient.orderCount} pedidos realizados</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-secondary/50">Total gasto</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(topClient.totalSpent)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                Buscar Clientes
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome ou telefone..."
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:w-auto">
              <label className="block text-sm font-semibold text-secondary-dark mb-2">
                Ordenar por
              </label>
              <div className="flex gap-2">
                {[
                  { value: "orders", label: "Mais Pedidos", icon: ShoppingBag },
                  { value: "spent", label: "Maior Gasto", icon: DollarSign },
                  { value: "recent", label: "Mais Recente", icon: Clock },
                ].map((option) => {
                  const Icon = option.icon;
                  const isSelected = sortBy === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value as any)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                        isSelected
                          ? "bg-primary text-white border-primary"
                          : "bg-gray-50 text-secondary/70 border-gray-200 hover:border-primary/30"
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
          {searchQuery && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-secondary/60">
                Encontrado{filteredClients.length !== 1 ? "s" : ""}{" "}
                <span className="font-semibold text-secondary-dark">{filteredClients.length}</span>{" "}
                cliente{filteredClients.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Total Gasto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-secondary/70 uppercase tracking-wider">
                  Ultima Compra
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => <TableRowSkeleton key={i} />)
              ) : sortedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-secondary/70 font-medium">Nenhum cliente encontrado</p>
                    <p className="text-sm text-secondary/50 mt-1">
                      {searchQuery ? "Tente ajustar sua busca" : "Os clientes aparecerao aqui"}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedClients.map((client, index) => {
                  const tier = getClientTier(client.totalSpent);
                  const timeAgo = getTimeAgo(client.lastOrderDate);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className={cn(
                              "w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm",
                              index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" :
                              index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400" :
                              index === 2 ? "bg-gradient-to-br from-orange-300 to-orange-400" :
                              "bg-gradient-to-br from-primary/80 to-primary"
                            )}>
                              {getInitials(client.name)}
                            </div>
                            {tier && (
                              <div className={cn(
                                "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
                                tier.color
                              )}>
                                <tier.icon className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Name & Badge */}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-secondary-dark group-hover:text-primary transition-colors">
                                {client.name}
                              </p>
                              {index < 3 && client.orderCount > 0 && (
                                <span className={cn(
                                  "px-1.5 py-0.5 text-xs font-bold rounded",
                                  index === 0 ? "bg-amber-100 text-amber-700" :
                                  index === 1 ? "bg-gray-200 text-gray-600" :
                                  "bg-orange-100 text-orange-700"
                                )}>
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                            {tier && (
                              <span className={cn(
                                "text-xs font-medium",
                                tier.color === "bg-amber-500" ? "text-amber-600" :
                                tier.color === "bg-yellow-500" ? "text-yellow-600" :
                                "text-gray-500"
                              )}>
                                Cliente {tier.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-secondary/70">
                          <Phone className="w-4 h-4 text-secondary/40" />
                          <span>{formatPhone(client.phone)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold",
                            client.orderCount > 10 ? "bg-emerald-100 text-emerald-700" :
                            client.orderCount > 5 ? "bg-blue-100 text-blue-700" :
                            client.orderCount > 0 ? "bg-gray-100 text-gray-700" :
                            "bg-gray-50 text-gray-400"
                          )}>
                            {client.orderCount} {client.orderCount === 1 ? "pedido" : "pedidos"}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm font-bold",
                          client.totalSpent >= 500 ? "text-amber-600" :
                          client.totalSpent >= 200 ? "text-emerald-600" :
                          client.totalSpent > 0 ? "text-primary" :
                          "text-gray-400"
                        )}>
                          {formatCurrency(client.totalSpent)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {timeAgo ? (
                            <>
                              <span className="text-sm text-secondary/70">
                                {formatDate(client.lastOrderDate)}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-xs font-medium",
                                timeAgo === "Hoje" || timeAgo === "Ontem"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              )}>
                                {timeAgo}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Nunca comprou</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
