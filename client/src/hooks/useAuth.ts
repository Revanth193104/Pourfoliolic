import { useState, useEffect } from "react";
import { auth, signInWithGoogle, logOut, getIdToken, handleRedirectResult } from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@shared/schema";
import { useQueryClient } from "@tanstack/react-query";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    handleRedirectResult();
    
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          const response = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
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

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    getIdToken,
  };
}
