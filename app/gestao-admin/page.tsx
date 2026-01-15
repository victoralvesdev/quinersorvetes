import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ShoppingCart, Package, Truck, BarChart3, ArrowLeft } from "lucide-react";

export default function GestaoAdminPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Cardápio
            </Button>
          </Link>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Painel de Gestão
            </h1>
            <p className="text-secondary text-lg max-w-2xl mx-auto">
              Área administrativa do QuinerApp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/gestao-admin/pedidos">
            <Card hover className="text-center h-full">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Pedidos
              </h3>
              <p className="text-gray-600 mb-4">
                Visualize e gerencie pedidos
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/gestao-admin/entregadores">
            <Card hover className="text-center h-full">
              <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Entregadores
              </h3>
              <p className="text-gray-600 mb-4">
                Gerencie entregadores
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/gestao-admin/relatorios">
            <Card hover className="text-center h-full">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Relatórios
              </h3>
              <p className="text-gray-600 mb-4">
                Visualize estatísticas
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Acessar
              </Button>
            </Card>
          </Link>

          <Link href="/gestao-admin/produtos">
            <Card hover className="text-center h-full">
              <ShoppingCart className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary mb-2">
                Produtos
              </h3>
              <p className="text-gray-600 mb-4">
                Gerencie produtos e cardápio
              </p>
              <Button variant="primary" size="sm" className="w-full">
                Acessar
              </Button>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}

