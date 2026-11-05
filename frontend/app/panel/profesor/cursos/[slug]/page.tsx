'use client';

import { CourseBuilder } from '@/components/course-builder/CourseBuilder';
import { PanelShell } from '@/components/PanelShell';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TeacherCourseEditInner() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab =
    tabParam === 'review' || tabParam === 'curriculum' || tabParam === 'info' ? tabParam : undefined;
  const { token } = useAuth();
  const nav = useProfesorNav();

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <h1 className="text-3xl font-black uppercase">Constructor de curso</h1>
      <CourseBuilder slug={slug} token={token} initialTab={initialTab} />
    </PanelShell>
  );
}

export default function TeacherCourseEditPage() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Cargando constructor…</div>}>
      <TeacherCourseEditInner />
    </Suspense>
  );
}
