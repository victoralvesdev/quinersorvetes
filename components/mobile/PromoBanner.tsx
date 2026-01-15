"use client";

import { useState } from "react";
import Image from "next/image";

interface PromoBannerProps {
  title: string;
  subtitle: string;
  image: string;
}

const banners: PromoBannerProps[] = [
  {
    title: "NOVIDADE IRRESISTÍVEL",
    subtitle: "Strawberry cheesecake",
    image: "/images/promo/banner-1.jpg",
  },
  {
    title: "SORVETES ARTESANAIS",
    subtitle: "Sabores únicos, feitos com paixão",
    image: "/images/promo/banner-2.jpg",
  },
];

export const PromoBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative mx-4 mb-4 rounded-2xl overflow-hidden">
      <div className="relative w-full" style={{ aspectRatio: '800/339', maxHeight: '339px' }}>
        <Image
          src={currentBanner.image}
          alt={currentBanner.title}
          fill
          className="object-cover rounded-2xl"
          priority
        />
      </div>
      
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

