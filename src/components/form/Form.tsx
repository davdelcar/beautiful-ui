import { useId, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  type FieldValues,
  type Path,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/atoms/Button";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

/* Formularios con validación: react-hook-form + zod sobre los campos del kit.
 *
 *   const schema = z.object({ email: z.email("Email no válido"), plan: z.enum(["m", "y"]) });
 *   const form = useZodForm(schema, { defaultValues: { email: "", plan: "m" } });
 *
 *   <Form form={form} onSubmit={save}>
 *     <FormField name="email" label="Email">{(f) => <Input {...f.input} />}</FormField>
 *     <FormField name="plan" label="Plan">{(f) => <Select value={f.value} onChange={f.onChange} options={…} />}</FormField>
 *     <FormSubmit>Guardar</FormSubmit>
 *   </Form>
 */

/** useForm con el resolver de zod y validación al salir de cada campo. */
export function useZodForm<S extends z.ZodType<FieldValues, FieldValues>>(schema: S, options?: Omit<UseFormProps<z.input<S>, unknown, z.output<S>>, "resolver">) {
  return useForm<z.input<S>, unknown, z.output<S>>({ mode: "onTouched", ...options, resolver: zodResolver(schema) });
}

export function Form<TIn extends FieldValues, TOut extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
}: {
  form: UseFormReturn<TIn, unknown, TOut>;
  onSubmit: SubmitHandler<TOut>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className={cn("flex flex-col gap-4", className)}>
        {children}
      </form>
    </FormProvider>
  );
}

export type FieldControl<V = unknown> = {
  id: string;
  name: string;
  value: V;
  onChange: (value: V) => void;
  onBlur: () => void;
  invalid: boolean;
  /** props listas para <Input>/<Textarea>: value, onChange(evento), onBlur, id, aria-* */
  input: {
    id: string;
    name: string;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    onBlur: () => void;
    ref: (el: HTMLElement | null) => void;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  };
};

/**
 * Campo conectado al formulario: etiqueta, control, ayuda y error (de zod).
 * `children` recibe `f.input` (inputs de texto) o `f.value`/`f.onChange` (Select, Switch, DatePicker…).
 */
export function FormField<T extends FieldValues = FieldValues>({
  name,
  label,
  hint,
  required,
  className,
  children,
}: {
  name: Path<T>;
  label?: ReactNode;
  hint?: ReactNode;
  /** solo visual (asterisco); la regla vive en el schema */
  required?: boolean;
  className?: string;
  children: (field: FieldControl) => ReactNode;
}) {
  const { control } = useFormContext<T>();
  const { field, fieldState } = useController({ name, control });
  const id = useId();
  const msgId = `${id}-msg`;
  const error = fieldState.error?.message;
  const invalid = !!fieldState.error;
  const described = error || hint ? msgId : undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink-2">
          {label}
          {required && <span className="ml-0.5 text-red" aria-hidden>*</span>}
        </label>
      )}
      {children({
        id,
        name: field.name,
        value: field.value,
        onChange: field.onChange,
        onBlur: field.onBlur,
        invalid,
        input: {
          id,
          name: field.name,
          value: field.value ?? "",
          onChange: (e) => field.onChange(e.target.value),
          onBlur: field.onBlur,
          ref: field.ref,
          "aria-invalid": invalid,
          "aria-describedby": described,
        },
      })}
      {error ? (
        <span id={msgId} role="alert" className="text-meta text-red" style={{ animation: "fade-in 150ms ease-out both" }}>
          {error}
        </span>
      ) : hint ? (
        <span id={msgId} className="text-meta text-ink-3">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

/** Botón de envío: se deshabilita y muestra Spinner mientras `onSubmit` (async) trabaja. */
export function FormSubmit({ children, variant = "primary", size = "sm", className }: { children: ReactNode; variant?: "primary" | "accent"; size?: "sm" | "md"; className?: string }) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" variant={variant} size={size} disabled={formState.isSubmitting} className={className}>
      {formState.isSubmitting && <Spinner size={12} />}
      {children}
    </Button>
  );
}

/** Error general del formulario (p. ej. del servidor): `form.setError("root", { message })`. */
export function FormError() {
  const { formState } = useFormContext();
  const msg = formState.errors.root?.message;
  if (!msg) return null;
  return (
    <p role="alert" className="rounded-control bg-red-tint px-3 py-2 text-body text-red" style={{ animation: "fade-in 150ms ease-out both" }}>
      {msg}
    </p>
  );
}
