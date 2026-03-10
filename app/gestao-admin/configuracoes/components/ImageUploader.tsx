"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, RefreshCw, Link2, ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  variant?: "default" | "compact";
  bucket?: string;
  folder?: string;
  hint?: string;
}

export function ImageUploader({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/gif,image/webp,image/x-icon,image/svg+xml",
  maxSizeMB = 5,
  maxWidth,
  maxHeight,
  variant = "default",
  bucket = "products",
  folder = "settings",
  hint,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCompact = variant === "compact";

  const validateImageDimensions = (file: File): Promise<{ valid: boolean; width: number; height: number }> => {
    return new Promise((resolve) => {
      if (!maxWidth && !maxHeight) {
        resolve({ valid: true, width: 0, height: 0 });
        return;
      }

      const img = document.createElement("img");
      img.onload = () => {
        const valid =
          (!maxWidth || img.width <= maxWidth) &&
          (!maxHeight || img.height <= maxHeight);
        resolve({ valid, width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ valid: true, width: 0, height: 0 });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    const validTypes = accept.split(",");
    if (!validTypes.includes(file.type)) {
      setError(`Tipo inválido`);
      return;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Máximo: ${maxSizeMB}MB`);
      return;
    }

    if (maxWidth || maxHeight) {
      const { valid, width, height } = await validateImageDimensions(file);
      if (!valid) {
        const maxDims = maxWidth && maxHeight ? `${maxWidth}x${maxHeight}px` : maxWidth ? `${maxWidth}px` : `${maxHeight}px`;
        setError(`Máx: ${maxDims}. Atual: ${width}x${height}px`);
        return;
      }
    }

    setIsUploading(true);

    try {
      const extension = file.name.split(".").pop() || "png";
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      onChange(publicUrlData.publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erro no upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClear = () => {
    onChange("");
    setShowUrlInput(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isExternalOrLocalUrl = value && (value.startsWith("http") || value.startsWith("/"));

  // Compact variant for small icons like favicon
  if (isCompact) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-secondary/70">{label}</label>

        <div className="flex items-start gap-4">
          {/* Preview Box - Fixed small size */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !value && inputRef.current?.click()}
            className={cn(
              "relative w-16 h-16 rounded-xl border-2 border-dashed transition-all flex-shrink-0 overflow-hidden",
              "flex items-center justify-center cursor-pointer",
              dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300 bg-gray-50",
              value && "border-solid border-gray-200 bg-white"
            )}
          >
            {isUploading ? (
              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            ) : value && isExternalOrLocalUrl ? (
              <Image
                src={value}
                alt={label}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            ) : (
              <ImageIcon className={cn("w-6 h-6", dragOver ? "text-primary" : "text-gray-300")} />
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-secondary text-xs font-medium rounded-lg transition-colors"
              >
                {value ? "Alterar" : "Carregar"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
                >
                  Remover
                </button>
              )}
            </div>

            <p className="text-xs text-secondary/50">
              {hint || `Máx. ${maxSizeMB}MB`}
            </p>

            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="w-3 h-3" />
                {error}
              </p>
            )}

            {!value && (
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-1 text-xs text-secondary/40 hover:text-secondary transition-colors"
              >
                <Link2 className="w-3 h-3" />
                {showUrlInput ? "Ocultar URL" : "Colar URL"}
              </button>
            )}

            {showUrlInput && !value && (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
              />
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>
    );
  }

  // Default variant for larger images like logo
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary/70">{label}</label>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all overflow-hidden",
          dragOver ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center justify-center p-6 min-h-[140px]">
            <RefreshCw className="w-8 h-8 text-primary animate-spin mb-2" />
            <p className="text-sm text-secondary/60">Enviando...</p>
          </div>
        ) : value ? (
          <div className="p-4">
            <div className="relative rounded-lg overflow-hidden bg-gray-50 h-24 flex items-center justify-center">
              {isExternalOrLocalUrl ? (
                <Image
                  src={value}
                  alt={label}
                  width={200}
                  height={80}
                  className="object-contain max-h-20"
                  unoptimized
                />
              ) : (
                <div className="text-sm text-secondary/50">{value}</div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-secondary text-sm font-medium rounded-lg transition-colors"
              >
                Alterar
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full p-6 min-h-[140px] flex flex-col items-center justify-center"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
              dragOver ? "bg-primary/10" : "bg-gray-100"
            )}>
              <Upload className={cn("w-6 h-6", dragOver ? "text-primary" : "text-gray-400")} />
            </div>
            <p className="text-sm font-medium text-secondary-dark mb-1">
              {dragOver ? "Solte a imagem aqui" : "Clique ou arraste"}
            </p>
            <p className="text-xs text-secondary/50">
              {hint || `Máx. ${maxSizeMB}MB`}
            </p>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {!value && (
        <div>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex items-center gap-1.5 text-xs text-secondary/50 hover:text-secondary transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            {showUrlInput ? "Ocultar campo de URL" : "Ou cole uma URL"}
          </button>
          {showUrlInput && (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="w-full mt-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary/30 focus:bg-white transition-all"
            />
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
