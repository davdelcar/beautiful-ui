import { useState } from "react";
import { z } from "zod";
import { Form, FormError, FormField, FormSubmit, useZodForm } from "@/components/form";
import * as UI from "@/components/ui";
import {
  ACCENTS,
  Accordion,
  BarChart,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Checkbox,
  Collapsible,
  Combobox,
  ContextMenu,
  DatePicker,
  DateRangePicker,
  Dropzone,
  IconCopy,
  IconLink,
  IconPencil,
  IconTrash,
  Input,
  LineChart,
  MultiSelect,
  NumberInput,
  Pagination,
  Progress,
  Segmented,
  SegmentedBar,
  Separator,
  Skeleton,
  SkeletonText,
  Slider,
  Stat,
  Stepper,
  Switch,
  UIProvider,
  addDays,
  setAccent,
  startOfDay,
  useToast,
  type Accent,
  type DateRange,
  type Series,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Showcase } from "./Showcase";
import { TEMPLATES } from "./templates";

/* ── fundamentos extra ── */

const SWATCH: Record<Accent, string> = {
  blue: "oklch(0.56 0.2 256)",
  violet: "oklch(0.53 0.22 292)",
  green: "oklch(0.5 0.13 155)",
  orange: "oklch(0.55 0.17 42)",
  pink: "oklch(0.54 0.2 0)",
};

export function MoreFoundations() {
  const [accent, setA] = useState<Accent>(() => (document.documentElement.dataset.accent as Accent) ?? "blue");
  const [on, setOn] = useState(true);
  const [lang, setLang] = useState<"es-ES" | "en-US">("en-US");
  const [date, setDate] = useState<Date | null>(new Date());
  const [page, setPage] = useState(3);
  const icons = Object.entries(UI).filter(([k]) => /^Icon[A-Z]/.test(k) && k !== "IconButton") as [string, (p: { size?: number }) => React.ReactElement][];
  return (
    <>
      <Showcase id="acento" title="Acento de marca" desc="Cinco acentos con pareja clara/oscura; cambia toda la app con setAccent().">
        <div className="mx-auto flex max-w-120 flex-col items-center gap-5">
          <div role="radiogroup" aria-label="Acento" className="flex gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={accent === a}
                aria-label={a}
                onClick={() => (setAccent(a), setA(a))}
                className={cn("size-7 rounded-full transition-[box-shadow,transform] duration-150 hover:scale-110", accent === a && "shadow-[0_0_0_2px_var(--canvas),0_0_0_4px_var(--ink)]")}
                style={{ background: SWATCH[a] }}
              />
            ))}
          </div>
          <Card className="primitive-card-pad flex w-full flex-wrap items-center justify-center gap-4">
            <Button variant="accent" size="sm">
              Acción
            </Button>
            <Switch checked={on} onChange={setOn} label="Activo" />
            <Checkbox checked={on} onChange={setOn} label="Marcado" />
            <Progress value={64} className="w-28" />
            <a href="#acento" className="text-body text-accent-ink">
              Enlace
            </a>
          </Card>
        </div>
      </Showcase>

      <Showcase id="iconos" title="Iconos" desc="Trazo 2px, 24×24, extremos redondeados. Para más, iconoir-react (strokeWidth 1.6).">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
          {icons.map(([name, Icon]) => (
            <div key={name} className="flex flex-col items-center gap-1.5 rounded-control bg-surface px-1 py-3 shadow-hairline" title={name}>
              <Icon size={18} />
              <span className="max-w-full truncate font-mono text-[9.5px] text-ink-3">{name.replace("Icon", "")}</span>
            </div>
          ))}
        </div>
      </Showcase>

      <Showcase
        id="idioma"
        title="Idioma"
        desc="UIProvider traduce los textos del kit y formatea fechas con Intl."
        controls={
          <Segmented
            size="sm"
            value={lang}
            onChange={setLang}
            options={[
              { value: "es-ES", label: "ES" },
              { value: "en-US", label: "EN" },
            ]}
          />
        }
      >
        <UIProvider locale={lang}>
          <div className="flex flex-wrap items-start justify-center gap-4">
            <Card className="primitive-card-pad">
              <Calendar value={date} onChange={setDate} />
            </Card>
            <div className="flex w-56 flex-col gap-3">
              <DatePicker value={date} onChange={setDate} />
              <Combobox aria-label="Demo" value={null} onChange={() => {}} options={[{ value: "a", label: "Alpha" }]} />
              <Pagination page={page} total={9} onChange={setPage} compact />
            </div>
          </div>
        </UIProvider>
      </Showcase>
    </>
  );
}

