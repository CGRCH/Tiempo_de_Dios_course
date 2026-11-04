'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
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

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/settings/`).then((r) => r.json()).then((s) => setVisible(s.teacher_earnings_visible));
  }, [token]);

  const save = async () => {
    await fetch(`${API_URL}/admin/settings/`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_earnings_visible: visible }),
    });
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
        <button data-testid="save-settings" type="button" onClick={save} className="mt-4 rounded-full bg-ink px-4 py-2 text-white">
          Guardar
        </button>
      </Card>
    </PanelShell>
  );
}
