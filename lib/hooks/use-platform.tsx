"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PlatformContextType {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  isConfigured: boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    // Load API key from localStorage on mount
    const stored = localStorage.getItem("platform_api_key");
    if (stored) {
      setApiKeyState(stored);
    }
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    localStorage.setItem("platform_api_key", key);
  };

  const clearApiKey = () => {
    setApiKeyState(null);
    localStorage.removeItem("platform_api_key");
  };

  return (
    <PlatformContext.Provider
      value={{
        apiKey,
        setApiKey,
        clearApiKey,
        isConfigured: !!apiKey,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
}
