import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, LayoutGrid, List, MapPin, RotateCcw, Search, SearchX, SlidersHorizontal, Star, X } from "lucide-react";
import { EXPOS, type Expo } from "@/lib/data";
import { Badge, Button, Card, EmptyState, Select, Tabs } from "@/components/ui";
import { Pagination } from "@/components/kit";
import { ExpoCard } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import { fetchLiveExpos } from "@/lib/liveApi";

const PER_PAGE = 6;
const STATUSES = ["All", "Live", "Upcoming", "Completed"];
const FALLBACK_COVER =
  "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200";

type SortKey = "date" | "attendees" | "price" | "rating";

export default function Expos() {
  const [expos, setExpos] = useState<Expo[]>(EXPOS);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [status, setStatus] = useState("All");
  const [city, setCity] = useState("All");
  const [sort, setSort] = useState<SortKey>("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [priceLimit, setPriceLimit] = useState<number | null>(null); // null = no limit
  const [showFilters, setShowFilters] = useState(false);
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
  const reset = () => {
    setQ(""); setCat("All"); setStatus("All"); setCity("All"); setSort("date"); setPriceLimit(null);
  };

  return (
    <Shell>
      {/* header + search */}
      <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Find your next expo
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-slate-600">
            Filter by industry, city, date or price, then reserve your place.
          </p>

          <label className="relative mt-6 block max-w-xl">
            <span className="sr-only">Search expos</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search expos, industries, cities"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-10 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            )}
          </label>
        </div>
      </section>

      {/* toolbar */}
      <section className="sticky top-16.5 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <Tabs
              tabs={STATUSES.map((s) => ({ id: s, label: s, count: statusCounts[s] ?? 0 }))}
              active={status}
              onChange={setStatus}
            />
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                variant={showFilters ? "soft" : "secondary"}
                icon={<SlidersHorizontal className="size-4" />}
                onClick={() => setShowFilters((v) => !v)}
              >
                Filters
              </Button>
              <div className="hidden rounded-xl border border-slate-200 p-0.5 sm:flex">
                {([["grid", LayoutGrid], ["list", List]] as const).map(([v, Icon]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-label={`${v} view`}
                    aria-pressed={view === v}
                    className={cn(
                      "grid size-8 place-items-center rounded-lg transition",
                      view === v ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    <Icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-3 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Category</span>
                <Select value={cat} onChange={(e) => setCat(e.target.value)}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">City</span>
                <Select value={city} onChange={(e) => setCity(e.target.value)}>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </Select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">Sort by</span>
                <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  <option value="date">Start date</option>
                  <option value="attendees">Most attendees</option>
                  <option value="price">Price: low to high</option>
                  <option value="rating">Highest rated</option>
                </Select>
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-baseline justify-between text-[12px] font-semibold text-slate-600">
                  Max ticket price
                  <span className="text-[13px] font-bold text-brand-700">${maxPrice}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={priceCap}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setPriceLimit(v >= priceCap ? null : v);
                  }}
                  className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
                />
              </label>
            </div>
          )}
        </div>
      </section>

      {/* results */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13.5px] text-slate-500">
              Showing <b className="text-slate-900">{results.length}</b> of {expos.length} expos
            </p>
            {hasFilters && (
              <div className="flex flex-wrap items-center gap-1.5">
                {cat !== "All" && <FilterChip label={cat} onClear={() => setCat("All")} />}
                {city !== "All" && <FilterChip label={city} onClear={() => setCity("All")} />}
                {status !== "All" && <FilterChip label={status} onClear={() => setStatus("All")} />}
                {priceLimit !== null && <FilterChip label={`Up to $${priceLimit}`} onClear={() => setPriceLimit(null)} />}
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold text-slate-500 transition hover:text-rose-600"
                >
                  <RotateCcw className="size-3" /> Reset all
                </button>
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <Card className="mt-6">
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
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {slice.map((e) => <ExpoCard key={e.id} expo={e} />)}
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {slice.map((e) => <ExpoRow key={e.id} expo={e} />)}
                </div>
              )}

              {pages > 1 && (
                <Card className="mt-6 p-4">
                  <Pagination
                    page={safePage}
                    pages={pages}
                    onChange={setPage}
                    total={results.length}
                    perPage={PER_PAGE}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      </section>
    </Shell>
  );
}

function ExpoRow({ expo: e }: { expo: Expo }) {
  return (
    <Card hover className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <img
        src={e.cover}
        alt=""
        loading="lazy"
        className="h-28 w-full shrink-0 rounded-lg object-cover sm:w-44"
        onError={(ev) => {
          ev.currentTarget.onerror = null; // avoid an endless error loop
          ev.currentTarget.src = FALLBACK_COVER;
        }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{e.category}</Badge>
          {e.status === "Live" && <Badge tone="danger">Live now</Badge>}
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-amber-600">
            <Star className="size-3.5 fill-amber-400 text-amber-400" /> {e.rating}
          </span>
        </div>
        <h3 className="mt-2 font-display text-[16px] font-bold tracking-tight text-slate-900">{e.title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {e.venue}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {e.startDate} to {e.endDate}
          </span>
        </p>
        <p className="mt-2 line-clamp-1 text-[12.5px] text-slate-600">{e.description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:w-40">
        <div className="text-center">
          <p className="font-display text-[20px] font-bold text-slate-900">${e.price}</p>
          <p className="text-[11px] text-slate-400">per day pass</p>
        </div>
        <Link to={`/expos/${e.slug}`}>
          <Button full size="sm">View expo</Button>
        </Link>
      </div>
    </Card>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-[12px] font-semibold text-brand-700 ring-1 ring-brand-100">
      {label}
      <button onClick={onClear} aria-label={`Clear ${label}`} className="text-brand-400 hover:text-brand-700">
        <X className="size-3" />
      </button>
    </span>
  );
}