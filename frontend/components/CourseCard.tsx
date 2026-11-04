import type { Course } from '@/lib/api';
import { coverStyle, formatCLP } from '@/lib/api';
import Link from 'next/link';
import { Card, Tag } from './ui';

export function CourseCard({ course }: { course: Course }) {
  const free = course.is_free || course.price_clp === 0;
  return (
    <Link href={`/cursos/${course.slug}`} className="block">
      <Card className="overflow-hidden transition hover:shadow-md">
        <div className="h-[110px] md:h-[170px]" style={coverStyle(course.cover_placeholder)} />
        <div className="p-3 md:p-[18px]">
          <Tag>{course.duration_label}</Tag>
          <h3 className="mt-2 text-[15px] font-extrabold leading-tight md:text-lg">{course.title}</h3>
          <p className="text-sm text-muted">{course.teacher_name}</p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span>
              <span className="text-[#b07a00]">★</span> {course.rating_display}
            </span>
            {free ? (
              <span className="font-extrabold text-[#1d5e2e]">Gratis</span>
            ) : course.price_clp != null ? (
              <span className="font-extrabold">{formatCLP(course.price_clp)}</span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
