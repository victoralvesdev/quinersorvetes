"use client";

import { useState } from "react";
import { Plug, Eye, EyeOff, ExternalLink, Shield, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationsTabProps {
  mercadopagoToken: string;
  onChange: (key: string, value: string) => void;
}

export function IntegrationsTab({
  mercadopagoToken,
  onChange,
}: IntegrationsTabProps) {
  const [showToken, setShowToken] = useState(false);

  const isConfigured = !!mercadopagoToken;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-violet-100 rounded-xl">
          <Plug className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-secondary-dark">Integrações</h3>
          <p className="text-sm text-secondary/60">
            Configure as integrações com serviços externos
          </p>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-amber-800">Informações Sensíveis</h4>
          <p className="text-xs text-amber-700 mt-1">
            Os tokens e credenciais são armazenados de forma segura. Nunca compartilhe essas informações.
          </p>
        </div>
      </div>

      {/* Mercado Pago Integration */}
      <section className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Integration Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-[#009ee3] shadow-lg shadow-[#009ee3]/20">
                <svg className="h-8 w-8 text-white" viewBox="0 0 50 50" fill="currentColor">
                  <path d="M25 2C12.317 2 2 12.317 2 25s10.317 23 23 23 23-10.317 23-23S37.683 2 25 2zm0 4c10.477 0 19 8.523 19 19s-8.523 19-19 19S6 35.477 6 25 14.523 6 25 6zm-5.5 9a6.5 6.5 0 00-6.5 6.5c0 1.933.858 3.672 2.207 4.875L11 35h7l2.5-5h10l2.5 5h7l-4.207-8.625A6.491 6.491 0 0038 21.5a6.5 6.5 0 00-6.5-6.5c-2.397 0-4.507 1.308-5.625 3.25h-1.75c-1.118-1.942-3.228-3.25-5.625-3.25z" />
                </svg>
              </div>
              <div>
                <h4 className="text-lg font-bold text-secondary-dark">Mercado Pago</h4>
                <p className="text-sm text-secondary/60">Pagamentos PIX e Cartão</p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold",
              isConfigured
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            )}>
              {isConfigured ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Configurado
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Não configurado
                </>
              )}
            </div>
          </div>
        </div>

        {/* Token Input */}
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary/70 mb-2">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={mercadopagoToken}
                  onChange={(e) => onChange("mercadopago_access_token", e.target.value)}
                  placeholder="APP_USR-..."
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-secondary/50 hover:text-secondary transition-colors"
                >
                  {showToken ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-secondary/50 mt-2 flex items-center gap-1">
                Encontre seu token em
                <a
                  href="https://www.mercadopago.com.br/developers/panel/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Suas integrações
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-secondary/70">Pagamento PIX</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-secondary/70">Cartão de Crédito</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-secondary/70">Cartão de Débito</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-sm text-secondary/70">Webhook automático</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Integrations Coming Soon */}
      <section className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-secondary-dark">Mais integrações em breve</h4>
          <p className="text-sm text-secondary/50 mt-1">
            Novas integrações serão adicionadas aqui
          </p>
        </div>
      </section>
    </div>
  );
}
