import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useUI } from "./i18n";
import { Floating, useRovingFocus } from "./floating";
import { IconCheck, IconChevronRight } from "./icons";
import { Chevron, TRIGGER, usePopover } from "./Overlay";

/* ── utilidades de fecha (sin dependencias) ── */

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d: Date, n: number) => {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return new Date(r.getFullYear(), r.getMonth(), Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate()));
};
export const sameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && a.toDateString() === b.toDateString();
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
function clampDay(date: Date, min?: Date, max?: Date) {
  const day = startOfDay(date);
  const first = min && startOfDay(min);
  const last = max && startOfDay(max);
  if (first && day < first) return first;
  if (last && day > last) return last;
  return day;
}
/** primer día de la semana: domingo en EE. UU., lunes en el resto */
const weekStart = (locale: string) => (/^en-US$|^en$/i.test(locale) ? 0 : 1);

export type DateRange = { from: Date | null; to: Date | null };

/* ── Calendar ──────────────────────────────────────────── */

type CalendarProps = {
  /** días deshabilitados fuera de [min, max] */
  min?: Date;
  max?: Date;
  className?: string;
  /** enfoca el día activo al montar (dentro de un selector) */
  autoFocus?: boolean;
} & (
  | { mode?: "single"; value: Date | null; onChange: (date: Date) => void }
  | { mode: "range"; value: DateRange; onChange: (range: DateRange) => void }
);

/**
 * Calendario mensual accesible: rejilla con foco itinerante, ← → ↑ ↓ por día/semana,
 * RePág/AvPág por mes, Inicio/Fin por semana. Nombres de mes y días según el locale.
 */
