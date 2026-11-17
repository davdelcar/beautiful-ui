import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "./Overlay";
import { IconMoon, IconSun } from "./icons";

/** Botón de icono — la clase compartida `primitive-icon-button` (28px) de la
 *  fundación, con las variantes de tono de los primitives. */
export function IconButton({
  label,
  tone = "quiet",
  tooltip = true,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  /** nombre accesible; también es el texto del tooltip */
  label: string;
  tone?: "quiet" | "secondary";
  tooltip?: boolean;
  children: ReactNode;
}) {
  const btn = (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "primitive-icon-button shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.94]",
        tone === "quiet" ? "text-ink-2 hover:bg-hover-2 hover:text-ink" : "bg-surface text-ink-2 shadow-btn hover:bg-hover hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
  return tooltip ? <Tooltip content={label}>{btn}</Tooltip> : btn;
}

/** Alterna `.dark` en <html> (la variante `dark` de la fundación) y lo recuerda.
 *  Añade `.theme-switching` un frame para que el cambio sea un único repintado. */
export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("bui-theme", dark ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible: el tema solo dura esta sesión */
    }
    const id = requestAnimationFrame(() => root.classList.remove("theme-switching"));
    return () => cancelAnimationFrame(id);
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function ThemeToggle({ tone }: { tone?: "quiet" | "secondary" }) {
  const { dark, toggle } = useTheme();
  return (
    <IconButton label={dark ? "Tema claro" : "Tema oscuro"} tone={tone} onClick={toggle}>
      {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
    </IconButton>
  );
}
