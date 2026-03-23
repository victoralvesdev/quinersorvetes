"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  Search,
  RefreshCw,
  Plus,
  Minus,
  History,
  TrendingUp,
  Gift,
  Users,
  Package,
  Trash2,
  CheckSquare,
  Square,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  getAllUsersPointsSummary,
  getPointsHistory,
  adminAdjustPoints,
  UserPointsSummary,
  getProductPointsRewards,
  bulkUpsertProductPointsRewards,
  deleteProductPointsReward,
} from "@/lib/supabase/points";
import { getProducts } from "@/lib/supabase/products";
import { PointsTransaction, ProductPointsReward } from "@/types/points";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

type Tab = "clientes" | "resgates";

export default function FidelidadePage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("clientes");

  // ─── Clientes ───────────────────────────────────────────────────────────────
  const [summaries, setSummaries] = useState<UserPointsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ─── Resgates ───────────────────────────────────────────────────────────────
  const [rewards, setRewards] = useState<ProductPointsReward[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [pointsInput, setPointsInput] = useState("");
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editingPoints, setEditingPoints] = useState("");

  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsersPointsSummary();
      setSummaries(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadRewards = useCallback(async () => {
    setIsRewardsLoading(true);
    try {
      const [rewardsData, productsData] = await Promise.all([
        getProductPointsRewards(),
        getProducts(),
      ]);
      setRewards(rewardsData);
      setProducts(productsData);
    } finally {
      setIsRewardsLoading(false);
    }
  }, []);

  useEffect(() => { loadClientes(); }, [loadClientes]);
  useEffect(() => { loadRewards(); }, [loadRewards]);

  // ─── Handlers Clientes ───────────────────────────────────────────────────────
  const handleSelect = async (phone: string) => {
    setSelectedPhone(phone);
    setAdjustAmount("");
    setAdjustDesc("");
    setIsHistoryLoading(true);
    try {
      const hist = await getPointsHistory(phone);
      setHistory(hist);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleAdjust = async (sign: 1 | -1) => {
    const amount = parseInt(adjustAmount);
    if (!selectedPhone || isNaN(amount) || amount <= 0) {
      showToast("Informe um valor válido.", "error");
      return;
    }
    if (!adjustDesc.trim()) {
      showToast("Informe uma descrição.", "error");
      return;
    }
    setIsSaving(true);
    const ok = await adminAdjustPoints(selectedPhone, sign * amount, adjustDesc.trim());
    setIsSaving(false);
    if (ok) {
      showToast(`Pontos ${sign > 0 ? "adicionados" : "removidos"} com sucesso.`, "success");
      setAdjustAmount("");
      setAdjustDesc("");
      await handleSelect(selectedPhone);
      await loadClientes();
    } else {
      showToast("Erro ao ajustar pontos.", "error");
    }
  };

  // ─── Handlers Resgates ───────────────────────────────────────────────────────
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleApplyRewards = async () => {
    if (selectedProductIds.size === 0) {
      showToast("Selecione ao menos um produto.", "error");
      return;
    }
    const pts = parseInt(pointsInput);
    if (isNaN(pts) || pts <= 0) {
      showToast("Informe uma quantidade de pontos válida.", "error");
      return;
    }
    setIsSavingRewards(true);
    const ok = await bulkUpsertProductPointsRewards(Array.from(selectedProductIds), pts);
    setIsSavingRewards(false);
    if (ok) {
      showToast(`Resgate definido: ${pts} pts para ${selectedProductIds.size} produto(s).`, "success");
      setSelectedProductIds(new Set());
      setPointsInput("");
      await loadRewards();
    } else {
      showToast("Erro ao salvar resgates.", "error");
    }
  };

  const handleSaveEditReward = async (productId: string, productName: string) => {
    const pts = parseInt(editingPoints);
    if (isNaN(pts) || pts <= 0) {
      showToast("Informe um valor válido.", "error");
      return;
    }
    const ok = await bulkUpsertProductPointsRewards([productId], pts);
    if (ok) {
      showToast(`Resgate de "${productName}" atualizado: ${pts} pts.`, "success");
      setEditingRewardId(null);
      setEditingPoints("");
      await loadRewards();
    } else {
      showToast("Erro ao atualizar resgate.", "error");
    }
  };

  const handleDeleteReward = async (productId: string, productName: string) => {
    const ok = await deleteProductPointsReward(productId);
    if (ok) {
      showToast(`Resgate de "${productName}" removido.`, "success");
      await loadRewards();
    } else {
      showToast("Erro ao remover resgate.", "error");
    }
  };

  // ─── Computed ────────────────────────────────────────────────────────────────
  const filteredSummaries = summaries.filter((s) => s.user_phone.includes(search));
  const selectedBalance = summaries.find((s) => s.user_phone === selectedPhone)?.balance ?? 0;
  const rewardProductIds = new Set(rewards.map((r) => r.product_id));
  const filteredProducts = products.filter(
    (p) =>
      p.available &&
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const typeLabel = (type: string) => {
    if (type === "earned") return "Ganhos";
    if (type === "redeemed") return "Resgatados";
    return "Ajuste";
  };

  const typeColor = (type: string) => {
    if (type === "earned") return "text-emerald-600";
    if (type === "redeemed") return "text-red-500";
    return "text-blue-500";
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
            <p className="text-sm text-gray-500">{summaries.length} clientes com pontos · {rewards.length} resgates ativos</p>
          </div>
        </div>
        <button
          onClick={() => { loadClientes(); loadRewards(); }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("clientes")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "clientes"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Users className="w-4 h-4" />
          Clientes
        </button>
        <button
          onClick={() => setActiveTab("resgates")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            activeTab === "resgates"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Gift className="w-4 h-4" />
          Resgates de Produtos
          {rewards.length > 0 && (
            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {rewards.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Clientes ─────────────────────────────────────────────────────── */}
      {activeTab === "clientes" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: User List */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-gray-200 rounded w-32" />
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {filteredSummaries.map((s) => (
                  <button
                    key={s.user_phone}
                    onClick={() => handleSelect(s.user_phone)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                      selectedPhone === s.user_phone && "bg-violet-50 hover:bg-violet-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                        s.balance > 0 ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-400"
                      )}>
                        {s.user_phone.slice(-2)}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{s.user_phone}</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      s.balance > 0 ? "text-violet-700" : "text-gray-400"
                    )}>
                      {s.balance} pts
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Detail Panel */}
          <div className="space-y-4">
            {!selectedPhone ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Selecione um cliente para ver detalhes</p>
              </div>
            ) : (
              <>
                {/* Balance + Adjust */}
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Cliente</p>
                      <p className="text-sm font-semibold text-gray-800">{selectedPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Saldo atual</p>
                      <p className="text-2xl font-bold text-violet-700">{selectedBalance} <span className="text-sm font-medium">pts</span></p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Quantidade de pontos"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    />
                    <input
                      type="text"
                      placeholder="Motivo do ajuste (obrigatório)"
                      value={adjustDesc}
                      onChange={(e) => setAdjustDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjust(1)}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                      <button
                        onClick={() => handleAdjust(-1)}
                        disabled={isSaving}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>

                {/* History */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">Histórico de pontos</span>
                  </div>
                  {isHistoryLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                          <div className="w-8 h-8 rounded-full bg-gray-200" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-gray-400">Nenhuma transação ainda</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                      {history.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              tx.type === "earned" ? "bg-emerald-50" :
                              tx.type === "redeemed" ? "bg-red-50" : "bg-blue-50"
                            )}>
                              {tx.type === "earned" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> :
                               tx.type === "redeemed" ? <Gift className="w-3.5 h-3.5 text-red-500" /> :
                               <Trophy className="w-3.5 h-3.5 text-blue-500" />}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-700 line-clamp-1">
                                {tx.description || typeLabel(tx.type)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(tx.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          <span className={cn("text-sm font-bold", typeColor(tx.type))}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Resgates ─────────────────────────────────────────────────────── */}
      {activeTab === "resgates" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Select Products */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 mb-3">Selecionar produtos</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
              {selectedProductIds.size > 0 && (
                <p className="text-xs text-violet-600 font-semibold mt-2">
                  {selectedProductIds.size} produto(s) selecionado(s)
                </p>
              )}
            </div>

            {isRewardsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-gray-200" />
                    <div className="flex-1 h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto flex-1">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.has(product.id);
                  const hasReward = rewardProductIds.has(product.id);
                  const reward = rewards.find((r) => r.product_id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
                        isSelected && "bg-violet-50 hover:bg-violet-50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected ? "text-violet-600" : "text-gray-300"
                      )}>
                        {isSelected
                          ? <CheckSquare className="w-5 h-5" />
                          : <Square className="w-5 h-5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                        {hasReward && (
                          <p className="text-xs text-violet-600 font-semibold">
                            Resgate atual: {reward?.points_required} pts
                          </p>
                        )}
                      </div>
                      {hasReward && (
                        <span className="flex-shrink-0 px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full">
                          ativo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Apply Form */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Pontos necessários para resgatar"
                  value={pointsInput}
                  onChange={(e) => setPointsInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
                <button
                  onClick={handleApplyRewards}
                  disabled={isSavingRewards || selectedProductIds.size === 0 || !pointsInput}
                  className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSavingRewards ? "Salvando..." : "Aplicar"}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {selectedProductIds.size === 0
                  ? "Selecione produtos e defina quantos pontos são necessários para resgatar 1 unidade grátis."
                  : `${selectedProductIds.size} produto(s) receberá(ão) resgate de ${pointsInput || "?"} pts.`
                }
              </p>
            </div>
          </div>

          {/* Right: Current Rewards */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Package className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Resgates configurados</span>
              <span className="ml-auto text-xs text-gray-400">{rewards.length} produto(s)</span>
            </div>

            {isRewardsLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rewards.length === 0 ? (
              <div className="p-8 text-center">
                <Gift className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Nenhum resgate configurado</p>
                <p className="text-xs text-gray-400 mt-1">Selecione produtos ao lado e defina a pontuação.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[540px] overflow-y-auto">
                {rewards.map((reward) => {
                  const isEditing = editingRewardId === reward.product_id;
                  return (
                    <div key={reward.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Trophy className="w-5 h-5 text-violet-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                          {reward.product_name ?? "Produto"}
                        </p>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 mt-1">
                            <input
                              type="number"
                              min="1"
                              value={editingPoints}
                              onChange={(e) => setEditingPoints(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEditReward(reward.product_id, reward.product_name ?? "produto");
                                if (e.key === "Escape") { setEditingRewardId(null); setEditingPoints(""); }
                              }}
                              autoFocus
                              className="w-24 px-2 py-1 text-xs border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400/30"
                              placeholder="pts"
                            />
                            <span className="text-xs text-gray-400">pts</span>
                            <button
                              onClick={() => handleSaveEditReward(reward.product_id, reward.product_name ?? "produto")}
                              className="p-1 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => { setEditingRewardId(null); setEditingPoints(""); }}
                              className="p-1 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-violet-600 font-bold">
                            {reward.points_required} pts para 1 unidade grátis
                          </p>
                        )}
                      </div>
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => { setEditingRewardId(reward.product_id); setEditingPoints(String(reward.points_required)); }}
                            className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                            title="Editar pontos"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReward(reward.product_id, reward.product_name ?? "produto")}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remover resgate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
