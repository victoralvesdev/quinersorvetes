"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  X,
  Tag,
  AlertTriangle,
  ExternalLink,
  Archive,
  Truck,
  Clock,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/contexts/AdminContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { StoreHoursModal } from "./StoreHoursModal";
import { StoreHours } from "@/types/settings";
import { useToast } from "@/components/ui/Toast";

const navigation = [
  { name: "Dashboard", href: "/gestao-admin", icon: Home },
  { name: "Pedidos", href: "/gestao-admin/pedidos", icon: Package },
  { name: "Produtos", href: "/gestao-admin/produtos", icon: ShoppingCart },
  { name: "Estoque", href: "/gestao-admin/estoque", icon: Archive },
  { name: "Frete", href: "/gestao-admin/frete", icon: Truck },
  { name: "Cupons", href: "/gestao-admin/cupons", icon: Tag },
  { name: "Clientes", href: "/gestao-admin/clientes", icon: Users },
  { name: "Fidelidade", href: "/gestao-admin/fidelidade", icon: Trophy },
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
  const { settings, refreshSettings } = useSettings();
  const { lowStockProducts, lowStockVariationItems, lowStockCount } = useNotifications();
  const [pendingOrders, setPendingOrders] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStoreHoursOpen, setIsStoreHoursOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isTogglingStore, setIsTogglingStore] = useState(false);
  const { showToast } = useToast();
  const prevPendingRef = useRef<number | null>(null);

  const isStoreOnline = settings.store_online !== false;

  const isStoreOnlineRef = useRef(isStoreOnline);
  isStoreOnlineRef.current = isStoreOnline;
  const storeHoursRef = useRef(settings.store_hours);
  storeHoursRef.current = settings.store_hours;

  const handleToggleStore = async () => {
    setIsTogglingStore(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'store_online', value: !isStoreOnline, upsert: true, is_public: true, category: 'appearance' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao atualizar');
      }
      await refreshSettings();
      showToast(isStoreOnline ? 'Loja fechada com sucesso' : 'Loja aberta com sucesso', 'success');
    } catch (error: any) {
      console.error('Erro ao alternar loja:', error);
      showToast(error?.message || 'Erro ao alterar status da loja', 'error');
    } finally {
      setIsTogglingStore(false);
    }
  };

  const totalNotifications = pendingOrders + lowStockCount;

  // ── Som de alerta via Web Audio API ────────────────────────────────────────
  const playOrderAlert = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      const playBeep = (freq: number, start: number, duration: number) => {
        // Oscilador principal — onda quadrada (mais agressiva que sine)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        // Distorção para deixar mais áspero
        const distortion = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1;
          curve[i] = (Math.PI + 400) * x / (Math.PI + 400 * Math.abs(x));
        }
        distortion.curve = curve;

        osc.connect(distortion);
        distortion.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, start);
        // Volume máximo (1.0)
        gain.gain.setValueAtTime(1.0, start);
        gain.gain.setValueAtTime(1.0, start + duration - 0.01);
        gain.gain.linearRampToValueAtTime(0, start + duration);
        osc.start(start);
        osc.stop(start + duration + 0.05);
      };

      const t = ctx.currentTime;
      // 6 apitos rápidos e irritantes alternando entre duas frequências agudas
      const beepDuration = 0.18;
      const gap = 0.22;
      for (let i = 0; i < 6; i++) {
        const freq = i % 2 === 0 ? 1400 : 1000;
        playBeep(freq, t + i * gap, beepDuration);
      }
    } catch {
      // browser sem suporte a Web Audio — ignora silenciosamente
    }
  }, []);

  // ── Notificação do browser (funciona com aba minimizada/em segundo plano) ──
  const showBrowserNotification = useCallback((count: number) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("🍦 Novo pedido — Quiner!", {
      body: `${count} pedido${count !== 1 ? "s" : ""} novo${count !== 1 ? "s" : ""} aguardando confirmação`,
      icon: "/images/logotipo.png",
      tag: "quiner-new-order",
    });
  }, []);

  // ── Solicita permissão de notificação ao montar ────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Detecta pedidos novos e dispara som + notificação ─────────────────────
  useEffect(() => {
    if (prevPendingRef.current === null) {
      prevPendingRef.current = pendingOrders;
      return;
    }
    if (pendingOrders > prevPendingRef.current) {
      playOrderAlert();
      if (document.hidden || !document.hasFocus()) {
        showBrowserNotification(pendingOrders);
      }
    }
    prevPendingRef.current = pendingOrders;
  }, [pendingOrders, playOrderAlert, showBrowserNotification]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca contagem de pedidos novos
  const fetchPendingOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const orders: { status: string }[] = res.ok ? await res.json() : [];
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

  // Auto open/close based on store_hours schedule (Brasília timezone)
  useEffect(() => {
    const DAY_KEYS: (keyof Omit<StoreHours, "auto">)[] = [
      "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
    ];

    const checkSchedule = async () => {
      const storeHours = storeHoursRef.current;
      if (!storeHours?.auto) return;

      const brasiliaStr = new Date().toLocaleString("en-US", {
        timeZone: "America/Sao_Paulo",
      });
      const brasiliaDate = new Date(brasiliaStr);
      const h = String(brasiliaDate.getHours()).padStart(2, "0");
      const m = String(brasiliaDate.getMinutes()).padStart(2, "0");
      const currentTimeBrasilia = `${h}:${m}`;

      const dayKey = DAY_KEYS[brasiliaDate.getDay()];
      const daySchedule = storeHours[dayKey];
      if (!daySchedule?.enabled) return;

      const online = isStoreOnlineRef.current;

      if (currentTimeBrasilia === daySchedule.open && !online) {
        await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'store_online', value: true, upsert: true, is_public: true, category: 'appearance' }) });
        await refreshSettings();
      } else if (currentTimeBrasilia === daySchedule.close && online) {
        await fetch('/api/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'store_online', value: false, upsert: true, is_public: true, category: 'appearance' }) });
        await refreshSettings();
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              {/* Store Online/Offline Toggle */}
              <button
                onClick={handleToggleStore}
                disabled={isTogglingStore}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border",
                  isStoreOnline
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
                  isTogglingStore && "opacity-60 cursor-not-allowed"
                )}
                title={isStoreOnline ? "Loja online — clique para fechar" : "Loja fechada — clique para abrir"}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isStoreOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                )} />
                <span className="hidden sm:inline">
                  {isStoreOnline ? "Loja Aberta" : "Loja Fechada"}
                </span>
              </button>

              {/* Store Hours Button */}
              <button
                onClick={() => setIsStoreHoursOpen(true)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all duration-200",
                  settings.store_hours?.auto
                    ? "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"
                    : "bg-gray-50 border-gray-200 text-secondary/60 hover:bg-gray-100"
                )}
                title="Horários de funcionamento"
              >
                <Clock className="w-4 h-4" />
              </button>

              {/* Current Time */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-secondary/70">{currentTime}</span>
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <Bell className={cn(
                    "w-5 h-5 transition-colors",
                    isNotificationsOpen ? "text-primary" : "text-secondary/60 group-hover:text-secondary"
                  )} />
                  {totalNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm animate-pulse">
                      {totalNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                <div className={cn(
                  "absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100/50 z-50 transition-all duration-200 origin-top-right overflow-hidden",
                  isNotificationsOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                )}>
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-bold text-secondary-dark">Notificações</p>
                    {totalNotifications > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                        {totalNotifications} nova{totalNotifications !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {/* Pedidos pendentes */}
                    {pendingOrders > 0 && (
                      <div className="p-3 border-b border-gray-50">
                        <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wider mb-2 px-1">
                          Pedidos
                        </p>
                        <Link
                          href="/gestao-admin/pedidos"
                          onClick={() => setIsNotificationsOpen(false)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-secondary-dark">
                              {pendingOrders} pedido{pendingOrders !== 1 ? 's' : ''} novo{pendingOrders !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-secondary/50">Aguardando confirmação</p>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-secondary/30 group-hover:text-orange-500 transition-colors shrink-0" />
                        </Link>
                      </div>
                    )}

                    {/* Estoque baixo — produtos */}
                    {lowStockProducts.length > 0 && (
                      <div className="p-3 border-b border-gray-50">
                        <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wider mb-2 px-1">
                          Produtos com estoque baixo
                        </p>
                        <div className="space-y-1">
                          {lowStockProducts.slice(0, 4).map((product) => (
                            <Link
                              key={product.id}
                              href={`/gestao-admin/produtos?edit=${product.id}`}
                              onClick={() => setIsNotificationsOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-secondary-dark truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-amber-600 font-medium">
                                  {product.stock_quantity === 0
                                    ? 'Esgotado'
                                    : `${product.stock_quantity} un. restantes`}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-secondary/30 group-hover:text-amber-500 transition-colors shrink-0" />
                            </Link>
                          ))}
                          {lowStockProducts.length > 4 && (
                            <p className="text-xs text-secondary/40 text-center py-1">
                              +{lowStockProducts.length - 4} outros
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Estoque baixo — variações */}
                    {lowStockVariationItems.length > 0 && (
                      <div className="p-3">
                        <p className="text-xs font-semibold text-secondary/50 uppercase tracking-wider mb-2 px-1">
                          Variações com estoque baixo
                        </p>
                        <div className="space-y-1">
                          {lowStockVariationItems.slice(0, 4).map((item) => (
                            <Link
                              key={item.itemId}
                              href="/gestao-admin/estoque"
                              onClick={() => setIsNotificationsOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                <Archive className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-secondary-dark truncate">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-orange-600 font-medium truncate">
                                  {item.variationName}: {item.itemName} —{' '}
                                  {item.stock_quantity === 0
                                    ? 'Esgotado'
                                    : `${item.stock_quantity} un. restantes`}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-secondary/30 group-hover:text-orange-500 transition-colors shrink-0" />
                            </Link>
                          ))}
                          {lowStockVariationItems.length > 4 && (
                            <p className="text-xs text-secondary/40 text-center py-1">
                              +{lowStockVariationItems.length - 4} outras variações
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {totalNotifications === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Bell className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-secondary-dark">Tudo em ordem!</p>
                        <p className="text-xs text-secondary/50 mt-1">Nenhuma notificação no momento</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

      {/* Store Hours Modal */}
      {isStoreHoursOpen && (
        <StoreHoursModal
          storeHours={settings.store_hours}
          onClose={() => setIsStoreHoursOpen(false)}
          onSaved={(hours) => {
            refreshSettings();
          }}
        />
      )}
    </div>
  );
}
