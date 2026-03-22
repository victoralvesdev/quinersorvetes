"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { getAllUsersPointsSummary, getPointsHistory, adminAdjustPoints, UserPointsSummary } from "@/lib/supabase/points";
import { PointsTransaction } from "@/types/points";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export default function FidelidadePage() {
  const { showToast } = useToast();
  const [summaries, setSummaries] = useState<UserPointsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [history, setHistory] = useState<PointsTransaction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsersPointsSummary();
      setSummaries(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
      await load();
    } else {
      showToast("Erro ao ajustar pontos.", "error");
    }
  };

  const filtered = summaries.filter((s) =>
    s.user_phone.includes(search)
  );

  const selectedBalance = summaries.find((s) => s.user_phone === selectedPhone)?.balance ?? 0;

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Programa de Fidelidade</h1>
            <p className="text-sm text-gray-500">{summaries.length} clientes com pontos</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

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
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {filtered.map((s) => (
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
    </div>
  );
}
