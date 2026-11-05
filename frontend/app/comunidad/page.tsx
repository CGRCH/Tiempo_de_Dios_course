'use client';

import { Card, Headline, Pill, SiteFooter, SiteHeader } from '@/components/ui';
import Link from 'next/link';

export default function ComunidadPage() {
  return (
    <>
      <SiteHeader active="Comunidad" />
      <section className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        <Headline className="!text-[clamp(2rem,6vw,3.5rem)]">
          Nuestra <span className="serif normal-case">comunidad</span>
        </Headline>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          La plataforma de cursos de Iglesia Tiempo de Dios (Santiago, Chile) conecta a quienes quieren crecer en la
          fe con pastores y profesores de la iglesia. Más allá de los videos, buscamos acompañamiento y conversación
          respetuosa.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="p-8" data-testid="comunidad-study-groups">
            <h2 className="text-xl font-black">Grupos de estudio</h2>
            <p className="mt-3 text-muted">
              Pronto podrás unirte a grupos por curso o tema (por ejemplo, Fundamentos o Estudios bíblicos) para
              repasar lecciones y orar juntos. Esta versión de demostración aún no incluye chat en vivo ni foros.
            </p>
            <Pill href="/" variant="ghost" className="mt-5">
              Explorar cursos →
            </Pill>
          </Card>
          <Card className="p-8" data-testid="comunidad-support">
            <h2 className="text-xl font-black">¿Necesitas ayuda?</h2>
            <p className="mt-3 text-muted">
              Si tienes dudas técnicas sobre tu cuenta, pagos simulados o certificados, el equipo de soporte de la
              plataforma puede ayudarte por ticket.
            </p>
            <Pill href="/ayuda" variant="ghost" className="mt-5">
              Centro de ayuda →
            </Pill>
          </Card>
        </div>

        <Card
          className="mt-8 border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center"
          data-testid="comunidad-coming-soon"
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Próximamente</p>
          <p className="mt-2 text-lg font-bold">Foro y eventos en línea</p>
          <p className="mx-auto mt-2 max-w-lg text-muted">
            Estamos preparando espacios para anuncios de la iglesia, encuentros en vivo y testimonios de alumnos. Mientras
            tanto, sigue aprendiendo en{' '}
            <Link href="/mis-cursos" className="font-semibold underline text-[var(--ink)]">
              Mis cursos
            </Link>
            .
          </p>
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}
