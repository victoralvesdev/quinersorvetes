"use client";

import { FileText, Store, MessageSquare, Link2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { FooterLink } from "@/types/settings";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FooterTabProps {
  storeName: string;
  slogan: string;
  sloganSecondary: string;
  links: FooterLink[];
  onChange: (key: string, value: unknown) => void;
}

export function FooterTab({
  storeName,
  slogan,
  sloganSecondary,
  links,
  onChange,
}: FooterTabProps) {
  const [newLink, setNewLink] = useState<FooterLink>({ label: "", url: "" });
  const [showLinkForm, setShowLinkForm] = useState(false);

  const handleAddLink = () => {
    if (!newLink.label || !newLink.url) return;

    onChange("footer_links", [...links, newLink]);
    setNewLink({ label: "", url: "" });
    setShowLinkForm(false);
  };

  const handleRemoveLink = (index: number) => {
    onChange(
      "footer_links",
      links.filter((_, i) => i !== index)
    );
  };

  const handleUpdateLink = (
    index: number,
    field: keyof FooterLink,
    value: string
  ) => {
    const updatedLinks = links.map((link, i) =>
      i === index ? { ...link, [field]: value } : link
    );
    onChange("footer_links", updatedLinks);
  };

  const handleMoveLink = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === links.length - 1)
    ) {
      return;
    }

    const newLinks = [...links];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    onChange("footer_links", newLinks);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 bg-amber-100 rounded-xl">
          <FileText className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-secondary-dark">Configurações do Rodapé</h3>
          <p className="text-sm text-secondary/60">
            Personalize as informações exibidas no rodapé
          </p>
        </div>
      </div>

      {/* Store Info Section */}
      <section className="bg-gradient-to-br from-amber-50/50 to-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h4 className="font-semibold text-secondary-dark">Informações da Loja</h4>
            <p className="text-xs text-secondary/60">Nome e slogans</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary/70 mb-1.5">
              Nome da Loja
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => onChange("store_name", e.target.value)}
              placeholder="Quiner Sorvetes"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <p className="text-xs text-secondary/50 mt-1">Aparece no copyright</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary/70 mb-1.5">
                Slogan Principal
              </label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => onChange("footer_slogan", e.target.value)}
                placeholder="Sabores que apaixonam."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary/70 mb-1.5">
                Slogan Secundário
              </label>
              <input
                type="text"
                value={sloganSecondary}
                onChange={(e) => onChange("footer_slogan_secondary", e.target.value)}
                placeholder="Feito com carinho para você."
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Links Section */}
      <section className="bg-gradient-to-br from-blue-50/50 to-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Link2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-secondary-dark">Links do Rodapé</h4>
              <p className="text-xs text-secondary/60">{links.length} links configurados</p>
            </div>
          </div>
          <button
            onClick={() => setShowLinkForm(!showLinkForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        {/* Add Link Form */}
        {showLinkForm && (
          <div className="mb-5 p-4 bg-white rounded-xl border-2 border-blue-200 space-y-4">
            <h5 className="font-medium text-secondary-dark">Novo Link</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-secondary/60 mb-1">Texto</label>
                <input
                  type="text"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="Ex: Sobre Nós"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary/60 mb-1">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLinkForm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddLink}
                disabled={!newLink.label || !newLink.url}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>
        )}

        {/* Links List */}
        {links.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-secondary/70 font-medium">Nenhum link cadastrado</p>
            <p className="text-sm text-secondary/50 mt-1">Adicione links para o rodapé</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleMoveLink(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-secondary/60" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveLink(index, "down")}
                    disabled={index === links.length - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-secondary/60" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => handleUpdateLink(index, "label", e.target.value)}
                    placeholder="Texto do link"
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => handleUpdateLink(index, "url", e.target.value)}
                    placeholder="https://..."
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Preview */}
      <section className="bg-gray-900 rounded-2xl p-6 overflow-hidden">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
          Pré-visualização do Rodapé
        </p>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white">{storeName || "Nome da Loja"}</h3>
            <p className="text-gray-400 text-sm mt-1">{slogan || "Slogan principal"}</p>
            <p className="text-gray-500 text-xs mt-0.5">{sloganSecondary || "Slogan secundário"}</p>
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-800">
              {links.map((link, index) => (
                <span
                  key={index}
                  className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
                >
                  {link.label}
                </span>
              ))}
            </div>
          )}
          <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-800">
            &copy; {new Date().getFullYear()} {storeName || "Nome da Loja"}. Todos os direitos reservados.
          </div>
        </div>
      </section>
    </div>
  );
}
