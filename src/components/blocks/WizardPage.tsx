import { useState } from "react";
import { z } from "zod";
import { Form, FormField, useZodForm } from "@/components/form";
import {
  Button,
  Card,
  Combobox,
  DatePicker,
  Dropzone,
  IconArrowRight,
  IconCheckCircle,
  Input,
  MultiSelect,
  NumberInput,
  RadioGroup,
  Slider,
  Stepper,
  addDays,
  startOfDay,
} from "@/components/ui";

/* Plantilla: alta en varios pasos. Un único schema; cada paso valida solo
 * sus campos (`trigger(fields)`) antes de avanzar. El último paso resume. */

const schema = z.object({
  company: z.string().min(2, "Nombre de la empresa"),
  country: z.string().min(1, "Elige un país"),
  size: z.enum(["1-10", "11-50", "51-200", "200+"]),
  seats: z.number({ message: "Indica cuántos puestos" }).int().min(1, "Al menos 1").max(500, "Máximo 500"),
  modules: z.array(z.string()).min(1, "Elige al menos un módulo"),
  budget: z.number(),
  start: z.date({ message: "Elige una fecha" }),
});
type Values = z.infer<typeof schema>;

const STEPS = [
  { label: "Empresa", description: "Datos básicos", fields: ["company", "country", "size"] },
  { label: "Equipo", description: "Puestos y módulos", fields: ["seats", "modules", "budget"] },
  { label: "Arranque", description: "Fecha y logo", fields: ["start"] },
  { label: "Revisar", description: "Confirma y crea", fields: [] },
] as const;

const MODULES = [
  { value: "crm", label: "CRM" },
  { value: "inv", label: "Inventario" },
  { value: "bill", label: "Facturación" },
  { value: "ai", label: "Asistente IA" },
  { value: "hr", label: "Personas" },
];
const COUNTRIES = [
  { value: "es", label: "España" },
  { value: "mx", label: "México" },
  { value: "ar", label: "Argentina" },
  { value: "co", label: "Colombia" },
  { value: "cl", label: "Chile" },
  { value: "pe", label: "Perú", keywords: ["peru"] },
  { value: "us", label: "Estados Unidos", keywords: ["usa"] },
];

