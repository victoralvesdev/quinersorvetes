"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types/product";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  variant?: "mobile" | "desktop";
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  variant = "desktop",
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Se o produto tem variações, abre o modal ao invés de adicionar direto
    if (product.hasVariations && onViewDetails) {
      onViewDetails(product);
      return;
    }

    addItem(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const finalPrice = product.promotion
    ? product.price * (1 - product.promotion.discount / 100)
    : product.price;

  const isMobile = variant === "mobile";

  return (
    <div
      onClick={() => onViewDetails?.(product)}
      className={cn(
        "group bg-white rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col h-full border-2 border-transparent hover:border-primary/20",
        isMobile
          ? "shadow-sm hover:shadow-md active:scale-[0.98]"
          : "shadow-md hover:shadow-xl hover:-translate-y-1"
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent-pink/10",
          isMobile ? "aspect-square" : "aspect-[4/3]"
        )}
      >
        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 bg-gradient-to-r from-accent-orange to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
              NOVIDADE
            </span>
          </div>
        )}

        {/* Promotion Badge */}
        {product.promotion && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full shadow-lg">
              -{product.promotion.discount}%
            </span>
          </div>
        )}

        {/* Product Image */}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              !isMobile && "group-hover:scale-110"
            )}
            sizes={isMobile ? "(max-width: 768px) 50vw" : "(max-width: 768px) 50vw, 25vw"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className={cn("mb-2", isMobile ? "text-4xl" : "text-5xl")}>🍦</div>
              <p className="text-xs text-secondary/40 font-medium">Sem imagem</p>
            </div>
          </div>
        )}

        {/* Hover Overlay - Desktop Only */}
        {!isMobile && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col flex-grow", isMobile ? "p-3" : "p-4")}>
        {/* Product Name */}
        <h3
          className={cn(
            "font-semibold text-secondary-dark line-clamp-2 mb-1",
            isMobile ? "text-sm min-h-[2.5rem]" : "text-base min-h-[3rem]"
          )}
        >
          {product.name}
        </h3>

        {/* Description - Desktop Only */}
        {!isMobile && product.description && (
          <p className="text-xs text-secondary/50 line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex flex-col">
            {product.promotion && (
              <span className="text-xs text-secondary/40 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
            <span
              className={cn(
                "font-bold text-primary",
                isMobile ? "text-base" : "text-lg"
              )}
            >
              {formatCurrency(finalPrice)}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={cn(
              "rounded-full shadow-md transition-all duration-300 flex items-center justify-center",
              isAdded
                ? "bg-green-500 text-white scale-110"
                : "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg hover:shadow-primary/30 active:scale-95",
              isMobile ? "w-9 h-9" : "w-11 h-11"
            )}
          >
            {isAdded ? (
              <Check className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            ) : (
              <Plus className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Skeleton for loading state
export const ProductCardSkeleton: React.FC<{ variant?: "mobile" | "desktop" }> = ({
  variant = "desktop",
}) => {
  const isMobile = variant === "mobile";

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
      <div
        className={cn(
          "bg-gradient-to-br from-gray-200 to-gray-100",
          isMobile ? "aspect-square" : "aspect-[4/3]"
        )}
      />
      <div className={cn(isMobile ? "p-3" : "p-4")}>
        <div className={cn("bg-gray-200 rounded-lg mb-2", isMobile ? "h-4 w-3/4" : "h-5 w-4/5")} />
        <div className={cn("bg-gray-200 rounded-lg mb-3", isMobile ? "h-4 w-1/2" : "h-4 w-2/3")} />
        <div className="flex items-center justify-between">
          <div className={cn("bg-gray-200 rounded-lg", isMobile ? "h-5 w-16" : "h-6 w-20")} />
          <div className={cn("bg-gray-200 rounded-full", isMobile ? "w-9 h-9" : "w-11 h-11")} />
        </div>
      </div>
    </div>
  );
};
