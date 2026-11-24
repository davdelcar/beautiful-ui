import type { ReactNode } from "react";
import { Checkbox as SDKCheckbox, CheckboxIndicator } from "@ui-sdk/react/checkbox";
import { Radio, RadioGroup as SDKRadioGroup, RadioIndicator } from "@ui-sdk/react/radio";
import { Switch as SDKSwitch, SwitchThumb } from "@ui-sdk/react/switch";
import { cn } from "@/lib/utils";

/* Checkbox, radio y switch sobre UI SDK (rol ARIA, input nativo para
 * formularios, flechas en el grupo de radios) con la piel de la librería:
 * caja `surface` + `shadow-btn`, relleno de acento al marcar y la curva
 * ease-out-strong en todos los cambios. */

const ring = "bui-ring outline-none focus-visible:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]";
const box = `flex size-4 shrink-0 items-center justify-center transition-[background-color,box-shadow] duration-150 ${ring}
  bg-surface shadow-btn data-unchecked:group-hover/choice:bg-hover data-disabled:cursor-default`;
const row = "group/choice inline-flex items-center gap-2 text-body text-ink has-[[data-disabled]]:opacity-50";

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** nombre accesible cuando no hay `label` visible */
  "aria-label"?: string;
}) {
  return (
    <label className={cn(row, className)}>
      <SDKCheckbox
        id={id}
        aria-label={ariaLabel}
        checked={indeterminate ? "indeterminate" : checked}
        onCheckedChange={(v) => onChange(v === true)}
        disabled={disabled}
        className={cn(
          box,
          `rounded-[5px] data-checked:bg-accent data-checked:text-white data-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]
           data-indeterminate:bg-accent data-indeterminate:text-white data-indeterminate:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]
           focus-visible:data-checked:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]
           focus-visible:data-indeterminate:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]`,
        )}
      >
        <CheckboxIndicator
          keepMounted
          className="flex scale-40 opacity-0 transition-[transform,opacity] duration-200 ease-[var(--ease-out-strong)] data-checked:scale-100 data-checked:opacity-100 data-indeterminate:scale-100 data-indeterminate:opacity-100"
        >
          <svg aria-hidden width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            {indeterminate ? <path d="M6 12h12" /> : <path d="M20 6L9 17l-5-5" />}
          </svg>
        </CheckboxIndicator>
      </SDKCheckbox>
      {label}
    </label>
  );
}

export function RadioGroup<T extends string>({
  value,
  onChange,
  options,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; disabled?: boolean }[];
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <SDKRadioGroup
      value={value}
      onValueChange={(v) => v != null && onChange(v as T)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn("flex flex-col gap-2", className)}
    >
      {options.map((o) => (
        <label key={o.value} className={row}>
          <Radio
            value={o.value}
            disabled={o.disabled}
            className={cn(box, "rounded-full data-checked:bg-accent data-checked:shadow-none focus-visible:data-checked:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]")}
          >
            <RadioIndicator
              keepMounted
              className="size-1.5 scale-0 rounded-full bg-white transition-transform duration-200 ease-[var(--ease-out-strong)] data-checked:scale-100"
            />
          </Radio>
          {o.label}
        </label>
      ))}
    </SDKRadioGroup>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
  /** nombre accesible cuando no hay `label` visible */
  "aria-label"?: string;
}) {
  return (
    <label className={cn(row, className)}>
      <SDKSwitch
        id={id}
        aria-label={ariaLabel}
        checked={checked}
        onCheckedChange={(v) => onChange(v)}
        disabled={disabled}
        className={`relative h-[18px] w-[30px] shrink-0 rounded-full bg-hover-2 shadow-[inset_0_0_0_1px_var(--line-strong)] transition-[background-color,box-shadow] duration-200
          data-checked:bg-accent data-checked:shadow-none ${ring} focus-visible:data-checked:shadow-[0_0_0_2px_var(--page),0_0_0_4px_var(--accent)]`}
      >
        <SwitchThumb className="absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-[240ms] ease-[var(--ease-out-strong)] data-checked:translate-x-3 rtl:data-checked:-translate-x-3" />
      </SDKSwitch>
      {label}
    </label>
  );
}
