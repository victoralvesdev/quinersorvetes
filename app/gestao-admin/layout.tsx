"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Truck, BarChart3, ShoppingCart, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/gestao-admin", icon: Home },
  { name: "Pedidos", href: "/gestao-admin/pedidos", icon: Package },
  { name: "Entregadores", href: "/gestao-admin/entregadores", icon: Truck },
  { name: "Relatórios", href: "/gestao-admin/relatorios", icon: BarChart3 },
  { name: "Produtos", href: "/gestao-admin/produtos", icon: ShoppingCart },
];

export default function GestaoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/gestao-admin" className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-primary">Gestão Quiner</h1>
              <span className="text-sm text-secondary">Admin</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-white"
                        : "text-secondary hover:bg-background-light"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

