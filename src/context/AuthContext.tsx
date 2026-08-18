import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin' | 'vip' | 'developer';
  vipTier?: string;
  createdAt?: string;
  companyName?: string;
}

interface AuthContextType {
  user: any | null; // Keep for backward compatibility, mapped to profile
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Restore session from localStorage
    try {
      const stored = localStorage.getItem('royal_epic_auth');
      if (stored) {
        const data = JSON.parse(stored);
        setProfile(data);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  const persistProfile = (p: UserProfile | null) => {
    setProfile(p);
    if (p) {
      localStorage.setItem('royal_epic_auth', JSON.stringify(p));
    } else {
      localStorage.removeItem('royal_epic_auth');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        throw new Error(`Server error (${res.status}): Please restart dev server`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password');
      }
      persistProfile(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string, phone?: string) => {
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, phone })
      });

      let data: any = {};
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (jsonErr) {
        throw new Error(`Server error (${res.status}): Please restart dev server`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }
      persistProfile(data.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const loginAsDemoCustomer = async () => {
    try {
      await loginWithEmail('customer.demo@royalepic.com', 'RoyalEpic2026!');
    } catch {
      await registerWithEmail('Demo Customer', 'customer.demo@royalepic.com', 'RoyalEpic2026!', '1234567890');
    }
  };

  const loginAsDemoAdmin = async (customEmail?: string) => {
    const email = customEmail || 'admin@royalepicinterior.in';
    try {
      await loginWithEmail(email, 'RoyalAdmin2026!');
      setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
    } catch {
      await registerWithEmail('Demo Admin', email, 'RoyalAdmin2026!', '1234567890');
      setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
    }
  };

  const loginAsDemoDeveloper = async (customEmail?: string) => {
    const email = customEmail || 'developer@royalepic.com';
    try {
      await loginWithEmail(email, 'RoyalDev2026!');
      setProfile(prev => prev ? { ...prev, role: 'developer' } : null);
    } catch {
      await registerWithEmail('Demo Developer', email, 'RoyalDev2026!', '1234567890');
      setProfile(prev => prev ? { ...prev, role: 'developer' } : null);
    }
  };

  const logout = async () => {
    persistProfile(null);
  };

  const clearError = () => setError(null);

  const isAdmin = profile?.role === 'admin' || 
    (profile?.email ? (
      profile.email.toLowerCase().includes('admin') || 
      profile.email === 'admin@royalepicinterior.in' ||
      profile.email === 'royalepicfurnitur1@gmail.com'
    ) : false);
    
  const isDeveloper = profile?.role === 'developer' || 
    (profile?.email ? (
      profile.email.toLowerCase().includes('developer') || 
      profile.email === 'developer@royalepic.com'
    ) : false);
    
  const isCustomer = profile?.role === 'customer' || profile?.role === 'vip' || (!isAdmin && !isDeveloper && !!profile);

  return (
    <AuthContext.Provider
      value={{
        user: profile ? { ...profile, id: profile.uid } : null,
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
