"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface LoginDialogContextType {
  isLoginDialogOpen: boolean;
  openLoginDialog: () => void;
  closeLoginDialog: () => void;
}

const LoginDialogContext = createContext<LoginDialogContextType | undefined>(undefined);

export function useLoginDialog() {
  const context = useContext(LoginDialogContext);
  if (context === undefined) {
    throw new Error('useLoginDialog must be used within a LoginDialogProvider');
  }
  return context;
}

export function LoginDialogProvider({ children }: { children: ReactNode }) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  const openLoginDialog = () => setIsLoginDialogOpen(true);
  const closeLoginDialog = () => setIsLoginDialogOpen(false);

  return (
    <LoginDialogContext.Provider value={{ isLoginDialogOpen, openLoginDialog, closeLoginDialog }}>
      {children}
    </LoginDialogContext.Provider>
  );
}
