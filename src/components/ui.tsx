import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

/* ------------------------------- Button ------------------------------- */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "dark" | "danger" | "soft";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconRight,
  full,
  className,
  children,
  ...rest
}: BtnProps) {
  const sizes = {
    xs: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
    sm: "h-9.5 px-4 text-[13px] gap-2 rounded-xl",
    md: "h-11 px-5 text-sm gap-2 rounded-xl",
    lg: "h-13 px-7 text-[15px] gap-2.5 rounded-2xl",
  };
  const variants = {
    primary:
      "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-[0_1px_0_rgb(255_255_255/.16)_inset,0_1px_2px_rgb(23_28_53/.08),0_6px_16px_-6px_rgb(104_84_217/.5)] hover:from-brand-400 hover:to-brand-600 active:translate-y-px",
    secondary:
      "bg-white text-slate-800 border border-slate-200 shadow-[0_1px_2px_rgb(23_28_53/.05)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:translate-y-px",
    outline:
      "border border-white/25 text-white bg-white/[0.06] backdrop-blur hover:bg-white/[0.14] hover:border-white/40 active:translate-y-px",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    dark: "bg-ink-900 text-white shadow-[0_1px_2px_rgb(23_28_53/.2)] hover:bg-ink-800 active:translate-y-px",
    danger: "bg-rose-600 text-white shadow-[0_1px_2px_rgb(224_82_82/.3)] hover:bg-rose-500 active:translate-y-px",
    soft: "bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100 hover:border-brand-200",
  };
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:opacity-55 disabled:pointer-events-none whitespace-nowrap",
        sizes[size],
        variants[variant],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

/* -------------------------------- Card -------------------------------- */
export function Card({
  className,
  children,
  hover,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgb(23_28_53/.04),0_1px_3px_rgb(23_28_53/.05)]",
        hover && "card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export const CardHeader = ({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4.5", className)}>
    <div className="min-w-0">
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-[12.5px] leading-snug text-slate-500">{subtitle}</p>}
    </div>
    {right}
  </div>
);

/* -------------------------------- Badge ------------------------------- */
const badgeTones: Record<string, string> = {
  neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200/80",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  warn: "bg-amber-50 text-amber-700 ring-amber-200/80",
  danger: "bg-rose-50 text-rose-700 ring-rose-200/80",
  info: "bg-aqua-500/8 text-aqua-600 ring-aqua-500/20",
  purple: "bg-purple-50 text-purple-700 ring-purple-200/80",
  dark: "bg-ink-900 text-white ring-ink-900",
};

