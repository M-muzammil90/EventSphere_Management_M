import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EXHIBITORS, type Exhibitor } from "@/lib/data";
import { Badge, Button, Card, EmptyState, Reveal, SectionHeading, Select } from "@/components/ui";
import { ExhibitorLogo } from "@/components/shared";
import { Shell } from "@/components/SiteLayout";
import { Pagination } from "@/components/kit";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { Building2, Grid3x3, Globe2, LayoutList, MapPin, Search, Star, Users, X } from "lucide-react";
import { fetchLiveExhibitors, fetchLiveExpos } from "@/lib/liveApi";
import { type Expo } from "@/lib/data";

const PER_PAGE = 9;

export default function ExhibitorDirectory() {
  const { toast } = useStore();
  const [exhibitors, setExhibitors] = useState<Exhibitor[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [country, setCountry] = useState("All");
  const [expo, setExpo] = useState("All");
  const [tier, setTier] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<string[]>([]);
  const [liveExpos, setLiveExpos] = useState<Expo[]>([]);

  useEffect(() => {
    fetchLiveExpos().then((data) => {
      if (data && data.length > 0) setLiveExpos(data.filter((e) => e.status !== "Draft"));
    });
  }, []);

  useEffect(() => {
    const expoParam = expo !== "All" ? expo : undefined;
    fetchLiveExhibitors(expoParam).then(({ exhibitors: data }) => {
      setExhibitors(data || []);
    });
  }, [expo]);

  const cats = ["All", ...Array.from(new Set(exhibitors.map((e) => e.category)))];
  const countries = ["All", ...Array.from(new Set(exhibitors.map((e) => e.country)))];

  const filtered = useMemo(
    () =>
      exhibitors.filter((e) => {
        const hay = `${e.company} ${e.category} ${e.country} ${e.rep} ${e.products.join(" ")} ${e.description || ""}`.toLowerCase();
        return (
          (!q || hay.includes(q.toLowerCase())) &&
          (cat === "All" || e.category === cat) &&
          (country === "All" || e.country === country) &&
          (tier === "All" || e.badgeTier === tier) &&
          (expo === "All" || e.status === "Approved")
        );
      }),
    [exhibitors, q, cat, country, tier, expo]
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const slice = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeFilters = [cat, country, tier, expo].filter((f) => f !== "All").length;

  const reset = () => {
    setQ(""); setCat("All"); setCountry("All"); setTier("All"); setExpo("All"); setPage(1);
  };

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-100/70 pb-10 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-[380px] rounded-full bg-brand-200/50 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Exhibitor directory"
              title={<>Find the right <span className="text-gradient-dark">exhibitor</span></>}
              body="Search every confirmed exhibitor by company, category, product or keyword. See booth locations and start a conversation before you arrive."
            />
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { i: Building2, l: "Confirmed exhibitors", v: String(EXHIBITORS.filter((e) => e.status === "Approved").length) },
                { i: LayoutList, l: "Categories", v: String(new Set(EXHIBITORS.map((e) => e.category)).size) },
                { i: Globe2, l: "Countries", v: String(new Set(EXHIBITORS.map((e) => e.country)).size) },
                { i: Star, l: "Average rating", v: (EXHIBITORS.reduce((s, e) => s + e.rating, 0) / EXHIBITORS.length).toFixed(1) },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><s.i className="size-4.5" /></span>
                  <div>
                    <p className="font-display text-[19px] font-bold leading-none text-slate-900">{s.v}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.l}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* toolbar */}
      <section className="sticky top-16.5 z-30 border-b border-slate-200 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-0 flex-1">
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search by company, product, service or keyword…"
                aria-label="Search exhibitors"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[14px] outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
              />
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>
            <div className="hidden rounded-xl border border-slate-200 p-0.5 sm:flex">
              {([["grid", Grid3x3], ["list", LayoutList]] as const).map(([v, Ic]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={`${v} view`}
                  className={cn("grid size-8 place-items-center rounded-lg transition", view === v ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700")}
                >
                  <Ic className="size-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="h-10 min-w-[170px]">
              {cats.map((c) => <option key={c}>{c === "All" ? "All categories" : c}</option>)}
            </Select>
            <Select value={country} onChange={(e) => { setCountry(e.target.value); setPage(1); }} className="h-10 min-w-[160px]">
              {countries.map((c) => <option key={c}>{c === "All" ? "All countries" : c}</option>)}
            </Select>
            <Select value={tier} onChange={(e) => { setTier(e.target.value); setPage(1); }} className="h-10 min-w-[140px]">
              {["All", "Platinum", "Gold", "Silver", "Bronze"].map((t) => <option key={t}>{t === "All" ? "All tiers" : t}</option>)}
            </Select>
            <Select value={expo} onChange={(e) => { setExpo(e.target.value); setPage(1); }} className="h-10 min-w-[190px]">
              <option value="All">All expos</option>
              {liveExpos.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </Select>
            {activeFilters > 0 && (
              <button onClick={reset} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[12.5px] font-bold text-slate-500 transition hover:border-rose-200 hover:text-rose-600">
                <X className="size-3.5" /> Clear {activeFilters}
              </button>
            )}
            <Badge tone="neutral" className="ml-auto h-8 px-3">{filtered.length} results</Badge>
          </div>
        </div>
      </section>

      <section className="bg-slate-100/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Building2 className="size-6" />}
                title="No exhibitors match your filters"
                body="Try a different keyword, or clear a filter or two to widen the results."
                action={<Button variant="secondary" onClick={reset}>Clear all filters</Button>}
              />
            </Card>
          ) : view === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {slice.map((e, i) => (
                <Reveal key={e.id} delay={Math.min(i * 60, 240)}>
                  <Card hover className="group flex h-full flex-col p-5">
                    <div className="flex items-start gap-3.5">
                      <ExhibitorLogo name={e.company} bg={e.logoBg} size={48} />
                      <div className="min-w-0 flex-1">
                        <Link to={`/exhibitors/${e.id.toLowerCase()}`} className="block truncate font-display text-[15.5px] font-bold text-slate-900 transition hover:text-brand-700">
                          {e.company}
                        </Link>
                        <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{e.category}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-[11.5px] font-bold text-slate-700">{e.rating}</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Globe2 className="size-3" /> {e.country}</span>
                        </div>
                      </div>
                      <Badge tone={e.badgeTier === "Platinum" ? "purple" : e.badgeTier === "Gold" ? "warn" : "neutral"}>{e.badgeTier}</Badge>
                    </div>

                    <p className="mt-3.5 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-slate-600">{e.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.products.slice(0, 3).map((p) => (
                        <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{p}</span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                      <Badge tone="brand"><MapPin className="size-3" /> {e.booth}</Badge>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Users className="size-3" /> {e.staff}</span>
                      <button
                        onClick={() => {
                          setSaved((p) => (p.includes(e.id) ? p.filter((x) => x !== e.id) : [...p, e.id]));
                          toast({ title: saved.includes(e.id) ? `${e.company} removed` : `${e.company} saved`, tone: saved.includes(e.id) ? "info" : "success" });
                        }}
                        aria-label="Save exhibitor"
                        className={cn(
                          "ml-auto rounded-lg px-2 py-1 text-[11.5px] font-bold transition",
                          saved.includes(e.id) ? "bg-brand-50 text-brand-700" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        )}
                      >
                        {saved.includes(e.id) ? "Saved" : "Save"}
                      </button>
                      <Link to={`/exhibitors/${e.id.toLowerCase()}`}>
                        <Button size="xs" variant="ghost">View</Button>
                      </Link>
                    </div>
                  </Card>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {slice.map((e) => (
                <Card key={e.id} hover className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <ExhibitorLogo name={e.company} bg={e.logoBg} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/exhibitors/${e.id.toLowerCase()}`} className="font-display text-[16px] font-bold text-slate-900 hover:text-brand-700">
                        {e.company}
                      </Link>
                      <Badge tone={e.badgeTier === "Platinum" ? "purple" : e.badgeTier === "Gold" ? "warn" : "neutral"}>{e.badgeTier}</Badge>
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-600">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" /> {e.rating}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">{e.category} · {e.country} · {e.staff} staff</p>
                    <p className="mt-2 line-clamp-1 text-[12.5px] text-slate-600">{e.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.products.map((p) => (
                        <span key={p} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-600">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:w-36">
                    <Badge tone="brand" className="self-start"><MapPin className="size-3" /> Booth {e.booth}</Badge>
                    <Link to={`/exhibitors/${e.id.toLowerCase()}`}>
                      <Button full size="sm">View profile</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className="mt-6 p-4">
            <Pagination page={page} pages={pages} onChange={setPage} total={filtered.length} perPage={PER_PAGE} />
          </Card>
        </div>
      </section>
    </Shell>
  );
}
