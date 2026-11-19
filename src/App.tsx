import { lazy, Suspense, useEffect, useState } from "react";
import { IconChevronRight, Spinner, ToastProvider, UIProvider } from "@/components/ui";
import DesignSystem from "@/pages/DesignSystem";
import { TEMPLATES } from "@/pages/templates";

/* Router mínimo por hash:
 *   #/app                 → app de ejemplo
 *   #/plantillas/<id>     → plantilla de página a pantalla completa
 *   cualquier otro        → galería (los anclajes #color, #button… siguen funcionando) */

const ExampleApp = lazy(() => import("@/pages/ExampleApp"));

const PAGES = Object.fromEntries(TEMPLATES.map((t) => [t.id, lazy(t.load)]));

const route = () => {
  const h = window.location.hash;
  if (h.startsWith("#/app")) return { name: "app" as const };
  const m = h.match(/^#\/plantillas\/([\w-]+)/);
  if (m && PAGES[m[1]]) return { name: "template" as const, id: m[1] };
  return { name: "gallery" as const };
};

export default function App() {
  const [r, setR] = useState(route);
  useEffect(() => {
    const on = () => {
      const next = route();
      setR((prev) => {
        if (prev.name !== next.name || ("id" in prev && "id" in next && prev.id !== next.id)) window.scrollTo(0, 0);
        return next.name === prev.name && (!("id" in next) || ("id" in prev && prev.id === next.id)) ? prev : next;
      });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const fallback = (
    <div className="flex min-h-dvh items-center justify-center bg-page text-ink-3">
      <Spinner size={18} />
    </div>
  );
  const Page = r.name === "template" ? PAGES[r.id] : null;

  return (
    <UIProvider locale="es-ES">
      <ToastProvider>
        <Suspense fallback={fallback}>
          {r.name === "app" ? (
            <ExampleApp />
          ) : Page ? (
            <>
              {/* barra en el flujo (no flotante): nunca tapa contenido de la plantilla */}
              <nav aria-label="Galería" className="flex h-9 items-center gap-2 border-b border-line bg-canvas px-4 text-meta text-ink-3">
                <a href="#plantillas" className="inline-flex items-center gap-1 rounded-chip font-medium text-ink-2 transition-colors hover:text-ink">
                  <IconChevronRight size={13} className="rotate-180" /> Galería
                </a>
                <span aria-hidden>/</span>
                <span className="truncate">{TEMPLATES.find((t) => t.id === r.id)?.title}</span>
              </nav>
              <Page />
            </>
          ) : (
            <DesignSystem />
          )}
        </Suspense>
      </ToastProvider>
    </UIProvider>
  );
}
