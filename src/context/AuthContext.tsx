import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
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
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Persistence setup failed:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth State Changed:", currentUser ? `User: ${currentUser.email}` : "No User");
      setUser(currentUser);
      setIsAuthReady(true);
      
      if (currentUser) {
        // Fetch in background, profile might already be set from cache
        fetchProfile(currentUser).finally(() => {
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      console.log("Initiating Popup Auth...");
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await fetchProfile(result.user);
      }
    } catch (err: any) {
      console.error("Auth Failure:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Popups are blocked. Please allow popups for this site to sign in.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized in Firebase Console. Please add your custom domain to the 'Authorized Domains' list.");
      } else {
        // Fallback for mobile environments where popup might fail
        try {
          console.log("Popup failed, trying redirect fallback...");
          await signInWithRedirect(auth, provider);
        } catch (redirErr: any) {
          setError(redirErr.message || "Authentication failed. Please try again.");
        }
      }
    }
  };

  const registerWithCode = async (code: string) => {
    if (!user) return false;
    if (INVITATION_CODES.includes(code.toUpperCase().trim())) {
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Member',
        invitationCode: code.toUpperCase().trim(),
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
      return true;
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
    localStorage.removeItem('obm_profile_cache');
    await signOut(auth);
    setUser(null);
    setProfile(null);
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
