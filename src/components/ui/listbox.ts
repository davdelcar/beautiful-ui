import { useEffect, useId, useMemo, useSyncExternalStore, type KeyboardEvent } from "react";
import { createListbox, definePrimitive, isComposing } from "@ui-sdk/core";
import { usePrimitive } from "@ui-sdk/react/primitive";

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

const virtualList = definePrimitive({
  name: "beautiful-ui-virtual-list",
  options: { keys: "value" },
  state: (_options: { keys: string[] }) => ({ highlighted: null as string | null }),
  api: (context) => ({
    listbox: createListbox(context, {
      key: "highlighted",
      focus: "virtual",
      items: () => context.options().keys,
    }),
  }),
  slots: (slot) => ({ root: slot({}) }),
});

/**
 * Navegación por teclado de una lista con foco "virtual" (aria-activedescendant):
 * ↑ ↓ Inicio Fin mueven el activo, Enter elige. El foco se queda en el input.
 */
export function useListNav<T>(items: T[], onPick: (item: T) => void) {
  const prefix = useId();
  const n = items.length;
  const keys = useMemo(() => Array.from({ length: n }, (_, i) => String(i)), [n]);
  const { instance, api: { listbox } } = usePrimitive(virtualList, { keys });
  const { highlighted } = useSyncExternalStore(instance.subscribe, instance.get, instance.get);
  const active = n ? Math.min(Number(highlighted ?? 0), n - 1) : -1;
  const optionId = (i: number) => `${prefix}-opt-${i}`;
  const setActive = (i: number) => listbox.highlight(keys[i] ?? null);

  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!n || e.defaultPrevented || isComposing(e.nativeEvent)) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onPick(items[active]);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      listbox.move(e.key === "Home" ? "first" : "last", e.nativeEvent);
    } else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(e.key)) {
      if (instance.get().highlighted !== keys[active]) setActive(active);
      listbox.keydown(e.nativeEvent);
      if (e.nativeEvent.defaultPrevented) e.preventDefault();
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
