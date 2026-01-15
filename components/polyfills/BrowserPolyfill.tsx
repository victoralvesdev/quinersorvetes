"use client";

import { useEffect } from "react";

export const BrowserPolyfill = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof (window as any).browser === "undefined") {
      (window as any).browser = {};
    }
    if (typeof globalThis !== "undefined" && typeof (globalThis as any).browser === "undefined") {
      (globalThis as any).browser = {};
    }
  }, []);
  return null;
};

