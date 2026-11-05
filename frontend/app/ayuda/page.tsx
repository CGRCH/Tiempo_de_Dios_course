'use client';

import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { API_URL , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

type Ticket = { id: number; subject: string; status: string };

export default function AyudaPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = () => {
    if (!token) return;
    fetch(`${API_URL}/me/tickets/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then((d) => setTickets(d.results || d));
  };

  useEffect(load, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    await fetch(`${API_URL}/me/tickets/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({ subject, body, priority: 'medium' }),
    });
    setSubject('');
    setBody('');
    setSuccessMsg('Ticket enviado. Te responderemos pronto.');
    load();
  };

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-[700px] px-4 py-12">
        <h1 className="text-3xl font-black uppercase">Centro de ayuda</h1>
        <Card className="mt-8 p-6">
          <form data-testid="ticket-form" onSubmit={submit} className="space-y-3">
            <input
              data-testid="ticket-subject"
              className="w-full rounded-xl border px-4 py-2"
              placeholder="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <textarea
              data-testid="ticket-body"
              className="w-full rounded-xl border px-4 py-2"
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
        <ul className="mt-6 space-y-2" data-testid="ticket-list">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border p-3">
              <b>{t.subject}</b> — {t.status}
            </li>
          ))}
        </ul>
      </section>
      <SiteFooter />
    </>
  );
}
