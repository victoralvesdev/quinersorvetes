"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Bell,
  User,
  Search,
  ChevronDown,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/contexts/AdminContext";
import { getAllOrders } from "@/lib/supabase/orders";

const navigation = [
  { name: "Dashboard", href: "/gestao-admin", icon: Home },
  { name: "Pedidos", href: "/gestao-admin/pedidos", icon: Package },
  { name: "Produtos", href: "/gestao-admin/produtos", icon: ShoppingCart },
  { name: "Clientes", href: "/gestao-admin/clientes", icon: Users },
  { name: "Relatórios", href: "/gestao-admin/relatorios", icon: BarChart3 },
  { name: "Configurações", href: "/gestao-admin/configuracoes", icon: Settings },
];

function AdminDropdown({ logout }: { logout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 hover:bg-primary/5 group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-semibold text-secondary-dark">Admin</p>
          <p className="text-xs text-secondary/60">Gerente</p>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 text-secondary/50 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      <div className={cn(
        "absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100/50 py-2 z-50 transition-all duration-200 origin-top-right",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-secondary-dark">Logado como</p>
          <p className="text-xs text-secondary/60">admin@quiner.com.br</p>
        </div>
        <div className="py-2">
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAdmin();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Busca contagem de pedidos novos
  const fetchPendingOrders = async () => {
    try {
      const orders = await getAllOrders();
      const newOrders = orders.filter(order => order.status === "novo");
      setPendingOrders(newOrders.length);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentPage = navigation.find(item => item.href === pathname)?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-background-beige">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 bottom-0 w-72 hidden lg:flex flex-col bg-white border-r border-gray-100/80 z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100/80">
          <Link href="/gestao-admin" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Image
                src="/images/logotipo.png"
                alt="Quiner Logo"
                width={140}
                height={56}
                style={{ width: "auto", height: "48px" }}
                className="object-contain relative"
                priority
                unoptimized
              />
            </div>
          </Link>
          <div className="mt-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-secondary/60 font-medium">Sistema Ativo</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-secondary/40 uppercase tracking-wider px-4 mb-3">
            Menu Principal
          </p>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group",
                  isActive
                    ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary"
                    : "text-secondary/70 hover:bg-gray-50 hover:text-secondary"
                )}
              >
                {/* Active Indicator */}
                <div className={cn(
                  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary transition-all duration-200",
                  isActive ? "opacity-100" : "opacity-0"
                )} />

                <div className={cn(
                  "p-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "bg-gray-100/80 text-secondary/60 group-hover:bg-gray-200/80"
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                <span className="font-medium text-sm">{item.name}</span>

                {item.name === "Pedidos" && pendingOrders > 0 && (
                  <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[22px] h-[22px] flex items-center justify-center font-bold shadow-sm shadow-red-500/30 animate-pulse">
                    {pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-100/80">
          <div className="bg-gradient-to-br from-primary/5 to-accent-pink/10 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-secondary-dark">Pedidos Hoje</p>
                <p className="text-xs text-secondary/60">Acompanhe em tempo real</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-primary">{pendingOrders}</span>
              <span className="text-sm text-secondary/60">pendentes</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar - Mobile */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-72 flex flex-col bg-white z-50 lg:hidden transition-transform duration-300 ease-out shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute right-4 top-4 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-secondary" />
        </button>

        {/* Logo Section */}
        <div className="p-6 border-b border-gray-100/80">
          <Image
            src="/images/logotipo.png"
            alt="Quiner Logo"
            width={120}
            height={48}
            style={{ width: "auto", height: "40px" }}
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-secondary/70 hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  isActive ? "bg-primary text-white" : "bg-gray-100 text-secondary/60"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.name}</span>
                {item.name === "Pedidos" && pendingOrders > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {pendingOrders}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Menu className="w-5 h-5 text-secondary" />
              </button>

              {/* Page Title */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-secondary-dark">{currentPage}</h1>
                <p className="text-xs text-secondary/50">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary/40 transition-colors group-focus-within:text-primary" />
                <input
                  type="text"
                  placeholder="Buscar pedidos, produtos, clientes..."
                  className="w-full bg-gray-50 rounded-xl pl-11 pr-4 py-2.5 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-200 placeholder:text-secondary/40"
                />
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {/* Current Time */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-secondary/70">{currentTime}</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group">
                <Bell className="w-5 h-5 text-secondary/60 group-hover:text-secondary transition-colors" />
                {pendingOrders > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                    {pendingOrders}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="hidden lg:block w-px h-8 bg-gray-200 mx-2" />

              {/* User Dropdown */}
              <AdminDropdown logout={logout} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                 style={{
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a36e6c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                 }}
            />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
