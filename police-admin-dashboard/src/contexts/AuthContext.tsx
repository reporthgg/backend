"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Ошибка при доступе к localStorage:", error);
    }
  }, []);

  const login = (newToken: string) => {
    try {
      localStorage.setItem("authToken", newToken);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Ошибка при сохранении токена:", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("authToken");
      setToken(null);
      setIsAuthenticated(false);
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при удалении токена:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 