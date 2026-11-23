import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { Badge, Button, Modal } from "@/components/ui";
import { useStore } from "@/lib/store";
import { NOTIFICATIONS } from "@/lib/data";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";

/* ============================ Motion presets ========================= */
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MotionDiv({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================== Pagination ========================== */
export function Pagination({
  page,
  pages,
  onChange,
  total,
  perPage,
  className,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
  total?: number;
  perPage?: number;
  className?: string;
}) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  const from = total && perPage ? (page - 1) * perPage + 1 : 0;
  const to = total && perPage ? Math.min(total, page * perPage) : 0;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {total !== undefined && perPage ? (
        <p className="text-[12.5px] text-slate-500">
          Showing <b className="text-slate-800">{from}</b>–<b className="text-slate-800">{to}</b> of{" "}
          <b className="text-slate-800">{total}</b>
        </p>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronLeft className="size-4" />
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "grid size-9 place-items-center rounded-lg text-[13px] font-semibold tabular-nums transition",
                n === page
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/30"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {n}
            </button>
          )
        )}
        <button
          onClick={() => onChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          aria-label="Next page"
          className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================== Skeletons =========================== */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton-bar rounded-lg", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("flex-1", c === 0 ? "h-9" : "h-4")} />
          ))}
        </div>
      ))}
      <p className="pt-1 text-center text-[12px] font-medium text-slate-400">Loading data…</p>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-5">
      <Skeleton className="h-11 w-11 rounded-xl" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/* ============================ State blocks ========================== */
export function StateBlock({
  tone = "info",
  icon,
  title,
  body,
  action,
}: {
  tone?: "info" | "success" | "warn" | "danger";
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const tones = {
    info: "bg-brand-50 text-brand-600",
    success: "bg-emerald-50 text-emerald-600",
    warn: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
  };
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className={cn("grid size-14 place-items-center rounded-2xl", tones[tone])}>{icon}</div>
      <h4 className="mt-4 font-display text-[16px] font-bold text-slate-900">{title}</h4>
      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* =========================== Confirm dialog ========================= */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  icon,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand" | "success";
  icon?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) setBusy(false);
  }, [open]);
  const tones = {
    danger: { btn: "danger", ring: "bg-rose-50 text-rose-600" },
    brand: { btn: "primary", ring: "bg-brand-50 text-brand-600" },
    success: { btn: "primary", ring: "bg-emerald-50 text-emerald-600" },
  } as const;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-4">
        <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", tones[tone].ring)}>
          {icon ?? <AlertTriangle className="size-5" />}
        </span>
        <p className="text-[13.5px] leading-relaxed text-slate-600">{body}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={tones[tone].btn as any}
          loading={busy}
          onClick={() => {
            setBusy(true);
            window.setTimeout(() => {
              setBusy(false);
              onConfirm();
              onClose();
            }, 550);
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ============================== Dropdown ============================ */
export function Dropdown({
  trigger,
  children,
  align = "right",
  width = "w-52",
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(23,28,53,.35)]",
              width,
              align === "right" ? "right-0" : "left-0"
            )}
            role="menu"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  icon,
  children,
  onClick,
  danger,
  shortcut,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-100"
      )}
    >
      {icon && <span className="shrink-0 [&>svg]:size-4 [&>svg]:text-current">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="shrink-0 text-[10.5px] font-bold text-slate-400">{shortcut}</span>}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

export const RowMenu = ({ items }: { items: { label: string; icon?: React.ReactNode; danger?: boolean; onClick: () => void }[] }) => (
  <Dropdown
    width="w-48"
    trigger={({ toggle }) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-label="Row actions"
        className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
      >
        <MoreHorizontal className="size-4" />
      </button>
    )}
  >
    {items.map((it) => (
      <DropdownItem key={it.label} icon={it.icon} danger={it.danger} onClick={it.onClick}>
        {it.label}
      </DropdownItem>
    ))}
  </Dropdown>
);

/* ======================= Notification dropdown ====================== */
export function NotificationsMenu({ onDark }: { onDark?: boolean }) {
  const { toast } = useStore();
  const [read, setRead] = useState<string[]>([]);
  const unread = NOTIFICATIONS.filter((n) => !read.includes(n.id)).length;

  const tones: Record<string, string> = {
    warn: "bg-amber-50 text-amber-600",
    success: "bg-emerald-50 text-emerald-600",
    info: "bg-brand-50 text-brand-600",
  };

  return (
    <Dropdown
      width="w-[min(92vw,352px)]"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          aria-label={`Notifications, ${unread} unread`}
          className={cn(
            "relative grid size-9.5 place-items-center rounded-xl transition",
            onDark ? "text-white/80 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
          )}
        >
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white ring-2 ring-white">
              {unread}
            </span>
          )}
        </button>
      )}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[13px] font-bold text-slate-900">Notifications</span>
        {unread > 0 && <Badge tone="brand">{unread} new</Badge>}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {NOTIFICATIONS.map((n) => {
          const isRead = read.includes(n.id);
          return (
            <button
              key={n.id}
              onClick={() => setRead((p) => [...p, n.id])}
              className={cn(
                "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50",
                isRead && "opacity-55"
              )}
            >
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl", tones[n.tone])}>
                <Bell className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold leading-snug text-slate-800">{n.title}</span>
                <span className="mt-0.5 block truncate text-[11.5px] text-slate-500">{n.body}</span>
                <span className="mt-1 block text-[10.5px] text-slate-400">{n.time} ago</span>
              </span>
              {!isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
            </button>
          );
        })}
      </div>
      <div className="mt-1 border-t border-slate-100 p-1.5">
        <button
          onClick={() => {
            setRead(NOTIFICATIONS.map((n) => n.id));
            toast({ title: "All notifications marked as read", tone: "success" });
          }}
          className="w-full rounded-xl px-3 py-2 text-[12.5px] font-bold text-brand-600 transition hover:bg-brand-50"
        >
          Mark all as read
        </button>
      </div>
    </Dropdown>
  );
}

/* ========================= Simulated loading ======================== */
export function useFakeLoad(ms = 650) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/* ======================= Export toast actions ====================== */
export function useExport() {
  const { toast } = useStore();
  return {
    csv: (label: string) => toast({ title: "CSV export started", body: `${label}.csv will download shortly.`, tone: "success" }),
    pdf: (label: string) => toast({ title: "PDF export started", body: `${label}.pdf will download shortly.`, tone: "success" }),
    xlsx: (label: string) => toast({ title: "XLSX export started", body: `${label}.xlsx will download shortly.`, tone: "success" }),
  };
}

export { CheckCircle2, Trash2, X };
