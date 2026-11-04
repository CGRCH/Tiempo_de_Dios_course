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

export default function AdminRolesPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<{ id: number; first_name: string; last_name: string; role: string }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/users/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUsers(d.results || d));
  }, [token]);

  const assign = async (id: number, role: string) => {
    await fetch(`${API_URL}/admin/users/${id}/role/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
  };

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Roles y permisos">
      <h1 className="text-3xl font-black uppercase">Roles</h1>
      <Card className="mt-6 p-6">
        {users.slice(0, 8).map((u) => (
          <div key={u.id} className="flex items-center gap-3 border-t py-3">
            <span className="flex-1 font-bold">
              {u.first_name} {u.last_name}
            </span>
            <select
              data-testid={`role-select-${u.id}`}
              defaultValue={u.role}
              onChange={(e) => assign(u.id, e.target.value)}
              className="rounded-lg border px-2 py-1"
            >
              {['Estudiante', 'Profesor', 'Administración (soporte)', 'Super admin'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        ))}
      </Card>
    </PanelShell>
  );
}
