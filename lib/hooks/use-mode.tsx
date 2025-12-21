"use client";

import React, { createContext, useContext, useState } from "react";

export type UserMode = "admin" | "user1" | "user2";

interface ModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  getWalletAddress: () => string;
  getUserId: () => string;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

// Mock wallet addresses for simulation
const WALLET_ADDRESSES = {
  admin: "AdminWallet1111111111111111111111111111111",
  user1: "User1Wallet1111111111111111111111111111111",
  user2: "User2Wallet1111111111111111111111111111111",
};

const USER_IDS = {
  admin: "admin-001",
  user1: "user-001",
  user2: "user-002",
};

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UserMode>("admin");

  const getWalletAddress = () => {
    return WALLET_ADDRESSES[mode];
  };

  const getUserId = () => {
    return USER_IDS[mode];
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        getWalletAddress,
        getUserId,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider");
  }
  return context;
}
