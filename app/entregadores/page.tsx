"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Truck, CheckCircle, XCircle, Plus } from "lucide-react";

// Mock data de entregadores
const mockDeliverers = [
  {
    id: "1",
    name: "Carlos Silva",
    phone: "(11) 99999-9999",
    vehicle: "Moto",
    plate: "ABC-1234",
    status: "disponivel" as const,
    activeOrders: 1,
  },
  {
    id: "2",
    name: "Ana Costa",
    phone: "(11) 88888-8888",
    vehicle: "Bicicleta",
    plate: null,
    status: "disponivel" as const,
    activeOrders: 0,
  },
  {
    id: "3",
    name: "Roberto Santos",
    phone: "(11) 77777-7777",
    vehicle: "Moto",
    plate: "XYZ-5678",
    status: "ocupado" as const,
    activeOrders: 2,
  },
];

export default function EntregadoresPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary mb-2">
              Entregadores
            </h1>
            <p className="text-gray-600">
              Gerencie seus entregadores e atribua pedidos
            </p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Entregador
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-secondary">3</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Disponíveis</p>
              <p className="text-3xl font-bold text-green-600">2</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Ocupados</p>
              <p className="text-3xl font-bold text-yellow-600">1</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockDeliverers.map((deliverer) => (
            <Card key={deliverer.id} hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-secondary">
                      {deliverer.name}
                    </h3>
                    <p className="text-sm text-gray-600">{deliverer.phone}</p>
                  </div>
                </div>
                {deliverer.status === "disponivel" ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Veículo:</span>
                  <span className="font-medium text-secondary">
                    {deliverer.vehicle}
                  </span>
                </div>
                {deliverer.plate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Placa:</span>
                    <span className="font-medium text-secondary">
                      {deliverer.plate}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-semibold ${
                      deliverer.status === "disponivel"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {deliverer.status === "disponivel"
                      ? "Disponível"
                      : "Ocupado"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pedidos Ativos:</span>
                  <span className="font-medium text-secondary">
                    {deliverer.activeOrders}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  Atribuir Pedido
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