export function Badge({
  tone = "neutral",
  dot,
  className,
  children,
}: {
  tone?: keyof typeof badgeTones | string;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.01em] ring-1 ring-inset",
        badgeTones[tone] ?? badgeTones.neutral,
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* -------------------------------- Inputs ------------------------------ */
export function Field({
  label,
  hint,
  error,
  children,
  className,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="text-[12.5px] font-semibold text-slate-700">
            {label}
            {required && <span className="ml-0.5 text-rose-500">*</span>}
          </span>
          {hint && <span className="text-[11px] font-medium text-slate-400">{hint}</span>}
        </span>
      )}
      {children}
      {error && <span className="mt-1 block text-[11.5px] font-medium text-rose-600">{error}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12";

export const Input = ({ className, isInvalid, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { isInvalid?: boolean }) => (
  <input
    className={cn(inputBase, "h-11", isInvalid && "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12", className)}
    aria-invalid={isInvalid || undefined}
    {...p}
  />
);

export const Textarea = ({ className, isInvalid, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { isInvalid?: boolean }) => (
  <textarea
    className={cn(
      inputBase,
      "min-h-[104px] py-3 leading-relaxed",
      isInvalid && "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12",
      className
    )}
    aria-invalid={isInvalid || undefined}
    {...p}
  />
);

export const Select = ({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select className={cn(inputBase, "h-11 cursor-pointer appearance-none pr-10", className)} {...p}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
  </div>
);

/* -------------------------------- Modal ------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink-950/55 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl",
          "animate-[popIn_.28s_cubic-bezier(.22,1,.36,1)]",
          w
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
            {subtitle && <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="max-h-[68vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* -------------------------------- Tabs -------------------------------- */
export function Tabs({
  tabs,
  active,
  onChange,
  className,
  size = "md",
}: {
  tabs: { id: string; label: string; count?: number; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100/90 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-lg font-semibold transition-all duration-200",
            size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9.5 px-4 text-[13px]",
            active === t.id
              ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(16,24,40,.10)]"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          {t.icon}
          {t.label}
          {t.count !== undefined && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums",
                active === t.id ? "bg-brand-50 text-brand-600" : "bg-slate-200/80 text-slate-500"
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Avatar ------------------------------- */
export function Avatar({
  src,
  name,
  size = 40,
  ring,
  className,
}: {
  src?: string;
  name?: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-aqua-500 font-bold text-white",
        ring && "ring-2 ring-white",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      title={name}
    >
      {src ? <img src={src} alt={name ?? ""} loading="lazy" className="size-full object-cover" /> : initials}
    </span>
  );
}

/* ------------------------------ Progress ------------------------------ */
export function Progress({
  value,
  className,
  tone = "brand",
  height = 8,
}: {
  value: number;
  className?: string;
  tone?: "brand" | "success" | "warn" | "danger" | "info" | "purple";
  height?: number;
}) {
  const tones = {
    brand: "from-brand-500 to-brand-400",
    success: "from-emerald-500 to-emerald-400",
    warn: "from-amber-500 to-amber-400",
    danger: "from-rose-500 to-rose-400",
    info: "from-aqua-500 to-aqua-400",
    purple: "from-fuchsia-500 to-purple-500",
  };
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-slate-100", className)} style={{ height }}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------- Toggle ------------------------------- */
export const Toggle = ({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  desc?: string;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex w-full items-center justify-between gap-4 text-left"
  >
    <span className="min-w-0">
      {label && <span className="block text-[13.5px] font-semibold text-slate-800">{label}</span>}
      {desc && <span className="mt-0.5 block text-[12px] text-slate-500">{desc}</span>}
    </span>
    <span
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-brand-600" : "bg-slate-300"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all duration-200",
          checked ? "left-[22px]" : "left-0.5"
        )}
      />
    </span>
  </button>
);

/* -------------------------------- Table ------------------------------- */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">{children}</table>
    </div>
  );
}
export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th
    className={cn(
      "sticky top-0 z-1 whitespace-nowrap border-b border-slate-200 bg-slate-50/95 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-500 backdrop-blur",
      className
    )}
  >
    {children}
  </th>
);
export const Td = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn("border-b border-slate-100 px-4 py-3 align-middle text-[13px] text-slate-700", className)}>{children}</td>
);

/* ------------------------------ Reveal -------------------------------- */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-[750ms] ease-[cubic-bezier(.22,1,.36,1)]", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------- CountUp ------------------------------ */
export function CountUp({ to, suffix = "", prefix = "", decimals = 0, duration = 1500 }: {
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(to * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/* ------------------------------ Checkbox ------------------------------ */
export const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: React.ReactNode;
}) => (
  <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-2.5 text-left">
    <span
      className={cn(
        "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-[6px] border transition",
        checked ? "border-brand-600 bg-brand-600" : "border-slate-300 bg-white"
      )}
    >
      {checked && <Check className="size-3 text-white" strokeWidth={3.5} />}
    </span>
    {label && <span className="text-[13px] leading-snug text-slate-600">{label}</span>}
  </button>
);

/* ------------------------------- Empty ------------------------------- */
export const EmptyState = ({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
    <h4 className="mt-4 font-display text-[15px] font-semibold text-slate-800">{title}</h4>
    <p className="mt-1.5 max-w-sm text-[13px] text-slate-500">{body}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* --------------------------- SectionHeading --------------------------- */
export function SectionHeading({
  eyebrow,
  title,
  body,
  center,
  light,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  center?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center && "mx-auto text-center", "max-w-2xl", className)}>
      {eyebrow && (
        <span
          className={cn(
            "eyebrow",
            light ? "bg-white/[0.07] text-brand-200 ring-1 ring-white/10" : "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
          )}
        >
          <span className="size-1 rounded-full bg-current opacity-70" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "mt-4 font-display text-[28px] font-bold leading-[1.16] tracking-[-0.035em] sm:text-[36px]",
          light ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h2>
      {body && (
        <p className={cn("mt-4 max-w-xl text-[14.5px] leading-[1.8]", center && "mx-auto", light ? "text-slate-300/80" : "text-slate-600")}>
          {body}
        </p>
      )}
    </div>
  );
}
