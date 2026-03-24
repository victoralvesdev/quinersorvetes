"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { PublicSettings, DEFAULT_PUBLIC_SETTINGS } from "@/types/settings";

const SETTINGS_STORAGE_KEY = "quiner_settings_cache";

interface SettingsContextType {
  settings: PublicSettings;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}

// Get cached settings from localStorage
function getCachedSettings(): PublicSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PUBLIC_SETTINGS;
  }
  try {
    const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_PUBLIC_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error("Failed to parse cached settings:", err);
  }
  return DEFAULT_PUBLIC_SETTINGS;
}

// Save settings to localStorage
function cacheSettings(settings: PublicSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to cache settings:", err);
  }
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_PUBLIC_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    const cached = getCachedSettings();
    setSettings(cached);
    setIsHydrated(true);
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/settings/public', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const fetchedSettings: PublicSettings = await res.json();
      setSettings(fetchedSettings);
      cacheSettings(fetchedSettings); // Cache for next page load
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Falha ao carregar configurações");
      // Keep using cached/default settings on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  // Load from server after hydration
  useEffect(() => {
    if (isHydrated) {
      loadSettings();
    }
  }, [isHydrated, loadSettings]);

  // Update favicon dynamically when settings change
  useEffect(() => {
    if (typeof window !== "undefined" && settings.favicon_url) {
      const existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (existingFavicon) {
        existingFavicon.href = settings.favicon_url;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = settings.favicon_url;
        document.head.appendChild(link);
      }
    }
  }, [settings.favicon_url]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        error,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }

  return context;
}
