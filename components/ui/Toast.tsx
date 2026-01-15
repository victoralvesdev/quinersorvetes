"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X, Info } from "lucide-react";
import { createContext, useContext } from "react";

type ToastType = "success" | "error" | "info";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-green-50 border border-green-200",
      icon: <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />,
      text: "text-green-800",
      button: "text-green-600",
    },
    error: {
      bg: "bg-red-50 border border-red-200",
      icon: <X className="w-5 h-5 text-red-600 flex-shrink-0" />,
      text: "text-red-800",
      button: "text-red-600",
    },
    info: {
      bg: "bg-blue-50 border border-blue-200",
      icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      text: "text-blue-800",
      button: "text-blue-600",
    },
  };

  const style = styles[type];

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] animate-in slide-in-from-top-5">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg min-w-[300px] max-w-[90vw] ${style.bg}`}>
        {style.icon}
        <p className={`flex-1 text-sm font-medium ${style.text}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.button} hover:opacity-70`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

