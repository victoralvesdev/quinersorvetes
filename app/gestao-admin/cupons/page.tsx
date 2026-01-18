"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Tag,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Gift,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/lib/supabase/coupons";
import { Coupon, CouponFormData } from "@/types/coupon";
import { useToast } from "@/components/ui/Toast";

function CouponCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-6 bg-gray-200 rounded-lg w-1/2" />
        <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        <div className="h-8 bg-gray-200 rounded-lg w-1/3" />
      </div>
    </div>
  );
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_value: undefined,
    max_discount: undefined,
    valid_from: new Date().toISOString().split("T")[0],
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    is_active: true,
    usage_limit: undefined,
    first_purchase_only: false,
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Erro ao carregar cupons:", error);
      showToast("Erro ao carregar cupons", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCoupons();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleOpenForm = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value,
        max_discount: coupon.max_discount,
        valid_from: coupon.valid_from.split("T")[0],
        valid_until: coupon.valid_until.split("T")[0],
        is_active: coupon.is_active,
        usage_limit: coupon.usage_limit,
        first_purchase_only: coupon.first_purchase_only,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        discount_value: 10,
        min_order_value: undefined,
        max_discount: undefined,
        valid_from: new Date().toISOString().split("T")[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        is_active: true,
        usage_limit: undefined,
        first_purchase_only: false,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Validações
      if (formData.discount_type !== "free_shipping" && !formData.discount_value) {
        showToast("Valor do desconto é obrigatório", "error");
        setIsSaving(false);
        return;
      }

      if (formData.discount_type === "free_shipping") {
        formData.discount_value = null;
      }

      const couponData = {
        ...formData,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until + "T23:59:59").toISOString(),
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, couponData);
        showToast("Cupom atualizado com sucesso!", "success");
      } else {
        await createCoupon(couponData);
        showToast("Cupom criado com sucesso!", "success");
      }

      handleCloseForm();
      await loadCoupons();
    } catch (error: any) {
      console.error("Erro ao salvar cupom:", error);
      showToast(
        error.message || "Erro ao salvar cupom",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o cupom "${coupon.code}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    try {
      await deleteCoupon(coupon.id);
      showToast("Cupom excluído com sucesso!", "success");
      await loadCoupons();
    } catch (error) {
      console.error("Erro ao excluir cupom:", error);
      showToast("Erro ao excluir cupom", "error");
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Código copiado!", "success");
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active });
      showToast(
        `Cupom ${coupon.is_active ? "desativado" : "ativado"} com sucesso!`,
        "success"
      );
      await loadCoupons();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      showToast("Erro ao atualizar status", "error");
    }
  };

  // Filtrar cupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && coupon.is_active) ||
      (filterStatus === "inactive" && !coupon.is_active) ||
      (filterStatus === "expired" &&
        new Date(coupon.valid_until) < new Date());

    return matchesSearch && matchesStatus;
  });

  const getDiscountTypeLabel = (type: string) => {
    switch (type) {
      case "percentage":
        return "Porcentagem";
      case "fixed":
        return "Valor Fixo";
      case "free_shipping":
        return "Frete Grátis";
      default:
        return type;
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return Percent;
      case "fixed":
        return DollarSign;
      case "free_shipping":
        return Truck;
      default:
        return Tag;
    }
  };

  const formatDiscountValue = (coupon: Coupon) => {
    if (coupon.discount_type === "free_shipping") {
      return "Frete Grátis";
    }
    if (coupon.discount_type === "percentage") {
      return `${coupon.discount_value}%`;
    }
    return formatCurrency(coupon.discount_value || 0);
  };

  return (
    <div className="w-full h-full p-4 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Gestão de Cupons
          </h1>
          <p className="text-secondary/60 mt-1">
            Crie e gerencie cupons de desconto para seus clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "w-5 h-5 text-secondary/60",
                isRefreshing && "animate-spin"
              )}
            />
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Novo Cupom
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary/40" />
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 rounded-xl pl-12 pr-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "active", label: "Ativos" },
              { value: "inactive", label: "Inativos" },
              { value: "expired", label: "Expirados" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  filterStatus === filter.value
                    ? "bg-primary text-white"
                    : "bg-gray-50 text-secondary/70 hover:bg-gray-100"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CouponCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100/50 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-secondary/70 font-medium text-lg">
            Nenhum cupom encontrado
          </p>
          <p className="text-sm text-secondary/50 mt-1">
            {searchQuery || filterStatus !== "all"
              ? "Tente ajustar os filtros"
              : "Crie seu primeiro cupom de desconto"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => {
            const DiscountIcon = getDiscountTypeIcon(coupon.discount_type);
            const isExpired = new Date(coupon.valid_until) < new Date();
            const isNearExpiry =
              new Date(coupon.valid_until) <
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={coupon.id}
                className={cn(
                  "bg-white rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg",
                  coupon.is_active && !isExpired
                    ? "border-primary/20 hover:border-primary/40"
                    : "border-gray-100"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          "p-2 rounded-xl",
                          coupon.is_active && !isExpired
                            ? "bg-primary/10"
                            : "bg-gray-100"
                        )}
                      >
                        <DiscountIcon
                          className={cn(
                            "w-5 h-5",
                            coupon.is_active && !isExpired
                              ? "text-primary"
                              : "text-gray-400"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-secondary-dark truncate">
                            {coupon.code}
                          </h3>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Copiar código"
                          >
                            <Copy className="w-4 h-4 text-secondary/50" />
                          </button>
                        </div>
                        <p className="text-xs text-secondary/50 mt-0.5">
                          {getDiscountTypeLabel(coupon.discount_type)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCouponStatus(coupon)}
                    className={cn(
                      "p-2 rounded-xl transition-colors",
                      coupon.is_active
                        ? "bg-emerald-100 hover:bg-emerald-200"
                        : "bg-gray-100 hover:bg-gray-200"
                    )}
                    title={
                      coupon.is_active ? "Desativar cupom" : "Ativar cupom"
                    }
                  >
                    {coupon.is_active ? (
                      <Eye className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Description */}
                <p className="text-sm text-secondary/70 mb-4 line-clamp-2">
                  {coupon.description}
                </p>

                {/* Discount Value */}
                <div className="bg-gradient-to-br from-primary/5 to-accent-pink/10 rounded-xl p-4 mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatDiscountValue(coupon)}
                    </span>
                    {coupon.discount_type === "percentage" &&
                      coupon.max_discount && (
                        <span className="text-xs text-secondary/50">
                          (máx. {formatCurrency(coupon.max_discount)})
                        </span>
                      )}
                  </div>
                  {coupon.min_order_value && (
                    <p className="text-xs text-secondary/50 mt-1">
                      Pedido mínimo: {formatCurrency(coupon.min_order_value)}
                    </p>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-secondary/60">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Válido até:{" "}
                      {new Date(coupon.valid_until).toLocaleDateString("pt-BR")}
                    </span>
                    {isNearExpiry && !isExpired && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                        Expira em breve
                      </span>
                    )}
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                        Expirado
                      </span>
                    )}
                  </div>

                  {coupon.usage_limit && (
                    <div className="flex items-center gap-2 text-xs text-secondary/60">
                      <Users className="w-4 h-4" />
                      <span>
                        {coupon.usage_count} / {coupon.usage_limit} usos
                      </span>
                    </div>
                  )}

                  {coupon.first_purchase_only && (
                    <div className="flex items-center gap-2 text-xs text-secondary/60">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        Apenas primeira compra
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleOpenForm(coupon)}
                    className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-secondary-dark rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-secondary-dark">
                  {editingCoupon ? "Editar Cupom" : "Novo Cupom"}
                </h2>
                <p className="text-sm text-secondary/50 mt-1">
                  {editingCoupon
                    ? "Atualize as informações do cupom"
                    : "Preencha os dados para criar um novo cupom"}
                </p>
              </div>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-secondary/60" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Ex: BEMVINDO10"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Descrição *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                  placeholder="Descreva o cupom..."
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Tipo de Desconto *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "percentage",
                      label: "Porcentagem",
                      icon: Percent,
                    },
                    { value: "fixed", label: "Valor Fixo (BRL)", icon: DollarSign },
                    {
                      value: "free_shipping",
                      label: "Frete Grátis",
                      icon: Truck,
                    },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            discount_type: type.value as any,
                            discount_value:
                              type.value === "free_shipping"
                                ? null
                                : formData.discount_value || 10,
                          })
                        }
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                          formData.discount_type === type.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-6 h-6",
                            formData.discount_type === type.value
                              ? "text-primary"
                              : "text-secondary/40"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            formData.discount_type === type.value
                              ? "text-primary"
                              : "text-secondary/70"
                          )}
                        >
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Discount Value */}
              {formData.discount_type !== "free_shipping" && (
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-2">
                    {formData.discount_type === "percentage"
                      ? "Porcentagem de Desconto (%) *"
                      : "Valor do Desconto (R$) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step={formData.discount_type === "percentage" ? "1" : "0.01"}
                    value={formData.discount_value || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder={
                      formData.discount_type === "percentage"
                        ? "Ex: 10"
                        : "Ex: 5.00"
                    }
                  />
                </div>
              )}

              {/* Max Discount (only for percentage) */}
              {formData.discount_type === "percentage" && (
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-2">
                    Desconto Máximo (R$) <span className="text-secondary/50">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.max_discount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount: e.target.value
                          ? parseFloat(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="Ex: 50.00"
                  />
                </div>
              )}

              {/* Min Order Value */}
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Pedido Mínimo (R$) <span className="text-secondary/50">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_order_value || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_value: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Ex: 30.00"
                />
              </div>

              {/* Usage Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-3">
                    Limite de Uso
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary/30 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="usage_type"
                        checked={formData.first_purchase_only}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            first_purchase_only: true,
                            usage_limit: undefined,
                          })
                        }
                        className="w-4 h-4 text-primary"
                      />
                      <Gift className="w-5 h-5 text-secondary/60" />
                      <div className="flex-1">
                        <p className="font-medium text-secondary-dark">
                          Apenas primeira compra
                        </p>
                        <p className="text-xs text-secondary/50">
                          O cupom só pode ser usado na primeira compra do cliente
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-primary/30 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="usage_type"
                        checked={!formData.first_purchase_only}
                        onChange={() =>
                          setFormData({
                            ...formData,
                            first_purchase_only: false,
                          })
                        }
                        className="w-4 h-4 text-primary"
                      />
                      <Users className="w-5 h-5 text-secondary/60" />
                      <div className="flex-1">
                        <p className="font-medium text-secondary-dark">
                          Múltiplos usos
                        </p>
                        <p className="text-xs text-secondary/50">
                          O cupom pode ser usado várias vezes (até o limite)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {!formData.first_purchase_only && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-dark mb-2">
                      Limite de Usos <span className="text-secondary/50">(opcional)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.usage_limit || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                      placeholder="Ex: 100 (deixe vazio para ilimitado)"
                    />
                  </div>
                )}
              </div>

              {/* Validity Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-2">
                    Válido a partir de *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-dark mb-2">
                    Válido até *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                    min={formData.valid_from}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm border border-transparent focus:outline-none focus:border-primary/30 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-5 h-5 text-primary rounded"
                />
                <label
                  htmlFor="is_active"
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-medium text-secondary-dark">
                    Cupom ativo
                  </p>
                  <p className="text-xs text-secondary/50">
                    Cupons inativos não podem ser usados pelos clientes
                  </p>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-6 py-3 bg-gray-50 hover:bg-gray-100 text-secondary-dark rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingCoupon ? "Atualizar" : "Criar"} Cupom
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

