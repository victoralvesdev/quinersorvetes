"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

export const FooterWrapper = () => {
  const pathname = usePathname();
  
  // Não mostrar footer na área de gestão
  if (pathname?.startsWith("/gestao-admin")) {
    return null;
  }

  return <Footer />;
};

