'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/administracion', label: 'Resumen' },
  { href: '/panel/administracion/usuarios', label: 'Usuarios' },
  { href: '/panel/administracion/tickets', label: 'Tickets' },
  { href: '/panel/administracion/aprobacion', label: 'Aprobación de cursos' },
  { href: '/panel/administracion/certificados', label: 'Certificados' },
];

export default function AdminCertPage() {
  const { token } = useAuth();
  const [certs, setCerts] = useState<{ id: number; verification_code: string; course_title: string }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/certificates/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCerts(d.results || d));
  }, [token]);

  const reissue = async (id: number) => {
    const r = await fetch(`${API_URL}/admin/certificates/${id}/reissue/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await r.json();
    alert(`Nuevo código: ${data.verification_code}`);
  };

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Certificados">
      <h1 className="text-3xl font-black uppercase">Certificados</h1>
      <Card className="mt-6 p-6">
        {certs.map((c) => (
          <div key={c.id} className="flex justify-between border-t py-3">
            <span>
              {c.course_title} — {c.verification_code}
            </span>
            <button
              type="button"
              data-testid={`reissue-cert-${c.id}`}
              className="underline"
              onClick={() => reissue(c.id)}
            >
              Reemitir
            </button>
          </div>
        ))}
      </Card>
    </PanelShell>
  );
}
