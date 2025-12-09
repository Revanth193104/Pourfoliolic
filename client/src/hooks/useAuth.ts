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
    console.log("useAuth: Initializing...");
    
    handleRedirectResult().then((redirectUser) => {
      console.log("useAuth: Redirect result:", redirectUser ? "got user" : "no user from redirect");
    });
    
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      console.log("useAuth: onAuthStateChanged fired, user:", fbUser ? fbUser.email : "null");
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        try {
          console.log("useAuth: Getting ID token...");
          const token = await fbUser.getIdToken();
          console.log("useAuth: Got token, calling /api/auth/user...");
          const response = await fetch("/api/auth/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("useAuth: Response status:", response.status);
          if (response.ok) {
            const userData = await response.json();
            console.log("useAuth: Got user data:", userData);
            setUser(userData);
          } else {
            console.log("useAuth: Response not ok");
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        console.log("useAuth: No Firebase user");
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