export default function WizardPage({ onComplete }: { onComplete?: (values: Values) => Promise<void> | void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [logo, setLogo] = useState<File[]>([]);
  const form = useZodForm(schema, {
    defaultValues: { company: "", country: "", size: "11-50", seats: 12, modules: ["crm"], budget: 400, start: undefined },
  });
  const money = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const next = async () => {
    const ok = await form.trigger(STEPS[step].fields as unknown as (keyof Values)[]);
    if (ok) setStep((s) => s + 1);
  };
  const submit = async (v: Values) => {
    await new Promise((r) => setTimeout(r, 700));
    await onComplete?.(v);
    setDone(true);
  };
  const v = form.watch();

  return (
    <div className="min-h-dvh bg-page px-4 py-8 sm:py-14">
      <div className="mx-auto flex max-w-[640px] flex-col gap-6">
        <div>
          <p className="text-overline text-ink-3 uppercase">Configurar espacio</p>
          <h1 className="mt-1 text-title text-ink">Prepara tu cuenta</h1>
        </div>
        <Stepper steps={STEPS.map(({ label, description }) => ({ label, description }))} current={done ? STEPS.length : step} onStepClick={done ? undefined : setStep} />

        <Card elevation="raised">
          {done ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" style={{ animation: "fade-up 400ms cubic-bezier(0.23,1,0.32,1) both" }}>
              <span className="flex size-11 items-center justify-center rounded-full bg-green-tint text-green">
                <IconCheckCircle size={22} />
              </span>
              <h2 className="text-heading text-ink">{v.company} está listo</h2>
              <p className="max-w-80 text-body text-ink-3">Hemos preparado {v.modules.length} módulos para {v.seats} personas. Te enviamos los detalles por email.</p>
              <Button size="sm" variant="primary" onClick={() => (setDone(false), setStep(0), form.reset())}>
                Empezar de nuevo
              </Button>
            </div>
          ) : (
            <Form form={form} onSubmit={submit} className="gap-0">
              <div
                key={step}
                className="flex flex-col gap-4 p-5 sm:p-6"
                style={{ animation: "fade-up 300ms cubic-bezier(0.23,1,0.32,1) both" }}
                onKeyDown={(e) => {
                  // Enter en un campo avanza de paso en lugar de enviar todo el formulario
                  if (e.key === "Enter" && !e.defaultPrevented && step < STEPS.length - 1 && (e.target as HTMLElement).tagName === "INPUT") {
                    e.preventDefault();
                    next();
                  }
                }}
              >
                {step === 0 && (
                  <>
                    <FormField<Values> name="company" label="Nombre de la empresa" required>
                      {(f) => <Input {...f.input} autoFocus placeholder="Acme S.L." />}
                    </FormField>
                    <FormField<Values> name="country" label="País" required>
                      {(f) => <Combobox id={f.id} value={(f.value as string) || null} onChange={(x) => (f.onChange(x), f.onBlur())} options={COUNTRIES} placeholder="Elige un país" />}
                    </FormField>
                    <FormField<Values> name="size" label="Tamaño del equipo">
                      {(f) => (
                        <RadioGroup
                          value={f.value as Values["size"]}
                          onChange={f.onChange}
                          options={[
                            { value: "1-10", label: "1–10" },
                            { value: "11-50", label: "11–50" },
                            { value: "51-200", label: "51–200" },
                            { value: "200+", label: "Más de 200" },
                          ]}
                        />
                      )}
                    </FormField>
                  </>
                )}
                {step === 1 && (
                  <>
                    <FormField<Values> name="seats" label="Puestos" hint="Puedes cambiarlo cuando quieras.">
                      {(f) => <NumberInput id={f.id} value={f.value as number | null} onChange={(x) => f.onChange(x ?? undefined)} min={1} max={500} suffix="personas" aria-invalid={f.invalid} className="w-48" />}
                    </FormField>
                    <FormField<Values> name="modules" label="Módulos" required>
                      {(f) => <MultiSelect id={f.id} value={f.value as string[]} onChange={(x) => (f.onChange(x), f.onBlur())} options={MODULES} placeholder="Elige módulos" />}
                    </FormField>
                    <FormField<Values> name="budget" label="Presupuesto mensual">
                      {(f) => <Slider id={f.id} value={f.value as number} onChange={f.onChange} min={0} max={2000} step={50} showValue format={money} />}
                    </FormField>
                  </>
                )}
                {step === 2 && (
                  <>
                    <FormField<Values> name="start" label="Fecha de inicio" required>
                      {(f) => <DatePicker id={f.id} value={(f.value as Date) ?? null} onChange={(d) => (f.onChange(d ?? undefined), f.onBlur())} min={startOfDay(new Date())} max={addDays(new Date(), 180)} className="w-60" />}
                    </FormField>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[12.5px] font-medium text-ink-2">Logo (opcional)</span>
                      <Dropzone files={logo} onFilesChange={setLogo} accept="image/*" multiple={false} maxSize={1024 * 1024} hint="SVG o PNG, hasta 1 MB" />
                    </div>
                  </>
                )}
                {step === 3 && (
                  <dl className="divide-y divide-line overflow-hidden rounded-card bg-inset">
                    {[
                      ["Empresa", v.company],
                      ["País", COUNTRIES.find((c) => c.value === v.country)?.label],
                      ["Equipo", v.size],
                      ["Puestos", v.seats],
                      ["Módulos", v.modules.map((m) => MODULES.find((x) => x.value === m)?.label).join(", ")],
                      ["Presupuesto", money(v.budget)],
                      ["Inicio", v.start ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(v.start) : "—"],
                      ["Logo", logo[0]?.name ?? "—"],
                    ].map(([k, val]) => (
                      <div key={k as string} className="flex justify-between gap-4 px-3.5 py-2.5 text-body">
                        <dt className="text-ink-3">{k}</dt>
                        <dd className="text-right text-ink">{val as string}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <div className="primitive-card-footer flex items-center justify-between border-t border-line bg-inset">
                <Button type="button" size="sm" variant="quiet" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                  Atrás
                </Button>
                <span className="text-meta text-ink-3 tabular-nums">
                  {step + 1} / {STEPS.length}
                </span>
                {step < STEPS.length - 1 ? (
                  <Button type="button" size="sm" variant="primary" onClick={next}>
                    Continuar <IconArrowRight size={13} />
                  </Button>
                ) : (
                  <Button type="submit" size="sm" variant="accent" disabled={form.formState.isSubmitting}>
                    Crear espacio
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
