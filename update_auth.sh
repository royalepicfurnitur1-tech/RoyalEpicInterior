cat << 'INNER_EOF' > src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'vip' | 'developer';
  vipTier?: string;
  createdAt: string;
  companyName?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDeveloper: boolean;
  isCustomer: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  loginAsDemoCustomer: () => Promise<void>;
  loginAsDemoAdmin: (customEmail?: string) => Promise<void>;
  loginAsDemoDeveloper: (customEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (u: SupabaseUser) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { data, error } = await supabase.from('profiles').select('*').eq('id', u.id).single();
    if (data) {
      setProfile({
        uid: u.id,
        email: u.email || '',
        name: data.name || u.user_metadata?.name || 'Customer',
        phone: data.phone || u.user_metadata?.phone || '',
        role: data.role || 'customer',
        createdAt: data.created_at || u.created_at
      });
    } else {
      // Fallback
      setProfile({
        uid: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || 'Customer',
        phone: u.user_metadata?.phone || '',
        role: 'customer',
        createdAt: u.created_at
      });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string, phone?: string) => {
    setError(null);
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { name, phone }
      }
    });
    
    if (error) {
      setError(error.message);
      throw error;
    }

    if (data.user) {
      // Create profile record if allowed (might fail if RLS, but try)
      await supabase.from('profiles').insert([
        { id: data.user.id, name, phone, email, role: 'customer' }
      ]).catch(() => {});
    }
  };

  const loginAsDemoCustomer = async () => {
    setError(null);
    try {
      await loginWithEmail('customer.demo@royalepic.com', 'RoyalEpic2026!');
    } catch {
      await registerWithEmail('Demo Customer', 'customer.demo@royalepic.com', 'RoyalEpic2026!', '1234567890');
    }
  };

  const loginAsDemoAdmin = async (customEmail?: string) => {
    setError(null);
    const email = customEmail || 'admin@royalepicinterior.in';
    try {
      await loginWithEmail(email, 'RoyalAdmin2026!');
    } catch {
      await registerWithEmail('Demo Admin', email, 'RoyalAdmin2026!', '1234567890');
      // Set role to admin in db manually or through UI later.
    }
  };

  const loginAsDemoDeveloper = async (customEmail?: string) => {
    setError(null);
    const email = customEmail || 'developer@royalepic.com';
    try {
      await loginWithEmail(email, 'RoyalDev2026!');
    } catch {
      await registerWithEmail('Demo Developer', email, 'RoyalDev2026!', '1234567890');
    }
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const clearError = () => setError(null);

  const isAdmin = profile?.role === 'admin' || 
    (user?.email ? (
      user.email.toLowerCase().includes('admin') || 
      user.email === 'admin@royalepicinterior.in' ||
      user.email === 'royalepicfurnitur1@gmail.com'
    ) : false);
    
  const isDeveloper = profile?.role === 'developer' || 
    (user?.email ? (
      user.email.toLowerCase().includes('developer') || 
      user.email === 'developer@royalepic.com'
    ) : false);
    
  const isCustomer = profile?.role === 'customer' || profile?.role === 'vip' || (!isAdmin && !isDeveloper && !!user);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        isDeveloper,
        isCustomer,
        loginWithEmail,
        registerWithEmail,
        loginAsDemoCustomer,
        loginAsDemoAdmin,
        loginAsDemoDeveloper,
        logout,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
INNER_EOF
