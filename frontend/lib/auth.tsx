'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL, User, apiGet, apiPost } from './api';

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('td_token');
    if (t) setToken(t);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await apiGet<User>('/auth/me/', token);
      setUser(me);
    } catch {
      setUser(null);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    const data = await res.json();
    localStorage.setItem('td_token', data.access);
    localStorage.setItem('td_refresh', data.refresh);
    setToken(data.access);
  };

  const logout = () => {
    localStorage.removeItem('td_token');
    localStorage.removeItem('td_refresh');
    setToken(null);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, token, login, logout, refreshUser }}>
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
