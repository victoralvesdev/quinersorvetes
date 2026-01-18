"use client";

import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Phone,
  Gift,
  ChevronRight,
  LogOut,
  Plus,
  Star,
  Clock,
  Percent,
  Tag,
  ClipboardList,
  Settings,
  Trash2,
  Edit3,
  Check,
  X,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { formatCEP } from "@/lib/utils/cep";
import { BottomNav } from "@/components/mobile/BottomNav";
import { Cart } from "@/components/cardapio/Cart";
import { useAuth } from "@/contexts/AuthContext";
import { useCartContext } from "@/contexts/CartContext";
import { useLoginModal } from "@/contexts/LoginModalContext";
import { useCoupons } from "@/contexts/CouponContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { Address, AddressFormData } from "@/types/address";
import { UserCoupon } from "@/types/coupon";
import { getUserAddresses, deleteAddress, setDefaultAddress, createAddress, updateAddress } from "@/lib/supabase/addresses";
import { AddressForm } from "@/components/checkout/AddressForm";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

function ProfileHeader({ user, onLogout }: { user: { name: string; phone: string }; onLogout: () => void }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary-dark" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative px-6 pt-8 pb-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-xl">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 flex items-center justify-center border-2 border-white shadow-lg">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div>
              <h1 className="text-xl font-bold text-white mb-1">{user.name}</h1>
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="w-3.5 h-3.5" />
                <span className="text-sm">{user.phone}</span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Stats Pills */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-300" />
              <span className="text-xs text-white/70">Cliente desde</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1">Jan 2024</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-300" />
              <span className="text-xs text-white/70">Pedidos</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1">Ver todos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CouponCard({ userCoupon }: { userCoupon: UserCoupon }) {
  const coupon = userCoupon.coupon;
  const expiresAt = new Date(coupon.valid_until);
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 3;

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-dashed border-primary/30 shadow-sm hover:shadow-md transition-all">
      {/* Coupon decoration */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-r-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-background rounded-l-full" />

      <div className="px-6 py-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {coupon.discount_type === "percentage" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent-pink/30 flex items-center justify-center">
                <Percent className="w-5 h-5 text-primary" />
              </div>
            ) : coupon.discount_type === "free_shipping" ? (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
                <Tag className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <p className="font-bold text-secondary-dark">
                {coupon.discount_type === "percentage"
                  ? `${coupon.discount_value}% OFF`
                  : coupon.discount_type === "free_shipping"
                  ? "FRETE GRÁTIS"
                  : `${formatCurrency(coupon.discount_value || 0)} OFF`}
              </p>
              <p className="text-xs text-secondary/60">{coupon.description}</p>
            </div>
          </div>
          <div
            className={cn(
              "px-2 py-1 rounded-full text-xs font-semibold",
              isExpiringSoon
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            )}
          >
            {daysLeft <= 0 ? "Expira hoje" : `${daysLeft}d restantes`}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-secondary/50">
            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
              {coupon.code}
            </span>
          </div>
          {coupon.min_order_value && (
            <p className="text-xs text-secondary/50">
              Min: {formatCurrency(coupon.min_order_value)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CouponsSection({ coupons, isLoading }: { coupons: UserCoupon[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="bg-gradient-to-br from-primary/5 to-accent-pink/10 rounded-2xl p-6 text-center border border-primary/10">
        <div className="w-16 h-16 rounded-full bg-white shadow-lg mx-auto mb-4 flex items-center justify-center">
          <Gift className="w-8 h-8 text-primary/60" />
        </div>
        <p className="font-semibold text-secondary-dark mb-1">Nenhum cupom disponível</p>
        <p className="text-sm text-secondary/60">
          Fique de olho! Cupons especiais podem aparecer aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {coupons.map((userCoupon) => (
        <CouponCard key={userCoupon.id} userCoupon={userCoupon} />
      ))}
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        "relative bg-white rounded-2xl border-2 p-4 transition-all",
        address.is_default
          ? "border-primary bg-primary/5"
          : "border-gray-100 hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              address.is_default
                ? "bg-gradient-to-br from-primary to-primary-dark"
                : "bg-gray-100"
            )}
          >
            <MapPin
              className={cn(
                "w-5 h-5",
                address.is_default ? "text-white" : "text-secondary/60"
              )}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {address.is_default && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Padrão
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-secondary-dark">
              {address.street}, {address.number}
              {address.complement && ` - ${address.complement}`}
            </p>
            <p className="text-xs text-secondary/60 mt-0.5">
              {address.neighborhood} - {formatCEP(address.zip_code)}
            </p>
            {address.reference && (
              <p className="text-xs text-secondary/50 mt-1 italic">
                Ref: {address.reference}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowActions(!showActions)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-4 h-4 text-secondary/40" />
        </button>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {!address.is_default && (
            <button
              onClick={onSetDefault}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Tornar padrão
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary/10 text-secondary rounded-xl text-xs font-medium hover:bg-secondary/20 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function AddressesSection({
  userId,
  addresses,
  isLoading,
  onAddressChange,
}: {
  userId: string;
  addresses: Address[];
  isLoading: boolean;
  onAddressChange: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async (addressId: string) => {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    try {
      await deleteAddress(addressId, userId);
      showToast("Endereço excluído com sucesso", "success");
      onAddressChange();
    } catch {
      showToast("Erro ao excluir endereço", "error");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId, userId);
      showToast("Endereço padrão atualizado", "success");
      onAddressChange();
    } catch {
      showToast("Erro ao definir endereço padrão", "error");
    }
  };

  const handleSubmit = async (data: AddressFormData) => {
    setIsSaving(true);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, userId, data);
        showToast("Endereço atualizado com sucesso", "success");
      } else {
        await createAddress(userId, data);
        showToast("Endereço cadastrado com sucesso", "success");
      }
      setIsAdding(false);
      setEditingAddress(null);
      onAddressChange();
    } catch {
      showToast("Erro ao salvar endereço", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitialData = (address: Address | null): AddressFormData | undefined => {
    if (!address) return undefined;
    return {
      zip_code: address.zip_code,
      street: address.street,
      number: address.number,
      complement: address.complement || "",
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      reference: address.reference || "",
      is_default: address.is_default,
    };
  };

  if (isAdding || editingAddress) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-secondary-dark">
            {editingAddress ? "Editar Endereço" : "Novo Endereço"}
          </h3>
          <button
            onClick={() => {
              setIsAdding(false);
              setEditingAddress(null);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-secondary/60" />
          </button>
        </div>
        <AddressForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsAdding(false);
            setEditingAddress(null);
          }}
          initialData={getInitialData(editingAddress)}
          isLoading={isSaving}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.length === 0 ? (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-white shadow-md mx-auto mb-3 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-secondary/40" />
          </div>
          <p className="font-medium text-secondary-dark mb-1">Nenhum endereço cadastrado</p>
          <p className="text-sm text-secondary/60 mb-4">
            Adicione um endereço para facilitar suas entregas
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl text-sm font-medium shadow-md shadow-primary/25 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Endereço
          </button>
        </div>
      ) : (
        <>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => setEditingAddress(address)}
              onDelete={() => handleDelete(address.id)}
              onSetDefault={() => handleSetDefault(address.id)}
            />
          ))}
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-200 rounded-2xl text-secondary/60 font-medium hover:border-primary/50 hover:text-primary transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar novo endereço
          </button>
        </>
      )}
    </div>
  );
}

function QuickActions({ onOrdersClick }: { onOrdersClick: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={onOrdersClick}
        className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-left group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <ClipboardList className="w-5 h-5 text-amber-600" />
        </div>
        <p className="font-semibold text-secondary-dark text-sm">Meus Pedidos</p>
        <p className="text-xs text-secondary/50 mt-0.5">Ver histórico</p>
      </button>

      <button className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-left group opacity-60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <Star className="w-5 h-5 text-purple-600" />
        </div>
        <p className="font-semibold text-secondary-dark text-sm">Favoritos</p>
        <p className="text-xs text-secondary/50 mt-0.5">Em breve</p>
      </button>
    </div>
  );
}

function LoginPrompt({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/30 flex items-center justify-center">
          <User className="w-16 h-16 text-primary/70" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl animate-bounce">
          <Gift className="w-6 h-6 text-white" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-secondary-dark mb-3 text-center">
        Entre na sua conta
      </h2>
      <p className="text-secondary/60 text-center mb-8 max-w-sm">
        Acesse seu perfil para ver seus cupons, endereços salvos e histórico de pedidos
      </p>

      <button
        onClick={onLogin}
        className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
      >
        Fazer Login
      </button>
    </div>
  );
}

export default function PerfilPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isCartOpen, closeCart } = useCartContext();
  const { isOpen: isLoginOpen, closeModal: closeLoginModal, openModal: openLoginModal } = useLoginModal();
  const { coupons, couponsCount, isLoading: isCouponsLoading, refreshCoupons } = useCoupons();
  const router = useRouter();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"coupons" | "addresses">("coupons");

  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || !user) {
        setIsAddressesLoading(false);
        return;
      }

      try {
        setIsAddressesLoading(true);
        const userAddresses = await getUserAddresses(user.id);
        setAddresses(userAddresses);
      } catch (error) {
        console.error("Erro ao carregar endereços:", error);
      } finally {
        setIsAddressesLoading(false);
      }
    };

    loadAddresses();
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    showToast("Até logo!", "info");
  };

  const refreshAddresses = async () => {
    if (!user) return;
    try {
      const userAddresses = await getUserAddresses(user.id);
      setAddresses(userAddresses);
    } catch (error) {
      console.error("Erro ao atualizar endereços:", error);
    }
  };

  return (
    <>
      {/* Mobile Layout */}
      <div className="min-h-screen pb-24 md:hidden bg-background" style={{ paddingTop: "60px" }}>
        {!isAuthenticated ? (
          <LoginPrompt onLogin={openLoginModal} />
        ) : user ? (
          <>
            {/* Profile Header */}
            <ProfileHeader user={user} onLogout={handleLogout} />

            {/* Content */}
            <div className="px-4 -mt-4 relative z-10 space-y-6">
              {/* Quick Actions */}
              <QuickActions onOrdersClick={() => router.push("/pedidos")} />

              {/* Tabs */}
              <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab("coupons")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
                      activeTab === "coupons"
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md"
                        : "text-secondary/60 hover:bg-gray-50"
                    )}
                  >
                    <Gift className="w-4 h-4" />
                    Cupons
                    {couponsCount > 0 && (
                      <span
                        className={cn(
                          "min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold",
                          activeTab === "coupons"
                            ? "bg-white/20 text-white"
                            : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                        )}
                      >
                        {couponsCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("addresses")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all",
                      activeTab === "addresses"
                        ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md"
                        : "text-secondary/60 hover:bg-gray-50"
                    )}
                  >
                    <MapPin className="w-4 h-4" />
                    Endereços
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === "coupons" ? (
                  <CouponsSection coupons={coupons} isLoading={isCouponsLoading} />
                ) : (
                  <AddressesSection
                    userId={user.id}
                    addresses={addresses}
                    isLoading={isAddressesLoading}
                    onAddressChange={refreshAddresses}
                  />
                )}
              </div>
            </div>
          </>
        ) : null}

        <BottomNav />
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          {!isAuthenticated ? (
            <LoginPrompt onLogin={openLoginModal} />
          ) : user ? (
            <div className="grid grid-cols-3 gap-8">
              {/* Left Column - Profile Info */}
              <div className="col-span-1">
                <div className="bg-white rounded-3xl overflow-hidden shadow-lg sticky top-24">
                  <ProfileHeader user={user} onLogout={handleLogout} />
                  <div className="p-6">
                    <QuickActions onOrdersClick={() => router.push("/pedidos")} />
                  </div>
                </div>
              </div>

              {/* Right Column - Content */}
              <div className="col-span-2 space-y-6">
                {/* Coupons Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent-pink/30 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-secondary-dark">Meus Cupons</h2>
                        <p className="text-sm text-secondary/60">
                          {couponsCount > 0
                            ? `${couponsCount} ${couponsCount === 1 ? "cupom disponível" : "cupons disponíveis"}`
                            : "Nenhum cupom disponível"}
                        </p>
                      </div>
                    </div>
                    {couponsCount > 0 && (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full">
                        <span className="text-xs font-bold text-white">{couponsCount}</span>
                      </div>
                    )}
                  </div>
                  <CouponsSection coupons={coupons} isLoading={isCouponsLoading} />
                </div>

                {/* Addresses Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/20 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-secondary-dark">Meus Endereços</h2>
                      <p className="text-sm text-secondary/60">
                        {addresses.length > 0
                          ? `${addresses.length} ${addresses.length === 1 ? "endereço cadastrado" : "endereços cadastrados"}`
                          : "Nenhum endereço cadastrado"}
                      </p>
                    </div>
                  </div>
                  <AddressesSection
                    userId={user.id}
                    addresses={addresses}
                    isLoading={isAddressesLoading}
                    onAddressChange={refreshAddresses}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Shared Modals */}
      <Cart isOpen={isCartOpen} onClose={closeCart} onCheckout={openLoginModal} />

      <LoginModal isOpen={isLoginOpen} onClose={closeLoginModal} />
    </>
  );
}
