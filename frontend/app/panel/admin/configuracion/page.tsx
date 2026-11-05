'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/admin', label: 'Ingresos' },
  { href: '/panel/admin/transacciones', label: 'Transacciones' },
  { href: '/panel/admin/roles', label: 'Roles y permisos' },
  { href: '/panel/admin/cursos', label: 'Cursos' },
  { href: '/panel/admin/configuracion', label: 'Configuración' },
];

export default function AdminConfigPage() {
  const { token } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/settings/`)
      .then((r) => r.json())
      .then((s) => {
        setVisible(!!s.teacher_earnings_visible);
        setLoaded(true);
      });
  }, [token]);

  const save = async () => {
    const res = await fetch(`${API_URL}/admin/settings/`, {
      method: 'PATCH',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({ teacher_earnings_visible: visible }),
    });
    if (res.ok) setSavedMsg('Configuración guardada correctamente.');
  };

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Configuración">
      <h1 className="text-3xl font-black uppercase">Configuración</h1>
      <Card className="mt-6 p-6">
        <label className="flex items-center gap-3">
          <input
            data-testid="toggle-teacher-earnings"
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          Mostrar ingresos a profesores
        </label>
        <button
          data-testid="save-settings"
          type="button"
          onClick={save}
          disabled={!loaded}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-white disabled:opacity-50"
        >
          Guardar
        </button>
        {savedMsg && (
          <p className="mt-3 text-sm text-[#1d5e2e]" data-testid="settings-saved">
            {savedMsg}
          </p>
        )}
      </Card>
    </PanelShell>
  );
}
