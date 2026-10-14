'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, loadSession, onSessionChange, saveSession } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
    return onSessionChange(setSession);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api('/auth/login', { method: 'POST', body: credentials, auth: false });
    saveSession(data);
    return data.user;
  }, []);

  const register = useCallback(async (details) => {
    const { data } = await api('/auth/register', { method: 'POST', body: details, auth: false });
    saveSession(data);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    const current = loadSession();
    saveSession(null);
    if (current?.refreshToken) {
      api('/auth/logout', { method: 'POST', body: { refreshToken: current.refreshToken }, auth: false }).catch(() => {});
    }
  }, []);

  const value = useMemo(
    () => ({ user: session?.user || null, ready, login, register, logout }),
    [session, ready, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Where each role lands after signing in.
export function homeFor(user) {
  if (!user) return '/';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'organizer') return '/organizer';
  return '/dashboard';
}
