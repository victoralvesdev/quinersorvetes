"use client";

import Image from "next/image";
import { Instagram, Facebook, Twitter, Sparkles } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="mt-auto" style={{ backgroundColor: '#FAF9F4' }}>
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="rounded-2xl border border-gray-300 p-6 md:p-8" style={{ backgroundColor: '#FAF9F4' }}>
          {/* Conteúdo Principal - 3 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* Coluna Esquerda - Logo e Slogan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logotipo.png"
                  alt="Quiner Logo"
                  width={120}
                  height={48}
                  style={{ width: "auto", height: "48px" }}
                  className="object-contain"
                  priority
                  unoptimized
                />
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#5d7184' }}>
                Sabores que apaixonam.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: '#5d7184' }}>
                Feito com carinho para você.
              </p>
            </div>

            {/* Coluna Meio - Links Úteis */}
            <div>
              <h3 className="text-base font-semibold mb-4" style={{ color: '#5d7184' }}>
                Links Úteis
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#5d7184' }}>
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#5d7184' }}>
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:opacity-70 transition-opacity" style={{ color: '#5d7184' }}>
                    Política de Privacidade
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna Direita - Siga-nos & Contato */}
            <div>
              <h3 className="text-base font-semibold mb-4" style={{ color: '#5d7184' }}>
                Siga-nos & Contato
              </h3>
              {/* Redes Sociais */}
              <div className="flex gap-3 mb-4">
                <a
                  href="#"
                  className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                  aria-label="Instagram"
                  style={{ color: '#a36e6c' }}
                >
                  <Instagram className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                  aria-label="Facebook"
                  style={{ color: '#a36e6c' }}
                >
                  <Facebook className="w-6 h-6" />
                </a>
                <a
                  href="#"
                  className="w-8 h-8 flex items-center justify-center transition-opacity hover:opacity-70"
                  aria-label="Twitter"
                  style={{ color: '#a36e6c' }}
                >
                  <Twitter className="w-6 h-6" />
                </a>
              </div>
              {/* Contato */}
              <div className="space-y-1 text-sm" style={{ color: '#5d7184' }}>
                <p>Email: <a href="mailto:naoresponda@quiner.com.br" className="hover:opacity-70 transition-opacity">naoresponda@quiner.com.br</a></p>
                <p>Tel: <a href="tel:+551112345678" className="hover:opacity-70 transition-opacity">(11) 1234-5678</a></p>
              </div>
            </div>
          </div>

          {/* Linha Divisória e Copyright */}
          <div className="border-t border-gray-300 pt-6 mt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-center md:text-left" style={{ color: '#5d7184' }}>
                © 2024 Quiner Sorvetes. Todos os direitos reservados.
              </p>

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

