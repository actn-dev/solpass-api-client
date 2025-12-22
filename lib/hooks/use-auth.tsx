"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import type { LoginInput, RegisterInput } from "@/lib/validations/auth-schema";
import { toast } from "sonner";

interface User {
  id?: string;
  userId?: string;
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setApiKey(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.success("Logged out successfully");
  }, []);

  const fetchProfileInternal = useCallback(async () => {
    try {
      console.log("Fetching profile from API...");
      // The auth token is automatically added by middleware in api-client.ts
      const response = await apiClient.GET("/api/v1/auth/me");

      console.log("API Response:", response);

      if (response.data) {
        // Handle the API response structure: {data: {success: true, user: {...}}}
        const responseData = response.data as any;
        const userData = responseData.user || responseData.data || responseData;
        console.log("Profile fetched successfully:", userData);
        setUser(userData);
        // Persist user data to localStorage
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } else if (response.error) {
        // Token invalid, clear it
        console.error("Profile fetch error:", response.error);
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      logout();
    }
  }, [logout]);

  // Restore token and fetch profile on mount
  useEffect(() => {
    console.log("Auth initialization running...");
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    
    if (storedToken) {
      console.log("Found stored token, restoring session...");
      setToken(storedToken);
      
      // Restore user from localStorage immediately
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Restored user from localStorage:", parsedUser.email);
          setUser(parsedUser);
          setIsLoading(false); // Set loading false immediately after restoring
        } catch (e) {
          console.error("Failed to parse stored user:", e);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
      
      // Fetch fresh profile to verify token is still valid (runs in background)
      fetchProfileInternal();
    } else {
      console.log("No stored token found");
      setIsLoading(false);
    }
  }, [fetchProfileInternal]);

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
        console.log("Login response:", data);
        const jwtToken = data.accessToken || data.token;
        
        if (jwtToken) {
          setToken(jwtToken);
          localStorage.setItem("auth_token", jwtToken);
          
          // Set user from response - check both data.user and data.data
          const userData = data.user || data.data;
          if (userData) {
            console.log("Setting user from login:", userData);
            setUser(userData);
            localStorage.setItem("auth_user", JSON.stringify(userData));
          } else {
            // Fetch profile to get user data
            await fetchProfileInternal();
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

  const fetchProfile = async () => {
    if (!token) return;
    
    try {
      const response = await apiClient.GET("/api/v1/auth/me");
      
      if (response.data) {
        const userData = response.data as User;
        setUser(userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
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
