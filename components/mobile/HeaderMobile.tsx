"use client";

import { Search } from "lucide-react";
import Image from "next/image";

interface HeaderMobileProps {
  onSearchChange?: (value: string) => void;
}

export const HeaderMobile = ({ onSearchChange }: HeaderMobileProps) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  return (
    <header className="bg-primary-pink fixed top-0 left-0 right-0 z-[110] pb-4 pt-4 md:hidden">
      <div className="px-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 pt-1">
            <Image
              src="/images/logotipo.png"
              alt="Quiner Logo"
              width={90}
              height={36}
              style={{ width: "auto", height: "36px" }}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              onChange={handleSearchChange}
              className="w-full bg-white rounded-full px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-pink"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
