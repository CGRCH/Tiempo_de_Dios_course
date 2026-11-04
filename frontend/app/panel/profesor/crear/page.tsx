'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function CrearCursoPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const router = useRouter();
  const [title, setTitle] = useState('Curso QA E2E');
  const [error, setError] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const catsRes = await fetch(`${API_URL}/categories/`);
    const catsBody = await catsRes.json();
    const list = Array.isArray(catsBody) ? catsBody : catsBody.results || [];
    const category = list[0]?.id;
    if (!category) {
      setError('No hay categorías disponibles.');
      return;
    }
    const res = await fetch(`${API_URL}/teacher/courses/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: 'Curso creado en prueba E2E',
        category,
        learning_objectives: ['Objetivo QA'],
        proposed_price_clp: 19990,
      }),
    });
    const course = await res.json();
    if (!res.ok || !course.slug) {
      setError(course.detail || 'No se pudo crear el curso.');
      return;
    }
    router.push(`/panel/profesor/cursos/${course.slug}`);
  };

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <h1 className="text-3xl font-black uppercase">Crear curso</h1>
      <Card className="mt-6 p-6">
        <form data-testid="create-course-form" onSubmit={create} className="space-y-3">
          <input
            data-testid="course-title"
            className="w-full rounded-xl border px-4 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button data-testid="create-course-submit" type="submit" className="rounded-full bg-ink px-6 py-2 text-white">
            Crear borrador
          </button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      </Card>
    </PanelShell>
  );
}
