import { useEffect } from "react";

interface Props {
  pageName: string;
  pageUrl: string;
}

const LegalBreadcrumbJsonLd = ({ pageName, pageUrl }: Props) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `breadcrumb-jsonld-${pageUrl}`;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Inicio",
          "item": "https://jipcoaching.com/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": pageName,
          "item": `https://jipcoaching.com${pageUrl}`
        }
      ]
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [pageName, pageUrl]);

  return null;
};

export default LegalBreadcrumbJsonLd;
