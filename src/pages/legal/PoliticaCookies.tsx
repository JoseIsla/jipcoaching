import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import LegalBreadcrumbJsonLd from "@/components/legal/LegalBreadcrumbJsonLd";

const PoliticaCookies = () => {
  useEffect(() => {
    document.title = "Política de Cookies — JIP Performance Nutrition";
    const meta = document.querySelector('meta[name="description"]');
    const original = meta?.getAttribute("content") || "";
    meta?.setAttribute("content", "Política de cookies de JIP Performance Nutrition: tipos de cookies utilizadas, gestión desde el navegador, cookies de terceros y actualización de la política.");
    return () => { meta?.setAttribute("content", original); };
  }, []);

  return (
  <div className="min-h-screen bg-background text-foreground">
    <LegalBreadcrumbJsonLd pageName="Política de Cookies" pageUrl="/legal/cookies" />
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>
      <h1 className="text-3xl font-bold mb-8">Política de Cookies</h1>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground">1. ¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Se utilizan para recordar preferencias, mejorar la experiencia de navegación y recopilar información estadística.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">2. Tipos de cookies que utilizamos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cookies técnicas (necesarias):</strong> Permiten la navegación por la web y el uso de sus funcionalidades básicas, como el acceso al área de clientes y el mantenimiento de la sesión.</li>
            <li><strong>Cookies de preferencias:</strong> Almacenan las preferencias del usuario, como el idioma seleccionado o el tema visual (claro/oscuro).</li>
            <li><strong>Cookies analíticas:</strong> Recopilan información sobre el uso del sitio web de forma anónima para mejorar su funcionamiento y contenido.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">3. Gestión de cookies</h2>
          <p>Puedes configurar tu navegador para bloquear o eliminar las cookies. Ten en cuenta que desactivar ciertas cookies puede afectar al funcionamiento correcto de la web, especialmente en el área de clientes.</p>
          <p>Instrucciones para los navegadores más comunes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
            <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad → Cookies</li>
            <li><strong>Safari:</strong> Preferencias → Privacidad → Cookies</li>
            <li><strong>Edge:</strong> Configuración → Privacidad → Cookies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">4. Cookies de terceros</h2>
          <p>Este sitio web puede utilizar servicios de terceros que instalen sus propias cookies con fines analíticos o funcionales. Estos terceros tienen sus propias políticas de privacidad y cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground">5. Actualización</h2>
          <p>Esta política de cookies puede actualizarse en función de cambios normativos o en los servicios ofrecidos. Te recomendamos revisarla periódicamente. Para cualquier consulta, puedes contactar en <a href="mailto:info@jipcoaching.com" className="text-primary hover:underline">info@jipcoaching.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
  );
};

export default PoliticaCookies;
