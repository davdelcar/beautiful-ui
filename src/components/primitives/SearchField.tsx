"use client";

import { createChange, createFocusRecovery, definePrimitive } from "@ui-sdk/core";
import { createParts } from "@ui-sdk/react/primitive";
import { IconButton, IconSearch, IconX, Input } from "@/components/ui";

type SearchFieldOptions = {
  value: string;
  onValueChange: (value: string) => void;
};

const searchField = definePrimitive({
  name: "beautiful-ui-search-field",
  options: { value: "string", onValueChange: "callback" },
  controlled: ["value"],
  state: ({ value }: SearchFieldOptions) => ({ value }),
  sync: ({ value }) => ({ value }),
  api: (context) => {
    const change = createChange(context);
    return {
      clear: (event?: Event) => change("value", "", { reason: "clear-press", event }),
      focusRecovery: createFocusRecovery({ fallback: () => context.element("input") }),
    };
  },
  slots: (slot) => ({
    input: slot({}),
    clear: slot({
      present: ({ value }) => value.length > 0,
      attrs: () => ({ type: "button" }),
      press: ({ api }, event) => api.clear(event),
      bind: (element, part) => part.api.focusRecovery.bind(element, part),
    }),
  }),
});

const Parts = createParts(searchField, { input: "input", clear: "button" });

type SearchFieldProps = SearchFieldOptions & {
  label?: string;
  clearLabel?: string;
  placeholder?: string;
  className?: string;
};

export default function SearchField({
  value, onValueChange, label = "Buscar", clearLabel = "Borrar búsqueda", placeholder, className,
}: SearchFieldProps) {
  return (
    <Parts.Root value={value} onValueChange={onValueChange}>
      <Parts.Input
        render={<Input leading={<IconSearch size={14} />} trailing={
          <Parts.Clear render={<IconButton label={clearLabel} tooltip={false}><IconX size={14} /></IconButton>} />
        } />}
        className={className}
        placeholder={placeholder}
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
      />
    </Parts.Root>
  );
}
