'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
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

type CertRow = {
  id: number;
  verification_code: string;
  course_title: string;
  user_name: string;
  issued_at: string;
};

export default function AdminCertPage() {
  const { token } = useAuth();
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!token) return;
    fetch(`${API_URL}/admin/certificates/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setCerts(Array.isArray(d) ? d : d.results || []));
  };

  useEffect(() => {
    load();
  }, [token]);

  const reissue = async (id: number) => {
    const r = await fetch(`${API_URL}/admin/certificates/${id}/reissue/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
    });
    const data = await r.json();
    setMsg(`Certificado reemitido. Nuevo código: ${data.verification_code}`);
    load();
  };

  return (
    <PanelShell roleTag="Administración · Soporte" nav={nav} active="Certificados">
      <h1 className="text-3xl font-black uppercase">Certificados</h1>
      {msg && <p className="mt-2 text-sm text-[#1d5e2e]">{msg}</p>}
      <Card className="mt-6 overflow-x-auto" data-testid="admin-certificates-page">
        {certs.length === 0 ? (
          <p className="p-6 text-muted" data-testid="certificates-empty">
            No hay certificados emitidos todavía. Aparecerán cuando un alumno complete un curso.
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                {['Alumno', 'Curso', 'Código', 'Emitido', ''].map((h) => (
                  <th key={h} className="border-b px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id} className="border-b border-[#f0ede8]">
                  <td className="px-4 py-3">{c.user_name}</td>
                  <td className="px-4 py-3">{c.course_title}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.verification_code}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.issued_at ? new Date(c.issued_at).toLocaleDateString('es-CL') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      data-testid={`reissue-cert-${c.id}`}
                      className="font-semibold underline"
                      onClick={() => reissue(c.id)}
                    >
                      Reemitir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </PanelShell>
  );
}
