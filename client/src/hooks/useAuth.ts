import { useState, useEffect } from "react";
import { auth, signInWithGoogle, logOut, getIdToken, resetPassword, signUpWithEmail, signInWithEmail } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.error("Auth request timed out - database may be slow");
          } else {
            console.error("Error fetching user data:", error);
          }
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (rememberMe: boolean = true) => {
    try {
      await signInWithGoogle(rememberMe);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      await signInWithEmail(email, password, rememberMe);
    } catch (error) {
      console.error("Email login failed:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      await signUpWithEmail(email, password, rememberMe);
    } catch (error) {
      console.error("Email signup failed:", error);
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await resetPassword(email);
      return true;
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      queryClient.clear();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const refetchUser = async () => {
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const response = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error refetching user:", error);
      }
    }
  };

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithEmail,
    signupWithEmail,
    logout,
    getIdToken,
    sendPasswordReset,
    refetchUser,
  };
}
