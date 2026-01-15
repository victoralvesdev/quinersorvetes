"use client";

import { Card } from "@/components/ui/Card";
import { TrendingUp, DollarSign, Package, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function RelatoriosPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Relatórios e Estatísticas
          </h1>
          <p className="text-gray-600">
            Visualize o desempenho do seu negócio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Faturamento Hoje</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(1250.50)}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% vs ontem
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-primary opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pedidos Hoje</p>
                <p className="text-2xl font-bold text-secondary">45</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8% vs ontem
                </p>
              </div>
              <Package className="w-12 h-12 text-secondary opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(27.79)}
                </p>
                <p className="text-xs text-gray-600 mt-1">Por pedido</p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary opacity-50" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Clientes Ativos</p>
                <p className="text-2xl font-bold text-secondary">128</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +5 esta semana
                </p>
              </div>
              <Users className="w-12 h-12 text-secondary opacity-50" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-xl font-semibold text-secondary mb-4">
              Produtos Mais Vendidos
            </h3>
            <div className="space-y-3">
              {[
                { name: "Sorvete de Chocolate", sales: 45 },
                { name: "Açaí 500ml", sales: 32 },
                { name: "Milkshake de Chocolate", sales: 28 },
                { name: "Sorvete de Morango", sales: 25 },
                { name: "Casquinha Dupla", sales: 20 },
              ].map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{product.name}</span>
                  <span className="font-semibold text-secondary">
                    {product.sales} vendas
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold text-secondary mb-4">
              Resumo Semanal
            </h3>
            <div className="space-y-3">
              {[
                { day: "Segunda", revenue: 980.50, orders: 35 },
                { day: "Terça", revenue: 1120.30, orders: 40 },
                { day: "Quarta", revenue: 1050.20, orders: 38 },
                { day: "Quinta", revenue: 1180.90, orders: 42 },
                { day: "Sexta", revenue: 1250.50, orders: 45 },
              ].map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700">{day.day}</span>
                  <div className="text-right">
                    <span className="block font-semibold text-secondary">
                      {formatCurrency(day.revenue)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {day.orders} pedidos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

