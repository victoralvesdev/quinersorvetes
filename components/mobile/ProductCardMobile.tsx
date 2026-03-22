"use client";

import { ShoppingCart, Star } from "lucide-react";
import Image from "next/image";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginModal } from "@/contexts/LoginModalContext";

interface ProductCardMobileProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export const ProductCardMobile: React.FC<ProductCardMobileProps> = ({
  product,
  onViewDetails,
}) => {
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuth();
  const { openModal: openLoginModal } = useLoginModal();
  const { isFavorited, toggleFavorite } = useFavorites();
  const fav = isFavorited(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) { openLoginModal(); return; }
    toggleFavorite(product);
  };

  const finalPrice = product.promotion
    ? product.price * (1 - product.promotion.discount / 100)
    : product.price;

  // Cores de fundo baseadas na categoria
  const bgColors: Record<string, string> = {
    milkshakes: "bg-pink-100",
    sorvetes: "bg-blue-50",
    acai: "bg-purple-50",
    casquinhas: "bg-amber-50",
    smoothies: "bg-green-50",
  };

  const bgColor = bgColors[product.category] || "bg-gray-50";

  return (
    <div
      onClick={() => onViewDetails?.(product)}
      className="bg-[#F4EEE0] rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer p-2 border border-gray-300 flex flex-col h-full"
    >
      {/* Card interno para a imagem */}
      <div className={cn("h-40 flex items-center justify-center relative rounded-xl overflow-hidden mb-2", bgColor)}>
        {product.featured && (
          <div className="absolute top-2 left-2 bg-accent-orange text-white px-2 py-1 rounded-md text-xs font-bold z-10">
            NOVIDADE
          </div>
        )}
        {/* Favorite Button */}
        <button
          onClick={handleFavorite}
          className={cn(
            "absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200",
            fav
              ? "bg-amber-400 text-white scale-110"
              : "bg-white/80 backdrop-blur-sm text-secondary/40"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", fav && "fill-current")} />
        </button>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover rounded-xl"
            sizes="(max-width: 768px) 50vw, 33vw"
            onError={(e) => {
              // Fallback se a imagem não carregar
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-32 h-32 bg-white rounded-full shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-1">🍦</div>
              <div className="text-xs text-gray-500">{product.name}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-2 pb-2 flex flex-col h-24">
        <h3 className="font-medium text-base text-secondary mb-1 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(finalPrice)}
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-secondary text-white p-2 rounded-[25px] shadow-md hover:bg-secondary-dark transition-colors active:scale-90"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

