import { Fragment, useId, useRef, useState, type ReactNode } from "react";
import { NumberInput as SDKNumberInput, NumberInputControl, NumberInputDecrement, NumberInputIncrement } from "@ui-sdk/react/number-input";
import { OTPInput as SDKOTPInput, OTPInputGroup, OTPInputSeparator, OTPInputSlot } from "@ui-sdk/react/otp-input";
import { PasswordInput as SDKPasswordInput, PasswordInputControl, PasswordInputToggle } from "@ui-sdk/react/password-input";
import { Slider as SDKSlider, SliderControl, SliderIndicator, SliderThumb, SliderTrack } from "@ui-sdk/react/slider";
import { cn } from "@/lib/utils";
import { fieldBase } from "./Field";
import { useLabels, useUI } from "./i18n";
import { Floating, useLabelFor } from "./floating";
import { IconCheck, IconEye, IconEyeOff, IconMinus, IconPlus, IconSearch, IconX } from "./icons";
import { matches, useListNav } from "./listbox";
import { Chevron, usePopover } from "./Overlay";

/* ── Slider ────────────────────────────────────────────── */

/** Deslizador nativo (accesible por defecto) con pista rellena en acento. */
export function Slider<V extends number | [number, number]>({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  showValue = false,
  format = (v: number) => String(v),
  className,
  id,
  "aria-label": ariaLabel,
}: {
  /** un número, o `[desde, hasta]` para un rango con dos tiradores */
  value: V;
  onChange: (value: V) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** muestra el valor a la derecha */
  showValue?: boolean;
  format?: (value: number) => string;
  className?: string;
  /** enlaza con `<label htmlFor>` (Field / FormField) */
  id?: string;
  "aria-label"?: string;
}) {
  const L = useLabels();
  const { locale } = useUI();
  const root = useRef<HTMLDivElement>(null);
  useLabelFor(root, id, "[role=slider]");
  const range = Array.isArray(value);
  const shown = range ? `${format(value[0])} – ${format(value[1])}` : format(value as number);
  return (
    <SDKSlider
      ref={root}
      value={value}
      onValueChange={(v) => onChange(v as V)}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      disabled={disabled}
      format={format}
      locale={locale}
      className={cn("group/slider flex items-center gap-3 data-disabled:opacity-50", className)}
    >
      <SliderControl className="relative flex h-8 min-w-0 flex-1 cursor-pointer touch-none items-center select-none group-data-disabled/slider:cursor-default">
        <SliderTrack className="relative h-1 w-full rounded-full bg-hover-2">
          <SliderIndicator className="absolute inset-y-0 rounded-full bg-accent" />
        </SliderTrack>
        {(range ? [0, 1] : [0]).map((i) => (
          <SliderThumb
            key={i}
            index={i}
            aria-label={range ? `${ariaLabel ? ariaLabel + ": " : ""}${i ? L.rangeTo : L.rangeFrom}` : ariaLabel}
            className={`absolute size-4 rounded-full bg-white shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.25)] transition-[transform,box-shadow] duration-150 ease-[var(--ease-out-strong)]
              data-dragging:scale-112 has-[:focus-visible]:shadow-[0_0_0_1px_var(--accent),0_0_0_4px_var(--accent-tint)]`}
          />
        ))}
      </SliderControl>
      {showValue && <span className="min-w-10 text-right text-body whitespace-nowrap text-ink-2 tabular-nums">{shown}</span>}
    </SDKSlider>
  );
}

/* ── NumberInput ───────────────────────────────────────── */


/** Campo numérico con − / +, ↑ ↓ (Mayús = ×10) y límites. `null` = vacío. */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  disabled,
  className,
  id,
  ...aria
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** unidad a la derecha del número: "kg", "%", "€" */
  suffix?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const L = useLabels();
  const { locale } = useUI();
  /* pasos como el resto de botones dentro de un campo (⌘K, borrar): chip de 24px a la derecha */
  const side = "flex size-6 items-center justify-center rounded-chip text-ink-3 transition-colors hover:bg-hover-2 hover:text-ink data-disabled:pointer-events-none data-disabled:opacity-40";
  return (
    <SDKNumberInput
      value={value}
      onValueChange={(v) => onChange(v)}
      min={min}
      max={max}
      step={step}
      largeStep={step * 10}
      disabled={disabled}
      locale={locale}
      wheel={false}
      className={cn(
        fieldBase,
        "flex h-8 items-stretch overflow-hidden p-0 focus-within:border-accent focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--accent-tint)] data-disabled:opacity-50",
        aria["aria-invalid"] && "border-red focus-within:border-red focus-within:shadow-[0_0_0_3px_var(--red-tint)]",
        className,
      )}
    >
      <NumberInputControl
        id={id}
        role="spinbutton"
        aria-valuenow={value ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        className="min-w-0 flex-1 bg-transparent pl-2.5 text-body text-ink tabular-nums outline-none focus-visible:shadow-none"
        {...aria}
      />
      {suffix && <span className="flex items-center pr-1.5 text-body text-ink-3">{suffix}</span>}
      <span className="flex items-center gap-px pr-1">
        <NumberInputDecrement tabIndex={-1} className={side} aria-label={L.decrease}>
          <IconMinus size={12} />
        </NumberInputDecrement>
        <NumberInputIncrement tabIndex={-1} className={side} aria-label={L.increase}>
          <IconPlus size={12} />
        </NumberInputIncrement>
      </span>
    </SDKNumberInput>
  );
}

