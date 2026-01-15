"use client";

import { HeaderMobile } from "@/components/mobile/HeaderMobile";
import { HeaderDesktop } from "@/components/layout/HeaderDesktop";
import { useCartContext } from "@/contexts/CartContext";

export const Header = () => {
  const { setSearchQuery } = useCartContext();
  
  return (
    <>
      <HeaderMobile onSearchChange={setSearchQuery} />
      <HeaderDesktop onSearchChange={setSearchQuery} />
    </>
  );
};

