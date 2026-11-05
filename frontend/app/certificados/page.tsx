import { LegalPage } from '@/components/LegalPage';
import Link from 'next/link';

export default function CertificadosInfoPage() {
  return (
    <LegalPage title="Certificados">
      <p>
        Al completar un curso publicado recibirás un certificado digital en PDF con tu nombre, el título del curso y
        la fecha de emisión. Los certificados están disponibles en{' '}
        <Link href="/mis-certificados" className="font-semibold underline">
          Mis certificados
        </Link>{' '}
        una vez finalizado el 100&nbsp;% del contenido.
      </p>
      <p>
        El equipo de administración puede reemitir un certificado si hubo un error en los datos. En esta demostración
        los certificados son ficticios y no tienen validez académica oficial.
      </p>
    </LegalPage>
  );
}
