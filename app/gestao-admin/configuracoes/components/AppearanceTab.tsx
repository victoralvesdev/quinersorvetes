"use client";

import { Palette, ImageIcon, Layout, Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { ImageUploader } from "./ImageUploader";
import { BannerItem } from "@/types/settings";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppearanceTabProps {
  headerColor: string;
  footerColor: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  banners: BannerItem[];
  onChange: (key: string, value: unknown) => void;
}

export function AppearanceTab({
  headerColor,
  footerColor,
  primaryColor,
  secondaryColor,
  logoUrl,
  faviconUrl,
  banners,
  onChange,
}: AppearanceTabProps) {
  const [newBanner, setNewBanner] = useState<Partial<BannerItem>>({
    image_url: "",
    alt_text: "",
    link_url: "",
    is_active: true,
  });
  const [showBannerForm, setShowBannerForm] = useState(false);

  const handleAddBanner = () => {
    if (!newBanner.image_url) return;

    const banner: BannerItem = {
      id: `banner_${Date.now()}`,
      image_url: newBanner.image_url || "",
      alt_text: newBanner.alt_text || "",
      link_url: newBanner.link_url || "",
      display_order: banners.length,
      is_active: newBanner.is_active ?? true,
    };

    onChange("banners", [...banners, banner]);
    setNewBanner({
      image_url: "",
      alt_text: "",
      link_url: "",
      is_active: true,
    });
    setShowBannerForm(false);
  };

  const handleRemoveBanner = (id: string) => {
    onChange("banners", banners.filter((b) => b.id !== id));
  };

  const handleToggleBanner = (id: string) => {
    onChange("banners", banners.map((b) =>
      b.id === id ? { ...b, is_active: !b.is_active } : b
    ));
  };

  const handleMoveBanner = (id: string, direction: "up" | "down") => {
    const index = banners.findIndex((b) => b.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === banners.length - 1)
    ) {
      return;
    }

    const newBanners = [...banners];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newBanners[index], newBanners[newIndex]] = [
      newBanners[newIndex],
      newBanners[index],
    ];

    newBanners.forEach((b, i) => {
      b.display_order = i;
    });

    onChange("banners", newBanners);
  };

  return (
    <div className="space-y-6">
      {/* Colors Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 sm:p-2.5 bg-primary/10 rounded-xl">
            <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-secondary-dark">Paleta de Cores</h3>
            <p className="text-xs sm:text-sm text-secondary/60">Personalize as cores do site</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <ColorPicker
            label="Cor do Header"
            value={headerColor}
            onChange={(value) => onChange("header_color", value)}
          />
          <ColorPicker
            label="Cor do Footer"
            value={footerColor}
            onChange={(value) => onChange("footer_color", value)}
          />
          <ColorPicker
            label="Cor Primária"
            value={primaryColor}
            onChange={(value) => onChange("primary_color", value)}
          />
          <ColorPicker
            label="Cor Secundária"
            value={secondaryColor}
            onChange={(value) => onChange("secondary_color", value)}
          />
        </div>
      </section>

      {/* Logo & Favicon Section */}
      <section className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 sm:p-2.5 bg-blue-100 rounded-xl">
            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-secondary-dark">Logo e Favicon</h3>
            <p className="text-xs sm:text-sm text-secondary/60">Identidade visual da marca</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Logo - Full width */}
          <ImageUploader
            label="Logo Principal"
            value={logoUrl}
            onChange={(value) => onChange("logo_url", value)}
            hint="Recomendado: PNG transparente, máx 5MB"
          />

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Favicon - Compact inline */}
          <ImageUploader
            label="Favicon"
            value={faviconUrl}
            onChange={(value) => onChange("favicon_url", value)}
            variant="compact"
            accept="image/x-icon,image/png,image/svg+xml"
            maxWidth={48}
            maxHeight={48}
            maxSizeMB={1}
            hint="48x48px, 1MB máx (ICO, PNG, SVG)"
          />
        </div>
      </section>

      {/* Banners Section */}
      <section className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-amber-100 rounded-xl">
              <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-secondary-dark">Banners</h3>
              <p className="text-xs sm:text-sm text-secondary/60">
                {banners.length} banner{banners.length !== 1 ? "s" : ""} cadastrado{banners.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowBannerForm(!showBannerForm)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Adicionar</span>
          </button>
        </div>

        {/* Add Banner Form */}
        {showBannerForm && (
          <div className="mb-5 p-4 bg-white rounded-xl border-2 border-amber-200 space-y-4">
            <h4 className="font-semibold text-secondary-dark text-sm">Novo Banner</h4>
            <div className="space-y-4">
              <ImageUploader
                label="Imagem do Banner"
                value={newBanner.image_url || ""}
                onChange={(value) => setNewBanner({ ...newBanner, image_url: value })}
                hint="Recomendado: 1200x400px"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Texto Alternativo
                  </label>
                  <input
                    type="text"
                    value={newBanner.alt_text || ""}
                    onChange={(e) => setNewBanner({ ...newBanner, alt_text: e.target.value })}
                    placeholder="Descrição do banner"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Link (opcional)
                  </label>
                  <input
                    type="url"
                    value={newBanner.link_url || ""}
                    onChange={(e) => setNewBanner({ ...newBanner, link_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:outline-none focus:border-primary/30 focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBannerForm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddBanner}
                  disabled={!newBanner.image_url}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner List */}
        {banners.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <Layout className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-secondary/70 font-medium text-sm">Nenhum banner cadastrado</p>
            <p className="text-xs text-secondary/50 mt-1">Clique em Adicionar para criar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {banners
              .sort((a, b) => a.display_order - b.display_order)
              .map((banner, index) => (
                <div
                  key={banner.id}
                  className={cn(
                    "flex items-center gap-2 sm:gap-4 p-3 bg-white rounded-xl border-2 transition-all",
                    banner.is_active
                      ? "border-gray-100 hover:border-gray-200"
                      : "border-gray-100 opacity-60"
                  )}
                >
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveBanner(banner.id, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-secondary/60" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBanner(banner.id, "down")}
                      disabled={index === banners.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-secondary/60" />
                    </button>
                  </div>

                  {/* Thumbnail */}
                  <div className="h-12 w-20 sm:h-14 sm:w-24 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.image_url}
                      alt={banner.alt_text}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-secondary-dark truncate">
                      {banner.alt_text || "Sem descrição"}
                    </p>
                    {banner.link_url && (
                      <p className="text-xs text-secondary/50 truncate mt-0.5 hidden sm:block">
                        {banner.link_url}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleBanner(banner.id)}
                      className={cn(
                        "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        banner.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {banner.is_active ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ativo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Inativo</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBanner(banner.id)}
                      className="p-1.5 sm:p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
