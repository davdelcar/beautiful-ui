import { createContext, useContext, useMemo, type ReactNode } from "react";

/* Textos fijos del kit. Español por defecto; `en` incluido. Para otro idioma,
 * pasa `labels` parciales a <UIProvider>. Fechas y números usan `locale` con Intl. */
const es = {
  select: "Seleccionar",
  search: "Buscar…",
  noResults: "Sin resultados",
  close: "Cerrar",
  themeLight: "Tema claro",
  themeDark: "Tema oscuro",
  commandPlaceholder: "Buscar o ejecutar…",
  commandNavigate: "navegar",
  commandRun: "ejecutar",
  commandToggle: "abrir / cerrar",
  commandPalette: "Paleta de comandos",
  previous: "Anterior",
  next: "Siguiente",
  page: "Página",
  of: "de",
  breadcrumb: "Ruta",
  dropzoneTitle: "Arrastra archivos o haz clic para subir",
  dropzoneRemove: "Quitar",
  increase: "Aumentar",
  decrease: "Disminuir",
  rangeFrom: "Mínimo",
  rangeTo: "Máximo",
  pickDate: "Elegir fecha",
  today: "Hoy",
  clear: "Limpiar",
  prevMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  showTable: "Ver tabla",
  showChart: "Ver gráfica",
  selected: "seleccionados",
  removeItem: "Quitar",
  required: "Obligatorio",
  step: "Paso",
  last7: "Últimos 7 días",
  last30: "Últimos 30 días",
  last90: "Últimos 90 días",
  thisMonth: "Este mes",
  customRange: "Rango personalizado",
  fileTooBig: "supera el tamaño máximo",
  sortAsc: "Orden ascendente",
  sortDesc: "Orden descendente",
  showPassword: "Mostrar contraseña",
  hidePassword: "Ocultar contraseña",
  capsLock: "Bloq Mayús",
  otpCode: "Código de verificación",
  resize: "Redimensionar",
};
export type Labels = typeof es;

const en: Labels = {
  select: "Select",
  search: "Search…",
  noResults: "No results",
  close: "Close",
  themeLight: "Light theme",
  themeDark: "Dark theme",
  commandPlaceholder: "Search or run…",
  commandNavigate: "navigate",
  commandRun: "run",
  commandToggle: "open / close",
  commandPalette: "Command palette",
  previous: "Previous",
  next: "Next",
  page: "Page",
  of: "of",
  breadcrumb: "Breadcrumb",
  dropzoneTitle: "Drop files or click to upload",
  dropzoneRemove: "Remove",
  increase: "Increase",
  decrease: "Decrease",
  rangeFrom: "Minimum",
  rangeTo: "Maximum",
  pickDate: "Pick a date",
  today: "Today",
  clear: "Clear",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  showTable: "Show table",
  showChart: "Show chart",
  selected: "selected",
  removeItem: "Remove",
  required: "Required",
  step: "Step",
  last7: "Last 7 days",
  last30: "Last 30 days",
  last90: "Last 90 days",
  thisMonth: "This month",
  customRange: "Custom range",
  fileTooBig: "exceeds the maximum size",
  sortAsc: "Sort ascending",
  sortDesc: "Sort descending",
  showPassword: "Show password",
  hidePassword: "Hide password",
  capsLock: "Caps Lock",
  otpCode: "Verification code",
  resize: "Resize",
};

export const LABELS = { es, en };

type UI = { locale: string; labels: Labels };
const Ctx = createContext<UI>({ locale: "es-ES", labels: es });

/**
 * Idioma del kit: `<UIProvider locale="en-US">` usa los textos en inglés;
 * `labels` sobrescribe cualquiera. Sin provider: español.
 */
export function UIProvider({ locale = "es-ES", labels, children }: { locale?: string; labels?: Partial<Labels>; children: ReactNode }) {
  const value = useMemo(() => {
    const base = locale.toLowerCase().startsWith("en") ? en : es;
    return { locale, labels: { ...base, ...labels } };
  }, [locale, labels]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useUI = () => useContext(Ctx);
export const useLabels = () => useContext(Ctx).labels;
