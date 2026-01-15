"use client";

import Image from "next/image";
import { Category } from "@/types/product";
import { cn } from "@/lib/utils";

interface CategoryFilterDesktopProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

// Mapeamento de ícones baseado no nome da categoria
const categoryIcons: Record<string, string> = {
  todos: "/images/icon-todos.png",
  potes: "/images/icon-pote.png",
  "q-mix": "/images/icon-pote.png",
  milkshakes: "/images/icon-milk.png",
  casquinhas: "/images/icon-casquinha.png",
};

// Mapeamento de labels
const categoryLabels: Record<string, string> = {
  todos: "Todos",
  potes: "Potes",
  "q-mix": "Q-Mix",
  milkshakes: "Milkshakes",
  casquinhas: "Casquinhas",
};

export const CategoryFilterDesktop: React.FC<CategoryFilterDesktopProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-col gap-3 w-48 flex-shrink-0">
      {categories.map((category) => {
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
              "flex items-center gap-3 p-3 rounded-xl transition-all text-left",
              isSelected
                ? "bg-primary/20 shadow-md ring-2 ring-primary"
                : "bg-white hover:bg-gray-50 shadow-sm"
            )}
          >
            <div
              className={cn(
                "rounded-lg transition-all relative overflow-hidden flex-shrink-0",
                isImageIcon ? "w-12 h-12" : "w-12 h-12 flex items-center justify-center bg-gray-100"
              )}
            >
              {isImageIcon && iconSrc ? (
                <Image
                  src={iconSrc}
                  alt={label}
                  fill
                  className="object-contain rounded-lg"
                  sizes="48px"
                />
              ) : (
                <span className="text-xl">📦</span>
              )}
            </div>
            <span
              className={cn(
                "font-medium transition-colors",
                isSelected ? "text-primary font-semibold" : "text-secondary"
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

