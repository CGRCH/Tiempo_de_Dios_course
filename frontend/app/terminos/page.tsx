import { LegalPage, LegalSection } from '@/components/LegalPage';
import Link from 'next/link';

export default function TerminosPage() {
  return (
    <LegalPage title="Términos de uso">
      <LegalSection title="1. Quiénes somos">
        <p>
          Este sitio es una plataforma de formación en línea administrada por Iglesia Tiempo de Dios, con sede en
          Santiago de Chile. Los cursos tienen fines de enseñanza bíblica y discipulado cristiano. El dominio de
          contacto de la plataforma es{' '}
          <Link href="mailto:cursos@tiempodedios.cl">cursos@tiempodedios.cl</Link>.
        </p>
      </LegalSection>
      <LegalSection title="2. Aceptación">
        <p>
          Al registrarte, iniciar sesión o inscribirte en un curso, declaras haber leído estos términos y usar el
          servicio de buena fe. Si no estás de acuerdo, no utilices la plataforma.
        </p>
      </LegalSection>
      <LegalSection title="3. Cuenta y acceso">
        <p>
          Eres responsable de mantener la confidencialidad de tu usuario y contraseña. No compartas tu cuenta ni
          permitas que terceros accedan al contenido en tu nombre. Debes proporcionar datos veraces al registrarte.
        </p>
      </LegalSection>
      <LegalSection title="4. Contenidos y licencia de uso">
        <p>
          Los videos, guías, evaluaciones y certificados están protegidos por derecho de autor. Se te concede una
          licencia personal, no exclusiva e intransferible para ver y descargar materiales permitidos mientras
          mantengas una inscripción válida. Queda prohibida la copia masiva, reventa o publicación del material sin
          autorización escrita.
        </p>
      </LegalSection>
      <LegalSection title="5. Pagos e inscripciones">
        <p>
          En esta maqueta de demostración los pagos están simulados: no se procesan cargos reales con tarjeta. Cuando la
          plataforma pase a producción, los precios, medios de pago y políticas de reembolso se informarán en cada
          curso y en el flujo de checkout correspondiente.
        </p>
      </LegalSection>
      <LegalSection title="6. Conducta">
        <p>
          Debes tratar con respeto a profesores, alumnos y equipos de soporte. No se tolera acoso, spam, suplantación
          ni uso del servicio para fines ilegales. Podemos suspender o cerrar cuentas que vulneren estas normas.
        </p>
      </LegalSection>
      <LegalSection title="7. Limitación de responsabilidad (demostración)">
        <p>
          La plataforma se ofrece “tal cual” en fase de demostración. No garantizamos disponibilidad ininterrumpida ni
          ausencia de errores. El contenido formativo no sustituye consejo pastoral, legal, médico ni profesional
          especializado.
        </p>
      </LegalSection>
      <LegalSection title="8. Cambios y contacto">
        <p>
          Podemos actualizar estos términos; la fecha al inicio del documento reflejará la versión vigente. Consultas:{' '}
          <Link href="mailto:cursos@tiempodedios.cl">cursos@tiempodedios.cl</Link>.
        </p>
        <p className="text-sm">
          Nota: este texto es orientativo para la maqueta MVP y no reemplaza asesoría legal. Antes de un lanzamiento
          público, la iglesia deberá revisarlo con su equipo jurídico.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
