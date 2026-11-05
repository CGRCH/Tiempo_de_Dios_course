'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, User, apiGet, apiPost } from './api';

type AuthCtx = {
  user: User | null;
  /** @deprecated use user / isAuthenticated — kept for legacy call sites during cookie migration */
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const me = await apiGet<User>('/auth/me/');
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/token/`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    await refreshUser();
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout/`, { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <Ctx.Provider
      value={{
        user,
        token: isAuthenticated ? 'cookie' : null,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export async function registerUser(payload: {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}) {
  return apiPost('/auth/register/', payload);
}
