import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Checkbox, radio y switch. Controles accesibles (input nativo oculto) con
 * la piel de la librería: caja `surface` + `shadow-btn`, relleno de acento
 * al marcar y la curva ease-out-strong en todos los cambios. */

const ease = "cubic-bezier(0.23,1,0.32,1)";

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** nombre accesible cuando no hay `label` visible */
  "aria-label"?: string;
}) {
  const on = checked || indeterminate;
  return (
    <label className={cn("group inline-flex items-center gap-2 text-[13px] text-ink", disabled && "opacity-50", className)}>
      <input
        type="checkbox"
        className="peer sr-only"
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          `flex size-4 shrink-0 items-center justify-center rounded-[5px] transition-[background-color,box-shadow] duration-150
           peer-focus-visible:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]`,
          on ? "bg-accent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]" : "bg-surface shadow-btn group-hover:bg-hover",
        )}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: on ? "scale(1)" : "scale(0.4)", opacity: on ? 1 : 0, transition: `transform 200ms ${ease}, opacity 120ms` }}>
          {indeterminate ? <path d="M6 12h12" /> : <path d="M20 6L9 17l-5-5" />}
        </svg>
      </span>
      {label}
    </label>
  );
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  className?: string;
}) {
  const name = useId();
  return (
    <div role="radiogroup" className={cn("flex flex-col gap-2", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label key={o.value} className={cn("group inline-flex items-center gap-2 text-[13px] text-ink", o.disabled && "opacity-50")}>
            <input type="radio" name={name} className="peer sr-only" checked={on} disabled={o.disabled} onChange={() => onChange(o.value)} />
            <span
              aria-hidden
              className={cn(
                `flex size-4 shrink-0 items-center justify-center rounded-full transition-[background-color,box-shadow] duration-150
                 peer-focus-visible:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]`,
                on ? "bg-accent" : "bg-surface shadow-btn group-hover:bg-hover",
              )}
            >
              <span className="size-1.5 rounded-full bg-white" style={{ transform: on ? "scale(1)" : "scale(0)", transition: `transform 200ms ${ease}` }} />
            </span>
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** nombre accesible cuando no hay `label` visible */
  "aria-label"?: string;
}) {
  return (
    <label className={cn("inline-flex items-center gap-2 text-[13px] text-ink", disabled && "opacity-50", className)}>
      <input type="checkbox" role="switch" className="peer sr-only" aria-label={ariaLabel} checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden
        className={cn(
          `relative h-[18px] w-[30px] shrink-0 rounded-full transition-colors duration-200
           peer-focus-visible:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]`,
          checked ? "bg-accent" : "bg-hover-2 shadow-[inset_0_0_0_1px_var(--line-strong)]",
        )}
      >
        <span
          className="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
          style={{ transform: `translateX(${checked ? 12 : 0}px)`, transition: `transform 240ms ${ease}` }}
        />
      </span>
      {label}
    </label>
  );
}
