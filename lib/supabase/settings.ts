import { supabase } from "./client";
import {
  PublicSettings,
  AllSettings,
  SettingRecord,
  SettingUpdate,
  DEFAULT_PUBLIC_SETTINGS,
  DEFAULT_ALL_SETTINGS,
} from "@/types/settings";

/**
 * Parse setting records into a typed settings object
 */
function parseSettings<T extends Partial<AllSettings>>(
  records: SettingRecord[],
  defaults: T
): T {
  const settings = { ...defaults };

  for (const record of records) {
    if (record.key in settings) {
      (settings as Record<string, unknown>)[record.key] = record.value;
    }
  }

  return settings;
}

/**
 * Get all public settings (for Header/Footer)
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("is_public", true);

  if (error) {
    console.error("Error fetching public settings:", error);
    return DEFAULT_PUBLIC_SETTINGS;
  }

  return parseSettings(data as SettingRecord[], DEFAULT_PUBLIC_SETTINGS);
}

/**
 * Get all settings including private ones (for admin)
 */
export async function getAllSettings(): Promise<AllSettings> {
  const { data, error } = await supabase.from("settings").select("*");

  if (error) {
    console.error("Error fetching all settings:", error);
    return DEFAULT_ALL_SETTINGS;
  }

  return parseSettings(data as SettingRecord[], DEFAULT_ALL_SETTINGS);
}

/**
 * Get a single setting by key
 */
export async function getSetting<T>(key: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .single();

  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }

  return data?.value as T;
}

/**
 * Update a single setting
 */
export async function updateSetting(
  key: string,
  value: unknown
): Promise<boolean> {
  const { error } = await supabase
    .from("settings")
    .update({ value })
    .eq("key", key);

  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    return false;
  }

  return true;
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(
  updates: SettingUpdate[]
): Promise<boolean> {
  // Use upsert for each setting
  const promises = updates.map(({ key, value }) =>
    supabase.from("settings").update({ value }).eq("key", key)
  );

  const results = await Promise.all(promises);

  const hasError = results.some((result) => result.error);

  if (hasError) {
    console.error(
      "Error updating settings:",
      results.filter((r) => r.error).map((r) => r.error)
    );
    return false;
  }

  return true;
}

/**
 * Upsert a single setting (insert if not exists, update if exists)
 */
export async function upsertSetting(
  key: string,
  value: unknown,
  category: "appearance" | "social" | "contact" | "footer" | "integrations" = "appearance",
  isPublic = true
): Promise<boolean> {
  const { error } = await supabase.from("settings").upsert(
    { key, value, category, is_public: isPublic },
    { onConflict: "key" }
  );

  if (error) {
    console.error(`Error upserting setting ${key}:`, error);
    return false;
  }

  return true;
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(
  category: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("category", category);

  if (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return {};
  }

  const settings: Record<string, unknown> = {};
  for (const record of data as SettingRecord[]) {
    settings[record.key] = record.value;
  }

  return settings;
}
