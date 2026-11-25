import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, CalendarDays, ChevronDown, LayoutGrid, List, MapPin, RotateCcw, Search, SearchX,
  SlidersHorizontal, Star, Users, X,
} from "lucide-react";
import { EXPOS, type Expo } from "@/lib/data";
import { Button, Card, EmptyState } from "@/components/ui";
import { Pagination } from "@/components/kit";
import { Shell } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import { fetchLiveExpos } from "@/lib/liveApi";

const PER_PAGE = 6;
const STATUSES = ["All", "Live", "Upcoming", "Completed"];
const FALLBACK_COVER =
  "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

type SortKey = "date" | "attendees" | "price" | "rating";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2";

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */
function formatRange(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  if (isNaN(+a) || isNaN(+b)) return `${start} to ${end}`;
  const day = (d: Date) => d.getDate();
  const mon = (d: Date) => d.toLocaleDateString("en-US", { month: "short" });
  const same = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  return same
    ? `${day(a)}–${day(b)} ${mon(a)} ${b.getFullYear()}`
    : `${day(a)} ${mon(a)} – ${day(b)} ${mon(b)} ${b.getFullYear()}`;
}

function StatusPill({ status }: { status: string }) {
  if (status === "Live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
        <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden /> Live now
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold shadow-sm",
        status === "Upcoming" ? "bg-white text-slate-900" : "bg-slate-900/70 text-white backdrop-blur"
      )}
    >
      {status}
    </span>
  );
}

function Cover({ expo, className }: { expo: Expo; className?: string }) {
  return (
    <img
      src={expo.cover}
      alt=""
      loading="lazy"
      className={className}
      onError={(ev) => {
        ev.currentTarget.onerror = null; // avoid an endless error loop
        ev.currentTarget.src = FALLBACK_COVER;
      }}
    />
  );
}

/* radio list row with a count — used for Status and Category in the sidebar */
function OptionRow({ name, label, count, checked, onSelect }: { name: string; label: string; count?: number; checked: boolean; onSelect: () => void }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[14px] transition",
        checked ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onSelect}
          className="size-4 cursor-pointer accent-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
        />
        {label}
      </span>
      {count !== undefined && <span className={cn("text-[13px] tabular-nums", checked ? "text-brand-600" : "text-slate-400")}>{count}</span>}
    </label>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-slate-200 pb-4 last:border-0 last:pb-0">
      <legend className="mb-2 px-0 text-[13px] font-semibold text-slate-900">{title}</legend>
      {children}
    </fieldset>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */
