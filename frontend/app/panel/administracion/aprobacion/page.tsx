'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Pill } from '@/components/ui';
import { API_URL, Course , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/administracion', label: 'Resumen' },
  { href: '/panel/administracion/usuarios', label: 'Usuarios' },
  { href: '/panel/administracion/tickets', label: 'Tickets' },
  { href: '/panel/administracion/aprobacion', label: 'Aprobación de cursos' },
  { href: '/panel/administracion/certificados', label: 'Certificados' },
];

export default function AdministracionAprobacionPage() {
  const { token } = useAuth();
  const [pending, setPending] = useState<(Course & { teacher_name: string })[]>([]);

  const load = () => {
    if (!token) return;
    fetch(`${API_URL}/admin/courses/pending/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setPending(d.results || d));
  };

  useEffect(() => {
    load();
  }, [token]);

  const approve = async (slug: string) => {
    await fetch(`${API_URL}/admin/courses/${slug}/approve/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({ action: 'approve' }),
    });
    load();
  };

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Aprobación de cursos">
      <h1 className="text-3xl font-black uppercase">Aprobación de cursos</h1>
      <Card className="mt-6 p-6" data-testid="admin-approval-page">
        {pending.length === 0 && <p className="text-muted">No hay cursos pendientes.</p>}
        {pending.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-t border-[#f0ede8] py-4 first:border-0">
            <div>
              <b>{c.title}</b>
              <div className="text-xs text-muted">{c.teacher_name}</div>
            </div>
            <Pill data-testid={`approve-page-${c.slug}`} className="!px-3 !py-2 text-xs" onClick={() => approve(c.slug)}>
              Aprobar
            </Pill>
          </div>
        ))}
      </Card>
    </PanelShell>
  );
}
