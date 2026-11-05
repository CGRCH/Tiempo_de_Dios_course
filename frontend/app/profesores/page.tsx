'use client';

import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { teacherInitials } from '@/lib/courseDisplay';
import { API_URL, Course } from '@/lib/api';
import { normalizeList } from '@/lib/apiErrors';
import { useEffect, useMemo, useState } from 'react';

type TeacherCard = { name: string; courses: number; categories: Set<string> };

export default function ProfesoresPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/courses/?page_size=100`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setCourses(normalizeList<Course>(d)))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const teachers = useMemo(() => {
    const map = new Map<string, TeacherCard>();
    for (const c of courses) {
      const name = c.teacher_name?.trim();
      if (!name) continue;
      const entry = map.get(name) || { name, courses: 0, categories: new Set<string>() };
      entry.courses += 1;
      if (c.category_name) entry.categories.add(c.category_name);
      map.set(name, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [courses]);

  return (
    <>
      <SiteHeader active="Profesores" />
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <h1 className="text-4xl font-black uppercase">Profesores</h1>
        <p className="mt-4 max-w-xl text-muted">
          Pastores y líderes de Tiempo de Dios que enseñan en la plataforma de cursos en línea.
        </p>
        {loading && <p className="mt-10 text-muted">Cargando…</p>}
        {!loading && teachers.length === 0 && (
          <Card className="mt-10 p-8 text-muted" data-testid="teachers-empty">
            Pronto publicaremos el listado de profesores.
          </Card>
        )}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <Card key={t.name} className="p-6" data-testid={`teacher-card-${t.name.replace(/\s+/g, '-').toLowerCase()}`}>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d9d3c7] text-lg font-bold dark:bg-[#3a3835]">
                  {teacherInitials(t.name)}
                </span>
                <div>
                  <h2 className="text-lg font-black">{t.name}</h2>
                  <p className="text-sm text-muted">
                    {t.courses} curso{t.courses === 1 ? '' : 's'} · {Array.from(t.categories).slice(0, 2).join(', ')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
