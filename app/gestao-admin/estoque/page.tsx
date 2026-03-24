"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Save,
  ChevronDown,
  ChevronRight,
  Package,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Product, ProductVariation, ProductVariationItem } from "@/types/product";
import { useToast } from "@/components/ui/Toast";
import { useNotifications } from "@/contexts/NotificationsContext";

// ─── tipos locais ──────────────────────────────────────────────────────────────

interface StockEdit {
  qty: string;
  threshold: string;
  dirty: boolean;
}

interface ProductRow {
  product: Product;
  variations: ProductVariation[];
  expanded: boolean;
  productStock: StockEdit;
  itemStocks: Record<string, StockEdit>; // itemId -> edit
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function stockStatus(qty: number | null | undefined, threshold: number | null | undefined) {
  if (qty === null || qty === undefined) return "sem_controle";
  if (qty === 0) return "esgotado";
  if (threshold !== null && threshold !== undefined && qty <= threshold) return "baixo";
  return "ok";
}

function StockBadge({ qty, threshold }: { qty: number | null | undefined; threshold: number | null | undefined }) {
  const status = stockStatus(qty, threshold);
  if (status === "sem_controle")
    return <span className="text-xs text-secondary/40 italic">Sem controle</span>;
  if (status === "esgotado")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3" /> Esgotado
      </span>
    );
  if (status === "baixo")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        <AlertTriangle className="w-3 h-3" /> Estoque baixo
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> OK
    </span>
  );
}

function StockBar({ qty, threshold }: { qty: number | null | undefined; threshold: number | null | undefined }) {
  if (qty === null || qty === undefined || threshold === null || threshold === undefined || threshold === 0) return null;
  const max = Math.max(threshold * 2, qty);
  const pct = Math.min((qty / max) * 100, 100);
  const status = stockStatus(qty, threshold);
  const color =
    status === "esgotado" ? "bg-red-400" : status === "baixo" ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StockInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-20 h-8 px-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-white transition-all"
    />
  );
}

// ─── componente principal ──────────────────────────────────────────────────────

