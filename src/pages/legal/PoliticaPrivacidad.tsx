import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PoliticaPrivacidad = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link to="/home" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>
      <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de los datos personales recogidos a través de este sitio web es JIP Performance Nutrition.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Finalidad del tratamiento</h2>
          <p>Los datos personales que nos facilites serán tratados con las siguientes finalidades:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gestionar las consultas recibidas a través del formulario de contacto.</li>
            <li>Prestar los servicios de coaching nutricional y entrenamiento personal contratados.</li>
            <li>Enviar comunicaciones relacionadas con nuestros servicios, previo consentimiento.</li>
            <li>Gestionar el acceso al área de clientes de la plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Legitimación</h2>
          <p>La base legal para el tratamiento de tus datos es:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>El consentimiento del interesado al enviar el formulario de contacto.</li>
            <li>La ejecución del contrato de prestación de servicios.</li>
            <li>El interés legítimo del responsable.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Conservación de datos</h2>
          <p>Los datos personales se conservarán mientras se mantenga la relación comercial o durante el tiempo necesario para cumplir con las obligaciones legales. Una vez finalizada la relación, los datos serán bloqueados y posteriormente eliminados.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Derechos del interesado</h2>
          <p>Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición contactando a través del formulario de contacto de la web o por correo electrónico.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Destinatarios</h2>
          <p>No se cederán datos personales a terceros salvo obligación legal. Los datos podrán ser tratados por encargados del tratamiento que prestan servicios al titular (hosting, plataforma web).</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">7. Seguridad</h2>
          <p>Se han adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado.</p>
        </section>
      </div>
    </div>
  </div>
);

export default PoliticaPrivacidad;
