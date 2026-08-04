"use client";

import { useState, useMemo, useEffect } from "react";
import { ShoppingCart, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/cardapio/ProductCard";
import { CategoryFilter } from "@/components/cardapio/CategoryFilter";
import { SearchBar } from "@/components/cardapio/SearchBar";
import { Cart } from "@/components/cardapio/Cart";
import { ProductModal } from "@/components/cardapio/ProductModal";
import { Button } from "@/components/ui/Button";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Product, Category } from "@/types/product";
import { useCartStore } from "@/store/cartStore";
import { useCartContext } from "@/contexts/CartContext";

export default function CardapioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const itemCount = useCartStore((state) => state.getItemCount());
  const { isCartOpen, openCart, closeCart, searchQuery, setSearchQuery } = useCartContext();

  // Carrega produtos e categorias do Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        const [productsData, categoriesData] = await Promise.all([
          productsRes.json(),
          categoriesRes.json(),
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    }
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

  const content = (
    <>
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <CategoryFilter
        categories={[{ id: "all", name: "Todos" }, ...categories]}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Carregando produtos...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhum produto encontrado
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={setSelectedProduct}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Layout */}
      <div className="fixed inset-0 md:hidden bg-background flex flex-col z-0" style={{ paddingTop: "80px" }}>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-secondary mb-1">
              Cardápio Digital
            </h1>
            <p className="text-gray-600 text-sm mb-4">
              Escolha seus produtos favoritos
            </p>
            {content}
          </div>
        </div>
        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-secondary mb-2">
                Cardápio Digital
              </h1>
              <p className="text-gray-600">
                Escolha seus produtos favoritos
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={openCart}
              className="relative"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Carrinho
              {itemCount > 0 && (
                <span className="ml-2 bg-white text-primary px-2 py-0.5 rounded-full text-sm font-bold">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>

          {content}
        </div>
      </div>

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={() => {
          closeCart();
          // Aqui será implementada a lógica de checkout
          alert("Checkout será implementado em breve!");
        }}
      />

      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
