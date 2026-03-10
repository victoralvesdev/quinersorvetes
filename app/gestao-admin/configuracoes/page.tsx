"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Palette,
  Share2,
  Phone,
  FileText,
  Plug,
  RefreshCw,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useSettings } from "@/contexts/SettingsContext";
import { getAllSettings, updateSettings } from "@/lib/supabase/settings";
import {
  AllSettings,
  DEFAULT_ALL_SETTINGS,
  SettingUpdate,
  SocialMediaSetting,
} from "@/types/settings";
import { AppearanceTab } from "./components/AppearanceTab";
import { SocialTab } from "./components/SocialTab";
import { ContactTab } from "./components/ContactTab";
import { FooterTab } from "./components/FooterTab";
import { IntegrationsTab } from "./components/IntegrationsTab";

type TabId = "appearance" | "social" | "contact" | "footer" | "integrations";

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TABS: Tab[] = [
  {
    id: "appearance",
    label: "Aparência",
    shortLabel: "Aparência",
    icon: Palette,
    color: "primary",
  },
  {
    id: "social",
    label: "Redes Sociais",
    shortLabel: "Social",
    icon: Share2,
    color: "blue",
  },
  {
    id: "contact",
    label: "Contato",
    shortLabel: "Contato",
    icon: Phone,
    color: "emerald",
  },
  {
    id: "footer",
    label: "Rodapé",
    shortLabel: "Rodapé",
    icon: FileText,
    color: "amber",
  },
  {
    id: "integrations",
    label: "Integrações",
    shortLabel: "APIs",
    icon: Plug,
    color: "violet",
  },
];

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
        <div className="h-6 w-40 bg-gray-200 rounded-lg mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_ALL_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    useState<AllSettings>(DEFAULT_ALL_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { showToast } = useToast();
  const { refreshSettings: refreshPublicSettings } = useSettings();

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSettings = await getAllSettings();
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
      setHasChanges(false);
    } catch (error) {
      console.error("Error loading settings:", error);
      showToast("Erro ao carregar configurações", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const changed =
      JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const handleChange = (key: string, value: unknown) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSocialChange = (key: string, value: SocialMediaSetting) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates: SettingUpdate[] = [];

      for (const key of Object.keys(settings) as (keyof AllSettings)[]) {
        if (
          JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key])
        ) {
          updates.push({
            key,
            value: settings[key],
          });
        }
      }

      if (updates.length === 0) {
        showToast("Nenhuma alteração para salvar", "info");
        setIsSaving(false);
        return;
      }

      const success = await updateSettings(updates);

      if (success) {
        setOriginalSettings(settings);
        setHasChanges(false);
        showToast("Configurações salvas com sucesso!", "success");
        await refreshPublicSettings();
      } else {
        showToast("Erro ao salvar configurações", "error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Erro ao salvar configurações", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSettings();
    setIsRefreshing(false);
    showToast("Configurações atualizadas", "info");
  };

  const handleDiscard = () => {
    setSettings(originalSettings);
    setHasChanges(false);
    showToast("Alterações descartadas", "info");
  };

  const getTabColorClasses = (tab: Tab, isActive: boolean) => {
    const colors: Record<string, { active: string; inactive: string }> = {
      primary: {
        active: "bg-primary text-white border-primary shadow-sm shadow-primary/20",
        inactive: "bg-primary/5 text-primary border-primary/20 hover:border-primary/40",
      },
      blue: {
        active: "bg-blue-500 text-white border-blue-500 shadow-sm shadow-blue-500/20",
        inactive: "bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400",
      },
      emerald: {
        active: "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20",
        inactive: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:border-emerald-400",
      },
      amber: {
        active: "bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/20",
        inactive: "bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400",
      },
      violet: {
        active: "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/20",
        inactive: "bg-violet-50 text-violet-600 border-violet-200 hover:border-violet-400",
      },
    };
    return isActive ? colors[tab.color].active : colors[tab.color].inactive;
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Sistema</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-secondary-dark">
            Configurações
          </h1>
          <p className="text-secondary/60 mt-1">
            Personalize a aparência e o comportamento do site
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleDiscard}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-secondary/70 hover:text-secondary border border-gray-200 hover:border-gray-300 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Descartar</span>
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="p-3 bg-white hover:bg-gray-50 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5 text-secondary", (isLoading || isRefreshing) && "animate-spin")} />
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium text-sm transition-all duration-200 shadow-sm shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasChanges && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Você tem alterações não salvas. Clique em <strong>Salvar</strong> para aplicar.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                    getTabColorClasses(tab, isActive)
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 lg:p-6">
          {isLoading ? (
            <SettingsSkeleton />
          ) : (
            <>
              {activeTab === "appearance" && (
                <AppearanceTab
                  headerColor={settings.header_color}
                  footerColor={settings.footer_color}
                  primaryColor={settings.primary_color}
                  secondaryColor={settings.secondary_color}
                  logoUrl={settings.logo_url}
                  faviconUrl={settings.favicon_url}
                  banners={settings.banners}
                  onChange={handleChange}
                />
              )}

              {activeTab === "social" && (
                <SocialTab
                  instagram={settings.social_instagram}
                  facebook={settings.social_facebook}
                  twitter={settings.social_twitter}
                  tiktok={settings.social_tiktok}
                  onChange={handleSocialChange}
                />
              )}

              {activeTab === "contact" && (
                <ContactTab
                  email={settings.contact_email}
                  phone={settings.contact_phone}
                  whatsapp={settings.contact_whatsapp}
                  onChange={handleChange}
                />
              )}

              {activeTab === "footer" && (
                <FooterTab
                  storeName={settings.store_name}
                  slogan={settings.footer_slogan}
                  sloganSecondary={settings.footer_slogan_secondary}
                  links={settings.footer_links}
                  onChange={handleChange}
                />
              )}

              {activeTab === "integrations" && (
                <IntegrationsTab
                  mercadopagoToken={settings.mercadopago_access_token}
                  onChange={handleChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
