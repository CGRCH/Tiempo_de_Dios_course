'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Tag } from '@/components/ui';
import { API_URL , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/administracion', label: 'Resumen' },
  { href: '/panel/administracion/usuarios', label: 'Usuarios' },
  { href: '/panel/administracion/tickets', label: 'Tickets' },
  { href: '/panel/administracion/aprobacion', label: 'Aprobación de cursos' },
  { href: '/panel/administracion/certificados', label: 'Certificados' },
];

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_blocked: boolean;
};

export default function AdministracionUsuariosPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/users/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setUsers(d.results || d));
  }, [token]);

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Usuarios">
      <h1 className="text-3xl font-black uppercase">Usuarios</h1>
      <Card className="mt-6 overflow-x-auto" data-testid="admin-users-page">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              {['Nombre', 'Correo', 'Rol', 'Estado'].map((h) => (
                <th key={h} className="border-b px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#f0ede8]">
                <td className="px-4 py-3 font-bold">
                  {u.first_name} {u.last_name}
                </td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  <Tag tone={u.is_blocked ? 'red' : 'ok'}>{u.is_blocked ? 'Suspendido' : 'Activo'}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  );
}
