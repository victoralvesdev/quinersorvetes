"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export const HeaderWrapper = () => {
  const pathname = usePathname();
  
  // Não mostrar header na área de gestão (ela tem seu próprio header no layout)
  if (pathname?.startsWith("/gestao-admin")) {
    return null;
  }

  return <Header />;
};

