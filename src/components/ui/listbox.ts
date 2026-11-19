import { useEffect, useId, useState, type KeyboardEvent } from "react";

/** Minúsculas y sin tildes, para filtrar "Diseño" escribiendo "diseno". */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export const matches = (query: string, ...texts: (string | undefined)[]) => {
  const q = normalize(query.trim());
  return !q || texts.some((t) => t && normalize(t).includes(q));
};

/**
 * Navegación por teclado de una lista con foco "virtual" (aria-activedescendant):
 * ↑ ↓ Inicio Fin mueven el activo, Enter elige. El foco se queda en el input.
 */
export function useListNav<T>(items: T[], onPick: (item: T) => void) {
  const prefix = useId();
  const [raw, setActive] = useState(0);
  const n = items.length;
  const active = n ? Math.min(raw, n - 1) : -1;
  const optionId = (i: number) => `${prefix}-opt-${i}`;

  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!n) return;
    const move = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: n - 1 }[e.key];
    if (move !== undefined) {
      e.preventDefault();
      setActive((move + n) % n);
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onPick(items[active]);
    }
  };

  return {
    active,
    setActive,
    onKeyDown,
    optionId,
    listId: `${prefix}-list`,
    activeId: active >= 0 ? optionId(active) : undefined,
  };
}

/** 0 si alguna palabra de `label` empieza por la consulta, 1 si solo la contiene: para ordenar resultados. */
export const rank = (query: string, label: string) => {
  const q = normalize(query.trim());
  return !q || normalize(label).split(/[\s/·-]+/).some((w) => w.startsWith(q)) ? 0 : 1;
};