export default function Expos() {
  const [expos, setExpos] = useState<Expo[]>(EXPOS);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [city, setCity] = useState("All");
  const [sort, setSort] = useState<SortKey>("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [priceLimit, setPriceLimit] = useState<number | null>(null); // null = no limit
  const [showFilters, setShowFilters] = useState(false); // mobile only
  const [page, setPage] = useState(1);

  // live data
  useEffect(() => {
    let alive = true;
    fetchLiveExpos().then((data) => {
      if (alive && data && data.length > 0) setExpos(data);
    });
    return () => { alive = false; };
  }, []);

  // options come from the data itself
  const categories = useMemo(() => ["All", ...new Set(expos.map((e) => e.category))], [expos]);
  const cities = useMemo(() => ["All", ...new Set(expos.map((e) => e.city))], [expos]);
  const priceCap = useMemo(
    () => Math.max(10, Math.ceil(Math.max(0, ...expos.map((e) => e.price)) / 10) * 10),
    [expos]
  );
  const maxPrice = priceLimit ?? priceCap;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: expos.length };
    for (const e of expos) counts[e.status] = (counts[e.status] ?? 0) + 1;
    return counts;
  }, [expos]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = { All: expos.length };
    for (const e of expos) counts[e.category] = (counts[e.category] ?? 0) + 1;
    return counts;
  }, [expos]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = expos.filter((e) => {
      const hay = `${e.title} ${e.category} ${e.industry} ${e.city} ${e.venue} ${e.theme}`.toLowerCase();
      return (
        (!needle || hay.includes(needle)) &&
        (cat === "All" || e.category === cat) &&
        (status === "All" || e.status === status) &&
        (city === "All" || e.city === city) &&
        e.price <= maxPrice
      );
    });
    return filtered.sort((a, b) => {
      switch (sort) {
        case "attendees": return b.attendees - a.attendees;
        case "price": return a.price - b.price;
        case "rating": return b.rating - a.rating;
        default: return +new Date(a.startDate) - +new Date(b.startDate);
      }
    });
  }, [expos, q, cat, status, city, sort, maxPrice]);

  // back to page 1 whenever the result set changes
  useEffect(() => setPage(1), [q, cat, status, city, sort, priceLimit]);

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const slice = results.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const hasFilters = !!q || cat !== "All" || city !== "All" || status !== "All" || priceLimit !== null;
  const activeFilterCount = (cat !== "All" ? 1 : 0) + (city !== "All" ? 1 : 0) + (status !== "All" ? 1 : 0) + (priceLimit !== null ? 1 : 0);
  const reset = () => {
    setQ(""); setCat("All"); setStatus("All"); setCity("All"); setSort("date"); setPriceLimit(null);
  };

  return (
    <Shell>
      {/* ========================= compact header ========================= */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:px-8">
          <div>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-slate-900 sm:text-[34px]">
              Find your next expo
            </h1>
            <p className="mt-1 text-[15px] text-slate-600">Browse by industry, city, date or price, then reserve your place.</p>
          </div>

          <div className="relative w-full lg:w-[420px]">
            <label>
              <span className="sr-only">Search expos</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search expos, industries, cities"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-11 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
              />
            </label>
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className={cn("absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700", focusRing)}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ============================== body =============================== */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-14 pt-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8 lg:px-8">
          {/* ---------------- filters sidebar ---------------- */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Filters">
            {/* mobile toggle */}
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-[14px] font-semibold text-slate-800 lg:hidden",
                focusRing
              )}
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden /> Filters
                {activeFilterCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{activeFilterCount}</span>
                )}
              </span>
              <ChevronDown className={cn("size-4 text-slate-400 transition-transform", showFilters && "rotate-180")} aria-hidden />
            </button>

            <div className={cn("mt-3 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 lg:mt-0 lg:block", showFilters ? "block" : "hidden")}>
              <div className="hidden items-center justify-between lg:flex">
                <h2 className="text-[15px] font-bold text-slate-900">Filters</h2>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={reset}
                    className={cn("inline-flex items-center gap-1 rounded-md text-[13px] font-semibold text-brand-600 hover:text-brand-700", focusRing)}
                  >
                    <RotateCcw className="size-3.5" aria-hidden /> Reset
                  </button>
                )}
              </div>

              <FilterGroup title="Status">
                {STATUSES.map((s) => (
                  <OptionRow key={s} name="status" label={s} count={statusCounts[s] ?? 0} checked={status === s} onSelect={() => setStatus(s)} />
                ))}
              </FilterGroup>

              <FilterGroup title="Category">
                {categories.map((c) => (
                  <OptionRow key={c} name="category" label={c} count={catCounts[c] ?? 0} checked={cat === c} onSelect={() => setCat(c)} />
                ))}
              </FilterGroup>

              <FilterGroup title="City">
                <div className="relative">
                  <select
                    aria-label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white pl-3 pr-9 text-[14px] text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                  >
                    {cities.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
              </FilterGroup>

              <FilterGroup title="Max ticket price">
                <div className="flex items-center justify-between text-[13px] text-slate-500">
                  <span>$0</span>
                  <span className="text-[14px] font-bold text-brand-700">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  aria-label="Max ticket price"
                  min={0}
                  max={priceCap}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setPriceLimit(v >= priceCap ? null : v);
                  }}
                  className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
                />
              </FilterGroup>
            </div>
          </aside>

          {/* ---------------- results ---------------- */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[14px] text-slate-600" aria-live="polite">
                Showing <b className="font-semibold text-slate-900">{results.length}</b> of {expos.length} expos
              </p>

              <div className="flex items-center gap-2">
                <label className="relative">
                  <span className="sr-only">Sort by</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="h-9 appearance-none rounded-xl border border-slate-300 bg-white pl-3 pr-8 text-[13.5px] font-medium text-slate-800 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15"
                  >
                    <option value="date">Sort: Start date</option>
                    <option value="attendees">Sort: Most attendees</option>
                    <option value="price">Sort: Price, low to high</option>
                    <option value="rating">Sort: Highest rated</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
                </label>

                <div className="hidden rounded-xl border border-slate-300 p-0.5 sm:flex">
                  {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-label={`${v} view`}
                      aria-pressed={view === v}
                      className={cn(
                        "grid size-8 place-items-center rounded-[10px] transition",
                        focusRing,
                        view === v ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {q && <FilterChip label={`“${q}”`} onClear={() => setQ("")} />}
                {status !== "All" && <FilterChip label={status} onClear={() => setStatus("All")} />}
                {cat !== "All" && <FilterChip label={cat} onClear={() => setCat("All")} />}
                {city !== "All" && <FilterChip label={city} onClear={() => setCity("All")} />}
                {priceLimit !== null && <FilterChip label={`Up to $${priceLimit}`} onClear={() => setPriceLimit(null)} />}
                <button
                  type="button"
                  onClick={reset}
                  className={cn("rounded-lg px-2 py-1 text-[13px] font-semibold text-slate-600 transition hover:text-rose-600 lg:hidden", focusRing)}
                >
                  Reset all
                </button>
              </div>
            )}

            {results.length === 0 ? (
              <Card className="mt-5">
                <EmptyState
                  icon={<SearchX className="size-6" />}
                  title="No expos match your filters"
                  body="Clear a filter or try a different search."
                  action={
                    <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={reset}>
                      Reset filters
                    </Button>
                  }
                />
              </Card>
            ) : (
              <>
                {view === "grid" ? (
                  <ul className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {slice.map((e) => <li key={e.id}><ExpoCard expo={e} /></li>)}
                  </ul>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {slice.map((e) => <li key={e.id}><ExpoRow expo={e} /></li>)}
                  </ul>
                )}

                {pages > 1 && (
                  <Card className="mt-6 p-3">
                    <Pagination page={safePage} pages={pages} onChange={setPage} total={results.length} perPage={PER_PAGE} />
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </Shell>
  );
}

/* ================================================================== */
/*  Grid card                                                          */
/* ================================================================== */
function ExpoCard({ expo: e }: { expo: Expo }) {
  return (
    <Link
      to={`/expos/${e.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300",
        "hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_50px_-24px_rgba(23,28,53,.35)]",
        focusRing
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover expo={e} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/10" />
        <div className="absolute left-3.5 top-3.5"><StatusPill status={e.status} /></div>
        <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-900 shadow-sm">
          <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> {e.rating}
        </span>
        <span className="absolute bottom-3.5 left-3.5 rounded-lg bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-brand-700 backdrop-blur">
          {e.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-[17px] font-bold leading-snug tracking-[-0.015em] text-slate-900 transition-colors group-hover:text-brand-700">
          {e.title}
        </h3>

        <ul className="mt-3 space-y-1.5 text-[14px] text-slate-600">
          <li className="flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span>{formatRange(e.startDate, e.endDate)}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">{e.venue}, {e.city}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <Users className="size-4 shrink-0 text-slate-400" aria-hidden />
            <span>{e.attendees.toLocaleString()} attendees</span>
          </li>
        </ul>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
            <p className="text-[13px] text-slate-500">
              From <span className="font-display text-[20px] font-bold tracking-tight text-slate-900">${e.price}</span>
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 text-[13.5px] font-semibold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              View expo <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ================================================================== */
/*  List row                                                           */
/* ================================================================== */
function ExpoRow({ expo: e }: { expo: Expo }) {
  return (
    <Link
      to={`/expos/${e.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 sm:flex-row",
        "hover:border-slate-300 hover:shadow-[0_20px_44px_-24px_rgba(23,28,53,.35)]",
        focusRing
      )}
    >
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100 sm:h-auto sm:w-60">
        <Cover expo={e} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute left-3 top-3"><StatusPill status={e.status} /></div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 md:flex-row md:items-center md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[13px] font-semibold text-brand-700">{e.category}</span>
            <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-slate-700">
              <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden /> {e.rating}
            </span>
          </div>
          <h3 className="mt-1.5 font-display text-[18px] font-bold leading-snug tracking-[-0.015em] text-slate-900 transition-colors group-hover:text-brand-700">
            {e.title}
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] text-slate-600">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4 text-slate-400" aria-hidden /> {formatRange(e.startDate, e.endDate)}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-slate-400" aria-hidden /> {e.venue}, {e.city}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="size-4 text-slate-400" aria-hidden /> {e.attendees.toLocaleString()}</span>
          </p>
          <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-slate-600">{e.description}</p>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4 md:w-40 md:flex-col md:items-stretch md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="md:text-center">
            <p className="text-[12.5px] text-slate-500">Day pass from</p>
            <p className="font-display text-[22px] font-bold leading-tight tracking-tight text-slate-900">${e.price}</p>
          </div>
          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors group-hover:bg-brand-700">
            View expo <ArrowRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-[13px] font-semibold text-brand-700 ring-1 ring-brand-100">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className={cn("grid size-5 place-items-center rounded-full text-brand-500 hover:bg-brand-100 hover:text-brand-800", focusRing)}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}