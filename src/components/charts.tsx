import React, { useId, useMemo, useState } from "react";
import { cn } from "@/utils/cn";

/* =====================================================================
   Hand-built responsive SVG chart kit — zero dependencies
   ===================================================================== */

const pathFrom = (pts: { x: number; y: number }[], smooth = 0.22) => {
  if (pts.length === 0) return "";
  if (pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) * smooth;
    const c1y = p1.y + (p2.y - p0.y) * smooth;
    const c2x = p2.x - (p3.x - p1.x) * smooth;
    const c2y = p2.y - (p3.y - p1.y) * smooth;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
};

/* ----------------------------- Area Chart ----------------------------- */
export function AreaChart({
  data,
  keys = ["a", "b"],
  labels = ["This year", "Last year"],
  colors = ["#6854d9", "#0ea5e9"],
  height = 240,
  format = (n: number) => String(n),
  showGrid = true,
  className,
}: {
  data: Record<string, any>[];
  keys?: string[];
  labels?: string[];
  colors?: string[];
  height?: number;
  format?: (n: number) => string;
  showGrid?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/[:]/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const pad = { t: 18, r: 12, b: 28, l: 44 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;

  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k]) || 0))) * 1.14 || 1;
  const xAt = (i: number) => pad.l + (data.length === 1 ? iw / 2 : (i * iw) / (data.length - 1));
  const yAt = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = 4;

  return (
    <div className={cn("relative w-full", className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img">
        <defs>
          {keys.map((k, ki) => (
            <linearGradient key={k} id={`ag-${uid}-${ki}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[ki]} stopOpacity="0.34" />
              <stop offset="70%" stopColor={colors[ki]} stopOpacity="0.05" />
              <stop offset="100%" stopColor={colors[ki]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {showGrid &&
          Array.from({ length: ticks + 1 }).map((_, i) => {
            const y = pad.t + (i * ih) / ticks;
            return (
              <g key={i}>
                <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="#e7e9f2" strokeWidth="1" strokeDasharray={i ? "4 6" : ""} />
                <text x={pad.l - 10} y={y + 4} textAnchor="end" className="fill-slate-400" style={{ fontSize: 10.5, fontWeight: 600 }}>
                  {format(Math.round(max - (i * max) / ticks))}
                </text>
              </g>
            );
          })}

        {keys.map((k, ki) => {
          const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(Number(d[k]) || 0) }));
          const line = pathFrom(pts);
          return (
            <g key={k}>
              <path d={`${line} L${xAt(data.length - 1)},${pad.t + ih} L${pad.l},${pad.t + ih} Z`} fill={`url(#ag-${uid}-${ki})`} />
              <path
                d={line}
                fill="none"
                stroke={colors[ki]}
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeDasharray={ki === 1 ? "6 5" : undefined}
                style={{ filter: `drop-shadow(0 4px 10px ${colors[ki]}44)` }}
              />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hover === i ? 5 : 0}
                  fill="#fff"
                  stroke={colors[ki]}
                  strokeWidth="2.5"
                />
              ))}
            </g>
          );
        })}

        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={xAt(i) - iw / (data.length * 2)}
              y={pad.t}
              width={iw / data.length}
              height={ih}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            <text
              x={xAt(i)}
              y={H - 8}
              textAnchor="middle"
              className={cn(hover === i ? "fill-slate-700" : "fill-slate-400")}
              style={{ fontSize: 10.5, fontWeight: 600 }}
            >
              {d.label}
            </text>
          </g>
        ))}

        {hover !== null && (
          <line x1={xAt(hover)} x2={xAt(hover)} y1={pad.t} y2={pad.t + ih} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 4" />
        )}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-[136px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur"
          style={{ left: `${((xAt(hover) / W) * 100).toFixed(2)}%` }}
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{data[hover].label}</p>
          {keys.map((k, ki) => (
            <div key={k} className="flex items-center gap-2 text-[12px]">
              <span className="size-2 rounded-full" style={{ background: colors[ki] }} />
              <span className="text-slate-500">{labels[ki]}</span>
              <span className="ml-auto font-bold tabular-nums text-slate-900">{format(Number(data[hover][k]) || 0)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1.5 pl-11">
        {labels.map((l, i) => (
          <span key={l} className="inline-flex items-center gap-2 text-[11.5px] font-medium text-slate-500">
            <span className="h-1 w-4 rounded-full" style={{ background: colors[i] }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Bar Chart ----------------------------- */
export function BarChart({
  data,
  height = 240,
  color = "#6854d9",
  format = (n: number) => String(n),
  horizontal = false,
  showValues = false,
  className,
}: {
  data: { label: string; v: number }[];
  height?: number;
  color?: string;
  format?: (n: number) => string;
  horizontal?: boolean;
  showValues?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.v)) || 1;

  if (horizontal)
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((d, i) => (
          <div key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-slate-700">{d.label}</span>
              <span className="text-[12.5px] font-bold tabular-nums text-slate-900">{format(d.v)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-all duration-[900ms] ease-out"
                style={{
                  width: `${(d.v / max) * 100}%`,
                  background: `linear-gradient(90deg,${color},${color}bb)`,
                  boxShadow: hover === i ? `0 0 0 3px ${color}22` : undefined,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((d, i) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="w-full origin-bottom rounded-t-[6px] transition-all duration-500 ease-out"
              style={{
                height: `${Math.max(2, (d.v / max) * 100)}%`,
                background:
                  hover === i
                    ? `linear-gradient(180deg,${color},${color}aa)`
                    : `linear-gradient(180deg,${color}e0,${color}70)`,
              }}
            />
            {showValues && (
              <span className="mt-1.5 text-center text-[10.5px] font-bold tabular-nums text-slate-500 group-hover:text-slate-800">
                {format(d.v)}
              </span>
            )}
            <span className="mt-1 text-center text-[10.5px] font-semibold text-slate-400">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Donut --------------------------------- */
export function Donut({
  data,
  size = 190,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e9f2" strokeWidth={thickness} />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const off = acc;
            acc += len;
            return (
              <circle
                key={d.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={hover === i ? thickness + 5 : thickness}
                strokeDasharray={`${len - 2.5} ${c - len + 2.5}`}
                strokeDashoffset={-off}
                strokeLinecap="round"
                className="transition-all duration-300"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {hover !== null ? `${data[hover].value}%` : centerValue ?? `${total}%`}
            </p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {hover !== null ? data[hover].label : centerLabel ?? "Total"}
            </p>
          </div>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {data.map((d, i) => (
          <div
            key={d.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex cursor-default items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-50"
          >
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
            <span className="text-[13px] font-medium text-slate-600">{d.label}</span>
            <span className="ml-auto text-[13px] font-bold tabular-nums text-slate-900">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Sparkline ------------------------------ */
export function Sparkline({
  values,
  color = "#6854d9",
  width = 110,
  height = 34,
  fill = true,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  const uid = useId().replace(/[:]/g, "");
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rng = max - min || 1;
  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - 3 - ((v - min) / rng) * (height - 8),
  }));
  const d = pathFrom(pts);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#sp-${uid})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.6" fill={color} />
    </svg>
  );
}

/* ------------------------------- Gauge -------------------------------- */
export function Gauge({
  value,
  size = 148,
  label,
  sub,
  color = "#6854d9",
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
  color?: string;
}) {
  const r = size / 2 - 12;
  const circ = Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size / 1.75 }} className="relative">
        <svg width={size} height={size / 1.75} viewBox={`0 0 ${size} ${size / 1.75}`}>
          <path
            d={`M12,${size / 1.75 - 8} A${r},${r} 0 0 1 ${size - 12},${size / 1.75 - 8}`}
            fill="none"
            stroke="#e7e9f2"
            strokeWidth="13"
            strokeLinecap="round"
          />
          <path
            d={`M12,${size / 1.75 - 8} A${r},${r} 0 0 1 ${size - 12},${size / 1.75 - 8}`}
            fill="none"
            stroke={color}
            strokeWidth="13"
            strokeLinecap="round"
            strokeDasharray={`${(value / 100) * circ} ${circ}`}
            style={{ transition: "stroke-dasharray 1s cubic-bezier(.22,1,.36,1)" }}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="font-display text-[26px] font-bold leading-none tracking-tight text-slate-900">{value}%</p>
          {label && <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{label}</p>}
        </div>
      </div>
      {sub && <p className="mt-1.5 text-center text-[11.5px] text-slate-500">{sub}</p>}
    </div>
  );
}

/* ------------------------------ Heatmap ------------------------------- */
export function Heatmap({
  rows,
  cols,
  values,
  color = "#5947c6",
}: {
  rows: string[];
  cols: string[];
  values: number[][];
  color?: string;
}) {
  const [tip, setTip] = useState<{ r: number; c: number } | null>(null);
  const max = Math.max(...values.flat()) || 1;
  return (
    <div className="relative">
      <div className="flex gap-1.5">
        <div className="flex w-8 shrink-0 flex-col gap-1.5 pt-[18px]">
          {rows.map((r) => (
            <div key={r} className="flex h-7 items-center justify-end pr-1 text-[10.5px] font-bold uppercase text-slate-400">
              {r}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols.length},minmax(0,1fr))` }}>
            {cols.map((c) => (
              <div key={c} className="text-center text-[10px] font-bold text-slate-400">
                {c}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {values.map((row, ri) => (
              <div key={ri} className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols.length},minmax(0,1fr))` }}>
                {row.map((v, ci) => {
                  const a = v / max;
                  return (
                    <div
                      key={ci}
                      onMouseEnter={() => setTip({ r: ri, c: ci })}
                      onMouseLeave={() => setTip(null)}
                      className="h-7 cursor-pointer rounded-[5px] transition-transform duration-150 hover:scale-[1.14]"
                      style={{
                        background: a < 0.06 ? "#e7e9f2" : color,
                        opacity: a < 0.06 ? 1 : 0.22 + a * 0.78,
                      }}
                      title={`${rows[ri]} ${cols[ci]}:00 — ${v}% traffic`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 pl-8">
        <span className="text-[10.5px] font-semibold text-slate-400">Low</span>
        <div className="flex gap-1">
          {[0.18, 0.36, 0.54, 0.72, 1].map((o) => (
            <span key={o} className="size-3 rounded-[3px]" style={{ background: color, opacity: o }} />
          ))}
        </div>
        <span className="text-[10.5px] font-semibold text-slate-400">High</span>
        {tip && (
          <span className="ml-auto rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
            {rows[tip.r]} · {cols[tip.c]}:00 — {values[tip.r][tip.c]}% peak
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Radial Bars --------------------------- */
export function RadialStack({
  items,
  size = 200,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const max = Math.max(...items.map((i) => i.value)) || 1;
  const r0 = size / 2 - 8;
  const step = 15;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {items.map((it, i) => {
          const r = r0 - i * step;
          const frac = it.value / max;
          const c = 2 * Math.PI * r;
          return (
            <g key={it.label}>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7e9f2" strokeWidth="9" />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={it.color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${frac * c * 0.75} ${c}`}
                style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.22,1,.36,1)" }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-xl font-bold text-slate-900">{items.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tracks</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Funnel ------------------------------- */
export function Funnel({ steps }: { steps: { label: string; v: number; pct: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const colors = ["#5947c6", "#6854d9", "#0ea5e9", "#0891b2", "#f97316"];
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => (
        <div
          key={s.label}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all"
          style={{ opacity: hover !== null && hover !== i ? 0.55 : 1 }}
        >
          <div
            className="absolute inset-y-0 left-0 transition-all duration-[900ms] ease-out"
            style={{ width: `${s.pct}%`, background: `linear-gradient(90deg,${colors[i]},${colors[i]}66)` }}
          />
          <div className="relative flex items-center gap-3 px-4 py-3">
            <span
              className="grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: colors[i] }}
            >
              {i + 1}
            </span>
            <span className="text-[13px] font-semibold text-slate-800">{s.label}</span>
            <span className="ml-auto text-[13px] font-bold tabular-nums text-slate-900">{s.v.toLocaleString()}</span>
            <span className="w-11 text-right text-[11.5px] font-bold tabular-nums text-slate-400">{s.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------- Stacked Bar Row -------------------------- */
export function StackedBar({ segments, height = 10 }: { segments: { value: number; color: string; label: string }[]; height?: number }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div>
      <div className="flex w-full overflow-hidden rounded-full bg-slate-100" style={{ height }}>
        {segments.map((s) => (
          <div
            key={s.label}
            onMouseEnter={() => setHover(s.label)}
            onMouseLeave={() => setHover(null)}
            className="h-full transition-all duration-300"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, opacity: hover && hover !== s.label ? 0.5 : 1 }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate-500">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            {s.label} · <b className="text-slate-800">{Math.round((s.value / total) * 100)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------- Live line chart ------------------------- */
export function LiveChart({ height = 90, color = "#0ea5e9" }: { height?: number; color?: string }) {
  const [seed, setSeed] = useState(0);
  const values = useMemo(() => {
    let v = 50;
    return Array.from({ length: 34 }, (_, i) => {
      v = Math.max(12, Math.min(96, v + (Math.sin(i * 0.7 + seed) * 9 + (Math.random() - 0.45) * 12)));
      return v;
    });
  }, [seed]);
  React.useEffect(() => {
    const t = setInterval(() => setSeed((s) => s + 0.9), 2200);
    return () => clearInterval(t);
  }, []);
  const uid = useId().replace(/[:]/g, "");
  const W = 600;
  const pts = values.map((v, i) => ({ x: (i / (values.length - 1)) * W, y: height - (v / 100) * height }));
  const d = pathFrom(pts);
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`lv-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${W},${height} L0,${height} Z`} fill={`url(#lv-${uid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" className="transition-all duration-[2000ms] ease-linear" />
    </svg>
  );
}