export function Calendar(props: CalendarProps) {
  const { locale, labels: L } = useUI();
  const { min, max, className } = props;
  const single = props.mode !== "range";
  const anchor = single ? (props.value as Date | null) : (props.value as DateRange).from;
  const [focus, setFocus] = useState(() => clampDay(anchor ?? new Date(), min, max));
  const [month, setMonth] = useState(() => startOfMonth(focus));
  const [hover, setHover] = useState<Date | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const keyboard = useRef(!!props.autoFocus);

  const ws = weekStart(locale);
  const days = useMemo(() => {
    const first = startOfMonth(month);
    const offset = (first.getDay() - ws + 7) % 7;
    return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset));
  }, [month, ws]);
  const weekdays = useMemo(() => {
    const f = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const longF = new Intl.DateTimeFormat(locale, { weekday: "long" });
    return days.slice(0, 7).map((d) => ({ short: f.format(d), long: longF.format(d) }));
  }, [days, locale]);
  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(month);
  const fullDate = new Intl.DateTimeFormat(locale, { dateStyle: "full" });
  const today = startOfDay(new Date());

  const disabled = (d: Date) => (min && d < startOfDay(min)) || (max && d > startOfDay(max));

  useEffect(() => {
    if (!keyboard.current) return;
    keyboard.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focus.toDateString()}"]`)?.focus();
  }, [focus, month]);

  const moveFocus = (d: Date, viaKeyboard: boolean) => {
    const next = clampDay(d, min, max);
    keyboard.current = viaKeyboard;
    setFocus(next);
    const nextMonth = startOfMonth(next);
    if (nextMonth.getTime() !== month.getTime()) setMonth(nextMonth);
  };

  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
      Home: () => addDays(focus, -((focus.getDay() - ws + 7) % 7)),
      End: () => addDays(focus, 6 - ((focus.getDay() - ws + 7) % 7)),
    };
    if (map[e.key]) {
      e.preventDefault();
      moveFocus(map[e.key](), true);
    }
  };

  const pick = (d: Date) => {
    if (disabled(d)) return;
    moveFocus(d, false);
    if (single) return (props.onChange as (d: Date) => void)(d);
    const r = props.value as DateRange;
    const onChange = props.onChange as (r: DateRange) => void;
    if (!r.from || r.to) onChange({ from: d, to: null });
    else onChange(d < r.from ? { from: d, to: r.from } : { from: r.from, to: d });
  };

  const range = !single ? (props.value as DateRange) : null;
  const rangeEnd = range?.to ?? (range?.from && hover ? hover : null);
  const [lo, hi] = range?.from && rangeEnd ? (range.from <= rangeEnd ? [range.from, rangeEnd] : [rangeEnd, range.from]) : [null, null];

  const navBtn = "flex size-7 items-center justify-center rounded-control text-ink-2 transition-colors enabled:hover:bg-hover-2 enabled:hover:text-ink disabled:opacity-40";
  return (
    <div className={cn("w-[252px] select-none", className)}>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" className={navBtn} aria-label={L.prevMonth} disabled={!!min && month <= startOfMonth(min)} onClick={() => moveFocus(addMonths(focus, -1), false)}>
          <IconChevronRight size={14} className="rotate-180" />
        </button>
        <span className="text-body font-medium text-ink first-letter:uppercase" aria-live="polite">
          {title}
        </span>
        <button type="button" className={navBtn} aria-label={L.nextMonth} disabled={!!max && month >= startOfMonth(max)} onClick={() => moveFocus(addMonths(focus, 1), false)}>
          <IconChevronRight size={14} />
        </button>
      </div>
      <div role="grid" aria-label={title} ref={grid} onKeyDown={onKey} onPointerLeave={() => setHover(null)}>
        <div role="row" className="grid grid-cols-7">
          {weekdays.map((w, i) => (
            <span key={i} role="columnheader" aria-label={w.long} className="flex h-7 items-center justify-center text-micro text-ink-3 uppercase">
              {w.short}
            </span>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div role="row" key={row} className="grid grid-cols-7">
            {days.slice(row * 7, row * 7 + 7).map((d) => {
              const outside = d.getMonth() !== month.getMonth();
              const selected = single ? sameDay(d, props.value as Date | null) : sameDay(d, range?.from) || sameDay(d, range?.to);
              const inRange = lo && hi && d > lo && d < hi;
              const isFocus = sameDay(d, focus);
              const off = disabled(d);
              return (
                <div role="gridcell" key={d.toDateString()} aria-selected={selected || !!inRange} className={cn("flex h-9 items-center justify-center", inRange && "bg-accent-tint", sameDay(d, lo) && hi && !sameDay(lo, hi) && "rounded-l-full bg-accent-tint", sameDay(d, hi) && lo && !sameDay(lo, hi) && "rounded-r-full bg-accent-tint")}>
                  <button
                    type="button"
                    data-day={d.toDateString()}
                    tabIndex={isFocus ? 0 : -1}
                    disabled={!!off}
                    aria-label={fullDate.format(d)}
                    aria-current={sameDay(d, today) ? "date" : undefined}
                    onClick={() => pick(d)}
                    onPointerEnter={() => !single && setHover(d)}
                    className={cn(
                      "relative flex size-8 items-center justify-center rounded-full text-body tabular-nums transition-[background-color,color] duration-100",
                      selected ? "bg-accent font-medium text-white" : inRange ? "text-accent-ink hover:bg-surface" : "hover:bg-hover-2",
                      !selected && (outside ? "text-ink-3" : "text-ink"),
                      off && "pointer-events-none opacity-35",
                    )}
                  >
                    {d.getDate()}
                    {sameDay(d, today) && !selected && <span className="absolute bottom-1 size-1 rounded-full bg-accent" aria-hidden />}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── DatePicker ────────────────────────────────────────── */

const triggerCls = TRIGGER;
const panelCls = "rounded-card bg-surface shadow-overlay";

/** Campo de fecha: botón con la fecha formateada + calendario en popover. */
export function DatePicker({
  value,
  onChange,
  placeholder,
  min,
  max,
  className,
  id,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  min?: Date;
  max?: Date;
  className?: string;
  id?: string;
}) {
  const { locale, labels: L } = useUI();
  const { open, setOpen, ref, panelRef, focusTrigger } = usePopover();
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const done = () => (setOpen(false), focusTrigger());
  return (
    <div ref={ref} className={cn("relative", className)}>
      <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={triggerCls}>
        <span className={cn("truncate", value ? "text-ink" : "text-ink-3")}>{value ? fmt.format(value) : (placeholder ?? L.pickDate)}</span>
        <CalendarGlyph />
      </button>
      <Floating anchor={ref} open={open} panelRef={panelRef} role="dialog" aria-label={L.pickDate} className={cn(panelCls, "overflow-y-auto p-3")}>
        <Calendar
          value={value}
          min={min}
          max={max}
          autoFocus
          onChange={(d) => {
            onChange(d);
            done();
          }}
        />
        <div className="mt-2 flex justify-between border-t border-line pt-2">
          <Button size="xs" variant="quiet" onClick={() => (onChange(null), done())}>
            {L.clear}
          </Button>
          <Button size="xs" onClick={() => (onChange(startOfDay(new Date())), done())}>
            {L.today}
          </Button>
        </div>
      </Floating>
    </div>
  );
}

/* ── DateRangePicker ───────────────────────────────────── */

export type RangePreset = { id: string; label: string; range: () => DateRange };

/**
 * Selector de rango para filtros: presets en filas (lo que más se usa) y el
 * rango personalizado detrás de un divisor. `preset` indica el activo.
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  className,
  id,
}: {
  id?: string;
  value: DateRange & { preset?: string };
  onChange: (value: DateRange & { preset?: string }) => void;
  presets?: RangePreset[];
  className?: string;
}) {
  const { locale, labels: L } = useUI();
  const { open, setOpen, ref, panelRef, focusTrigger } = usePopover();
  const [custom, setCustom] = useState(false);
  const onKeyDown = useRovingFocus(panelRef, open && !custom, "[role=menuitemradio],[data-preset]");
  const today = startOfDay(new Date());
  const list: RangePreset[] = presets ?? [
    { id: "today", label: L.today, range: () => ({ from: today, to: today }) },
    { id: "7d", label: L.last7, range: () => ({ from: addDays(today, -6), to: today }) },
    { id: "30d", label: L.last30, range: () => ({ from: addDays(today, -29), to: today }) },
    { id: "90d", label: L.last90, range: () => ({ from: addDays(today, -89), to: today }) },
    { id: "month", label: L.thisMonth, range: () => ({ from: startOfMonth(today), to: today }) },
  ];
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const active = list.find((p) => p.id === value.preset);
  const text = active
    ? active.label
    : value.from && value.to
      ? `${fmt.format(value.from)} – ${fmt.format(value.to)}`
      : value.from
        ? `${fmt.format(value.from)} – …`
        : L.customRange;

  return (
    <div ref={ref} className={cn("relative inline-flex", className)}>
      <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => (setCustom(!active && !!value.from), setOpen((o) => !o))} className={cn(triggerCls, "w-auto min-w-44")}>
        <span className="flex items-center gap-2 truncate text-ink">
          <CalendarGlyph />
          {text}
        </span>
        <Chevron open={open} />
      </button>
      <Floating anchor={ref} open={open} panelRef={panelRef} role="dialog" aria-label={L.customRange} onKeyDown={onKeyDown} className={cn(panelCls, "w-max overflow-y-auto p-1")}>
          {!custom ? (
            <div className="flex w-52 flex-col">
              {list.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={p.id === value.preset}
                  onClick={() => {
                    onChange({ ...p.range(), preset: p.id });
                    setOpen(false);
                    focusTrigger();
                  }}
                  className="flex h-8 items-center justify-between gap-3 rounded-chip px-2 text-left text-body text-ink outline-none transition-colors hover:bg-hover-2 focus-visible:bg-hover-2"
                >
                  {p.label}
                  <IconCheck size={13} className={cn("shrink-0 text-accent-ink", p.id !== value.preset && "invisible")} />
                </button>
              ))}
              <div className="my-1 h-px bg-line" />
              <button type="button" data-preset onClick={() => setCustom(true)} className="flex h-8 items-center justify-between rounded-chip px-2 text-left text-body text-ink-2 outline-none transition-colors hover:bg-hover-2 hover:text-ink focus-visible:bg-hover-2">
                {L.customRange}
                <IconChevronRight size={13} />
              </button>
            </div>
          ) : (
            <div className="p-2">
              <Calendar
                mode="range"
                value={value}
                autoFocus
                onChange={(r) => {
                  onChange({ ...r, preset: undefined });
                  if (r.from && r.to) (setOpen(false), focusTrigger());
                }}
              />
              <div className="mt-2 flex justify-between border-t border-line pt-2">
                <Button size="xs" variant="quiet" onClick={() => setCustom(false)}>
                  <IconChevronRight size={12} className="rotate-180" /> {L.previous}
                </Button>
                <Button size="xs" variant="quiet" onClick={() => onChange({ from: null, to: null })}>
                  {L.clear}
                </Button>
              </div>
            </div>
          )}
      </Floating>
    </div>
  );
}

function CalendarGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-3" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

