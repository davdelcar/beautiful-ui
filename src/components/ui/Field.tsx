import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* Campos de texto: pozo `bg-field` con borde `line` (igual que el composer de
 * ChatComposer); al enfocar se eleva a `surface` con anillo de acento. */
export const fieldBase = `w-full min-w-0 rounded-control border border-line bg-field text-body text-ink
  shadow-[0_1px_2px_rgba(0,0,0,0.035)] outline-none placeholder:text-ink-3
  transition-[border-color,box-shadow,background-color] duration-150
  hover:border-line-strong
  focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-tint)]
  aria-invalid:border-red aria-invalid:shadow-[0_0_0_3px_var(--red-tint)]
  disabled:pointer-events-none disabled:opacity-55`;

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** icono o texto a la izquierda */
  leading?: ReactNode;
  /** icono, kbd o botón a la derecha */
  trailing?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, className, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      className={cn(fieldBase, "h-8 px-2.5", leading && "pl-8", trailing && "pr-9", !leading && !trailing && className)}
      {...props}
    />
  );
  if (!leading && !trailing) return input;
  return (
    <div className={cn("relative flex items-center", className)}>
      {leading && (
        <span className="pointer-events-none absolute left-2.5 flex text-ink-3">{leading}</span>
      )}
      {input}
      {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(fieldBase, "min-h-21 resize-y px-2.5 py-2 leading-normal", className)}
        {...props}
      />
    );
  },
);

/** Etiqueta + control + ayuda/error. Pasa el id al control vía render prop. */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-label font-medium text-ink-2">
          {label}
        </label>
      )}
      {children(id)}
      {error ? (
        <span className="text-meta text-red" style={{ animation: "fade-in 150ms ease-out both" }}>
          {error}
        </span>
      ) : (
        hint && <span className="text-meta text-ink-3">{hint}</span>
      )}
    </div>
  );
}

/** Tecla — mismo tratamiento que los atajos de los primitives. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        `inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[5px] bg-surface px-1
         font-mono text-[10.5px] leading-none text-ink-3 shadow-btn`,
        className,
      )}
    >
      {children}
    </kbd>
  );
}
