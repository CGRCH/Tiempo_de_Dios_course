'use client';

import { useEffect, useState } from 'react';
import { API_URL } from './api';
import { useAuth } from './auth';
import { profesorNav } from './panelNav';

export function useProfesorNav() {
  const { token } = useAuth();
  const [nav, setNav] = useState(() => profesorNav(false));

  useEffect(() => {
    if (!token) {
      setNav(profesorNav(false));
      return;
    }
    fetch(`${API_URL}/settings/`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => setNav(profesorNav(!!s.teacher_earnings_visible)))
      .catch(() => setNav(profesorNav(false)));
  }, [token]);

  return nav;
}
