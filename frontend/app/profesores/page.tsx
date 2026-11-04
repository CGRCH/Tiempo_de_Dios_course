import { SiteFooter, SiteHeader } from '@/components/ui';

export default function ProfesoresPage() {
  return (
    <>
      <SiteHeader active="Profesores" />
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
        <h1 className="text-4xl font-black uppercase">Profesores</h1>
        <p className="mt-4 max-w-xl text-muted">
          Pastores y líderes de Tiempo de Dios que enseñan en la plataforma.
        </p>
      </section>
      <SiteFooter />
    </>
  );
}