export default function EstoquePage() {
  const { showToast } = useToast();
  const { refreshNotifications } = useNotifications();

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "baixo" | "esgotado" | "sem_controle">("todos");

  // ── carrega dados ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const productsRes = await fetch("/api/products");
      const products = await productsRes.json();
      const productIds = products.map((p: Product) => p.id);
      const variationsRes = await fetch(`/api/admin/products/variations?productIds=${encodeURIComponent(JSON.stringify(productIds))}`);
      const variationsMap = await variationsRes.json();

      const built: ProductRow[] = products.map((product) => {
        const variations = variationsMap[product.id] || [];
        const itemStocks: Record<string, StockEdit> = {};
        variations.forEach((v) =>
          v.items.forEach((item) => {
            if (item.id) {
              itemStocks[item.id] = {
                qty: item.stock_quantity != null ? String(item.stock_quantity) : "",
                threshold: item.low_stock_threshold != null ? String(item.low_stock_threshold) : "",
                dirty: false,
              };
            }
          })
        );
        return {
          product,
          variations,
          expanded: false,
          productStock: {
            qty: product.stock_quantity != null ? String(product.stock_quantity) : "",
            threshold: product.low_stock_threshold != null ? String(product.low_stock_threshold) : "",
            dirty: false,
          },
          itemStocks,
        };
      });

      setRows(built);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── edição ───────────────────────────────────────────────────────────────────
  const updateProductStock = (productId: string, field: "qty" | "threshold", value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.product.id === productId
          ? { ...r, productStock: { ...r.productStock, [field]: value, dirty: true } }
          : r
      )
    );
  };

  const updateItemStock = (productId: string, itemId: string, field: "qty" | "threshold", value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.product.id === productId
          ? {
              ...r,
              itemStocks: {
                ...r.itemStocks,
                [itemId]: { ...r.itemStocks[itemId], [field]: value, dirty: true },
              },
            }
          : r
      )
    );
  };

  const toggleExpanded = (productId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.product.id === productId ? { ...r, expanded: !r.expanded } : r
      )
    );
  };

  // ── salvar ───────────────────────────────────────────────────────────────────
  const sendAlert = async (name: string, variationItemName: string | undefined, qty: number, threshold: number) => {
    try {
      await fetch("/api/whatsapp/low-stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: name,
          variationItemName,
          stockQuantity: qty,
          threshold,
        }),
      });
    } catch {
      // silencia erro de alerta
    }
  };

  const saveAll = async () => {
    setSaving(true);
    let saved = 0;
    let errors = 0;

    try {
      const dirtyProducts = rows.filter((r) => r.productStock.dirty);
      const dirtyItems = rows.flatMap((r) =>
        Object.entries(r.itemStocks)
          .filter(([, s]) => s.dirty)
          .map(([itemId, s]) => ({ row: r, itemId, s }))
      );

      await Promise.all([
        ...dirtyProducts.map(async (r) => {
          const qty = r.productStock.qty !== "" ? parseInt(r.productStock.qty, 10) : null;
          const threshold = r.productStock.threshold !== "" ? parseInt(r.productStock.threshold, 10) : null;
          const res = await fetch("/api/admin/products/stock", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "product", id: r.product.id, stockQuantity: qty, lowStockThreshold: threshold }),
          });
          const ok = res.ok;
          if (ok) {
            saved++;
            if (qty !== null && threshold !== null && qty <= threshold) {
              await sendAlert(r.product.name, undefined, qty, threshold);
            }
          } else {
            errors++;
          }
        }),
        ...dirtyItems.map(async ({ row, itemId, s }) => {
          const qty = s.qty !== "" ? parseInt(s.qty, 10) : null;
          const threshold = s.threshold !== "" ? parseInt(s.threshold, 10) : null;
          const res = await fetch("/api/admin/products/stock", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "variation", id: itemId, stockQuantity: qty, lowStockThreshold: threshold }),
          });
          const ok = res.ok;
          if (ok) {
            saved++;
            // encontra o item para compor a mensagem de alerta
            if (qty !== null && threshold !== null && qty <= threshold) {
              const variation = row.variations.find((v) => v.items.some((i) => i.id === itemId));
              const item = variation?.items.find((i) => i.id === itemId);
              await sendAlert(row.product.name, item?.name, qty, threshold);
            }
          } else {
            errors++;
          }
        }),
      ]);

      // marca como não dirty
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          productStock: { ...r.productStock, dirty: false },
          itemStocks: Object.fromEntries(
            Object.entries(r.itemStocks).map(([id, s]) => [id, { ...s, dirty: false }])
          ),
        }))
      );

      await refreshNotifications();

      if (errors === 0) {
        showToast(`${saved} ${saved === 1 ? "item salvo" : "itens salvos"} com sucesso`, "success");
      } else {
        showToast(`${saved} salvos, ${errors} com erro`, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── filtro + busca ───────────────────────────────────────────────────────────
  const filteredRows = rows.filter((r) => {
    const name = r.product.name.toLowerCase();
    const cat = (r.product.categoryName || "").toLowerCase();
    const term = search.toLowerCase();
    if (term && !name.includes(term) && !cat.includes(term)) return false;

    if (filter === "todos") return true;

    const productStatus = stockStatus(r.product.stock_quantity, r.product.low_stock_threshold);
    const allItemStatuses = r.variations.flatMap((v) =>
      v.items.map((item) => stockStatus(item.stock_quantity, item.low_stock_threshold))
    );
    const allStatuses = [productStatus, ...allItemStatuses];

    if (filter === "baixo") return allStatuses.includes("baixo");
    if (filter === "esgotado") return allStatuses.includes("esgotado");
    if (filter === "sem_controle") return allStatuses.every((s) => s === "sem_controle");
    return true;
  });

  // ── contagens para cabeçalho ─────────────────────────────────────────────────
  const totalItems = rows.reduce(
    (acc, r) => acc + 1 + r.variations.reduce((a, v) => a + v.items.length, 0),
    0
  );
  const lowCount = rows.reduce((acc, r) => {
    const pStatus = stockStatus(r.product.stock_quantity, r.product.low_stock_threshold);
    const iCount = r.variations.flatMap((v) => v.items).filter(
      (item) => stockStatus(item.stock_quantity, item.low_stock_threshold) === "baixo"
    ).length;
    return acc + (pStatus === "baixo" ? 1 : 0) + iCount;
  }, 0);
  const zeroCount = rows.reduce((acc, r) => {
    const pStatus = stockStatus(r.product.stock_quantity, r.product.low_stock_threshold);
    const iCount = r.variations.flatMap((v) => v.items).filter(
      (item) => stockStatus(item.stock_quantity, item.low_stock_threshold) === "esgotado"
    ).length;
    return acc + (pStatus === "esgotado" ? 1 : 0) + iCount;
  }, 0);
  const hasDirty = rows.some(
    (r) => r.productStock.dirty || Object.values(r.itemStocks).some((s) => s.dirty)
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 lg:p-8 space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-secondary-dark tracking-tight">Controle de Estoque</h2>
          <p className="text-sm text-secondary/60 mt-0.5">
            Gerencie quantidades de produtos e variações em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Recarregar"
          >
            <RefreshCw className={cn("w-4 h-4 text-secondary/60", loading && "animate-spin")} />
          </button>
          <button
            onClick={saveAll}
            disabled={saving || !hasDirty}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
              hasDirty
                ? "bg-primary text-white shadow-sm shadow-primary/20 hover:bg-primary/90"
                : "bg-gray-100 text-secondary/40 cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-secondary/50 font-medium">Total de itens</p>
              <p className="text-xl font-bold text-secondary-dark">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-secondary/50 font-medium">Com controle</p>
              <p className="text-xl font-bold text-secondary-dark">
                {rows.filter((r) => r.productStock.qty !== "" || Object.values(r.itemStocks).some((s) => s.qty !== "")).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-secondary/50 font-medium">Estoque baixo</p>
              <p className="text-xl font-bold text-amber-600">{lowCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-secondary/50 font-medium">Esgotados</p>
              <p className="text-xl font-bold text-red-600">{zeroCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de busca + filtro */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1">
          <Filter className="w-3.5 h-3.5 text-secondary/40 ml-2" />
          {(["todos", "baixo", "esgotado", "sem_controle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                filter === f
                  ? "bg-primary text-white shadow-sm"
                  : "text-secondary/60 hover:bg-gray-50"
              )}
            >
              {f === "todos" && "Todos"}
              {f === "baixo" && "Baixo"}
              {f === "esgotado" && "Esgotado"}
              {f === "sem_controle" && "Sem controle"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-16">
          <Archive className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-sm font-medium text-secondary/60">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

          {/* Header da tabela */}
          <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
            <span>Produto / Variação</span>
            <span className="w-20 text-center">Quantidade</span>
            <span className="w-20 text-center">Alerta em</span>
            <span className="w-16 text-center">Barra</span>
            <span className="w-28 text-center">Status</span>
            <span className="w-8" />
          </div>

          <div className="divide-y divide-gray-50">
            {filteredRows.map((row) => {
              const hasVariations = row.variations.length > 0 && row.variations.some((v) => v.items.length > 0);
              const ps = row.productStock;
              const pQty = ps.qty !== "" ? parseInt(ps.qty, 10) : null;
              const pThreshold = ps.threshold !== "" ? parseInt(ps.threshold, 10) : null;

              return (
                <div key={row.product.id}>
                  {/* Linha do produto */}
                  <div
                    className={cn(
                      "grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-4 transition-colors",
                      hasVariations ? "hover:bg-gray-50/60 cursor-pointer" : "hover:bg-gray-50/30",
                      ps.dirty && "bg-primary/[0.02]"
                    )}
                    onClick={hasVariations ? () => toggleExpanded(row.product.id) : undefined}
                  >
                    {/* Nome + Imagem */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Imagem do produto */}
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100 border border-gray-100">
                        {row.product.image ? (
                          <Image
                            src={row.product.image}
                            alt={row.product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Chevron expand (variações) */}
                      {hasVariations && (
                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {row.expanded
                            ? <ChevronDown className="w-3 h-3 text-primary" />
                            : <ChevronRight className="w-3 h-3 text-primary" />
                          }
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-secondary-dark truncate flex items-center gap-2">
                          {row.product.name}
                          {ps.dirty && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </p>
                        <p className="text-xs text-secondary/50 truncate">
                          {row.product.categoryName}
                          {hasVariations && (
                            <span className="ml-1.5 text-primary/60">
                              · {row.variations.reduce((a, v) => a + v.items.length, 0)} variações
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Campos de estoque — produto */}
                    <div
                      className="flex items-center gap-2 col-span-1 md:contents"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!hasVariations ? (
                        <>
                          <StockInput
                            value={ps.qty}
                            onChange={(v) => updateProductStock(row.product.id, "qty", v)}
                            placeholder="Qtd."
                          />
                          <StockInput
                            value={ps.threshold}
                            onChange={(v) => updateProductStock(row.product.id, "threshold", v)}
                            placeholder="Alerta"
                          />
                          <div className="hidden md:block">
                            <StockBar qty={pQty} threshold={pThreshold} />
                          </div>
                          <div className="hidden md:block">
                            <StockBadge qty={pQty} threshold={pThreshold} />
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="hidden md:block w-20" />
                          <span className="hidden md:block w-20" />
                          <span className="hidden md:block w-16" />
                          <span className="hidden md:block w-28 text-xs text-secondary/40 italic text-center">
                            ver variações
                          </span>
                        </>
                      )}
                    </div>
                    <div className="w-8 hidden md:block" />
                  </div>

                  {/* Linhas de variações expandidas */}
                  {hasVariations && row.expanded && (
                    <div className="border-t border-gray-50 bg-gray-50/40">
                      {row.variations.map((variation) => (
                        <div key={variation.id}>
                          {/* Cabeçalho da variação */}
                          <div className="flex items-center gap-2 px-5 py-2">
                            <Layers className="w-3.5 h-3.5 text-secondary/40" />
                            <span className="text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                              {variation.name}
                            </span>
                          </div>

                          {/* Itens da variação */}
                          {variation.items.map((item) => {
                            if (!item.id) return null;
                            const is = row.itemStocks[item.id] || { qty: "", threshold: "", dirty: false };
                            const iQty = is.qty !== "" ? parseInt(is.qty, 10) : null;
                            const iThreshold = is.threshold !== "" ? parseInt(is.threshold, 10) : null;

                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center pl-12 pr-5 py-3 border-t border-gray-100/80 hover:bg-white/60 transition-colors",
                                  is.dirty && "bg-primary/[0.03]"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                  <p className="text-sm text-secondary-dark truncate flex items-center gap-2">
                                    {item.name}
                                    {item.price > 0 && (
                                      <span className="text-xs text-secondary/40">
                                        +{item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                      </span>
                                    )}
                                    {is.dirty && (
                                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 col-span-1 md:contents">
                                  <StockInput
                                    value={is.qty}
                                    onChange={(v) => updateItemStock(row.product.id, item.id!, "qty", v)}
                                    placeholder="Qtd."
                                  />
                                  <StockInput
                                    value={is.threshold}
                                    onChange={(v) => updateItemStock(row.product.id, item.id!, "threshold", v)}
                                    placeholder="Alerta"
                                  />
                                  <div className="hidden md:block">
                                    <StockBar qty={iQty} threshold={iThreshold} />
                                  </div>
                                  <div className="hidden md:block">
                                    <StockBadge qty={iQty} threshold={iThreshold} />
                                  </div>
                                </div>
                                <div className="w-8 hidden md:block" />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-secondary/50 pb-4">
        <span className="font-semibold uppercase tracking-wider">Legenda:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> OK — acima do limite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Baixo — no limite ou abaixo
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Esgotado — quantidade zero
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-200" /> Sem controle — campos vazios
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Alteração não salva
        </span>
      </div>
    </div>
  );
}
