"use client";

import { X, Plus, Minus, Check, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency, cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { getProductById } from "@/lib/supabase/products";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Cache para variações já carregadas
const variationsCache = new Map<string, Product>();

function VariationsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [productWithVariations, setProductWithVariations] = useState<Product | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Carregar variações com cache
  const loadVariations = useCallback(async (productId: string) => {
    // Verificar cache primeiro
    if (variationsCache.has(productId)) {
      const cached = variationsCache.get(productId)!;
      setProductWithVariations(cached);
      initializeSelections(cached);
      return;
    }

    setIsLoadingVariations(true);
    try {
      const fullProduct = await getProductById(productId);
      if (fullProduct) {
        variationsCache.set(productId, fullProduct);
        setProductWithVariations(fullProduct);
        initializeSelections(fullProduct);
      }
    } catch (error) {
      console.error("Erro ao carregar variações:", error);
      if (product) {
        setProductWithVariations(product);
      }
    } finally {
      setIsLoadingVariations(false);
    }
  }, [product]);

  const initializeSelections = (prod: Product) => {
    const initialSelections: Record<string, string> = {};
    prod.variations?.forEach((variation) => {
      if (variation.required && variation.items.length > 0) {
        initialSelections[variation.id!] = variation.items[0].id || '';
      }
    });
    setSelectedVariations(initialSelections);
  };

  useEffect(() => {
    if (isOpen && product) {
      loadVariations(product.id);
    } else {
      setProductWithVariations(null);
      setSelectedVariations({});
      setQuantity(1);
      setIsAdding(false);
    }
  }, [isOpen, product, loadVariations]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const displayProduct = productWithVariations || product;
  const finalPrice = displayProduct.promotion
    ? displayProduct.price * (1 - displayProduct.promotion.discount / 100)
    : displayProduct.price;

  const additionalPrice = displayProduct.variations?.reduce((total, variation) => {
    if (!variation.has_price) return total;
    const selectedItemId = selectedVariations[variation.id!];
    if (!selectedItemId) return total;
    const selectedItem = variation.items.find(item => item.id === selectedItemId);
    return total + (selectedItem?.price || 0);
  }, 0) || 0;

  const totalPrice = (finalPrice + additionalPrice) * quantity;
  const unitPrice = finalPrice + additionalPrice;

  const handleVariationSelect = (variationId: string, itemId: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: itemId,
    }));
  };

  const requiredVariations = displayProduct.variations?.filter(v => v.required) || [];
  const allRequiredSelected = requiredVariations.every(v => {
    const selected = selectedVariations[v.id!];
    return selected && selected !== '';
  });
  const canAddToCart = !requiredVariations.length || allRequiredSelected;

  const handleAddToCart = () => {
    if (!canAddToCart) return;

    setIsAdding(true);

    const productToAdd = {
      ...displayProduct,
      selectedVariations: selectedVariations,
      additionalPrice: additionalPrice,
    };

    addItem(productToAdd, quantity);

    setTimeout(() => {
      onClose();
      setQuantity(1);
      setSelectedVariations({});
      setIsAdding(false);
    }, 500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full md:max-w-lg bg-white md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl",
          "transform transition-all duration-300 ease-out",
          "max-h-[90vh] md:max-h-[85vh] flex flex-col"
        )}
      >
        {/* Header Image */}
        <div className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-gradient-to-br from-primary/5 to-accent-pink/10 flex-shrink-0">
          {displayProduct.image ? (
            <Image
              src={displayProduct.image}
              alt={displayProduct.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-7xl">🍦</span>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-secondary" />
          </button>

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {displayProduct.featured && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-accent-orange to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                NOVIDADE
              </span>
            )}
            {displayProduct.promotion && (
              <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
                -{displayProduct.promotion.discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-6 space-y-5">
            {/* Title & Description */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-secondary-dark mb-2">
                {displayProduct.name}
              </h2>
              <p className="text-secondary/60 text-sm md:text-base leading-relaxed">
                {displayProduct.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {formatCurrency(unitPrice)}
              </span>
              {displayProduct.promotion && (
                <span className="text-base text-secondary/40 line-through">
                  {formatCurrency(displayProduct.price)}
                </span>
              )}
            </div>

            {/* Variations */}
            {isLoadingVariations ? (
              <VariationsSkeleton />
            ) : displayProduct.variations && displayProduct.variations.length > 0 ? (
              <div className="space-y-5">
                {displayProduct.variations.map((variation) => (
                  <div key={variation.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-secondary-dark">
                        {variation.name}
                        {variation.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                      {!variation.required && (
                        <span className="text-xs text-secondary/50">Opcional</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {variation.items.map((item) => {
                        const isSelected = selectedVariations[variation.id!] === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleVariationSelect(variation.id!, item.id || '')}
                            className={cn(
                              "relative px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all duration-200",
                              isSelected
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-gray-200 bg-white hover:border-primary/30 text-secondary"
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">{item.name}</span>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {variation.has_price && item.price > 0 && (
                                  <span className={cn(
                                    "text-xs",
                                    isSelected ? "text-primary" : "text-secondary/50"
                                  )}>
                                    +{formatCurrency(item.price)}
                                  </span>
                                )}
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4 md:p-5 space-y-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-secondary">Quantidade</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-secondary" />
              </button>
              <span className="w-8 text-center text-lg font-bold text-secondary-dark">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4 text-secondary" />
              </button>
            </div>
          </div>

          {/* Required Warning */}
          {requiredVariations.length > 0 && !allRequiredSelected && (
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl text-center">
              Selecione todas as opções obrigatórias (*)
            </p>
          )}

          {/* Add to Cart Button */}
          {displayProduct.available ? (
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart || isAdding}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-3",
                canAddToCart && !isAdding
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
            >
              {isAdding ? (
                <>
                  <Check className="w-5 h-5" />
                  Adicionado!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Adicionar • {formatCurrency(totalPrice)}
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-4 rounded-2xl bg-red-50 text-red-500 font-semibold text-center">
              Produto indisponível
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
