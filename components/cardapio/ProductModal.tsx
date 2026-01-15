"use client";

import { X, Plus, Minus } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const finalPrice = product.promotion
    ? product.price * (1 - product.promotion.discount / 100)
    : product.price;

  const handleAddToCart = () => {
    addItem(product, quantity);
    onClose();
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative w-full h-64 bg-background rounded-lg overflow-hidden">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary">
                {product.name}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-secondary mb-2">
                {product.name}
              </h2>
              <p className="text-gray-600">{product.description}</p>
            </div>

            <div className="space-y-2">
              {product.promotion ? (
                <div>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(finalPrice)}
                  </span>
                  <span className="text-lg text-gray-400 line-through ml-2">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {product.available ? (
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-secondary">
                    Quantidade:
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold">
                      {quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  <Plus className="w-5 h-5" />
                  Adicionar ao Carrinho
                </Button>
              </div>
            ) : (
              <div className="pt-4">
                <p className="text-red-500 font-medium">
                  Produto temporariamente indisponível
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

