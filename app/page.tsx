"use client";

import { useState, useMemo, useEffect } from "react";
import { ProductCardMobile } from "@/components/mobile/ProductCardMobile";
import { ProductCardDesktop } from "@/components/cardapio/ProductCardDesktop";
import { CategoryNav } from "@/components/mobile/CategoryNav";
import { CategoryFilterDesktop } from "@/components/cardapio/CategoryFilterDesktop";
import { PromoBanner } from "@/components/mobile/PromoBanner";
import { PromoBannerDesktop } from "@/components/cardapio/PromoBannerDesktop";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Cart } from "@/components/cardapio/Cart";
import { ProductModal } from "@/components/cardapio/ProductModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { Product, Category } from "@/types/product";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { getProducts } from "@/lib/supabase/products";
import { getCategories } from "@/lib/supabase/categories";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { isCartOpen, closeCart, searchQuery } = useCartContext();
  const { isOpen: isLoginOpen, closeModal: closeLoginModal } = useLoginModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Busca produtos e categorias do Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories(),
        ]);

        setProducts(productsData);
        // Adiciona a opção "Todos" no início das categorias
        setCategories([
          { id: "all", name: "Todos" },
          ...categoriesData,
        ]);
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
      {/* Layout Mobile */}
      <div className="min-h-screen pb-24 md:hidden" style={{ backgroundColor: '#FAF9F4', paddingTop: '80px' }}>
        <div className="pt-4">
          <PromoBanner />
        </div>

        <CategoryNav
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {isLoading ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-lg">Carregando produtos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-lg">
              Nenhum produto encontrado
            </p>
          </div>
        ) : (
          <div className="px-4 py-4" style={{ backgroundColor: '#FAF9F4' }}>
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <ProductCardMobile
                  key={product.id}
                  product={product}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>
          </div>
        )}

        <BottomNav />
      </div>

      {/* Layout Desktop */}
      <div className="hidden md:block min-h-screen" style={{ backgroundColor: '#FAF9F4' }}>
        <div className="container mx-auto px-6 py-6">
          {/* Banner Promocional */}
          <PromoBannerDesktop />

          {/* Layout com duas colunas */}
          <div className="flex gap-6 items-start">
            {/* Coluna Esquerda - Categorias */}
            <aside className="flex-shrink-0 sticky top-24">
              <CategoryFilterDesktop
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </aside>

            {/* Coluna Direita - Produtos */}
            <main className="flex-1">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Carregando produtos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Nenhum produto encontrado
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCardDesktop
                      key={product.id}
                      product={product}
                      onViewDetails={setSelectedProduct}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Modais compartilhados */}
      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        onCheckout={() => {
          // O checkout já abre o modal de login se necessário
        }}
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
