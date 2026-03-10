"use client";

import { Mail, Phone, MessageCircle } from "lucide-react";

interface ContactTabProps {
  email: string;
  phone: string;
  whatsapp: string;
  onChange: (key: string, value: string) => void;
}

export function ContactTab({
  email,
  phone,
  whatsapp,
  onChange,
}: ContactTabProps) {
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "");

    if (digits.length <= 2) {
      return digits.length ? `(${digits}` : "";
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (key: string, value: string) => {
    const formatted = formatPhone(value);
    onChange(key, formatted);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-emerald-100 rounded-xl">
          <Phone className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-secondary-dark">Informações de Contato</h3>
          <p className="text-sm text-secondary/60">
            Dados de contato exibidos no site
          </p>
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email */}
        <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-secondary-dark">E-mail</p>
              <p className="text-xs text-secondary/60">Suporte e contato</p>
            </div>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => onChange("contact_email", e.target.value)}
            placeholder="suporte@quiner.com.br"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Phone */}
        <div className="bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-secondary-dark">Telefone</p>
              <p className="text-xs text-secondary/60">Fixo ou celular</p>
            </div>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange("contact_phone", e.target.value)}
            placeholder="(11) 1234-5678"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* WhatsApp */}
        <div className="bg-gradient-to-br from-green-50/50 to-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-500 rounded-xl">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-secondary-dark">WhatsApp</p>
              <p className="text-xs text-secondary/60">Atendimento</p>
            </div>
          </div>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => handlePhoneChange("contact_whatsapp", e.target.value)}
            placeholder="(11) 91234-5678"
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
        <p className="text-xs font-medium text-secondary/50 uppercase tracking-wide mb-4">
          Pré-visualização
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {email && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-secondary/50">E-mail</p>
                <p className="text-sm font-medium text-secondary-dark truncate">{email}</p>
              </div>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Phone className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-secondary/50">Telefone</p>
                <p className="text-sm font-medium text-secondary-dark truncate">{phone}</p>
              </div>
            </div>
          )}
          {whatsapp && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-secondary/50">WhatsApp</p>
                <p className="text-sm font-medium text-secondary-dark truncate">{whatsapp}</p>
              </div>
            </div>
          )}
          {!email && !phone && !whatsapp && (
            <p className="text-sm text-secondary/50 col-span-3 text-center py-4">
              Nenhum contato configurado
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