/* ── kit extra ── */

const profile = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.email("Email no válido"),
  plan: z.string().min(1, "Elige un plan"),
  seats: z.number({ message: "Obligatorio" }).min(1, "Al menos 1"),
  terms: z.literal(true, { message: "Debes aceptar las condiciones" }),
});
type Profile = z.infer<typeof profile>;

export function MoreKit() {
  const toast = useToast();
  const [page, setPage] = useState(4);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vol, setVol] = useState(40);
  const [qty, setQty] = useState<number | null>(3);
  const [tags, setTags] = useState<string[]>(["crm", "ai"]);
  const [files, setFiles] = useState<File[]>([]);
  const [day, setDay] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ from: addDays(startOfDay(new Date()), -4), to: startOfDay(new Date()) });
  const [preset, setPreset] = useState<DateRange & { preset?: string }>({ from: null, to: null, preset: "30d" });
  const form = useZodForm(profile, { defaultValues: { name: "", email: "", plan: "", seats: 1, terms: false as unknown as true } });

  return (
    <>
      <Showcase id="navegacion-2" title="Breadcrumb · Pagination · Stepper" desc="Dónde estás, en qué página y en qué paso.">
        <div className="mx-auto flex max-w-140 flex-col items-center gap-6">
          <Breadcrumb items={[{ label: "Acme", href: "#navegacion-2" }, { label: "Ventas", href: "#navegacion-2" }, { label: "2026", href: "#navegacion-2" }, { label: "Pedidos", href: "#navegacion-2" }, { label: "#1042" }]} />
          <Pagination page={page} total={12} onChange={setPage} />
          <Stepper className="w-full" current={step} onStepClick={setStep} steps={[{ label: "Cuenta" }, { label: "Equipo" }, { label: "Pago" }, { label: "Listo" }]} />
          <div className="flex gap-2">
            <Button size="xs" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Atrás
            </Button>
            <Button size="xs" variant="primary" disabled={step === 4} onClick={() => setStep((s) => s + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      </Showcase>

      <Showcase id="menu-contextual" title="Menú contextual" desc="Clic derecho (o Mayús+F10) sobre cualquier zona.">
        <ContextMenu
          items={[
            { type: "label", label: "Archivo" },
            { label: "Renombrar", icon: <IconPencil size={14} />, shortcut: "F2", onSelect: () => toast("Renombrar") },
            { label: "Duplicar", icon: <IconCopy size={14} />, onSelect: () => toast("Duplicado") },
            { label: "Copiar enlace", icon: <IconLink size={14} />, onSelect: () => toast("Enlace copiado") },
            { type: "separator" },
            { label: "Eliminar", icon: <IconTrash size={14} />, danger: true, onSelect: () => toast("Eliminado") },
          ]}
        >
          <div tabIndex={0} className="mx-auto flex h-36 max-w-100 items-center justify-center rounded-card border border-dashed border-line-strong bg-surface text-body text-ink-3">
            Haz clic derecho aquí
          </div>
        </ContextMenu>
      </Showcase>

      <Showcase
        id="estructura"
        title="Accordion · Skeleton · Separator"
        desc="Plegables con altura animada y esqueletos con el tamaño del contenido final."
        controls={
          <Button size="xs" onClick={() => setLoading((l) => !l)}>
            {loading ? "Cargar" : "Esqueleto"}
          </Button>
        }
      >
        <div className="mx-auto grid max-w-160 gap-4 md:grid-cols-2">
          <Accordion
            defaultOpen={["a"]}
            items={[
              { value: "a", title: "¿Puedo cambiar de plan?", meta: "Facturación", content: "Sí, cuando quieras. El cambio se prorratea en la siguiente factura." },
              { value: "b", title: "¿Dónde se guardan los datos?", content: "En la UE, cifrados en reposo y en tránsito." },
              { value: "c", title: "¿Hay API?", content: "Sí: REST y webhooks, incluidos en todos los planes." },
            ]}
          />
          <Card className="primitive-card-pad flex flex-col gap-3">
            {loading ? (
              <>
                <div className="flex items-center gap-3">
                  <Skeleton circle className="size-8" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                </div>
                <SkeletonText lines={3} />
              </>
            ) : (
              <div style={{ animation: "fade-in 200ms ease-out both" }} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <UI.Avatar name="Ana López" color="#2f6fec" size="lg" />
                  <div>
                    <div className="text-body font-medium text-ink">Ana López</div>
                    <div className="text-meta text-ink-3">Hace 5 min</div>
                  </div>
                </div>
                <p className="text-body text-ink-2">El pistacho lidera el fin de semana con un 18 % más que la media. Bátelo el sábado temprano.</p>
              </div>
            )}
            <Separator label="o" />
            <Collapsible title="Detalles técnicos">
              <p className="text-meta text-ink-3">Modelo v3 · 12 fuentes · 1,2 s</p>
            </Collapsible>
          </Card>
        </div>
      </Showcase>

      <Showcase id="entradas" title="Slider · NumberInput · MultiSelect · Dropzone" desc="Controles de formulario con teclado completo.">
        <Card className="primitive-card-pad mx-auto grid max-w-140 gap-4 sm:grid-cols-2">
          <UI.Field label="Volumen">{(id) => <Slider id={id} value={vol} onChange={setVol} showValue format={(v) => `${v} %`} />}</UI.Field>
          <UI.Field label="Cantidad">{(id) => <NumberInput id={id} value={qty} onChange={setQty} min={0} max={99} suffix="uds" />}</UI.Field>
          <UI.Field label="Módulos" className="sm:col-span-2">
            {(id) => (
              <MultiSelect
                id={id}
                value={tags}
                onChange={setTags}
                options={[
                  { value: "crm", label: "CRM" },
                  { value: "inv", label: "Inventario" },
                  { value: "bill", label: "Facturación" },
                  { value: "ai", label: "Asistente IA" },
                  { value: "hr", label: "Personas" },
                ]}
              />
            )}
          </UI.Field>
          <Dropzone className="sm:col-span-2" files={files} onFilesChange={setFiles} maxSize={5 * 1024 * 1024} hint="Cualquier archivo, hasta 5 MB" />
        </Card>
      </Showcase>

      <Showcase id="fechas" title="Calendar · DatePicker · DateRangePicker" desc="Rejilla navegable con flechas; presets antes que el calendario.">
        <div className="flex flex-wrap items-start justify-center gap-4">
          <Card className="primitive-card-pad">
            <Calendar mode="range" value={range} onChange={setRange} />
          </Card>
          <div className="flex w-60 flex-col gap-3">
            <UI.Field label="Entrega">{(id) => <DatePicker id={id} value={day} onChange={setDay} min={new Date()} />}</UI.Field>
            <UI.Field label="Periodo">{(id) => <DateRangePicker id={id} value={preset} onChange={setPreset} />}</UI.Field>
          </div>
        </div>
      </Showcase>

      <Showcase id="validacion" title="Formularios con validación" desc="react-hook-form + zod sobre los campos del kit (@/components/form).">
        <Card className="mx-auto max-w-120">
          <Form
            form={form}
            onSubmit={async (v: Profile) => {
              await new Promise((r) => setTimeout(r, 800));
              if (v.email.endsWith("@test.com")) return form.setError("root", { message: "Ese dominio no está permitido." });
              toast(`Bienvenido, ${v.name}`);
              form.reset();
            }}
            className="primitive-card-pad"
          >
            <FormError />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField<Profile> name="name" label="Nombre" required>
                {(f) => <Input {...f.input} placeholder="Ana López" />}
              </FormField>
              <FormField<Profile> name="email" label="Email" required hint="Prueba con @test.com">
                {(f) => <Input {...f.input} type="email" placeholder="ana@empresa.com" />}
              </FormField>
              <FormField<Profile> name="plan" label="Plan" required>
                {(f) => (
                  <UI.Select
                    id={f.id}
                    value={(f.value as string) || null}
                    onChange={(v) => (f.onChange(v), f.onBlur())}
                    options={[
                      { value: "free", label: "Gratis" },
                      { value: "pro", label: "Pro" },
                      { value: "team", label: "Equipo" },
                    ]}
                  />
                )}
              </FormField>
              <FormField<Profile> name="seats" label="Puestos">
                {(f) => <NumberInput id={f.id} value={f.value as number | null} onChange={(v) => f.onChange(v ?? undefined)} min={1} aria-invalid={f.invalid} />}
              </FormField>
            </div>
            <FormField<Profile> name="terms">{(f) => <Checkbox checked={!!f.value} onChange={(v) => (f.onChange(v), f.onBlur())} label="Acepto las condiciones" />}</FormField>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="quiet" onClick={() => form.reset()}>
                Limpiar
              </Button>
              <FormSubmit>Crear cuenta</FormSubmit>
            </div>
          </Form>
        </Card>
      </Showcase>
    </>
  );
}

/* ── datos y gráficas ── */

const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const SERIES: Series[] = [
  { key: "web", label: "Web" },
  { key: "tienda", label: "Tienda" },
  { key: "mayorista", label: "Mayorista" },
];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const r = rnd(5);
const SALES = MONTHS.map((m, i) => ({
  mes: m,
  web: Math.round(3200 + i * 260 + r() * 900),
  tienda: Math.round(2600 + Math.sin(i / 2) * 700 + r() * 500),
  mayorista: Math.round(1500 + i * 120 + r() * 600),
}));

export function DataViz() {
  const [stacked, setStacked] = useState<"grouped" | "stacked">("grouped");
  const [shown, setShown] = useState<string[]>(["web", "tienda", "mayorista"]);
  /* el color se fija por entidad (color: n) para que filtrar no repinte */
  const series = SERIES.map((s, i) => ({ ...s, color: i + 1 })).filter((s) => shown.includes(s.key));
  const nf = new Intl.NumberFormat("es-ES");
  return (
    <>
      <Showcase
        id="lineas"
        title="LineChart"
        desc="Evolución: línea 2px, rejilla en línea fina sólida, cursor que muestra todas las series."
        controls={
          <MultiSelect
            className="w-52"
            value={shown}
            onChange={(v) => v.length && setShown(v)}
            options={SERIES.map((s) => ({ value: s.key, label: s.label }))}
          />
        }
      >
        <Card className="primitive-card-pad mx-auto max-w-180">
          <LineChart title="Unidades vendidas" description="2026, por canal" data={SALES} x="mes" series={series} area endLabels height={240} format={(v) => nf.format(v)} />
        </Card>
      </Showcase>

      <Showcase
        id="barras"
        title="BarChart"
        desc="Barras ≤ 24px, 4px redondeadas en el extremo, 2px de aire. Agrupadas o apiladas."
        controls={
          <Segmented
            size="sm"
            value={stacked}
            onChange={setStacked}
            options={[
              { value: "grouped", label: "Agrupadas" },
              { value: "stacked", label: "Apiladas" },
            ]}
          />
        }
      >
        <Card className="primitive-card-pad mx-auto max-w-180">
          <BarChart title="Ventas por trimestre" data={[0, 3, 6, 9].map((q) => ({ t: `T${q / 3 + 1}`, ...Object.fromEntries(SERIES.map((s) => [s.key, SALES.slice(q, q + 3).reduce((a, m) => a + (m[s.key as "web"] as number), 0)])) }))} x="t" series={SERIES} stacked={stacked === "stacked"} height={220} format={(v) => nf.format(v)} />
        </Card>
      </Showcase>

      <Showcase id="cuota" title="Stat · Sparkline · SegmentedBar" desc="Cuando el dato es un número, el número es la gráfica. Cuota sin donuts.">
        <div className="mx-auto flex max-w-160 flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Ingresos" value="48.210 €" delta="+12,4 % vs. mes pasado" trend="up" spark={SALES.map((m) => m.web)} />
            <Stat label="Pedidos" value="1.284" delta="−3,1 %" trend="down" spark={SALES.map((m) => m.tienda)} />
            <Stat label="Errores de pago" value="0,8 %" delta="−0,3 pts" trend="down" goodWhen="down" />
          </div>
          <Card className="primitive-card-pad flex flex-col gap-4">
            <SegmentedBar tall parts={SERIES.map((s) => ({ label: s.label, value: SALES.reduce((a, m) => a + (m[s.key as "web"] as number), 0) }))} />
            <SegmentedBar
              parts={[
                { label: "Completadas", value: 62 },
                { label: "En curso", value: 25 },
                { label: "Pendientes", value: 13 },
              ]}
            />
          </Card>
        </div>
      </Showcase>
    </>
  );
}

/* ── plantillas ── */

export function Templates() {
  return (
    <Showcase id="plantillas" title="Plantillas de página" desc="Pantallas completas listas para copiar (registro: items *-page)." bare>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t, i) => (
          <a
            key={t.id}
            href={`#/plantillas/${t.id}`}
            className="group flex flex-col gap-1.5 rounded-card bg-surface p-4 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-raised"
            style={{ animation: `fade-up 400ms cubic-bezier(0.23,1,0.32,1) ${i * 40}ms both` }}
          >
            <span className="flex items-center justify-between text-body font-medium text-ink">
              {t.title}
              <UI.IconArrowRight size={14} className="text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink" />
            </span>
            <span className="text-meta text-ink-3">{t.description}</span>
          </a>
        ))}
      </div>
    </Showcase>
  );
}
