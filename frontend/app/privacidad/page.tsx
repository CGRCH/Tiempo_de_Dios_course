import { LegalPage, LegalSection } from '@/components/LegalPage';
import Link from 'next/link';

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad">
      <LegalSection title="1. Responsable del tratamiento">
        <p>
          Iglesia Tiempo de Dios (Santiago, Chile) administra esta plataforma de cursos en línea. Para ejercer tus
          derechos o hacer consultas sobre privacidad, escribe a{' '}
          <Link href="mailto:cursos@tiempodedios.cl">cursos@tiempodedios.cl</Link>.
        </p>
      </LegalSection>
      <LegalSection title="2. Datos que recopilamos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Identificación de cuenta: nombre, apellido, nombre de usuario, correo electrónico.</li>
          <li>Datos de aprendizaje: cursos inscritos, progreso, notas internas y certificados emitidos.</li>
          <li>Soporte: mensajes que envíes por el centro de ayuda (tickets).</li>
          <li>Técnicos: cookies de sesión necesarias para mantener tu ingreso de forma segura.</li>
        </ul>
        <p className="text-sm">
          En la demostración no solicitamos RUT ni datos de tarjeta; los pagos son simulados.
        </p>
      </LegalSection>
      <LegalSection title="3. Finalidad">
        <p>
          Usamos tus datos para crear y administrar tu cuenta, permitir el acceso a cursos, emitir certificados,
          responder solicitudes de ayuda y mejorar el servicio. No vendemos ni arrendamos tu información personal a
          terceros con fines comerciales.
        </p>
      </LegalSection>
      <LegalSection title="4. Cookies y sesión">
        <p>
          Utilizamos cookies técnicas (incluidas cookies HttpOnly de sesión) para autenticarte de forma segura. Puedes
          cerrar sesión desde el menú de usuario; eso elimina las cookies de acceso en tu navegador.
        </p>
      </LegalSection>
      <LegalSection title="5. Conservación">
        <p>
          Conservamos la información mientras mantengas una cuenta activa y el tiempo necesario para cumplir obligaciones
          legales o resolver disputas. En el entorno de demostración, los datos pueden restablecerse periódicamente al
          recargar datos de prueba.
        </p>
      </LegalSection>
      <LegalSection title="6. Tus derechos">
        <p>
          Puedes solicitar acceso, rectificación o eliminación de tus datos personales, así como oponerte a tratamientos
          no esenciales, contactando a{' '}
          <Link href="mailto:cursos@tiempodedios.cl">cursos@tiempodedios.cl</Link>. Responderemos en un plazo razonable.
        </p>
      </LegalSection>
      <LegalSection title="7. Seguridad">
        <p>
          Aplicamos medidas técnicas acordes a un MVP (contraseñas cifradas, sesiones protegidas, acceso restringido a
          contenidos sensibles). Ningún sistema es 100&nbsp;% infalible; te recomendamos usar contraseñas únicas.
        </p>
      </LegalSection>
      <LegalSection title="8. Menores">
        <p>
          Si eres padre, madre o tutor y crees que un menor nos proporcionó datos sin tu consentimiento, contáctanos
          para evaluar la eliminación de la cuenta.
        </p>
      </LegalSection>
      <LegalSection title="9. Cambios">
        <p>
          Publicaremos cambios relevantes en esta página con una nueva fecha de actualización. El uso continuado del
          servicio tras un cambio implica que has revisado la política vigente.
        </p>
        <p className="text-sm">
          Esta política describe de forma transparente el tratamiento en la maqueta de demostración. Antes de operar en
          producción, la iglesia deberá alinear el texto con la Ley N.º 19.628 sobre protección de la vida privada y
          normativa aplicable, con asesoría profesional.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
