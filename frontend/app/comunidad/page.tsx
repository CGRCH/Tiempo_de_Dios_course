import { SiteFooter, SiteHeader } from '@/components/ui';

export default function ComunidadPage() {
  return (
    <>
      <SiteHeader active="Comunidad" />
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <h1 className="text-4xl font-black uppercase">Comunidad</h1>
        <p className="mt-4 max-w-xl text-muted">
          Espacio para grupos de estudio y conversación (próximamente).
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
