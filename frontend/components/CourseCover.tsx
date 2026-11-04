import { Course, courseCoverUrl } from '@/lib/api';

export function CourseCover({
  course,
  className,
}: {
  course: Pick<Course, 'cover_url' | 'cover_placeholder' | 'title'>;
  className?: string;
}) {
  const src = courseCoverUrl(course);
  return (
    <img
      src={src}
      alt=""
      className={className}
      loading="lazy"
      onError={(e) => {
        const t = e.currentTarget;
        t.onerror = null;
        t.src = '/img/inicio.png';
      }}
    />
  );
}