/* ── MultiSelect ───────────────────────────────────────── */

export type MultiOption<T extends string> = { value: T; label: string; hint?: ReactNode; icon?: ReactNode; keywords?: string[] };

/** Selección múltiple con buscador: chips en el disparador, panel abierto mientras eliges, Retroceso quita el último. */
export function MultiSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  maxChips = 3,
  className,
  id,
}: {
  id?: string;
  value: T[];
  onChange: (value: T[]) => void;
  options: MultiOption<T>[];
  placeholder?: string;
  /** chips visibles antes de «+N» */
  maxChips?: number;
  className?: string;
}) {
  const L = useLabels();
  const { open, setOpen, ref, panelRef } = usePopover();
  const [query, setQuery] = useState("");
  const visible = options.filter((o) => matches(query, o.label, ...(o.keywords ?? [])));
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const nav = useListNav(visible, (o) => toggle(o.value));
  const chosen = value.map((v) => options.find((o) => o.value === v)).filter(Boolean) as MultiOption<T>[];

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* el contenedor abre con el ratón; el botón real (accesible) es el último hijo,
          así los botones de quitar chip no quedan anidados dentro de otro botón */}
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          setQuery("");
          setOpen((o) => !o);
        }}
        className={cn(
          "flex min-h-8 w-full cursor-pointer flex-wrap items-center gap-1 rounded-control border border-line bg-field py-[3px] pr-1 pl-1.5 text-body shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow,background-color] duration-150 hover:border-line-strong",
          "focus-within:border-accent focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--accent-tint)]",
          open && "border-accent bg-surface shadow-[0_0_0_3px_var(--accent-tint)]",
        )}
      >
        {chosen.slice(0, maxChips).map((o) => (
          <span key={o.value} className="inline-flex h-6 items-center gap-1 rounded-chip bg-surface pr-0.5 pl-1.5 text-meta text-ink shadow-hairline">
            {o.label}
            <button
              type="button"
              aria-label={`${L.removeItem} ${o.label}`}
              onClick={() => toggle(o.value)}
              className="flex size-4 items-center justify-center rounded-[4px] text-ink-3 hover:bg-line-strong hover:text-ink"
            >
              <IconX size={10} />
            </button>
          </span>
        ))}
        {chosen.length > maxChips && <span className="px-1 text-meta text-ink-3">+{chosen.length - maxChips}</span>}
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={chosen.length ? `${placeholder ?? L.select}: ${chosen.map((c) => c.label).join(", ")}` : undefined}
          onClick={() => {
            setQuery("");
            setOpen((o) => !o);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className="flex h-6 min-w-6 flex-1 items-center justify-between gap-2 rounded-chip px-1 text-left outline-none"
        >
          <span className="truncate text-ink-3">{chosen.length === 0 ? (placeholder ?? L.select) : ""}</span>
          <Chevron open={open} />
        </button>
      </div>

      <Floating anchor={ref} open={open} width="trigger" panelRef={panelRef} className="flex min-w-56 flex-col overflow-hidden rounded-card bg-surface shadow-overlay">
          <div className="flex items-center gap-2 border-b border-line px-2.5">
            <IconSearch size={14} className="shrink-0 text-ink-3" />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={nav.listId}
              aria-activedescendant={nav.activeId}
              value={query}
              placeholder={L.search}
              onChange={(e) => {
                setQuery(e.target.value);
                nav.setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !query && value.length) onChange(value.slice(0, -1));
                else nav.onKeyDown(e);
              }}
              className="h-9 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3 focus-visible:shadow-none"
            />
            {value.length > 0 && <span className="shrink-0 text-micro text-ink-3 tabular-nums">{value.length} {L.selected}</span>}
          </div>
          <div id={nav.listId} role="listbox" aria-multiselectable className="max-h-64 min-h-0 flex-1 overflow-y-auto p-1">
            {visible.length === 0 && <div className="px-2 py-6 text-center text-meta text-ink-3">{L.noResults}</div>}
            {visible.map((o, i) => {
              const on = value.includes(o.value);
              return (
                <div
                  key={o.value}
                  id={nav.optionId(i)}
                  role="option"
                  aria-selected={on}
                  onPointerMove={() => nav.setActive(i)}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => toggle(o.value)}
                  className={cn("flex h-8 cursor-pointer items-center gap-2 rounded-chip px-2 text-body text-ink", i === nav.active && "bg-hover-2")}
                >
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-[5px] transition-colors", on ? "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" : "bg-surface shadow-btn")}>
                    {on && <IconCheck size={11} strokeWidth={3} />}
                  </span>
                  {o.icon && <span className="flex shrink-0 text-ink-3">{o.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-meta text-ink-3">{o.hint}</span>}
                </div>
              );
            })}
          </div>
      </Floating>
    </div>
  );
}

