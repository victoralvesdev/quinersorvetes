"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFreightZones,
  createFreightZone,
  updateFreightZone,
  deleteFreightZone,
  FreightZone,
} from "@/lib/supabase/freight";
import { useToast } from "@/components/ui/Toast";

const EMPTY_FORM = {
  label: "",
  min_km: "",
  max_km: "",
  price: "",
  display_order: "",
};

type FormData = typeof EMPTY_FORM;

function ZoneForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: Partial<FreightZone>;
  onSave: (data: Omit<FreightZone, "id" | "active">) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<FormData>({
    label: initial?.label ?? "",
    min_km: initial?.min_km !== undefined ? String(initial.min_km) : "",
    max_km: initial?.max_km !== undefined ? String(initial.max_km) : "",
    price: initial?.price !== undefined ? String(initial.price) : "",
    display_order: initial?.display_order !== undefined ? String(initial.display_order) : "",
  });

  const set = (field: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      label: form.label.trim(),
      min_km: parseFloat(form.min_km) || 0,
      max_km: parseFloat(form.max_km) || 0,
      price: parseFloat(form.price) || 0,
      display_order: parseInt(form.display_order) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-secondary/70 mb-1">
            Nome da zona
          </label>
          <input
            type="text"
            required
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Ex: Zona Centro"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary/70 mb-1">
            Distância mínima (km)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.1"
            value={form.min_km}
            onChange={(e) => set("min_km", e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary/70 mb-1">
            Distância máxima (km)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.1"
            value={form.max_km}
            onChange={(e) => set("max_km", e.target.value)}
            placeholder="5"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary/70 mb-1">
            Taxa de entrega (R$)
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-secondary/70 mb-1">
            Ordem de exibição
          </label>
          <input
            type="number"
            min="0"
            value={form.display_order}
            onChange={(e) => set("display_order", e.target.value)}
            placeholder="0"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-secondary hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  );
}

export default function FretePage() {
  const { showToast } = useToast();
  const [zones, setZones] = useState<FreightZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    const data = await getFreightZones();
    setZones(data);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: Omit<FreightZone, "id" | "active">) => {
    setIsSaving(true);
    const result = await createFreightZone({ ...data, active: true });
    setIsSaving(false);
    if (result) {
      showToast("Zona criada com sucesso", "success");
      setShowCreateForm(false);
      await load();
    } else {
      showToast("Erro ao criar zona", "error");
    }
  };

  const handleUpdate = async (id: string, data: Omit<FreightZone, "id" | "active">) => {
    setIsSaving(true);
    const result = await updateFreightZone(id, data);
    setIsSaving(false);
    if (result) {
      showToast("Zona atualizada", "success");
      setEditingId(null);
      await load();
    } else {
      showToast("Erro ao atualizar zona", "error");
    }
  };

  const handleToggleActive = async (zone: FreightZone) => {
    const result = await updateFreightZone(zone.id, { active: !zone.active });
    if (result) {
      showToast(result.active ? "Zona ativada" : "Zona desativada", "success");
      setZones((prev) => prev.map((z) => (z.id === zone.id ? result : z)));
    } else {
      showToast("Erro ao atualizar status", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta zona de frete?")) return;
    setDeletingId(id);
    const ok = await deleteFreightZone(id);
    setDeletingId(null);
    if (ok) {
      showToast("Zona excluída", "success");
      setZones((prev) => prev.filter((z) => z.id !== id));
    } else {
      showToast("Erro ao excluir zona", "error");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-dark">Zonas de Frete</h1>
            <p className="text-sm text-secondary/60">Gerencie as taxas de entrega por distância</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
        >
          <Plus className="w-4 h-4" />
          Nova zona
        </button>
      </div>

      {/* Store address info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-secondary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-secondary-dark">Endereço da loja (ponto de origem)</p>
          <p className="text-sm text-secondary/70 mt-0.5">
            Rua Argemiro Egidio Gonçalves, 422 — Parque Brasil, Bragança Paulista, SP — CEP 12908-020
          </p>
          <p className="text-xs text-secondary/40 mt-1">
            As distâncias são calculadas em linha reta (Haversine) a partir deste endereço.
          </p>
        </div>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-secondary-dark mb-4">Nova zona de frete</h2>
          <ZoneForm
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSaving={isSaving}
          />
        </div>
      )}

      {/* Zones table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-secondary-dark">Nenhuma zona cadastrada</p>
            <p className="text-xs text-secondary/50 mt-1">
              Clique em &quot;Nova zona&quot; para começar a configurar as taxas de entrega.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                    Zona
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                    Distância
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                    Taxa
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-secondary/50 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {zones.map((zone) => (
                  <>
                    <tr
                      key={zone.id}
                      className={cn(
                        "transition-colors",
                        editingId === zone.id ? "bg-primary/5" : "hover:bg-gray-50/50"
                      )}
                    >
                      <td className="px-5 py-4 font-medium text-secondary-dark">
                        {zone.label}
                      </td>
                      <td className="px-5 py-4 text-secondary/70">
                        {zone.min_km} – {zone.max_km} km
                      </td>
                      <td className="px-5 py-4">
                        {zone.price === 0 ? (
                          <span className="text-emerald-600 font-semibold">Grátis</span>
                        ) : (
                          <span className="font-semibold text-secondary-dark">
                            R$ {zone.price.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleActive(zone)}
                          className="flex items-center gap-1.5 text-sm transition-colors"
                        >
                          {zone.active ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-emerald-500" />
                              <span className="text-emerald-600 font-medium">Ativa</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                              <span className="text-secondary/50">Inativa</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setEditingId(editingId === zone.id ? null : zone.id)
                            }
                            className="p-2 rounded-lg hover:bg-primary/10 text-secondary/50 hover:text-primary transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(zone.id)}
                            disabled={deletingId === zone.id}
                            className="p-2 rounded-lg hover:bg-red-50 text-secondary/50 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Excluir"
                          >
                            {deletingId === zone.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === zone.id && (
                      <tr key={`${zone.id}-edit`} className="bg-primary/5">
                        <td colSpan={5} className="px-5 py-4">
                          <ZoneForm
                            initial={zone}
                            onSave={(data) => handleUpdate(zone.id, data)}
                            onCancel={() => setEditingId(null)}
                            isSaving={isSaving}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
