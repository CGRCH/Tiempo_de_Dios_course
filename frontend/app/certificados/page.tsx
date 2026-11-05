import { LegalPage, LegalSection } from '@/components/LegalPage';
import Link from 'next/link';

export default function CertificadosInfoPage() {
  return (
    <LegalPage title="Certificados de finalización">
      <LegalSection title="1. Qué certificamos">
        <p>
          Al completar el 100&nbsp;% de las lecciones de un curso publicado en la plataforma de Iglesia Tiempo de Dios,
          se genera un certificado digital en formato PDF con tu nombre, el título del curso y la fecha de emisión.
        </p>
      </LegalSection>
      <LegalSection title="2. Dónde descargarlo">
        <p>
          Inicia sesión y entra a{' '}
          <Link href="/mis-certificados">Mis certificados</Link>. Allí verás los documentos disponibles o el estado
          “Generando…” mientras se prepara el archivo.
        </p>
      </LegalSection>
      <LegalSection title="3. Requisitos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Estar inscrito en el curso correspondiente.</li>
          <li>Completar todas las lecciones obligatorias del temario.</li>
          <li>Mantener datos de perfil correctos (nombre y apellido).</li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Reemisión y correcciones">
        <p>
          Si detectas un error en tu nombre o en los datos del curso, contacta a{' '}
          <Link href="mailto:cursos@tiempodedios.cl">cursos@tiempodedios.cl</Link> o abre un ticket en el{' '}
          <Link href="/ayuda">centro de ayuda</Link>. El equipo de administración puede reemitir un certificado cuando
          corresponda.
        </p>
      </LegalSection>
      <LegalSection title="5. Alcance del documento">
        <p>
          El certificado acredita la finalización del curso en esta plataforma de formación de la iglesia. No equivale a
          título universitario ni a certificación estatal, salvo que se indique expresamente en un programa futuro.
        </p>
        <p className="text-sm">
          En la maqueta de demostración, los certificados y nombres de cursos pueden ser ficticios; sirven para probar el
          flujo técnico de emisión y descarga.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
