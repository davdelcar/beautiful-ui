import type { ComponentType } from "react";

/* Plantillas de página: se cargan bajo demanda en #/plantillas/<id>. */
export const TEMPLATES: { id: string; title: string; description: string; load: () => Promise<{ default: ComponentType }> }[] = [
  { id: "login", title: "Login y registro", description: "Card centrada, validación con zod, proveedores sociales.", load: () => import("@/components/blocks/LoginPage") },
  { id: "listado", title: "Listado con detalle", description: "Filtros, tabla ordenable y paginada, detalle en Sheet, menú contextual.", load: () => import("@/components/blocks/ListDetailPage") },
  { id: "analitica", title: "Analítica", description: "Filtros de fecha, KPIs con sparkline, línea, barras apiladas y cuota.", load: () => import("@/components/blocks/AnalyticsPage") },
  { id: "ajustes", title: "Ajustes", description: "Subnavegación, perfil con formulario, notificaciones, tema y acento.", load: () => import("@/components/blocks/SettingsPage") },
  { id: "alta", title: "Alta por pasos", description: "Stepper con validación por paso y resumen final.", load: () => import("@/components/blocks/WizardPage") },
  { id: "error", title: "Error 404 / 500", description: "Estados de sistema con acciones de salida.", load: () => import("@/components/blocks/ErrorPage") },
];
