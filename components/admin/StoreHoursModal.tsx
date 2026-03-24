"use client";

import { useState } from "react";
import { Clock, X, Save, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { StoreHours, DaySchedule } from "@/types/settings";

const DAYS: { key: keyof Omit<StoreHours, "auto">; label: string }[] = [
  { key: "monday",    label: "Segunda-feira" },
  { key: "tuesday",   label: "Terça-feira"   },
  { key: "wednesday", label: "Quarta-feira"  },
  { key: "thursday",  label: "Quinta-feira"  },
  { key: "friday",    label: "Sexta-feira"   },
  { key: "saturday",  label: "Sábado"        },
  { key: "sunday",    label: "Domingo"       },
];

interface Props {
  storeHours: StoreHours;
  onClose: () => void;
  onSaved: (hours: StoreHours) => void;
}

export function StoreHoursModal({ storeHours, onClose, onSaved }: Props) {
  const [hours, setHours] = useState<StoreHours>(storeHours);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const toggleAuto = () =>
    setHours((prev) => ({ ...prev, auto: !prev.auto }));

  const toggleDay = (key: keyof Omit<StoreHours, "auto">) =>
    setHours((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as DaySchedule), enabled: !(prev[key] as DaySchedule).enabled },
    }));

  const changeTime = (
    key: keyof Omit<StoreHours, "auto">,
    field: "open" | "close",
    value: string
  ) =>
    setHours((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as DaySchedule), [field]: value },
    }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'store_hours', value: hours, category: 'appearance', is_public: true, upsert: true }),
      });
      const ok = res.ok;
      if (ok) {
        showToast("Horários salvos com sucesso!", "success");
        onSaved(hours);
        onClose();
      } else {
        showToast("Erro ao salvar horários", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-secondary-dark">
                Horários de Funcionamento
              </h2>
              <p className="text-xs text-secondary/50">Horário de Brasília (GMT-3)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-secondary/50" />
          </button>
        </div>

        {/* Auto-schedule toggle */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary-dark">
                Agendamento Automático
              </p>
              <p className="text-xs text-secondary/50 mt-0.5">
                Abre e fecha a loja nos horários configurados
              </p>
            </div>
            <button
              onClick={toggleAuto}
              className={cn(
                "relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0",
                hours.auto ? "bg-emerald-500" : "bg-gray-200"
              )}
            >
              <span
                className={cn(
                  "inline-block w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5",
                  hours.auto ? "translate-x-6" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          {hours.auto && (
            <p className="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              A loja abrirá e fechará automaticamente
            </p>
          )}
        </div>

        {/* Days list */}
        <div className="p-4 space-y-2">
          {DAYS.map(({ key, label }) => {
            const day = hours[key] as DaySchedule;
            return (
              <div
                key={key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200",
                  day.enabled
                    ? "border-primary/20 bg-primary/5"
                    : "border-gray-100 bg-gray-50/50"
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => toggleDay(key)}
                  className={cn(
                    "relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                    day.enabled ? "bg-primary" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5",
                      day.enabled ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>

                {/* Day name */}
                <span
                  className={cn(
                    "text-sm font-medium w-28 shrink-0",
                    day.enabled ? "text-secondary-dark" : "text-secondary/40"
                  )}
                >
                  {label}
                </span>

                {/* Time inputs */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 flex-1 transition-opacity",
                    !day.enabled && "opacity-30 pointer-events-none"
                  )}
                >
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => changeTime(key, "open", e.target.value)}
                    className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-secondary-dark bg-white"
                  />
                  <span className="text-xs text-secondary/40 shrink-0">–</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => changeTime(key, "close", e.target.value)}
                    className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-secondary-dark bg-white"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100">
          <p className="text-xs text-secondary/40">
            {hours.auto ? "✓ Agendamento ativo" : "Agendamento inativo"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-secondary/70 hover:text-secondary border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
