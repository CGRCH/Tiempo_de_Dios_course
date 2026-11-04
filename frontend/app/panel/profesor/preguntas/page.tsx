'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useEffect, useState } from 'react';

type Question = {
  id: number;
  course_title: string;
  student_name: string;
  lesson_title?: string;
  question: string;
  answer: string;
  is_answered: boolean;
};

export default function ProfesorPreguntasPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const [rows, setRows] = useState<Question[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const load = () => {
    if (!token) return;
    fetch(`${API_URL}/teacher/questions/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : d.results || []));
  };

  useEffect(() => {
    load();
  }, [token]);

  const reply = async (id: number) => {
    const answer = drafts[id]?.trim();
    if (!answer) return;
    await fetch(`${API_URL}/teacher/questions/${id}/reply/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    });
    load();
  };

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Preguntas">
      <h1 className="text-3xl font-black uppercase">Preguntas</h1>
      <Card className="mt-6 p-6" data-testid="teacher-questions-page">
        {rows.length === 0 ? (
          <p className="text-muted">No hay preguntas de estudiantes.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((q) => (
              <li key={q.id} className="border-t border-[#f0ede8] pt-4 first:border-0 first:pt-0">
                <div className="text-xs text-muted">
                  {q.course_title} · {q.student_name}
                  {q.lesson_title ? ` · ${q.lesson_title}` : ''}
                </div>
                <p className="mt-1 font-medium">{q.question}</p>
                {q.is_answered ? (
                  <p className="mt-2 text-sm text-[#1d5e2e]">Respuesta: {q.answer}</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm"
                      placeholder="Escribe tu respuesta…"
                      value={drafts[q.id] || ''}
                      onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      data-testid={`reply-question-${q.id}`}
                      className="rounded-full bg-ink px-4 py-2 text-sm text-white"
                      onClick={() => reply(q.id)}
                    >
                      Responder
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PanelShell>
  );
}
