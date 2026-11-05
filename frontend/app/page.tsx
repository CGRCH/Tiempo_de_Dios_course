'use client';

import { CourseCover } from '@/components/CourseCover';
import { CourseCard } from '@/components/CourseCard';
import { Card, Headline, Pill, ProgressBar, SectionTitle, SiteFooter, SiteHeader } from '@/components/ui';
import { API_URL, Course , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const filters = [
  'Todos',
  'Fundamentos',
  'Estudios bíblicos',
  'Liderazgo',
  'Familia',
  'Oración',
  'Música',
  'Gratis',
];

const filterSlug: Record<string, string> = {
  Fundamentos: 'fundamentos',
  'Estudios bíblicos': 'estudios-biblicos',
  Liderazgo: 'liderazgo',
  Familia: 'familia',
  Oración: 'oracion',
  Música: 'musica',
};

export default function HomePage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCount, setCourseCount] = useState(0);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [continueCourse, setContinueCourse] = useState<{
    course: Course;
    progress_percent: number;
    current_lesson_title: string;
    current_lesson_id: number;
  } | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (activeFilter === 'Gratis') params.set('free', '1');
    else if (activeFilter !== 'Todos') params.set('category', filterSlug[activeFilter] || '');
    const res = await fetch(`${API_URL}/courses/?${params}`, { cache: 'no-store' });
    const data = await res.json();
    setCourses(data.results || data);
    setCourseCount(typeof data.count === 'number' ? data.count : (data.results || data).length);
  }, [query, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/me/continue/`, {
      credentials: 'include', headers: authHeaders(token),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setContinueCourse)
      .catch(() => setContinueCourse(null));
  }, [token]);

  const countLabel = useMemo(
    () => `${courseCount} curso${courseCount === 1 ? '' : 's'} disponible${courseCount === 1 ? '' : 's'}`,
    [courseCount],
  );

  return (
    <>
      <SiteHeader active="Cursos" />
      <section className="px-4 pb-8 pt-10 md:px-8">
        <div className="mx-auto grid max-w-[1280px] items-end gap-8 md:grid-cols-2">
          <div>
            <p className="mb-5 inline-block rounded-full bg-[#efece6] px-2.5 py-1 text-xs font-semibold">
              Escuela online · Tiempo de Dios
            </p>
            <Headline>
              Aprende a <span className="serif normal-case">caminar</span> en la fe
            </Headline>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Cursos bíblicos y de formación creados por nuestros pastores y líderes. A tu ritmo, desde
              cualquier lugar.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Pill href="#catalogo">Explorar cursos →</Pill>
              <Pill href="#catalogo" variant="ghost">
                Cursos gratis
              </Pill>
            </div>
          </div>
          <div
            className="h-[280px] rounded-3xl md:h-[380px]"
            style={{
              backgroundImage: 'url(/img/inicio.png), linear-gradient(135deg,#cfc8bb,#6b645c)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        </div>
      </section>

      {continueCourse?.course && (
        <div className="mx-auto max-w-[1280px] px-4 md:px-8">
          <Card className="flex flex-wrap items-center gap-5 p-5">
            <CourseCover course={continueCourse.course} className="h-24 w-[150px] flex-none rounded-xl object-cover" />
            <div className="min-w-[220px] flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">Seguir aprendiendo</div>
              <div className="text-xl font-extrabold">{continueCourse.course.title}</div>
              <div className="text-sm text-muted">
                Lección en curso · {continueCourse.current_lesson_title}
              </div>
              <div className="mt-2">
                <ProgressBar value={continueCourse.progress_percent} />
              </div>
            </div>
            <Pill
              href={`/aprender/${continueCourse.course.slug}/leccion/${continueCourse.current_lesson_id}`}
            >
              ▶ Continuar
            </Pill>
          </Card>
        </div>
      )}

      <section id="catalogo" className="px-4 py-12 md:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <SectionTitle>
              Todos los <span className="serif normal-case">cursos</span>
            </SectionTitle>
            <span className="text-muted" data-testid="course-count-label">
              {countLabel}
            </span>
          </div>
          <Card className="mb-4 flex items-center gap-3 rounded-full p-1.5 pl-5">
            <span aria-hidden>⌕</span>
            <input
              data-testid="catalog-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Buscar cursos, temas o profesores…"
              className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base outline-none"
            />
            <Pill onClick={load} className="!px-5 !py-2.5 text-sm">
              Buscar
            </Pill>
          </Card>
          <div className="mb-8 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activeFilter === f
                    ? 'bg-ink text-white'
                    : 'border-[1.5px] border-ink bg-transparent'
                }`}
                data-testid={`filter-${f}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
