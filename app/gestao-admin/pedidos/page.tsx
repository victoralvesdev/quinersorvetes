import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data de pedidos
const mockOrders = [
  {
    id: "1",
    customerName: "João Silva",
    customerPhone: "(11) 99999-9999",
    address: "Rua Exemplo, 123 - São Paulo, SP",
    total: 45.70,
    status: "novo" as const,
    createdAt: new Date(),
    items: [
      { name: "Sorvete de Chocolate", quantity: 2, price: 12.90 },
      { name: "Açaí 500ml", quantity: 1, price: 19.90 },
    ],
  },
  {
    id: "2",
    customerName: "Maria Santos",
    customerPhone: "(11) 88888-8888",
    address: "Av. Teste, 456 - São Paulo, SP",
    total: 31.80,
    status: "preparando" as const,
    createdAt: new Date(Date.now() - 15 * 60000),
    items: [
      { name: "Sorvete de Morango", quantity: 2, price: 12.90 },
      { name: "Casquinha Dupla", quantity: 1, price: 12.90 },
    ],
  },
  {
    id: "3",
    customerName: "Pedro Oliveira",
    customerPhone: "(11) 77777-7777",
    address: "Rua Demo, 789 - São Paulo, SP",
    total: 18.90,
    status: "saiu_entrega" as const,
    createdAt: new Date(Date.now() - 30 * 60000),
    items: [
      { name: "Milkshake de Chocolate", quantity: 1, price: 18.90 },
    ],
  },
];

const statusConfig = {
  novo: {
    label: "Novo",
    icon: Package,
    color: "bg-blue-100 text-blue-800",
  },
  preparando: {
    label: "Preparando",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  saiu_entrega: {
    label: "Saiu para Entrega",
    icon: Truck,
    color: "bg-purple-100 text-purple-800",
  },
  entregue: {
    label: "Entregue",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
};

export default function PedidosPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary mb-2">
            Gestão de Pedidos
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie todos os pedidos de delivery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Novos</p>
              <p className="text-3xl font-bold text-primary">1</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Preparando</p>
              <p className="text-3xl font-bold text-yellow-600">1</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Em Entrega</p>
              <p className="text-3xl font-bold text-purple-600">1</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Hoje</p>
              <p className="text-3xl font-bold text-secondary">3</p>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {mockOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-secondary">
                        Pedido #{order.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${status.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Cliente:</strong> {order.customerName}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Telefone:</strong> {order.customerPhone}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Endereço:</strong> {order.address}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-secondary mb-1">
                        Itens:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {order.items.map((item, index) => (
                          <li key={index}>
                            {item.quantity}x {item.name} -{" "}
                            {formatCurrency(item.price * item.quantity)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(order.total)}
                    </p>
                    <div className="flex gap-2">
                      {order.status === "novo" && (
                        <>
                          <Button variant="primary" size="sm">
                            Aceitar
                          </Button>
                          <Button variant="outline" size="sm">
                            Recusar
                          </Button>
                        </>
                      )}
                      {order.status === "preparando" && (
                        <Button variant="primary" size="sm">
                          Marcar como Pronto
                        </Button>
                      )}
                      {order.status === "saiu_entrega" && (
                        <Button variant="primary" size="sm">
                          Marcar como Entregue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

