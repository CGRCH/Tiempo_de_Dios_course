import { LegalPage } from '@/components/LegalPage';
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <LegalPage title="Privacidad">
      <p>
        Recopilamos los datos necesarios para tu cuenta (nombre, correo, progreso en cursos y certificados emitidos).
        No vendemos tu información. Usamos cookies de sesión para mantener tu ingreso seguro.
      </p>
      <p>
        Puedes solicitar corrección o eliminación de tu cuenta escribiendo a{' '}
        <Link href="mailto:cursos@tiempodedios.cl" className="underline">
          cursos@tiempodedios.cl
        </Link>
        . Conservamos registros de transacciones simuladas solo durante la fase de demostración de esta maqueta.
      </p>
      <p className="text-sm text-muted">
        En producción, esta política se actualizará conforme a la normativa chilena aplicable.
      </p>
    </LegalPage>
  );
}
