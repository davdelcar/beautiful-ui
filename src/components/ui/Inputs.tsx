import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fieldBase } from "./Field";
import { useLabels, useUI } from "./i18n";
import { IconCheck, IconChevronDown, IconPlus, IconSearch, IconX } from "./icons";
import { matches, useListNav } from "./listbox";
import { usePopover } from "./Overlay";

/* ── Slider ────────────────────────────────────────────── */

/** Deslizador nativo (accesible por defecto) con pista rellena en acento. */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  showValue = false,
  format = (v: number) => String(v),
  className,
  ...aria
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** muestra el valor a la derecha */
  showValue?: boolean;
  format?: (value: number) => string;
  className?: string;
  id?: string;
  "aria-label"?: string;
}) {
  const fill = ((value - min) / (max - min || 1)) * 100;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <input
        type="range"
        className="bui-range min-w-0 flex-1"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as CSSProperties}
        {...aria}
      />
      {showValue && <span className="min-w-10 text-right font-mono text-meta text-ink-2 tabular-nums">{format(value)}</span>}
    </div>
  );
}

/* ── NumberInput ───────────────────────────────────────── */

const clamp = (n: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

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
  const [draft, setDraft] = useState<string | null>(null);
  const bump = (dir: 1 | -1, mult = 1) => onChange(clamp(Number(((value ?? min ?? 0) + dir * step * mult).toFixed(10)), min, max));
  const side = "flex w-7 items-center justify-center text-ink-3 transition-colors hover:bg-hover-2 hover:text-ink disabled:pointer-events-none disabled:opacity-40";
  return (
    <div className={cn(fieldBase, "flex h-8 items-stretch overflow-hidden p-0 focus-within:border-accent focus-within:bg-surface focus-within:shadow-[0_0_0_3px_var(--accent-tint)]", className)}>
      <button type="button" tabIndex={-1} className={side} aria-label={L.decrease} disabled={disabled || (min !== undefined && (value ?? min) <= min)} onClick={() => bump(-1)}>
        <span className="h-px w-2.5 bg-current" />
      </button>
      <input
        id={id}
        inputMode="decimal"
        type="number"
        disabled={disabled}
        className="bui-number min-w-0 flex-1 bg-transparent text-center text-body text-ink tabular-nums outline-none focus-visible:shadow-none"
        value={draft ?? (value ?? "")}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft === null) return;
          const n = draft.trim() === "" ? null : Number(draft.replace(",", "."));
          onChange(n === null || Number.isNaN(n) ? null : clamp(n, min, max));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            setDraft(null);
            bump(e.key === "ArrowUp" ? 1 : -1, e.shiftKey ? 10 : 1);
          } else if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        {...aria}
      />
      {suffix && <span className="flex items-center pr-1 text-meta text-ink-3">{suffix}</span>}
      <button type="button" tabIndex={-1} className={side} aria-label={L.increase} disabled={disabled || (max !== undefined && (value ?? -Infinity) >= max)} onClick={() => bump(1)}>
        <IconPlus size={12} />
      </button>
    </div>
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
}: {
  value: T[];
  onChange: (value: T[]) => void;
  options: MultiOption<T>[];
  placeholder?: string;
  /** chips visibles antes de «+N» */
  maxChips?: number;
  className?: string;
}) {
  const L = useLabels();
  const { open, setOpen, ref } = usePopover();
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
          "flex min-h-8 w-full cursor-pointer flex-wrap items-center gap-1 rounded-control bg-surface py-1 pr-1 pl-1.5 text-body shadow-btn transition-[background-color,box-shadow] duration-150 hover:bg-inset",
          open && "shadow-[0_0_0_1px_var(--accent),0_0_0_4px_var(--accent-tint)]",
        )}
      >
        {chosen.slice(0, maxChips).map((o) => (
          <span key={o.value} className="inline-flex h-6 items-center gap-1 rounded-chip bg-hover-2 pr-0.5 pl-1.5 text-meta text-ink">
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
          className="flex h-6 min-w-6 flex-1 items-center justify-between gap-2 rounded-chip px-1 text-left"
        >
          <span className="truncate text-ink-3">{chosen.length === 0 ? (placeholder ?? L.select) : ""}</span>
          <IconChevronDown size={13} className="shrink-0 text-ink-3" />
        </button>
      </div>

      {open && (
        <div className="bui-pop absolute top-full right-0 left-0 z-40 mt-1.5 min-w-56 overflow-hidden rounded-card bg-surface shadow-overlay" style={{ animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both" }}>
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
          <div id={nav.listId} role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto p-1">
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
                  <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-[4px] transition-colors", on ? "bg-accent text-white" : "bg-surface shadow-btn")}>
                    {on && <IconCheck size={11} strokeWidth={3} />}
                  </span>
                  {o.icon && <span className="flex shrink-0 text-ink-3">{o.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-meta text-ink-3">{o.hint}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
