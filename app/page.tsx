"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { IceCream, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/cardapio/ProductCard";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Cart } from "@/components/cardapio/Cart";
import { ProductModal } from "@/components/cardapio/ProductModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { Product, Category } from "@/types/product";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { getProducts } from "@/lib/supabase/products";
import { getCategories } from "@/lib/supabase/categories";
import { cn } from "@/lib/utils";

// Category icons mapping
const categoryIcons: Record<string, string> = {
  todos: "/images/icon-todos.png",
  potes: "/images/icon-pote.png",
  "q-mix": "/images/icon-pote.png",
  milkshakes: "/images/icon-milk.png",
  casquinhas: "/images/icon-casquinha.png",
};

// Promo banners
const promoBanners = [
  {
    title: "NOVIDADE IRRESISTÍVEL",
    subtitle: "Strawberry cheesecake",
    image: "/images/promo/banner-1.jpg",
  },
  {
    title: "SORVETES ARTESANAIS",
    subtitle: "Sabores únicos, feitos com paixão",
    image: "/images/promo/banner-2.jpg",
  },
];

function PromoBanner({ variant = "mobile" }: { variant?: "mobile" | "desktop" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = variant === "mobile";

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % promoBanners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + promoBanners.length) % promoBanners.length);
  };

  // Auto-slide
  useEffect(() => {
    const timer = setInterval(nextBanner, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn("relative group", isMobile ? "mx-4" : "mb-8")}>
      {/* Container com aspect ratio do banner original (800x339) */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{ aspectRatio: "800/339" }}
      >
        {promoBanners.map((banner, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-all duration-700 ease-out",
              index === currentIndex
                ? "opacity-100 translate-x-0"
                : index < currentIndex
                ? "opacity-0 -translate-x-full"
                : "opacity-0 translate-x-full"
            )}
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* Navigation Arrows - Desktop */}
        {!isMobile && promoBanners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {promoBanners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {promoBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-6 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  variant = "mobile",
}: {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  variant?: "mobile" | "desktop";
}) {
  const isMobile = variant === "mobile";

  if (isMobile) {
    return (
      <div className="flex gap-4 px-4 py-4 overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const categoryKey = category.name.toLowerCase().trim();
          const iconSrc = categoryIcons[categoryKey] || categoryIcons[category.id];
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "flex flex-col items-center gap-2 min-w-[76px] transition-all duration-200",
                isSelected && "scale-105"
              )}
            >
              {/* Container com aspect ratio 500/450 (10/9) */}
              <div
                className={cn(
                  "w-[72px] rounded-lg overflow-hidden transition-all duration-200 relative",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 shadow-lg shadow-primary/20"
                    : "shadow-md"
                )}
                style={{ aspectRatio: "500/450" }}
              >
                {iconSrc ? (
                  <Image
                    src={iconSrc}
                    alt={category.name}
                    fill
                    className="object-contain"
                    sizes="72px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent-pink/20 flex items-center justify-center">
                    <span className="text-2xl">📦</span>
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isSelected ? "text-primary font-semibold" : "text-secondary/70"
                )}
              >
                {category.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div className="w-52 flex-shrink-0 space-y-2">
      <h3 className="text-sm font-semibold text-secondary/50 uppercase tracking-wide px-3 mb-3">
        Categorias
      </h3>
      {categories.map((category) => {
        const categoryKey = category.name.toLowerCase().trim();
        const iconSrc = categoryIcons[categoryKey] || categoryIcons[category.id];
        const isSelected = selectedCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left",
              isSelected
                ? "bg-gradient-to-r from-primary/10 to-primary/5 shadow-md ring-1 ring-primary/20"
                : "bg-white hover:bg-gray-50 shadow-sm hover:shadow-md"
            )}
          >
            {/* Container com aspect ratio 500/450 */}
            <div
              className={cn(
                "w-12 rounded-lg overflow-hidden relative flex-shrink-0 transition-transform duration-200",
                isSelected && "scale-105"
              )}
              style={{ aspectRatio: "500/450" }}
            >
              {iconSrc ? (
                <Image
                  src={iconSrc}
                  alt={category.name}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent-pink/20 flex items-center justify-center">
                  <span className="text-lg">📦</span>
                </div>
              )}
            </div>
            <span
              className={cn(
                "font-medium transition-colors",
                isSelected ? "text-primary font-semibold" : "text-secondary"
              )}
            >
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent-pink/20 flex items-center justify-center mb-6">
        <IceCream className="w-12 h-12 text-primary/60" />
      </div>
      <h3 className="text-xl font-bold text-secondary-dark mb-2 text-center">
        Nenhum produto encontrado
      </h3>
      <p className="text-secondary/60 text-center max-w-xs">
        Tente buscar por outro termo ou selecione outra categoria
      </p>
    </div>
  );
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { isCartOpen, closeCart, searchQuery } = useCartContext();
  const { isOpen: isLoginOpen, closeModal: closeLoginModal } = useLoginModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productsData);
        setCategories([{ id: "all", name: "Todos" }, ...categoriesData]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch && product.available;
    });
  }, [selectedCategory, searchQuery, products]);

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen pb-24 md:hidden bg-background" style={{ paddingTop: "80px" }}>
        {/* Banner */}
        <div className="pt-4 pb-2">
          <PromoBanner variant="mobile" />
        </div>

        {/* Categories */}
        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          variant="mobile"
        />

        {/* Products */}
        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCardSkeleton key={i} variant="mobile" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="mobile"
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          {/* Banner */}
          <PromoBanner variant="desktop" />

          {/* Layout with Sidebar */}
          <div className="flex gap-8 items-start">
            {/* Sidebar - Categories */}
            <aside className="sticky top-24">
              <CategoryNav
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                variant="desktop"
              />
            </aside>

            {/* Main Content - Products */}
            <main className="flex-1">
              {/* Results Header */}
              {searchQuery && (
                <div className="mb-6 flex items-center gap-2">
                  <Search className="w-4 h-4 text-secondary/50" />
                  <span className="text-secondary/70">
                    Resultados para &ldquo;<span className="font-semibold text-secondary-dark">{searchQuery}</span>&rdquo;
                  </span>
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <ProductCardSkeleton key={i} variant="desktop" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="desktop"
                      onViewDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Shared Modals */}
      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={() => {}}
      />

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={closeLoginModal}
      />
    </>
  );
}
