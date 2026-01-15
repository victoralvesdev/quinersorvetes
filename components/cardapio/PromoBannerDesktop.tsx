"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface PromoBannerDesktopProps {
  title: string;
  subtitle: string;
  image: string;
}

const banners: PromoBannerDesktopProps[] = [
  {
    title: "MILKSHAKES QUINER",
    subtitle: "A combinação perfeita de sabor e cremosidade que você merece.",
    image: "/images/promo/banner-1-desktop.jpg",
  },
  {
    title: "SABORES DE VERÃO",
    subtitle: "Refresque seus dias com nossas delícias geladas.",
    image: "/images/promo/banner-2-desktop.jpg",
  },
];

export const PromoBannerDesktop = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto-play: muda o banner a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, []);

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full mb-6 rounded-2xl overflow-hidden bg-beige">
      <div className="relative w-full" style={{ aspectRatio: '1480/450', maxHeight: '450px' }}>
        <Image
          src={currentBanner.image}
          alt={currentBanner.title}
          fill
          className="object-contain rounded-2xl"
          priority
          sizes="(max-width: 1480px) 100vw, 1480px"
        />
      </div>
      
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-8" : "bg-white/50 w-2"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

