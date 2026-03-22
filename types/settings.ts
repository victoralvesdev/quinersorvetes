// Settings Types

export interface SocialMediaSetting {
  enabled: boolean;
  url: string;
}

export interface DaySchedule {
  enabled: boolean;
  open: string;  // "HH:MM"
  close: string; // "HH:MM"
}

export interface StoreHours {
  auto: boolean; // Whether auto open/close is active
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface BannerItem {
  id: string;
  image_url: string;
  alt_text: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
}

export interface SettingRecord {
  id: string;
  key: string;
  value: unknown;
  category: "appearance" | "social" | "contact" | "footer" | "integrations";
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Public settings (accessible by all users)
export interface PublicSettings {
  // Store
  store_online: boolean;
  store_hours: StoreHours;

  // Appearance
  header_color: string;
  footer_color: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
  banners: BannerItem[];

  // Social Media
  social_instagram: SocialMediaSetting;
  social_facebook: SocialMediaSetting;
  social_twitter: SocialMediaSetting;
  social_tiktok: SocialMediaSetting;

  // Contact
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;

  // Footer
  store_name: string;
  footer_slogan: string;
  footer_slogan_secondary: string;
  footer_links: FooterLink[];

  // Loyalty Points
  points_enabled: boolean;
  points_ratio: number;          // ex: 10 = a cada R$10 ganha 1 ponto
  points_redemption_cost: number; // ex: 50 = 50 pontos para resgatar sorvete grátis
  points_redemption_description: string; // ex: "1 sorvete grátis"
}

// Private settings (admin only)
export interface PrivateSettings {
  mercadopago_access_token: string;
}

// All settings combined
export interface AllSettings extends PublicSettings, PrivateSettings {}

// Settings update payload
export interface SettingUpdate {
  key: string;
  value: unknown;
}

const DEFAULT_DAY_SCHEDULE: DaySchedule = { enabled: true, open: "08:00", close: "22:00" };

// Default public settings (fallback values)
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  store_online: true,
  store_hours: {
    auto: false,
    monday: { ...DEFAULT_DAY_SCHEDULE },
    tuesday: { ...DEFAULT_DAY_SCHEDULE },
    wednesday: { ...DEFAULT_DAY_SCHEDULE },
    thursday: { ...DEFAULT_DAY_SCHEDULE },
    friday: { ...DEFAULT_DAY_SCHEDULE },
    saturday: { ...DEFAULT_DAY_SCHEDULE },
    sunday: { enabled: false, open: "08:00", close: "22:00" },
  },
  header_color: "#a36e6c",
  footer_color: "#FAF9F4",
  primary_color: "#a36e6c",
  secondary_color: "#5d7184",
  logo_url: "/images/logotipo.png",
  favicon_url: "/favicon.ico",
  banners: [],
  social_instagram: { enabled: true, url: "" },
  social_facebook: { enabled: true, url: "" },
  social_twitter: { enabled: true, url: "" },
  social_tiktok: { enabled: false, url: "" },
  contact_email: "naoresponda@quiner.com.br",
  contact_phone: "(11) 1234-5678",
  contact_whatsapp: "",
  store_name: "Quiner Sorvetes",
  footer_slogan: "Sabores que apaixonam.",
  footer_slogan_secondary: "Feito com carinho para você.",
  footer_links: [
    { label: "Sobre Nós", url: "#" },
    { label: "Contato", url: "#" },
    { label: "Política de Privacidade", url: "#" },
  ],
  points_enabled: false,
  points_ratio: 10,
  points_redemption_cost: 50,
  points_redemption_description: "1 sorvete grátis",
};

// Default private settings
export const DEFAULT_PRIVATE_SETTINGS: PrivateSettings = {
  mercadopago_access_token: "",
};

// All default settings
export const DEFAULT_ALL_SETTINGS: AllSettings = {
  ...DEFAULT_PUBLIC_SETTINGS,
  ...DEFAULT_PRIVATE_SETTINGS,
};
