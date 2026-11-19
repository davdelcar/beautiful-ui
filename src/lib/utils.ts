import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/* tailwind-merge debe conocer la escala tipográfica y los radios del sistema:
 * si no, trata `text-body` como un color y lo descarta al combinarlo con
 * `text-ink` (el texto volvería al tamaño por defecto). */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "title", "heading", "lead", "body", "label", "meta", "micro", "overline"] }],
      rounded: [{ rounded: ["chip", "control", "card", "window"] }],
      shadow: [{ shadow: ["hairline", "btn", "card", "raised", "overlay", "inset-field"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
