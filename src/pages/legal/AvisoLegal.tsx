import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LegalBreadcrumbJsonLd from "@/components/legal/LegalBreadcrumbJsonLd";

const AvisoLegal = () => {
  useEffect(() => {
    document.title = "Aviso Legal — JIP Performance Nutrition";
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.getAttribute("content") || "";
    meta?.setAttribute("content", "Aviso legal de JIP Performance Nutrition: datos identificativos, condiciones de uso, propiedad intelectual y legislación aplicable.");
    return () => { meta?.setAttribute("content", original); };
  }, []);

  return (
  <div className="min-h-screen bg-background text-foreground">
    <LegalBreadcrumbJsonLd pageName="Aviso Legal" pageUrl="/legal/aviso-legal" />
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>
      <h1 className="text-3xl font-bold mb-8">Aviso Legal</h1>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. Datos identificativos</h2>
          <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSICE), se informa al usuario de los datos del titular de este sitio web:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Titular:</strong> José Isla Pérez</li>
            <li><strong>Actividad:</strong> Servicios de coaching nutricional y entrenamiento personal</li>
            <li><strong>Contacto:</strong> <a href="mailto:info@jipcoaching.com" className="text-primary hover:underline">info@jipcoaching.com</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Objeto</h2>
          <p>El presente sitio web tiene como finalidad informar sobre los servicios de coaching deportivo, nutricional y de entrenamiento personal ofrecidos por JIP Performance Nutrition, así como facilitar el contacto con potenciales clientes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Condiciones de uso</h2>
          <p>El acceso a este sitio web es gratuito y no requiere suscripción ni registro previo, salvo para el acceso al área de clientes. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios ofrecidos, absteniéndose de:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utilizar los contenidos con fines ilícitos o contrarios a la buena fe.</li>
            <li>Reproducir, distribuir o modificar los contenidos sin autorización expresa.</li>
            <li>Introducir virus informáticos o cualquier sistema que pueda causar daños.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Propiedad intelectual e industrial</h2>
          <p>Todos los contenidos del sitio web (textos, imágenes, logotipos, diseño gráfico, código fuente, etc.) son propiedad de JIP Performance Nutrition o de sus legítimos titulares y están protegidos por las leyes de propiedad intelectual e industrial.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Exclusión de responsabilidad</h2>
          <p>JIP Performance Nutrition no se hace responsable de los daños derivados del uso de la información contenida en esta web. Los consejos y planes proporcionados son orientativos y no sustituyen el asesoramiento médico profesional.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">6. Legislación aplicable</h2>
          <p>Las presentes condiciones se rigen por la legislación española vigente. Para cualquier controversia se someterán a los juzgados y tribunales del domicilio del titular.</p>
        </section>
      </div>
    </div>
  </div>
);

export default AvisoLegal;
