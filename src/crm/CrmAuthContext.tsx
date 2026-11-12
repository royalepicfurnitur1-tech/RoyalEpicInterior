import React, { createContext, useContext, useState, useEffect } from 'react';
import { CrmUser } from './types';

interface CrmAuthContextType {
  user: CrmUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isTelecaller: boolean;
  isAuthenticated: boolean;
  login: (nameOrEmail: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const CrmAuthContext = createContext<CrmAuthContextType | undefined>(undefined);

export const CrmAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CrmUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const stored = localStorage.getItem('royal_epic_crm_session');
        if (stored) {
          const session = JSON.parse(stored);
          if (session?.user && session?.token) {
            // Validate session with server
            const res = await fetch('/api/crm/auth/session', {
              headers: {
                'Authorization': `Bearer ${session.token}`,
                'x-crm-user-id': session.user.id
              }
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.user) {
                setUser(data.user);
              } else {
                setUser(session.user);
              }
            } else {
              // Token invalid or expired
              localStorage.removeItem('royal_epic_crm_session');
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('CRM session verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Handle browser Back / Forward Navigation and bfcache restores
    const handlePageShow = () => {
      const stored = localStorage.getItem('royal_epic_crm_session');
      if (!stored) {
        setUser(null);
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePageShow);
    };
  }, []);

  const login = async (nameOrEmail: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameOrEmail.trim(),
          email: nameOrEmail.trim(),
          pin: pin.trim(),
          password: pin.trim()
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Authentication failed. Please verify your Name and PIN.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      localStorage.setItem('royal_epic_crm_session', JSON.stringify({
        token: data.token || 'crm_staff_' + data.user.id + '_' + Date.now(),
        user: data.user
      }));

      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Network error during login';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      const stored = localStorage.getItem('royal_epic_crm_session');
      if (stored) {
        const session = JSON.parse(stored);
        await fetch('/api/crm/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.token || ''}`,
            'x-crm-user-id': session?.user?.id || ''
          }
        }).catch(() => {});
      }
    } catch (_) {}

    // Sign out from Supabase Auth if client exists
    try {
      const { getSupabase } = await import('../lib/supabase');
      const sb = getSupabase();
      if (sb && sb.auth) {
        await sb.auth.signOut().catch(() => {});
      }
    } catch (_) {}

    // Invalidate local storage and session cache
    try {
      localStorage.removeItem('royal_epic_crm_session');
      sessionStorage.clear();
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('crm_') || k.startsWith('sb-') || k.includes('royal_epic_crm'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (_) {}

    setUser(null);
    setError(null);

    // Replace current browser history state to prevent Back button from reopening authenticated workspace
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const clearError = () => setError(null);

  // Equal permissions for all active staff members
  const isAuthenticated = Boolean(user && user.status === 'active');
  const isAdmin = isAuthenticated;
  const isTelecaller = isAuthenticated;

  return (
    <CrmAuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        isTelecaller,
        isAuthenticated,
        login,
        logout,
        clearError
      }}
    >
      {children}
    </CrmAuthContext.Provider>
  );
};

export const useCrmAuth = () => {
  const context = useContext(CrmAuthContext);
  if (!context) {
    throw new Error('useCrmAuth must be used within a CrmAuthProvider');
  }
  return context;
};
