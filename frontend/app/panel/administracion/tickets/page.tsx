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

export default function AdministracionTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<
    { id: number; subject: string; user_name: string; priority: string; status: string }[]
  >([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/tickets/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setTickets(d.results || d));
  }, [token]);

  const reply = async (id: number) => {
    await fetch(`${API_URL}/admin/tickets/${id}/reply/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({ message: 'Respuesta desde panel tickets', status: 'in_progress' }),
    });
  };

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Tickets">
      <h1 className="text-3xl font-black uppercase">Tickets</h1>
      <Card className="mt-6 p-6" data-testid="admin-tickets-page">
        {tickets.map((t) => (
          <div key={t.id} className="border-t border-[#f0ede8] py-4 first:border-0">
            <div className="flex justify-between gap-2">
              <b>{t.subject}</b>
              <Tag>{t.priority}</Tag>
            </div>
            <div className="text-xs text-muted">{t.user_name}</div>
            <button type="button" className="mt-2 text-sm underline" onClick={() => reply(t.id)}>
              Responder
            </button>
          </div>
        ))}
      </Card>
    </PanelShell>
  );
}
