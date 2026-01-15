"use client";

import Image from "next/image";
import { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

// Mapeamento de ícones baseado no nome da categoria (case insensitive)
const categoryIcons: Record<string, string> = {
  todos: "/images/icon-todos.png",
  potes: "/images/icon-pote.png",
  "q-mix": "/images/icon-pote.png", // Usa o mesmo ícone de potes
  milkshakes: "/images/icon-milk.png",
  casquinhas: "/images/icon-casquinha.png",
};

// Mapeamento de labels (opcional, usa o nome da categoria se não encontrar)
const categoryLabels: Record<string, string> = {
  todos: "Todos",
  potes: "Potes",
  "q-mix": "Q-Mix",
  milkshakes: "Milkshakes",
  casquinhas: "Casquinhas",
};

export const CategoryNav = ({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryNavProps) => {
  return (
    <div className="flex gap-4 px-4 mb-6 pt-2 overflow-x-auto scrollbar-hide">
      {categories.map((category) => {
        // Usa o nome da categoria (normalizado para lowercase) para buscar o ícone
        const categoryKey = category.name.toLowerCase().trim();
        const iconSrc = categoryIcons[categoryKey] || categoryIcons[category.id] || null;
        const label = categoryLabels[categoryKey] || categoryLabels[category.id] || category.name;
        const isSelected = selectedCategory === category.id;
        const isImageIcon = !!iconSrc;

        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "flex flex-col items-center gap-2 min-w-[80px] transition-all pt-1",
              isSelected && "scale-105"
            )}
          >
            <div
              className={cn(
                "rounded-[10px] transition-all relative overflow-hidden",
                isImageIcon ? "w-20 h-[72px]" : "w-20 h-20",
                isSelected
                  ? "shadow-lg shadow-primary/30 ring-2 ring-primary"
                  : "shadow-md",
                !isImageIcon && "flex items-center justify-center bg-white"
              )}
            >
              {isImageIcon && iconSrc ? (
                <Image
                  src={iconSrc}
                  alt={label}
                  fill
                  className="object-contain rounded-[10px]"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white rounded-[10px]">
                  <span className="text-2xl">📦</span>
                </div>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isSelected ? "text-primary font-semibold" : "text-gray-600"
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

