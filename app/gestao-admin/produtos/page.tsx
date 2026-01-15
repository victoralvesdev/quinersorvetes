import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { products } from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";

export default function ProdutosPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary mb-2">
              Gestão de Produtos
            </h1>
            <p className="text-gray-600">
              Gerencie seus produtos e cardápio
            </p>
          </div>
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Adicionar Produto
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} hover className="p-4">
              <div className="relative w-full h-32 bg-background rounded-lg mb-3">
                <div className="w-full h-full flex items-center justify-center text-secondary text-xs">
                  {product.name}
                </div>
              </div>
              <h3 className="font-semibold text-secondary mb-1">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    product.available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.available ? "Disponível" : "Indisponível"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Editar
                </Button>
                <Button variant="primary" size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

