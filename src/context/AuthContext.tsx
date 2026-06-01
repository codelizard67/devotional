import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/firebase';
import { INVITATION_CODES } from '../constants/auth';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      console.log("Auth State Changed:", currentUser ? `User: ${currentUser.email}` : "No User");
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        await fetchProfile(currentUser);
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      console.log("Initiating Google OAuth...");
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
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
      await fetchProfile(user);
      setLoading(false);
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, registerWithCode, logout, authError: error, syncProfile, isAuthReady }}>
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
