import { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/SiteLayout";
import { Badge, Button, Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  ChevronDown,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  cat: "general" | "exhibitors" | "attendees" | "payments";
}

const FAQS: FAQItem[] = [
  {
    cat: "general",
    q: "What is EventSphere Management?",
    a: "EventSphere is an end-to-end expo and exhibition management platform connecting event organizers, exhibitors, and attendees. It powers interactive floor plans, live booth allocations, digital ticketing, meeting scheduling, and multi-tenant communication.",
  },
  {
    cat: "general",
    q: "How do I create an organizer or admin account?",
    a: "Admin and Organizer accounts are provisioned securely through our enterprise onboarding team. Contact our partnerships team via the Contact page to set up a dedicated expo space.",
  },
  {
    cat: "exhibitors",
    q: "What are the requirements for an exhibitor application to be approved?",
    a: "Exhibitors must submit a verified company profile, upload required business documents (Certificate of Incorporation, Public Liability Insurance), and specify their desired booth configuration. Organizers review and approve applications before booth allocation.",
  },
  {
    cat: "exhibitors",
    q: "When does our company profile become publicly visible to attendees?",
    a: "According to EventSphere's strict business visibility rule: An exhibitor appears in the attendee-facing directory and interactive floor plan only when BOTH their application is Approved AND their booth assignment is confirmed by the organizer.",
  },
  {
    cat: "exhibitors",
    q: "Can I manage booth staff and issue badges from the portal?",
    a: "Yes! Exhibitors can add team members, assign role permissions (lead scanner only vs. full management), and generate printable digital passes with unique QR codes for fast turnstile check-in.",
  },
  {
    cat: "attendees",
    q: "How does attendee registration and badge check-in work?",
    a: "When you register for an expo, a unique badge code and encrypted QR pass are generated in your Attendee Portal. At the venue, show your digital badge at fast-lane entrance turnstiles for immediate scanning.",
  },
  {
    cat: "attendees",
    q: "Can I book 1-on-1 meetings with exhibitors in advance?",
    a: "Absolutely. In the Attendee Portal, you can browse verified exhibitors, check their open meeting slots, and request appointments. Exhibitors receive notifications and can confirm directly.",
  },
  {
    cat: "payments",
    q: "What payment methods are supported for booth bookings and passes?",
    a: "We support major credit/debit cards via Stripe, wire transfer invoicing, and automated corporate billing. All transactions generate automated PDF receipts and invoices accessible in your portal.",
  },
  {
    cat: "payments",
    q: "What is your refund policy?",
    a: "Attendees and exhibitors can request cancellations and refunds through their portal. Refund requests enter an administrative review queue where organizers verify terms before issuing credit.",
  },
];

export default function FaqPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "general" | "exhibitors" | "attendees" | "payments">("all");
  const [openItems, setOpenItems] = useState<number[]>([0, 2, 5]);

  const toggleItem = (idx: number) => {
    setOpenItems((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const filtered = FAQS.filter((f) => {
    const hay = `${f.q} ${f.a}`.toLowerCase();
    const matchQ = !q || hay.includes(q.toLowerCase());
    const matchCat = cat === "all" || f.cat === cat;
    return matchQ && matchCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-24">
          <div className="absolute inset-0 grid-noise-dark opacity-40" />
          <div className="pointer-events-none absolute -right-20 -top-20 size-96 rounded-full bg-brand-600/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <Badge tone="brand" className="bg-white/10 text-brand-200 ring-white/15">
              <Sparkles className="size-3" /> Help Center & Knowledge Base
            </Badge>
            <h1 className="mt-4 font-display text-[32px] font-extrabold tracking-tight sm:text-[44px]">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-300">
              Find instant answers to common questions about expo registrations, booth allocation, payments, and attendee passes.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Search & Tabs */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search questions or keywords..."
                className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-[14px] shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/12"
              />
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All Questions" },
                { id: "general", label: "General" },
                { id: "exhibitors", label: "Exhibitors & Booths" },
                { id: "attendees", label: "Attendees & Tickets" },
                { id: "payments", label: "Billing & Invoices" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id as any)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[12.5px] font-bold transition",
                    cat === c.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filtered.map((item, idx) => {
              const isOpen = openItems.includes(idx);
              return (
                <div
                  key={item.q}
                  className="rounded-2xl border border-slate-200 bg-white transition shadow-xs"
                >
                  <button
                    onClick={() => toggleItem(idx)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <span className="font-display text-[15px] font-bold text-slate-900 pr-4">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4.5 shrink-0 text-slate-400 transition-transform duration-200",
                        isOpen && "rotate-180 text-brand-600"
                      )}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-[13.5px] leading-relaxed text-slate-600">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Support CTA */}
          <Card className="mt-12 overflow-hidden bg-gradient-to-r from-brand-600 to-indigo-700 p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="font-display text-[20px] font-bold">Still have questions?</h3>
                <p className="mt-1 text-[13.5px] text-white/80">
                  Our dedicated expo coordination team is here to assist you 24/7.
                </p>
              </div>
              <Link to="/contact">
                <Button variant="secondary" icon={<MessageSquare className="size-4" />}>
                  Contact Support
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
