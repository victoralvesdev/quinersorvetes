"use client";

import Image from "next/image";
import { Instagram, Facebook, Twitter } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

// TikTok icon component since lucide doesn't have it
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export const Footer = () => {
  const { settings } = useSettings();

  return (
    <footer
      className="mt-auto"
      style={{ backgroundColor: settings.footer_color }}
    >
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div
          className="rounded-2xl border border-gray-300 p-6 md:p-8"
          style={{ backgroundColor: settings.footer_color }}
        >
          {/* Conteúdo Principal - 3 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Coluna Esquerda - Logo e Slogan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image
                  key={settings.logo_url}
                  src={settings.logo_url}
                  alt={settings.store_name}
                  width={120}
                  height={48}
                  style={{ width: "auto", height: "48px" }}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: settings.secondary_color }}
              >
                {settings.footer_slogan}
              </p>
              <p
                className="text-sm leading-relaxed"
                style={{ color: settings.secondary_color }}
              >
                {settings.footer_slogan_secondary}
              </p>
            </div>

            {/* Coluna Meio - Links Úteis */}
            <div>
              <h3
                className="text-base font-semibold mb-4"
                style={{ color: settings.secondary_color }}
              >
                Links Úteis
              </h3>
              <ul className="space-y-2">
                {settings.footer_links.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.url}
                      className="text-sm hover:opacity-70 transition-opacity"
                      style={{ color: settings.secondary_color }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coluna Direita - Siga-nos & Contato */}
            <div>
              <h3
                className="text-base font-semibold mb-4"
                style={{ color: settings.secondary_color }}
              >
                Siga-nos & Contato
              </h3>
              {/* Redes Sociais */}
              <div className="flex gap-3 mb-4">
                {settings.social_instagram.enabled &&
                  settings.social_instagram.url && (
                    <a
                      href={settings.social_instagram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                      aria-label="Instagram"
                      style={{ color: settings.primary_color }}
                    >
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                {settings.social_facebook.enabled &&
                  settings.social_facebook.url && (
                    <a
                      href={settings.social_facebook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                      aria-label="Facebook"
                      style={{ color: settings.primary_color }}
                    >
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                {settings.social_twitter.enabled &&
                  settings.social_twitter.url && (
                    <a
                      href={settings.social_twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                      aria-label="Twitter"
                      style={{ color: settings.primary_color }}
                    >
                      <Twitter className="w-6 h-6" />
                    </a>
                  )}
                {settings.social_tiktok.enabled &&
                  settings.social_tiktok.url && (
                    <a
                      href={settings.social_tiktok.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                      aria-label="TikTok"
                      style={{ color: settings.primary_color }}
                    >
                      <TikTokIcon className="w-6 h-6" />
                    </a>
                  )}
              </div>
              {/* Contato */}
              <div
                className="space-y-1 text-sm"
                style={{ color: settings.secondary_color }}
              >
                {settings.contact_email && (
                  <p>
                    Email:{" "}
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {settings.contact_email}
                    </a>
                  </p>
                )}
                {settings.contact_phone && (
                  <p>
                    Tel:{" "}
                    <a
                      href={`tel:${settings.contact_phone.replace(/\D/g, "")}`}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {settings.contact_phone}
                    </a>
                  </p>
                )}
                {settings.contact_whatsapp && (
                  <p>
                    WhatsApp:{" "}
                    <a
                      href={`https://wa.me/55${settings.contact_whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-70 transition-opacity"
                    >
                      {settings.contact_whatsapp}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Linha Divisória e Copyright */}
          <div className="border-t border-gray-300 pt-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p
                className="text-sm text-center md:text-left"
                style={{ color: settings.secondary_color }}
              >
                © {new Date().getFullYear()} {settings.store_name}. Todos os
                direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
