"use client";

import { usePathname } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProtected } from "@/components/admin/AdminProtected";

export default function GestaoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Não aplicar layout e proteção na página de login
  if (pathname === "/gestao-admin/login") {
    return <>{children}</>;
  }

  return (
    <AdminProtected>
      <AdminLayout>{children}</AdminLayout>
    </AdminProtected>
  );
}

