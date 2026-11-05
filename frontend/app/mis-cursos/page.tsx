'use client';

import { CourseCard } from '@/components/CourseCard';
import { SiteFooter, SiteHeader, Card, Pill } from '@/components/ui';
import { API_URL, Course , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MisCursosPage() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<{ course: Course; progress_percent: number }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me/enrollments/`, {
      credentials: 'include', headers: authHeaders(token),
    })
      .then((r) => r.json())
      .then((data) => setItems(data.results || data));
  }, [token]);

  return (
    <>
      <SiteHeader active="Mis cursos" />
      <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        <h1 className="text-4xl font-black uppercase">Mis cursos</h1>
        {!token && (
          <Card className="mt-8 p-8">
            <p className="mb-4 text-muted">Inicia sesión para ver tus cursos.</p>
            <Pill href="/ingresar">Ingresar</Pill>
          </Card>
        )}
        {token && items.length === 0 && (
          <p className="mt-8 text-muted">Aún no tienes cursos. Explora el catálogo.</p>
        )}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((e) => (
            <CourseCard key={e.course.id} course={e.course} />
          ))}
        </div>
        {user?.role === 'Profesor' && (
          <Link href="/panel/profesor" className="mt-8 inline-block font-semibold underline">
            Ir al panel de profesor →
          </Link>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
