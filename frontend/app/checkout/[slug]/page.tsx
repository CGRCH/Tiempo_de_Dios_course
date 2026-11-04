'use client';

import { CourseCover } from '@/components/CourseCover';
import { Card, Headline, Pill, SectionTitle, SiteFooter, SiteHeader, Tag } from '@/components/ui';
import { firstPreviewLesson } from '@/lib/courseLessons';
import { API_URL, Course, formatCLP } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CheckoutPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { token } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/ingresar');
      return;
    }
    fetch(`${API_URL}/courses/${slug}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setCourse);

    fetch(`${API_URL}/courses/${slug}/enroll/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ method: 'webpay' }),
    }).then(async (res) => {
      if (res.status === 402) {
        const data = await res.json();
        setTransactionId(data.transaction_id);
      } else if (res.ok) {
        router.replace(`/cursos/${slug}`);
      }
    });
  }, [slug, token, router]);

  const confirm = async () => {
    if (!transactionId || !token) return;
    setBusy(true);
    const res = await fetch(`${API_URL}/checkout/confirm/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction_id: transactionId }),
    });
    setBusy(false);
    if (res.ok) {
      setMsg('¡Pago confirmado! Ya estás inscrito.');
      const enrollment = await res.json();
      const preview = course ? firstPreviewLesson(course) : null;
      const lessonId =
        preview?.id ||
        enrollment?.current_lesson_id ||
        course?.modules?.[0]?.lessons?.[0]?.id;
      const dest = lessonId ? `/aprender/${slug}/leccion/${lessonId}` : `/cursos/${slug}`;
      setTimeout(() => router.push(dest), 800);
    }
  };

  if (!course) {
    return (
      <>
        <SiteHeader />
        <div className="p-10 text-center text-muted">Preparando checkout…</div>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-lg px-4 py-12">
        <Headline className="!text-4xl">Checkout simulado</Headline>
        <Card className="mt-6 p-6" data-testid="checkout-page">
          <CourseCover course={course} className="mb-4 h-40 w-full rounded-xl object-cover" />
          <h2 className="text-xl font-bold">{course.title}</h2>
          <p className="mt-2 text-3xl font-black">{formatCLP(course.price_clp)}</p>
          <p className="mt-2 text-sm text-muted">Webpay Plus (simulado) · no se realizará un cargo real</p>
          <Pill
            className="mt-6 w-full"
            data-testid="checkout-confirm"
            onClick={confirm}
            disabled={busy || !transactionId}
          >
            {busy ? 'Procesando…' : 'Confirmar pago'}
          </Pill>
          {msg && (
            <p className="mt-3 text-sm text-[#1d5e2e]" data-testid="checkout-message">
              {msg}
            </p>
          )}
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}
