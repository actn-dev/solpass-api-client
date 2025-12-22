"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth-schema";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  walletAddress: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  apiKey: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<{ apiKey: string }>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  getApiKey: () => Promise<string>;
  regenerateApiKey: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore token and fetch profile on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      // Fetch profile to verify token is still valid
      fetchProfileInternal(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchProfileInternal = async (authToken: string) => {
    try {
      const response = await apiClient.GET("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data) {
        setUser(response.data as User);
      } else {
        // Token invalid, clear it
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient.POST("/api/v1/auth/login", {
        body: credentials,
      });

      if (response.error) {
        throw new Error(response.error as string || "Login failed");
      }

      if (response.data) {
        const data = response.data as any;
        const jwtToken = data.accessToken || data.token;
        
        if (jwtToken) {
          setToken(jwtToken);
          localStorage.setItem("auth_token", jwtToken);
          
          // Set user from response
          if (data.user) {
            setUser(data.user);
          } else {
            // Fetch profile to get user data
            await fetchProfileInternal(jwtToken);
          }
          
          toast.success("Login successful!");
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error?.message || "Login failed. Please check your credentials.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterInput): Promise<{ apiKey: string }> => {
    setIsLoading(true);
    try {
      const response = await apiClient.POST("/api/v1/auth/register", {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error as string || "Registration failed");
      }

      if (response.data) {
        const responseData = response.data as any;
        
        // Save API key for display
        const newApiKey = responseData.apiKey;
        
        // Auto-login after registration
        if (responseData.id && responseData.email) {
          // Don't auto-login, let user login manually after seeing API key
          toast.success("Registration successful! Please save your API key.");
          return { apiKey: newApiKey };
        }
        
        return { apiKey: newApiKey };
      }
      
      throw new Error("Registration failed");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error?.message || "Registration failed. Email may already exist.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setApiKey(null);
    localStorage.removeItem("auth_token");
    toast.success("Logged out successfully");
  };

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.GET("/api/v1/auth/me");
      
      if (response.data) {
        setUser(response.data as User);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to fetch profile");
    }
  };

  const getApiKey = async (): Promise<string> => {
    try {
      const response = await apiClient.GET("/api/v1/auth/api-key");
      
      if (response.data) {
        const key = (response.data as any).apiKey;
        setApiKey(key);
        return key;
      }
      
      throw new Error("Failed to get API key");
    } catch (error) {
      console.error("Failed to get API key:", error);
      toast.error("Failed to retrieve API key");
      throw error;
    }
  };

  const regenerateApiKey = async (): Promise<string> => {
    try {
      const response = await apiClient.POST("/api/v1/auth/regenerate-key", {});
      
      if (response.data) {
        const key = (response.data as any).apiKey;
        setApiKey(key);
        toast.success("API key regenerated successfully!");
        return key;
      }
      
      throw new Error("Failed to regenerate API key");
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Failed to regenerate API key");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    apiKey,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    fetchProfile,
    getApiKey,
    regenerateApiKey,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
