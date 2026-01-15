"use client";

import { Plus, Tag } from "lucide-react";
import { Product } from "@/types/product";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
}) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const finalPrice = product.promotion
    ? product.price * (1 - product.promotion.discount / 100)
    : product.price;

  return (
    <Card
      hover
      className="relative overflow-hidden"
      onClick={() => onViewDetails?.(product)}
    >
      {product.promotion && (
        <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 z-10">
          <Tag className="w-3 h-3" />
          {product.promotion.label}
        </div>
      )}
      
      {product.featured && (
        <div className="absolute top-2 left-2 bg-secondary text-white px-2 py-1 rounded-md text-xs font-semibold z-10">
          Destaque
        </div>
      )}

      <div className="relative w-full h-48 bg-background rounded-lg mb-4 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center text-secondary text-sm">
          {product.name}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-secondary">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between pt-2">
          <div>
            {product.promotion ? (
              <div>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(finalPrice)}
                </span>
                <span className="text-sm text-gray-400 line-through ml-2">
                  {formatCurrency(product.price)}
                </span>
              </div>
            ) : (
              <span className="text-lg font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          
          {product.available ? (
            <Button
              size="sm"
              variant="primary"
              onClick={handleAddToCart}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          ) : (
            <span className="text-sm text-gray-400">Indisponível</span>
          )}
        </div>
      </div>
    </Card>
  );
};