/* ── Dropzone ──────────────────────────────────────────── */

export const formatBytes = (n: number, locale = "es-ES") => {
  const u = ["B", "KB", "MB", "GB"];
  const i = Math.min(u.length - 1, Math.floor(Math.log(Math.max(n, 1)) / Math.log(1024)));
  return `${(n / 1024 ** i).toLocaleString(locale, { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`;
};

/** Zona para soltar o elegir archivos, con lista y validación de tamaño. Controlada. */
export function Dropzone({
  files,
  onFilesChange,
  accept,
  multiple = true,
  maxSize,
  hint,
  disabled,
  className,
}: {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** como en <input type="file">: "image/*,.pdf" */
  accept?: string;
  multiple?: boolean;
  /** bytes */
  maxSize?: number;
  /** texto bajo el título, p. ej. "PNG o PDF, hasta 5 MB" */
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const { labels: L, locale } = useUI();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const hintId = useId();

  const add = (list: FileList | null) => {
    if (!list) return;
    const incoming = [...list];
    const bad = maxSize ? incoming.filter((f) => f.size > maxSize) : [];
    const ok = incoming.filter((f) => !bad.includes(f));
    setRejected(bad.map((f) => f.name));
    onFilesChange(multiple ? [...files, ...ok] : ok.slice(0, 1));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-card border border-dashed px-4 py-7 text-center transition-[background-color,border-color,box-shadow] duration-150 disabled:opacity-55",
          over ? "border-accent bg-accent-tint shadow-[0_0_0_3px_var(--accent-tint)]" : "border-line-strong bg-inset hover:bg-hover",
        )}
      >
        <span className={cn("flex size-8 items-center justify-center rounded-full bg-surface shadow-btn transition-transform duration-200", over ? "scale-110 text-accent" : "text-ink-2")}>
          <IconPlus size={15} />
        </span>
        <span className="text-body font-medium text-ink">{L.dropzoneTitle}</span>
        {hint && (
          <span id={hintId} className="text-meta text-ink-3">
            {hint}
          </span>
        )}
      </button>
      <input ref={input} type="file" hidden accept={accept} multiple={multiple} onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      {rejected.length > 0 && (
        <p role="alert" className="text-meta text-red">
          {rejected.join(", ")} {L.fileTooBig}
          {maxSize ? ` (${formatBytes(maxSize, locale)})` : ""}.
        </p>
      )}
      {files.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-hairline">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 px-3 py-2" style={{ animation: "fade-in 150ms ease-out both" }}>
              <span className="flex h-7 min-w-9 items-center justify-center rounded-chip bg-hover-2 px-1 font-mono text-[9.5px] text-ink-2 uppercase">
                {f.name.split(".").pop()?.slice(0, 4)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body text-ink">{f.name}</span>
                <span className="text-micro text-ink-3 tabular-nums">{formatBytes(f.size, locale)}</span>
              </span>
              <button
                type="button"
                aria-label={`${L.dropzoneRemove} ${f.name}`}
                onClick={() => onFilesChange(files.filter((_, j) => j !== i))}
                className="primitive-icon-button text-ink-3 hover:bg-hover-2 hover:text-ink"
              >
                <IconX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── PasswordInput ─────────────────────────────────────── */

/**
 * Contraseña sobre UI SDK: botón de ver/ocultar (no envía el formulario),
 * aviso de Bloq Mayús y se oculta sola al enviar para que el navegador ofrezca guardarla.
 * Misma piel que Input (pozo `field`).
 */
export function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete = "current-password",
  name,
  required,
  disabled,
  className,
  id,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  /** "current-password" para entrar, "new-password" para registrarse o cambiarla */
  autoComplete?: "current-password" | "new-password" | "off";
  name?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const L = useLabels();
  return (
    <SDKPasswordInput
      value={value}
      onValueChange={(v: string) => onChange(v)}
      autoComplete={autoComplete}
      name={name}
      required={required}
      disabled={disabled}
      className={cn(
        fieldBase,
        "group/pw flex h-8 items-stretch overflow-hidden p-0 focus-within:border-accent focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--accent-tint)] data-disabled:opacity-55",
        aria["aria-invalid"] && "border-red focus-within:border-red focus-within:shadow-[0_0_0_3px_var(--red-tint)]",
        className,
      )}
    >
      <PasswordInputControl
        id={id}
        placeholder={placeholder}
        onBlur={onBlur}
        className="min-w-0 flex-1 bg-transparent pl-2.5 text-body text-ink outline-none placeholder:text-ink-3"
        {...aria}
      />
      <span aria-hidden className="hidden items-center pr-1 text-micro font-medium text-orange group-data-capslock/pw:flex">⇪ {L.capsLock}</span>
      <span className="flex items-center pr-1">
        <PasswordInputToggle
          className="flex size-6 items-center justify-center rounded-chip text-ink-3 outline-none transition-colors hover:bg-hover-2 hover:text-ink focus-visible:bg-hover-2 focus-visible:text-ink"
          aria-label={L.showPassword}
        >
          <IconEye size={14} className="group-data-visible/pw:hidden" />
          <IconEyeOff size={14} className="hidden group-data-visible/pw:block" />
        </PasswordInputToggle>
      </span>
    </SDKPasswordInput>
  );
}

/* ── OtpInput ──────────────────────────────────────────── */

/**
 * Código de un solo uso (2FA, verificación por email) sobre UI SDK: un único
 * input nativo con `autocomplete="one-time-code"` (pegar, autocompletar del SMS,
 * deshacer) pintado como casillas. `onComplete` salta al rellenar todas.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  groupSize,
  pattern = "digits",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-invalid": invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  /** se llama con el código completo, p. ej. para verificarlo */
  onComplete?: (value: string) => void;
  length?: number;
  /** separa las casillas en grupos (3 → «123–456») */
  groupSize?: number;
  pattern?: "digits" | "letters" | "alphanumeric";
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const L = useLabels();
  const size = groupSize && groupSize < length ? groupSize : length;
  const groups = Array.from({ length: Math.ceil(length / size) }, (_, g) => Array.from({ length: Math.min(size, length - g * size) }, (_, i) => g * size + i));
  return (
    <SDKOTPInput
      id={id}
      value={value}
      onValueChange={(v: string) => onChange(v)}
      onValueCommit={(v: string) => onComplete?.(v)}
      maxLength={length}
      pattern={pattern}
      inputMode={pattern === "digits" ? "numeric" : "text"}
      disabled={disabled}
      aria-label={ariaLabel ?? L.otpCode}
      aria-invalid={invalid || undefined}
      className={cn("group/otp inline-flex items-center gap-2 data-disabled:opacity-55", className)}
    >
      {groups.map((slots, g) => (
        <Fragment key={g}>
          {g > 0 && <OTPInputSeparator className="h-px w-2.5 rounded-full bg-line-strong" />}
          <OTPInputGroup className="flex gap-1.5">
            {slots.map((i) => (
              <OTPInputSlot
                key={i}
                index={i}
                className={cn(
                  `relative flex h-10 w-9 items-center justify-center rounded-control border border-line bg-field text-[17px] font-medium text-ink tabular-nums
                   shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow,background-color] duration-150
                   data-active:border-accent data-active:bg-surface data-active:shadow-[0_0_0_3px_var(--accent-tint)]`,
                  invalid && "border-red data-active:border-red data-active:shadow-[0_0_0_3px_var(--red-tint)]",
                )}
                render={(props, state) => (
                  <div {...props}>
                    {state.char}
                    {state.hasFakeCaret && <span aria-hidden className="bui-caret h-4.5 w-px bg-ink" />}
                  </div>
                )}
              />
            ))}
          </OTPInputGroup>
        </Fragment>
      ))}
    </SDKOTPInput>
  );
}
