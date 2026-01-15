"use client";

import Image from "next/image";
import { Heart, MapPin, Phone, Mail, Instagram, Facebook, Clock } from "lucide-react";
import Link from "next/link";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Conteúdo Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo e Descrição */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image
                src="/images/logotipo.png"
                alt="Quiner Logo"
                width={120}
                height={48}
                style={{ width: "auto", height: "40px" }}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Sorvetes artesanais feitos com amor e ingredientes selecionados. 
              Refresque seus dias com nossas delícias geladas.
            </p>
            {/* Redes Sociais */}
            <div className="flex gap-3 pt-2">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/cardapio" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Cardápio
                </Link>
              </li>
              <li>
                <Link href="/pedidos" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Meus Pedidos
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Sobre Nós
                </a>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary-pink flex-shrink-0 mt-0.5" />
                <span className="text-gray-300 text-sm">
                  Rua Exemplo, 123<br />
                  Bairro Centro<br />
                  Cidade - Estado, CEP 12345-678
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-pink flex-shrink-0" />
                <a href="tel:+5511999999999" className="text-gray-300 hover:text-white transition-colors text-sm">
                  (11) 99999-9999
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary-pink flex-shrink-0" />
                <a href="mailto:contato@quiner.com.br" className="text-gray-300 hover:text-white transition-colors text-sm">
                  contato@quiner.com.br
                </a>
              </li>
            </ul>
          </div>

          {/* Horário de Funcionamento */}
          <div>
            <h3 className="text-lg font-bold mb-4">Horário de Funcionamento</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-pink flex-shrink-0 mt-0.5" />
                <div className="text-gray-300 text-sm">
                  <p className="font-medium">Segunda a Sexta</p>
                  <p>09:00 - 22:00</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary-pink flex-shrink-0 mt-0.5" />
                <div className="text-gray-300 text-sm">
                  <p className="font-medium">Sábado e Domingo</p>
                  <p>10:00 - 23:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha Divisória */}
        <div className="border-t border-white/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-300 text-sm text-center md:text-left">
              &copy; {currentYear} QuinerApp. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-1 text-gray-300 text-sm">
              <span>Feito com</span>
              <Heart className="w-4 h-4 text-primary-pink fill-current" />
              <span>para você</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

