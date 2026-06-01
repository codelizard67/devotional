import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/firebase';
import { INVITATION_CODES } from '../constants/auth';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  registerWithCode: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authError: string | null;
  syncProfile: () => Promise<void>;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(() => {
    const cached = localStorage.getItem('obm_profile_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        console.log("Instant Load: Profile found in cache.");
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const getRedirectUrl = () => {
    const appUrl = import.meta.env.VITE_APP_URL || import.meta.env.VITE_SITE_URL;
    const baseUrl = appUrl || window.location.origin;
    return `${baseUrl.replace(/\/$/, '')}/auth/callback`;
  };

  const fetchProfile = async (currentUser: User) => {
    try {
      const { data, error: err } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (err && err.code !== 'PGRST116') {
        throw err;
      }

      if (data) {
        setProfile(data);
        localStorage.setItem('obm_profile_cache', JSON.stringify(data));
        return data;
      } else {
        setProfile(null);
        localStorage.removeItem('obm_profile_cache');
        return null;
      }
    } catch (err: any) {
      console.error("Profile sync error:", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Initial session check failed:", error);
        }
        if (!mounted) return;

        const currentUser = data.session?.user || null;
        setUser(currentUser);
        setIsAuthReady(true);
        setLoading(false);

        if (currentUser) {
          fetchProfile(currentUser).catch((err) => {
            console.error("Background profile sync failed:", err);
          });
        }
      } catch (err) {
        if (!mounted) return;
        console.error("Auth bootstrap error:", err);
        setIsAuthReady(true);
        setLoading(false);
      }
    };

    bootstrapAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      console.log("Auth State Changed:", currentUser ? `User: ${currentUser.email}` : "No User");
      setUser(currentUser);
      setLoading(false);
      setIsAuthReady(true);
      
      if (currentUser) {
        fetchProfile(currentUser).catch((err) => {
          console.error("Background profile sync failed:", err);
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      console.log("Initiating Google OAuth...");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getRedirectUrl(),
        },
      });
      if (err) {
        throw err;
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      setError(err.message || "Authentication failed. Please try again.");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
    } catch (err: any) {
      console.error("Email sign-in failure:", err);
      setError(err.message || "Sign in failed. Please try again.");
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectUrl(),
        },
      });
      if (err) throw err;
      return { needsConfirmation: !data.session };
    } catch (err: any) {
      console.error("Email sign-up failure:", err);
      setError(err.message || "Sign up failed. Please try again.");
      return { needsConfirmation: false };
    }
  };

  const registerWithCode = async (code: string) => {
    if (!user) return false;
    if (INVITATION_CODES.includes(code.toUpperCase().trim())) {
      try {
        const profileData = {
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Member',
          invitation_code: code.toUpperCase().trim(),
          created_at: new Date().toISOString(),
        };
        
        const { error: err } = await supabase
          .from('users')
          .upsert([profileData], { onConflict: 'id' });
        
        if (err) throw err;
        
        setProfile(profileData);
        localStorage.setItem('obm_profile_cache', JSON.stringify(profileData));
        return true;
      } catch (err: any) {
        console.error("Registration error:", err);
        return false;
      }
    }
    return false;
  };

  const syncProfile = async () => {
    if (user) {
      setLoading(true);
      try {
        await fetchProfile(user);
      } finally {
        setLoading(false);
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('obm_profile_cache');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, registerWithCode, logout, authError: error, syncProfile, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
