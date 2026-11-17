import { useEffect, useState } from "react";
import { ToastProvider } from "@/components/ui";
import DesignSystem from "@/pages/DesignSystem";
import ExampleApp from "@/pages/ExampleApp";

/* Router mínimo por hash: "#/app" → app de ejemplo, cualquier otro → sistema.
 * Los anclajes internos (#color, #button…) siguen funcionando en la galería. */
const isApp = () => window.location.hash.startsWith("#/app");

export default function App() {
  const [app, setApp] = useState(isApp);
  useEffect(() => {
    const on = () => {
      const next = isApp();
      setApp((prev) => {
        if (prev !== next) window.scrollTo(0, 0);
        return next;
      });
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return <ToastProvider>{app ? <ExampleApp /> : <DesignSystem />}</ToastProvider>;
}
