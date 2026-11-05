import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import type { ReactNode } from 'react';

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader compact />
      <section className="mx-auto max-w-[720px] px-4 py-12 md:px-8">
        <h1 className="text-3xl font-black uppercase">{title}</h1>
        <Card className="prose prose-neutral mt-8 max-w-none space-y-4 p-8 text-[15px] leading-relaxed dark:prose-invert">
          {children}
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}
