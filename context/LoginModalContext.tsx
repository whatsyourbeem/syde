"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { LoginForm } from "@/components/login-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Import shadcn Dialog components
import { useRouter } from "next/navigation";

interface LoginModalContextType {
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(
  undefined
);

interface LoginModalProviderProps {
  children: ReactNode;
}

export function LoginModalProvider({ children }: LoginModalProviderProps) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const router = useRouter();

  const openLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const handleSignUpClick = useCallback(() => {
    closeLoginModal(); // Close the modal
    router.push("/auth/sign-up"); // Navigate to sign-up page
  }, [closeLoginModal, router]);

  return (
    <LoginModalContext.Provider value={{ openLoginModal, closeLoginModal }}>
      {children}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
          </DialogHeader>
          <LoginForm
            onSignUpClick={handleSignUpClick}
          />
        </DialogContent>
      </Dialog>
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (context === undefined) {
    throw new Error("useLoginModal must be used within a LoginModalProvider");
  }
  return context;
}
