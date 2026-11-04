'use client';

import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

type Cert = {
  id: number;
  verification_code: string;
  course_title: string;
  pdf_url: string | null;
};

export default function MisCertificadosPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<Cert[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me/certificates/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(d.results || d));
  }, [token]);

  return (
    <>
      <SiteHeader active="Mis cursos" />
      <section className="mx-auto max-w-[900px] px-4 py-12">
        <h1 className="text-3xl font-black uppercase">Mis certificados</h1>
        <div className="mt-8 space-y-4" data-testid="cert-list">
          {items.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <b>{c.course_title}</b>
                <p className="text-sm text-muted">Código: {c.verification_code}</p>
              </div>
              {c.pdf_url ? (
                <a
                  data-testid={`cert-download-${c.id}`}
                  href={
                    c.pdf_url.startsWith('http')
                      ? c.pdf_url
                      : `${API_URL.replace('/api', '')}${c.pdf_url}`
                  }
                  className="font-semibold underline"
                  download
                >
                  Descargar PDF
                </a>
              ) : (
                <span className="text-sm text-muted">Generando PDF…</span>
              )}
            </Card>
          ))}
          {token && items.length === 0 && (
            <p className="text-muted">Completa un curso para obtener tu certificado.</p>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
