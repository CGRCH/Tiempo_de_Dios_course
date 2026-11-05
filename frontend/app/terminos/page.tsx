import { LegalPage } from '@/components/LegalPage';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso">
      <p>
        Esta plataforma de cursos en línea es operada por Iglesia Tiempo de Dios (Santiago, Chile) con fines
        formativos y de discipulado. Al crear una cuenta o inscribirte en un curso aceptas usar el servicio con
        respeto, sin compartir credenciales ni redistribuir el material protegido.
      </p>
      <p>
        Los contenidos (videos, guías y certificados) son para uso personal del alumno inscrito. Nos reservamos el
        derecho de suspender cuentas que abusen del servicio o vulneren a otros participantes.
      </p>
      <p className="text-sm text-muted">
        Maqueta de demostración — texto orientativo, no constituye asesoría legal. Para consultas:{' '}
        <Link href="mailto:cursos@tiempodedios.cl" className="underline">
          cursos@tiempodedios.cl
        </Link>
        .
      </p>
    </LegalPage>
  );
}
