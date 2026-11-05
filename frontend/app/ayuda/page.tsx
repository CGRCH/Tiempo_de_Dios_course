'use client';

import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { API_URL, authHeaders } from '@/lib/api';
import { normalizeList } from '@/lib/apiErrors';
import { loginPath } from '@/lib/authPaths';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type Ticket = { id: number; subject: string; status: string };

export default function AyudaPage() {
  const { token, user, authReady } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoadError('');
    fetch(`${API_URL}/me/tickets/`, { credentials: 'include', headers: authHeaders(token) })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          setTickets([]);
          setLoadError(typeof data?.detail === 'string' ? data.detail : 'No pudimos cargar tus tickets.');
          return;
        }
        setTickets(normalizeList<Ticket>(data));
      })
      .catch(() => {
        setTickets([]);
        setLoadError('No pudimos cargar tus tickets.');
      });
  }, [token]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace(loginPath('/ayuda'));
      return;
    }
    load();
  }, [authReady, user, router, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch(`${API_URL}/me/tickets/`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(token),
      body: JSON.stringify({ subject, body, priority: 'medium' }),
    });
    if (!res.ok) {
      setLoadError('No se pudo enviar el ticket. Revisa los campos e intenta de nuevo.');
      return;
    }
    setSubject('');
    setBody('');
    setSuccessMsg('Ticket enviado. Te responderemos pronto.');
    load();
  };

  if (!authReady || !user) {
    return (
      <>
        <SiteHeader />
        <div className="p-10 text-center text-muted">Cargando…</div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-[700px] px-4 py-12">
        <h1 className="text-3xl font-black uppercase">Centro de ayuda</h1>
        <p className="mt-2 text-sm text-muted">
          ¿Problemas con un curso o tu cuenta? Escríbenos y el equipo de soporte te responderá.
        </p>
        <Card className="mt-8 p-6">
          <form data-testid="ticket-form" onSubmit={submit} className="space-y-3">
            <input
              data-testid="ticket-subject"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2"
              placeholder="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              data-testid="ticket-body"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2"
              placeholder="Describe tu consulta"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <button type="submit" data-testid="ticket-submit" className="rounded-full bg-ink px-6 py-2 text-white">
              Enviar ticket
            </button>
            {successMsg && (
              <p className="text-sm text-[#1d5e2e]" data-testid="ticket-success">
                {successMsg}
              </p>
            )}
          </form>
        </Card>
        {loadError && <p className="mt-4 text-sm text-red-700">{loadError}</p>}
        <ul className="mt-6 space-y-2" data-testid="ticket-list">
          {tickets.length === 0 && !loadError && (
            <li className="rounded-xl border border-[var(--border)] p-4 text-sm text-muted" data-testid="ticket-empty">
              Aún no tienes tickets. Usa el formulario para contactarnos.
            </li>
          )}
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border border-[var(--border)] p-3">
              <b>{t.subject}</b> — {t.status}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-muted">
          También puedes escribir a{' '}
          <Link href="mailto:cursos@tiempodedios.cl" className="font-semibold underline">
            cursos@tiempodedios.cl
          </Link>
          .
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
