"use client";

import Image from "next/image";
import { MessageCircle, IceCream } from "lucide-react";

const WHATSAPP_NUMBER = "5511912680275";
const WHATSAPP_MESSAGE = "Olá! Gostaria de fazer um pedido.";

export default function Home() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo / ícone */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent-pink/30 flex items-center justify-center shadow-lg">
          <IceCream className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-secondary tracking-tight">Quiner Sorveteria</h1>
      </div>

      {/* Card de aviso */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-5 border border-primary/10">
        {/* Ícone de manutenção */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl shadow-sm">
          🔧
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-secondary">Site em manutenção</h2>
          <p className="text-secondary/70 text-sm leading-relaxed">
            Estamos melhorando nosso site para te atender ainda melhor!
            Por enquanto, faça seu pedido diretamente pelo WhatsApp.
          </p>
        </div>

        {/* Botão WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fbc5a] active:bg-[#1aad52] text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <MessageCircle className="w-5 h-5 flex-shrink-0" />
          <span>Pedir pelo WhatsApp</span>
        </a>

        <p className="text-xs text-secondary/40">(11) 91268-0275</p>
      </div>

      <p className="mt-8 text-xs text-secondary/30">Voltamos em breve!</p>
    </div>
  );
}
