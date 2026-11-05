'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Headline, Pill, Tag } from '@/components/ui';
import { API_URL, Course } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export default function ProfesorPanelPage() {
  const { token, user } = useAuth();
  const nav = useProfesorNav();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Record<string, string | number | boolean>>({});

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/teacher/courses/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCourses(d.results || d));
    fetch(`${API_URL}/teacher/stats/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats);
  }, [token]);

  const statusTone = (s: string) =>
    s === 'published' ? 'ok' : s === 'review' ? 'rev' : s === 'rejected' ? 'red' : 'dr';
  const statusLabel: Record<string, string> = {
    published: 'Publicado',
    review: 'En revisión',
    draft: 'Borrador',
    rejected: 'Rechazado',
  };

  const reviewCourses = useMemo(() => courses.filter((c) => c.status === 'review'), [courses]);
  const rejectedCourses = useMemo(() => courses.filter((c) => c.status === 'rejected'), [courses]);

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-muted">Hola, {user?.first_name || 'Profesor'} 👋</p>
          <Headline className="!text-[56px]">
            Mis <span className="serif normal-case">cursos</span>
          </Headline>
        </div>
        <Pill href="/panel/profesor/crear" data-testid="create-course-link">
          ＋ Crear curso
        </Pill>
      </div>
      <div className="mb-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Estudiantes totales', stats.total_students || '1.926'],
          ['Cursos publicados', stats.published_courses || 2],
          ['Valoración media', stats.average_rating || '4,9 ★'],
          ['Preguntas sin responder', stats.unanswered_questions || 7],
        ].map(([label, value]) => (
          <Card key={String(label)} className="p-5">
            <span className="text-sm text-muted">{label}</span>
            <b className="mt-1 block text-3xl font-black">{String(value)}</b>
          </Card>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              {['Curso', 'Estado', 'Estudiantes', 'Valoración', 'Actualizado', ''].map((h) => (
                <th key={h} className="border-b border-[#eee] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id} className="border-b border-[#f0ede8]">
                <td className="px-4 py-3.5 font-bold">{c.title}</td>
                <td className="px-4 py-3.5">
                  <Tag tone={statusTone(c.status || 'draft')}>
                    {statusLabel[c.status || 'draft'] || c.status}
                  </Tag>
                </td>
                <td className="px-4 py-3.5">{c.student_count}</td>
                <td className="px-4 py-3.5">{c.rating_display}</td>
                <td className="px-4 py-3.5 text-muted">reciente</td>
                <td className="px-4 py-3.5 font-semibold">
                  <Link href={`/panel/profesor/cursos/${c.slug}`} className="underline">
                    Editar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {reviewCourses.map((c) => (
        <Card
          key={c.id}
          className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6"
          data-testid={`review-banner-${c.slug}`}
        >
          <div>
            <b>“{c.title}” está en revisión</b>
            <p className="text-sm text-muted">El equipo de soporte lo revisará en 1–2 días hábiles.</p>
          </div>
          <Pill
            variant="ghost"
            href={`/panel/profesor/cursos/${c.slug}?tab=review`}
            data-testid={`review-details-${c.slug}`}
          >
            Ver detalles
          </Pill>
        </Card>
      ))}
      {rejectedCourses.map((c) => (
        <Card
          key={c.id}
          className="mt-6 flex flex-wrap items-center justify-between gap-4 border-red-200 p-6 dark:border-red-900"
          data-testid={`rejected-banner-${c.slug}`}
        >
          <div>
            <b>“{c.title}” fue rechazado</b>
            <p className="text-sm text-muted">Revisa el motivo y actualiza el curso antes de reenviarlo.</p>
          </div>
          <Pill variant="ghost" href={`/panel/profesor/cursos/${c.slug}?tab=review`} data-testid={`rejected-details-${c.slug}`}>
            Ver detalles
          </Pill>
        </Card>
      ))}
    </PanelShell>
  );
}
