import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AppUser } from "../types";
import { auth } from "../lib/api";
import { supabase } from "../lib/supabase";

interface AuthCtx {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AppUser>;
  signUp: (email: string, password: string, role?: AppUser["role"]) => Promise<AppUser>;
  signOut: () => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const u = await auth.getUser();
      if (!active) return;
      setUser(u);
      setLoading(false);
    };

    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async () => {
      const u = await auth.getUser();
      setUser(u);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await auth.logIn(email, password);
    setUser(u);
    return u;
  }, []);

  const signUp = useCallback(async (email: string, password: string, role: AppUser["role"] = "usuario") => {
    const u = await auth.signUp(email, password, role);
    setUser(u);
    return u;
  }, []);

  const signOut = useCallback(async () => {
    await auth.logOut();
    setUser(null);
  }, []);

  const requestReset = useCallback(async (email: string) => {
    await auth.requestPasswordReset(email);
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await auth.updatePassword(token, newPassword);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, requestReset, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}