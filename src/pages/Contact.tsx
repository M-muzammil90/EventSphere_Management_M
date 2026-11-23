import { useState } from "react";
import { Link } from "react-router-dom";
import { ABOUT, CONTACT_TOPICS } from "@/lib/mock";
import { Badge, Button, Card, CardHeader, Checkbox, Field, Input, Reveal, SectionHeading, Select, Textarea } from "@/components/ui";
import { Shell, SocialLinks } from "@/components/SiteLayout";
import { cn } from "@/utils/cn";
import { useStore } from "@/lib/store";
import { AVATARS } from "@/lib/data";
import { CalendarClock, CheckCircle2, Clock, Globe2, Headphones, Mail, MapPin, MessageSquare, Phone, Send, Sparkles } from "lucide-react";

const TOPICS = CONTACT_TOPICS;

export default function Contact() {
  const { toast } = useStore();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", company: "", topic: TOPICS[0], subject: "", message: "", consent: false, call: false });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const x: Record<string, string> = {};
    if (!form.name.trim()) x.name = "Please tell us your name";
    if (!form.email.includes("@")) x.email = "Enter a valid email address";
    if (!form.subject.trim()) x.subject = "Add a short subject";
    if (form.message.trim().length < 12) x.message = "Please give us a little more detail (12+ characters)";
    if (!form.consent) x.consent = "We need your consent to reply";
    setErr(x);
    if (Object.keys(x).length) {
      toast({ title: "Please fix the highlighted fields", tone: "danger" });
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setSent(true);
      toast({ title: "Message sent", body: "A member of the team will reply within one business day.", tone: "success" });
    }, 900);
  }

  return (
    <Shell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-100/70 pb-12 pt-12 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 grid-noise opacity-60" />
        <div className="pointer-events-none absolute left-1/2 top-0 size-[440px] -translate-x-1/2 rounded-full bg-brand-200/50 blur-[110px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              center
              eyebrow="Contact us"
              title={<>Let's talk about <span className="text-gradient-dark">your next expo</span></>}
              body="Whether you're planning your first 40-booth show or your fifteenth 500-booth edition, we'll help you scope it properly."
            />
          </Reveal>
          <Reveal delay={90}>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { i: MessageSquare, t: "Live chat", d: "In-app, 24/7 during expo week", v: "Reply in ~2 min" },
                { i: Mail, t: "Email", d: "hello@eventsphere.io", v: "Reply in ~4 hours" },
                { i: Phone, t: "Phone", d: ABOUT.offices[0].phone, v: "Mon–Fri 09:00–18:00 GST" },
                { i: Headphones, t: "Priority line", d: "For live-event incidents", v: "Sev-1 in 15 min" },
              ].map((c) => (
                <Card key={c.t} hover className="p-5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <c.i className="size-5" />
                  </span>
                  <h3 className="mt-4 font-display text-[15px] font-bold text-slate-900">{c.t}</h3>
                  <p className="mt-1 text-[12.5px] text-slate-600">{c.d}</p>
                  <p className="mt-3 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-600">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> {c.v}
                  </p>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            {/* FORM */}
            <Card>
              <CardHeader title="Send us a message" subtitle="We reply to every enquiry within one business day" right={<Badge tone="brand"><Sparkles className="size-3" /> Free consultation</Badge>} />
              {sent ? (
                <div className="p-8 text-center sm:p-12">
                  <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-7" />
                  </span>
                  <h3 className="mt-5 font-display text-[20px] font-bold text-slate-900">Thanks, {form.name.split(" ")[0]} — message received</h3>
                  <p className="mx-auto mt-2.5 max-w-md text-[14px] leading-relaxed text-slate-600">
                    Your reference is <b className="text-slate-900">#CN-{Math.floor(Math.random() * 90000 + 10000)}</b>. We'll reply to{" "}
                    <b className="text-slate-900">{form.email}</b> within one business day
                    {form.topic === "Hosting an expo" ? ", with a tailored scoping checklist for your edition." : "."}
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button variant="secondary" onClick={() => { setSent(false); setForm({ ...form, subject: "", message: "" }); }}>
                      Send another message
                    </Button>
                    <Link to="/expos"><Button>Explore expos</Button></Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5 p-5 sm:p-6" noValidate>
                  <div>
                    <span className="mb-2 block text-[12.5px] font-semibold text-slate-700">What's this about?</span>
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set("topic", t)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-[12.5px] font-semibold transition",
                            form.topic === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" required error={err.name}>
                      <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Cooper" isInvalid={!!err.name} />
                    </Field>
                    <Field label="Work email" required error={err.email}>
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" isInvalid={!!err.email} />
                    </Field>
                    <Field label="Company / organisation" hint="optional">
                      <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Events Ltd" />
                    </Field>
                    <Field label="Expected attendees" hint="helps us scope">
                      <Select defaultValue="">
                        <option value="">Select…</option>
                        {["Under 500", "500 – 2,000", "2,000 – 10,000", "10,000 – 30,000", "30,000+"].map((r) => <option key={r}>{r}</option>)}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Subject" required error={err.subject}>
                    <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" isInvalid={!!err.subject} />
                  </Field>

                  <Field label="Message" required error={err.message} hint={`${form.message.length} / 1200`}>
                    <Textarea
                      maxLength={1200}
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="Tell us about your event — dates, venue, expected exhibitor count, and what you're trying to solve."
                      className={err.message ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/12" : ""}
                    />
                  </Field>

                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <Checkbox
                      checked={form.consent}
                      onChange={(v) => set("consent", v)}
                      label={<>I consent to EventSphere storing my details in order to respond to this enquiry, in line with the <a href="#" className="font-semibold text-brand-600">Privacy Policy</a>.</>}
                    />
                    {err.consent && <p className="text-[11.5px] font-medium text-rose-600">{err.consent}</p>}
                    <Checkbox checked={form.call} onChange={(v) => set("call", v)} label="I'd prefer a call back rather than email (optional)" />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-[11.5px] text-slate-400">Typical first response: 3 hours 40 minutes</p>
                    <Button type="submit" loading={busy} icon={<Send className="size-4" />}>Send message</Button>
                  </div>
                </form>
              )}
            </Card>

            {/* SIDE */}
            <div className="space-y-6">
              <Card>
                <CardHeader title="Our offices" subtitle="Three locations, one team" />
                <div className="space-y-3 p-5">
                  {ABOUT.offices.map((o) => (
                    <div key={o.city} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPin className="size-4" /></span>
                        <p className="font-display text-[14.5px] font-bold text-slate-900">{o.city}</p>
                        <span className="ml-auto text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{o.tz}</span>
                      </div>
                      <p className="mt-2.5 text-[12.5px] leading-snug text-slate-600">{o.address}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-500"><Phone className="size-3.5" /> {o.phone}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Talk to a specialist" subtitle="Direct lines to our senior team" />
                <div className="divide-y divide-slate-100">
                  {[
                    { n: "Sarah Whitfield", r: "Founder & CEO — hosting enquiries", a: AVATARS[0] },
                    { n: "Marcus Reid", r: "Head of Product — platform demos", a: AVATARS[2] },
                    { n: "Priya Nair", r: "Engineering Lead — technical Q&A", a: AVATARS[1] },
                  ].map((p) => (
                    <div key={p.n} className="flex items-center gap-3 px-5 py-3.5">
                      <img src={p.a} alt="" className="size-10 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-900">{p.n}</p>
                        <p className="truncate text-[11.5px] text-slate-500">{p.r}</p>
                      </div>
                      <Button size="xs" variant="ghost" icon={<Mail className="size-3.5" />} onClick={() => toast({ title: `Email drafted to ${p.n}`, tone: "info" })}>Email</Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
                  <CalendarClock className="size-5" />
                  <p className="mt-3.5 font-display text-[16px] font-bold">Book a 30-minute walkthrough</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
                    We'll screen-share the floor-plan editor, approval queue and analytics dashboards against your own scenario.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Tue 24 Feb · 10:00 GST", "Wed 25 Feb · 14:30 GMT", "Thu 26 Feb · 09:00 SGT"].map((slot) => (
                      <button
                        key={slot}
                        onClick={() => toast({ title: "Slot reserved", body: `${slot} — confirmation sent by email.`, tone: "success" })}
                        className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-white/20"
                      >
                        {slot}
                        <span className="text-[11px] font-bold text-brand-200">Select</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Follow us</p>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <Clock className="size-3.5" /> <Globe2 className="size-3.5" />
                  </div>
                </div>
                <div className="mt-3"><SocialLinks /></div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
