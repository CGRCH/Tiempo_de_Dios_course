'use client';

import { CourseBuilder } from '@/components/course-builder/CourseBuilder';
import { PanelShell } from '@/components/PanelShell';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useParams } from 'next/navigation';

export default function TeacherCourseEditPage() {
  const { slug } = useParams() as { slug: string };
  const { token } = useAuth();
  const nav = useProfesorNav();

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <h1 className="text-3xl font-black uppercase">Constructor de curso</h1>
      <CourseBuilder slug={slug} token={token} />
    </PanelShell>
  );
}
