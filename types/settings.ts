// Settings Types

export interface SocialMediaSetting {
  enabled: boolean;
  url: string;
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

// Default public settings (fallback values)
export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
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
