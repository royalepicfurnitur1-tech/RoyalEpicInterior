import React, { createContext, useContext, useState, useEffect } from 'react';
import { CrmUser } from './types';

interface CrmAuthContextType {
  user: CrmUser | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isTelecaller: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  initFirstAdmin: (data: { email: string; name: string; password?: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
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
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password: pass })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data.error || 'Authentication failed. Please verify credentials.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }

      setUser(data.user);
      localStorage.setItem('royal_epic_crm_session', JSON.stringify({
        token: data.token || 'crm_token_' + Date.now(),
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
            'Authorization': `Bearer ${session?.token || ''}`
          }
        }).catch(() => {});
      }
    } catch (_) {}
    localStorage.removeItem('royal_epic_crm_session');
    setUser(null);
    setError(null);
  };

  const initFirstAdmin = async (data: { email: string; name: string; password?: string; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    try {
      const res = await fetch('/api/crm/auth/init-first-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.success) {
        const errMsg = resData.error || 'Failed to initialize first admin.';
        setError(errMsg);
        return { success: false, error: errMsg };
      }
      setUser(resData.user);
      localStorage.setItem('royal_epic_crm_session', JSON.stringify({
        token: resData.token || 'crm_admin_' + Date.now(),
        user: resData.user
      }));
      return { success: true };
    } catch (err: any) {
      const msg = err.message || 'Network error initializing admin';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const clearError = () => setError(null);

  const isAdmin = user?.role === 'admin';
  const isTelecaller = user?.role === 'telecaller';
  const isAuthenticated = Boolean(user && user.status === 'active');

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
        initFirstAdmin,
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
