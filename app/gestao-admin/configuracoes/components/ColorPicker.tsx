"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  presetColors?: string[];
}

const DEFAULT_PRESET_COLORS = [
  "#a36e6c", // primary (warm brown/rose)
  "#5d7184", // secondary (slate blue)
  "#FAF9F4", // cream/beige
  "#FF6B35", // accent orange
  "#FFB6C1", // accent pink
  "#FFFFFF", // white
  "#000000", // black
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
];

export function ColorPicker({
  label,
  value,
  onChange,
  presetColors = DEFAULT_PRESET_COLORS,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorSelect = (color: string) => {
    setInputValue(color);
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="block text-sm font-medium text-secondary/70">{label}</label>
      <div className="relative">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-12 w-12 rounded-xl border-2 border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:border-gray-300"
            style={{ backgroundColor: value }}
            aria-label={`Selecionar cor para ${label}`}
          />
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="#000000"
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all"
            maxLength={7}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorSelect(e.target.value)}
            className="h-12 w-12 cursor-pointer rounded-xl border border-gray-200 bg-white p-1"
            title="Escolher cor personalizada"
          />
        </div>

        {isOpen && (
          <div className="absolute z-20 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100">
            <p className="text-xs text-secondary/50 mb-3 font-medium">Cores predefinidas</p>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={cn(
                    "h-8 w-8 rounded-lg border-2 transition-all hover:scale-110",
                    value === color
                      ? "border-primary ring-2 ring-primary ring-offset-1"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
