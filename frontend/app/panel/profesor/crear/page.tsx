'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const nav = [
  { href: '/panel/profesor', label: 'Mis cursos' },
  { href: '/panel/profesor/estudiantes', label: 'Estudiantes' },
  { href: '/panel/profesor/preguntas', label: 'Preguntas' },
  { href: '/panel/profesor/resenas', label: 'Reseñas' },
  { href: '/panel/profesor/perfil', label: 'Perfil' },
];

export default function CrearCursoPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('Curso QA E2E');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const cats = await fetch(`${API_URL}/categories/`).then((r) => r.json());
    const category = cats[0]?.id;
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
        </form>
      </Card>
    </PanelShell>
  );
}
