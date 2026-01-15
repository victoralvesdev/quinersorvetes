"use client";

import { Category } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "primary" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "transition-all",
            selectedCategory === category.id && "shadow-md"
          )}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

