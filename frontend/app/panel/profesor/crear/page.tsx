'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL , authHeaders } from '@/lib/api';
import { formatApiError, normalizeList } from '@/lib/apiErrors';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function CrearCursoPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = title.trim();
    if (!trimmed) {
      setError('Escribe un título para el curso.');
      return;
    }
    const catsRes = await fetch(`${API_URL}/categories/`);
    const catsBody = await catsRes.json();
    const list = normalizeList<{ id: number }>(catsBody);
    const category = list[0]?.id;
    if (!category) {
      setError('No hay categorías disponibles.');
      return;
    }
    const res = await fetch(`${API_URL}/teacher/courses/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({
        title: trimmed,
        description: description.trim() || 'Describe aquí el contenido y objetivos del curso.',
        category,
        learning_objectives: ['Completar los objetivos de aprendizaje en el constructor.'],
        proposed_price_clp: 19990,
      }),
    });
    const course = await res.json().catch(() => ({}));
    if (!res.ok || !course.slug) {
      setError(formatApiError(course, 'No se pudo crear el curso.'));
      return;
    }
    router.push(`/panel/profesor/cursos/${course.slug}`);
  };

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <h1 className="text-3xl font-black uppercase">Crear curso</h1>
      <Card className="mt-6 p-6">
        <form data-testid="create-course-form" noValidate onSubmit={create} className="space-y-3">
          <label className="block text-sm font-medium">
            Título del curso
            <input
              data-testid="course-title"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Fundamentos de la fe"
            />
          </label>
          <label className="block text-sm font-medium">
            Descripción breve (opcional)
            <textarea
              className="mt-1 min-h-[80px] w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿Qué aprenderán los estudiantes?"
            />
          </label>
          <button data-testid="create-course-submit" type="submit" className="rounded-full bg-ink px-6 py-2 text-white">
            Crear borrador
          </button>
          {error && (
            <p className="text-sm text-red-700" role="alert" data-testid="create-course-error">
              {error}
            </p>
          )}
        </form>
      </Card>
    </PanelShell>
  );
}
