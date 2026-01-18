import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product } from "@/types/product";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1) => {
        const state = get();
        // Se o produto tem variações selecionadas, criar uma chave única
        const productKey = (product as any).selectedVariations 
          ? `${product.id}_${JSON.stringify((product as any).selectedVariations)}`
          : product.id;
        
        const additionalPrice = (product as any).additionalPrice || 0;
        const selectedVariations = (product as any).selectedVariations || {};

        const existingItem = state.items.find((item) => {
          if (item.product.id !== product.id) return false;
          // Comparar variações selecionadas
          const itemVariations = JSON.stringify(item.selectedVariations || {});
          const newVariations = JSON.stringify(selectedVariations);
          return itemVariations === newVariations;
        });

        let newItems;
        if (existingItem) {
          newItems = state.items.map((item) => {
            const itemVariations = JSON.stringify(item.selectedVariations || {});
            const newVariations = JSON.stringify(selectedVariations);
            if (item.product.id === product.id && itemVariations === newVariations) {
              return { ...item, quantity: item.quantity + quantity };
            }
            return item;
          });
        } else {
          newItems = [...state.items, { 
            product, 
            quantity,
            selectedVariations: Object.keys(selectedVariations).length > 0 ? selectedVariations : undefined,
            additionalPrice: additionalPrice > 0 ? additionalPrice : undefined,
          }];
        }

        set({ items: newItems });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      setItems: (items) => {
        set({ items });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => {
            const basePrice = item.product.price;
            const additionalPrice = item.additionalPrice || 0;
            const itemPrice = basePrice + additionalPrice;
            return total + itemPrice * item.quantity;
          },
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: "quiner-cart-storage",
      skipHydration: true,
    }
  )
);

