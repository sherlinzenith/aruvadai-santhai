"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getClient } from "@/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [supabase] = useState(() => getClient());
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (!error && initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 2. Real-time auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Real Supabase registration
   */
  const signUp = async ({ email, password, fullName, mobile }) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            mobile: mobile.trim(),
          },
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding/role`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const needsVerification = !data.session;

      return {
        success: true,
        user: data.user,
        session: data.session,
        needsVerification,
      };
    } catch (err) {
      return { success: false, error: err.message || "Registration failed." };
    }
  };

  /**
   * Real Supabase sign in (email or mobile)
   */
  const signIn = async (identifier, password) => {
    try {
      const trimmed = identifier.trim();
      const isEmail = trimmed.includes("@");
      let res;

      if (isEmail) {
        res = await supabase.auth.signInWithPassword({
          email: trimmed.toLowerCase(),
          password,
        });
      } else {
        const cleanMobile = trimmed.replace(/\s+/g, "");
        const formattedPhone = cleanMobile.startsWith("+") ? cleanMobile : `+91${cleanMobile}`;
        res = await supabase.auth.signInWithPassword({
          phone: formattedPhone,
          password,
        });
      }

      if (res.error) {
        // Clear message if phone provider is not enabled in Supabase project
        if (!isEmail && res.error.message.toLowerCase().includes("provider")) {
          return {
            success: false,
            error: "Mobile phone login is not enabled on this Supabase project. Please sign in using your registered email address.",
          };
        }
        return { success: false, error: res.error.message };
      }

      setSession(res.data.session);
      setUser(res.data.user);

      return {
        success: true,
        user: res.data.user,
        session: res.data.session,
      };
    } catch (err) {
      return { success: false, error: err.message || "Failed to sign in." };
    }
  };

  /**
   * Real Supabase sign out
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /**
   * Real Supabase password reset request (email)
   */
  const resetPasswordForEmail = async (email) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not send reset email." };
    }
  };

  /**
   * Real Supabase update password (authenticated session required)
   */
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not update password." };
    }
  };

  /**
   * Resend signup verification email
   */
  const resendVerificationEmail = async (email) => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/onboarding/role`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || "Could not resend verification email." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        supabase,
        session,
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
