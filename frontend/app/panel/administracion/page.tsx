'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Headline, Pill, Tag } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/administracion', label: 'Resumen' },
  { href: '/panel/administracion/usuarios', label: 'Usuarios' },
  { href: '/panel/administracion/tickets', label: 'Tickets' },
  { href: '/panel/administracion/aprobacion', label: 'Aprobación de cursos' },
  { href: '/panel/administracion/certificados', label: 'Certificados' },
];

export default function AdministracionPanelPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const [tickets, setTickets] = useState<
    { id: number; subject: string; user_name: string; priority: string }[]
  >([]);
  const [pending, setPending] = useState<{ id: number; title: string; teacher_name: string }[]>([]);
  const [users, setUsers] = useState<
    { id: number; first_name: string; last_name: string; email: string; role: string; is_blocked: boolean }[]
  >([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/support-stats/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats);
    fetch(`${API_URL}/admin/tickets/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTickets((d.results || d).slice(0, 4)));
    fetch(`${API_URL}/admin/courses/pending/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setPending(d.results || d));
    fetch(`${API_URL}/admin/users/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setUsers((d.results || d).slice(0, 5)));
  }, [token]);

  const approveCourse = async (slug: string) => {
    await fetch(`${API_URL}/admin/courses/${slug}/approve/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
  };

  const replyTicket = async (id: number) => {
    await fetch(`${API_URL}/admin/tickets/${id}/reply/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Respuesta de soporte QA', status: 'in_progress' }),
    });
  };

  const manualEnroll = async () => {
    const u = users[0];
    const c = pending[0];
    if (!u || !c) return;
    await fetch(`${API_URL}/admin/enrollments/manual/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: u.id, course_id: c.id }),
    });
  };

  const priorityTone = (p: string) =>
    p === 'high' ? 'red' : p === 'medium' ? 'rev' : 'dr';

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Resumen">
      <div data-testid="support-dashboard" aria-hidden="true" className="h-0 w-0 overflow-hidden" />
      <Headline className="mb-7 !text-[56px]">
        Centro de <span className="serif normal-case">soporte</span>
      </Headline>
      <div className="mb-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Usuarios activos', stats.active_users ?? 0],
          ['Tickets abiertos', stats.open_tickets ?? 0],
          ['Cursos por aprobar', stats.courses_pending ?? 0],
          ['Tiempo medio respuesta', stats.avg_response_time || '2 h 10 min'],
        ].map(([a, b]) => (
          <Card key={a} className="p-5">
            <span className="text-sm text-muted">{a}</span>
            <b className="mt-1 block text-3xl font-black">{b}</b>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-2 flex justify-between">
            <b className="text-lg">Bandeja de tickets</b>
            <Link href="/panel/administracion/tickets" className="text-sm font-semibold text-muted underline">
              Ver todos →
            </Link>
          </div>
          {tickets.map((t) => (
            <div key={t.id} className="border-t border-[#f0ede8] py-3">
              <div className="flex justify-between gap-2">
                <b className="text-[15px]">{t.subject}</b>
                <Tag tone={priorityTone(t.priority)}>{t.priority}</Tag>
              </div>
              <div className="text-xs text-muted">{t.user_name}</div>
              <button
                type="button"
                data-testid={`reply-ticket-${t.id}`}
                className="mt-2 text-sm font-semibold underline"
                onClick={() => replyTicket(t.id)}
              >
                Responder
              </button>
            </div>
          ))}
        </Card>
        <Card className="p-6">
          <b className="text-lg">Cursos pendientes de aprobación</b>
          {pending.map((c: { id: number; title: string; teacher_name: string; slug?: string }) => (
            <div key={c.id} className="flex items-center gap-3 border-t border-[#f0ede8] py-3">
              <div className="h-11 w-16 rounded-lg bg-[#cfc8bb]" />
              <div className="flex-1">
                <b className="text-[15px]">{c.title}</b>
                <div className="text-xs text-muted">{c.teacher_name}</div>
              </div>
              <Pill
                data-testid={`approve-${c.slug || c.id}`}
                className="!px-3 !py-2 text-xs"
                onClick={() => approveCourse((c as { slug?: string }).slug || '')}
              >
                Aprobar
              </Pill>
              <Pill
                variant="ghost"
                className="!px-3 !py-2 text-xs"
                href={`/panel/administracion/aprobacion?highlight=${encodeURIComponent((c as { slug?: string }).slug || String(c.id))}`}
                data-testid={`review-course-${(c as { slug?: string }).slug || c.id}`}
              >
                Revisar
              </Pill>
            </div>
          ))}
        </Card>
      </div>
      <Card className="overflow-x-auto">
        <div className="flex items-center justify-between p-5">
          <b className="text-lg">Usuarios</b>
          <input
            placeholder="Buscar usuario…"
            className="rounded-full border border-[#ddd] px-4 py-2 text-sm"
          />
        </div>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              {['Nombre', 'Correo', 'Rol', 'Estado'].map((h) => (
                <th key={h} className="border-b border-[#eee] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[#f0ede8]">
                <td className="px-4 py-3.5 font-bold">
                  {u.first_name} {u.last_name}
                </td>
                <td className="px-4 py-3.5 text-muted">{u.email}</td>
                <td className="px-4 py-3.5">{u.role}</td>
                <td className="px-4 py-3.5">
                  <Tag tone={u.is_blocked ? 'red' : 'ok'}>
                    {u.is_blocked ? 'Suspendido' : 'Activo'}
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" data-testid="manual-enroll" onClick={manualEnroll} className="p-5 text-sm underline">
          Inscripción manual (demo)
        </button>
      </Card>
    </PanelShell>
  );
}
