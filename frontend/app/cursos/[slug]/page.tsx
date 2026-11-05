'use client';

import { CourseCover } from '@/components/CourseCover';
import { Card, Headline, Pill, SectionTitle, SiteFooter, SiteHeader } from '@/components/ui';
import { firstPreviewLesson } from '@/lib/courseLessons';
import { API_URL, Course, Lesson, formatCLP } from '@/lib/api';
import { registerPath, loginPath } from '@/lib/authPaths';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { token, user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [openModule, setOpenModule] = useState(0);
  const [checkoutMsg, setCheckoutMsg] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  const loadCourse = () => {
    fetch(`${API_URL}/courses/${slug}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setCourse);
  };

  useEffect(() => {
    loadCourse();
  }, [slug, token]);

  useEffect(() => {
    if (!token) {
      setEnrolled(false);
      return;
    }
    fetch(`${API_URL}/courses/${slug}/progress/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { enrolled: false }))
      .then((d) => setEnrolled(!!d.enrolled));
  }, [slug, token]);

  const previewLesson = useMemo(() => (course ? firstPreviewLesson(course) : null), [course]);

  const lessonHref = (l: Lesson) => `/aprender/${slug}/leccion/${l.id}`;

  const canOpenLesson = (l: Lesson) => enrolled || l.is_preview;

  const enroll = async () => {
    const free = course?.is_free || course?.price_clp === 0;
    const afterAuth = free ? `/cursos/${slug}` : `/checkout/${slug}`;
    if (!token) {
      router.push(registerPath(afterAuth));
      return;
    }
    if (!free) {
      router.push(`/checkout/${slug}`);
      return;
    }
    const res = await fetch(`${API_URL}/courses/${slug}/enroll/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method: 'webpay' }),
    });
    if (res.ok) {
      setEnrolled(true);
      setCheckoutMsg('¡Ya estás inscrito!');
    }
  };

  const goToLearning = () => {
    const target = previewLesson || course?.modules?.[0]?.lessons?.[0];
    if (target) router.push(lessonHref(target));
    else router.push('/mis-cursos');
  };

  if (!course) {
    return (
      <>
        <SiteHeader />
        <div className="p-10 text-center text-muted">Cargando curso…</div>
      </>
    );
  }

  const free = course.is_free || course.price_clp === 0;

  return (
    <>
      <SiteHeader active="Cursos" />
      <section className="px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-[1280px] items-start gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="mb-4 text-sm text-muted">
              Cursos › {course.category_name}
            </p>
            <Headline className="!text-[clamp(2rem,6vw,4.75rem)]">
              {course.title.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="serif normal-case">{course.title.split(' ').slice(-1)}</span>
            </Headline>
            <p className="mt-5 max-w-2xl text-lg text-muted">{course.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-5 text-[15px]">
              <span className="inline-flex items-center gap-2 font-bold">
                <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#d9d3c7] text-xs">
                  {course.teacher_name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)}
                </span>
                {course.teacher_name}
              </span>
              <span>
                <span className="text-[#b07a00]">★</span> {course.rating_display} ({course.student_count}{' '}
                estudiantes)
              </span>
              <span>{course.duration_label}</span>
            </div>

            {course.learning_objectives && (
              <Card className="mt-10 p-8">
                <SectionTitle className="!text-[26px]">
                  Lo que <span className="serif normal-case">aprenderás</span>
                </SectionTitle>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {course.learning_objectives.map((o) => (
                    <div key={o}>✓ &nbsp;{o}</div>
                  ))}
                </div>
              </Card>
            )}

            <SectionTitle className="mt-11 !text-[26px]">Temario</SectionTitle>
            <p className="mb-4 text-muted">
              {course.modules?.length || 0} módulos · {course.lesson_count || 0} lecciones ·{' '}
              {course.duration_label}
            </p>
            <Card className="overflow-hidden">
              {course.modules?.map((mod, idx) => (
                <div key={mod.id} className="border-b border-[#eee] px-5 py-4 last:border-0">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left font-bold"
                    onClick={() => setOpenModule(openModule === idx ? -1 : idx)}
                  >
                    <span>
                      {openModule === idx ? '−' : '+'} &nbsp;Módulo {idx + 1}: {mod.title}
                    </span>
                    <span className="text-sm font-medium text-muted">
                      {mod.lessons.length} lecciones
                    </span>
                  </button>
                  {openModule === idx && (
                    <div className="mt-3 space-y-2 border-t border-[#f0ede8] pt-3 text-[15px]">
                      {mod.lessons.map((l) =>
                        canOpenLesson(l) ? (
                          <Link
                            key={l.id}
                            href={lessonHref(l)}
                            data-testid={`syllabus-lesson-${l.id}`}
                            className="flex justify-between hover:underline"
                          >
                            <span>▶ &nbsp;{l.title}</span>
                            <span className="text-muted">
                              {Math.floor(l.duration_seconds / 60)}:
                              {String(l.duration_seconds % 60).padStart(2, '0')}
                            </span>
                          </Link>
                        ) : (
                          <div key={l.id} className="flex justify-between text-muted">
                            <span>🔒 &nbsp;{l.title}</span>
                            <span>
                              {Math.floor(l.duration_seconds / 60)}:
                              {String(l.duration_seconds % 60).padStart(2, '0')}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          </div>

          <aside className="lg:sticky lg:top-24">
            <Card className="overflow-hidden">
              <div className="relative flex h-[200px] items-center justify-center">
                <CourseCover course={course} className="absolute inset-0 h-full w-full object-cover" />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl">
                  ▶
                </span>
              </div>
              <div className="p-6">
                <div className="text-4xl font-black">
                  {free ? 'Gratis' : formatCLP(course.price_clp)}{' '}
                  {!free && <span className="text-base font-medium text-muted">CLP</span>}
                </div>
                <p className="mb-4 text-sm text-muted">Pago único · acceso de por vida</p>
                {enrolled ? (
                  <Pill className="w-full" data-testid="continue-learning" onClick={goToLearning}>
                    Ir al curso
                  </Pill>
                ) : (
                  <>
                    <Pill className="w-full" data-testid="enroll-button" onClick={enroll}>
                      Inscribirme
                    </Pill>
                    {!user && (
                      <p className="mt-2 text-center text-sm text-muted" data-testid="enroll-auth-hint">
                        <Link href={loginPath(free ? `/cursos/${slug}` : `/checkout/${slug}`)} className="font-semibold underline">
                          Ingresar
                        </Link>
                        {' · '}
                        <Link
                          href={registerPath(free ? `/cursos/${slug}` : `/checkout/${slug}`)}
                          data-testid="course-register-link"
                          className="font-semibold underline"
                        >
                          Crear cuenta
                        </Link>
                      </p>
                    )}
                  </>
                )}
                {previewLesson && (
                  <Pill
                    variant="ghost"
                    className="mt-2 w-full"
                    href={lessonHref(previewLesson)}
                    data-testid="preview-lesson-link"
                  >
                    Ver lección gratis
                  </Pill>
                )}
                {checkoutMsg && (
                  <p className="mt-3 text-sm text-[#1d5e2e]" data-testid="enroll-message">
                    {checkoutMsg}
                  </p>
                )}
                {enrolled && !checkoutMsg && (
                  <p className="mt-3 text-sm text-[#1d5e2e]" data-testid="enrolled-badge">
                    Ya estás inscrito en este curso.
                  </p>
                )}
                <ul className="mt-5 grid gap-2 text-[15px]">
                  <li>
                    <b>Certificado incluido</b>
                  </li>
                  <li>{course.lesson_count} lecciones en video</li>
                  <li>Guías de estudio PDF</li>
                  <li>Móvil y computador</li>
                </ul>
                <p className="mt-4 text-xs text-muted">Pago seguro con Webpay · Garantía de 14 días</p>
              </div>
            </Card>
          </aside>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
