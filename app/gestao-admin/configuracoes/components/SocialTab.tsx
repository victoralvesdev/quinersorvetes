"use client";

import { Instagram, Facebook, Twitter, Share2 } from "lucide-react";
import { SocialMediaSetting } from "@/types/settings";
import { cn } from "@/lib/utils";

interface SocialTabProps {
  instagram: SocialMediaSetting;
  facebook: SocialMediaSetting;
  twitter: SocialMediaSetting;
  tiktok: SocialMediaSetting;
  onChange: (key: string, value: SocialMediaSetting) => void;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

interface SocialCardProps {
  name: string;
  icon: React.ReactNode;
  settingKey: string;
  value: SocialMediaSetting;
  placeholder: string;
  gradient: string;
  iconBg: string;
  onChange: (key: string, value: SocialMediaSetting) => void;
}

function SocialCard({
  name,
  icon,
  settingKey,
  value,
  placeholder,
  gradient,
  iconBg,
  onChange,
}: SocialCardProps) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 p-5 transition-all", gradient)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", iconBg)}>
            {icon}
          </div>
          <span className="font-semibold text-secondary-dark">{name}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(settingKey, { ...value, enabled: !value.enabled })}
          className={cn(
            "relative w-12 h-7 rounded-full transition-colors duration-200",
            value.enabled ? "bg-emerald-500" : "bg-gray-300"
          )}
        >
          <div
            className={cn(
              "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
              value.enabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary/70">
          URL do Perfil
        </label>
        <input
          type="url"
          value={value.url}
          onChange={(e) => onChange(settingKey, { ...value, url: e.target.value })}
          placeholder={placeholder}
          disabled={!value.enabled}
          className={cn(
            "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm transition-all",
            "focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10",
            !value.enabled && "opacity-50 cursor-not-allowed"
          )}
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          value.enabled && value.url ? "bg-emerald-500" : value.enabled ? "bg-amber-500" : "bg-gray-300"
        )} />
        <span className="text-xs text-secondary/60">
          {value.enabled && value.url
            ? "Configurado e ativo"
            : value.enabled
            ? "Ativo, mas sem URL"
            : "Desativado"}
        </span>
      </div>
    </div>
  );
}

export function SocialTab({
  instagram,
  facebook,
  twitter,
  tiktok,
  onChange,
}: SocialTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-blue-100 rounded-xl">
          <Share2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-secondary-dark">Redes Sociais</h3>
          <p className="text-sm text-secondary/60">
            Configure os links das redes sociais exibidas no rodapé
          </p>
        </div>
      </div>

      {/* Social Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SocialCard
          name="Instagram"
          settingKey="social_instagram"
          value={instagram}
          placeholder="https://instagram.com/quiner"
          gradient="bg-gradient-to-br from-pink-50/80 to-purple-50/50"
          iconBg="bg-gradient-to-br from-pink-500 to-purple-600"
          onChange={onChange}
          icon={<Instagram className="w-5 h-5 text-white" />}
        />

        <SocialCard
          name="Facebook"
          settingKey="social_facebook"
          value={facebook}
          placeholder="https://facebook.com/quiner"
          gradient="bg-gradient-to-br from-blue-50/80 to-indigo-50/50"
          iconBg="bg-blue-600"
          onChange={onChange}
          icon={<Facebook className="w-5 h-5 text-white" />}
        />

        <SocialCard
          name="Twitter / X"
          settingKey="social_twitter"
          value={twitter}
          placeholder="https://x.com/quiner"
          gradient="bg-gradient-to-br from-gray-50/80 to-slate-50/50"
          iconBg="bg-gray-900"
          onChange={onChange}
          icon={<Twitter className="w-5 h-5 text-white" />}
        />

        <SocialCard
          name="TikTok"
          settingKey="social_tiktok"
          value={tiktok}
          placeholder="https://tiktok.com/@quiner"
          gradient="bg-gradient-to-br from-gray-50/80 to-pink-50/50"
          iconBg="bg-black"
          onChange={onChange}
          icon={<TikTokIcon className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Preview */}
      <div className="p-5 bg-gray-900 rounded-2xl">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Pré-visualização no Rodapé
        </p>
        <div className="flex items-center gap-3">
          {instagram.enabled && (
            <div className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <Instagram className="w-5 h-5 text-white" />
            </div>
          )}
          {facebook.enabled && (
            <div className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <Facebook className="w-5 h-5 text-white" />
            </div>
          )}
          {twitter.enabled && (
            <div className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <Twitter className="w-5 h-5 text-white" />
            </div>
          )}
          {tiktok.enabled && (
            <div className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
              <TikTokIcon className="w-5 h-5 text-white" />
            </div>
          )}
          {!instagram.enabled && !facebook.enabled && !twitter.enabled && !tiktok.enabled && (
            <p className="text-sm text-gray-500">Nenhuma rede social ativa</p>
          )}
        </div>
      </div>
    </div>
  );
}
