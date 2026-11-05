import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import type { ReactNode } from 'react';

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-[var(--ink)]">{title}</h2>
      <div className="space-y-2 text-muted [&_a]:font-semibold [&_a]:text-[var(--ink)] [&_a]:underline">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({
  title,
  updated = '5 de noviembre de 2026',
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader compact />
      <section className="mx-auto max-w-[720px] px-4 py-12 md:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Documento informativo</p>
        <h1 className="mt-2 text-3xl font-black uppercase">{title}</h1>
        <p className="mt-2 text-sm text-muted">Última actualización: {updated}</p>
        <Card className="mt-8 max-w-none space-y-8 p-8 text-[15px] leading-relaxed">
          {children}
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}
