import { useState } from "react";
import { Navbar, Footer } from "@/components/SiteLayout";
import { Badge, Card } from "@/components/ui";
import { cn } from "@/utils/cn";
import { ShieldCheck, FileText, Lock } from "lucide-react";

export default function LegalPage({ initialTab = "privacy" }: { initialTab?: "privacy" | "terms" }) {
  const [tab, setTab] = useState<"privacy" | "terms">(initialTab);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="bg-ink-950 py-16 text-white text-center">
          <div className="mx-auto max-w-4xl px-4">
            <Badge tone="brand" className="bg-white/10 text-brand-200">
              <ShieldCheck className="size-3.5" /> Legal & Governance
            </Badge>
            <h1 className="mt-4 font-display text-[32px] font-extrabold sm:text-[40px]">
              {tab === "privacy" ? "Privacy Policy" : "Terms & Conditions"}
            </h1>
            <p className="mt-2 text-[14px] text-slate-300">
              Last updated: March 2026 · Effective for all EventSphere expos, exhibitors, and attendees.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                onClick={() => setTab("privacy")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition",
                  tab === "privacy"
                    ? "bg-brand-600 text-white shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                )}
              >
                <Lock className="size-4" /> Privacy Policy
              </button>
              <button
                onClick={() => setTab("terms")}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold transition",
                  tab === "terms"
                    ? "bg-brand-600 text-white shadow-md"
                    : "bg-white/10 text-slate-300 hover:bg-white/15"
                )}
              >
                <FileText className="size-4" /> Terms of Service
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-4xl px-4 py-12">
          <Card className="p-8 sm:p-12 space-y-8 text-[14px] leading-relaxed text-slate-600">
            {tab === "privacy" ? (
              <>
                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    1. Information We Collect
                  </h2>
                  <p className="mt-2">
                    EventSphere Management collects information required to facilitate participation in global exhibitions and trade shows. This includes personal contact information, company profiles, job titles, business documents (e.g., Certificates of Incorporation), booth allocation requirements, and attendee ticketing records.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    2. Protection of Private Business Documents
                  </h2>
                  <p className="mt-2">
                    In compliance with our strict security principles, all private company documents submitted during exhibitor registration are stored in access-controlled environments. Private compliance documents are accessible only to authorized event organizers and system administrators, and are never exposed publicly.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    3. QR Code & Fast-Lane Badge Scanning
                  </h2>
                  <p className="mt-2">
                    Digital badges and QR codes generated for registered attendees and exhibitor staff are used for venue access control and authorized business card exchanges. Badge scans by exhibitors require mutual consent during booth visits.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    4. Payment & Billing Privacy
                  </h2>
                  <p className="mt-2">
                    Financial transactions are securely processed through certified payment gateway partners (such as Stripe). EventSphere does not store full credit card numbers on our application servers.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    1. Acceptance of Terms
                  </h2>
                  <p className="mt-2">
                    By registering for, exhibiting at, or attending any event hosted on the EventSphere Management platform, you agree to comply with these Terms & Conditions and all applicable venue safety rules.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    2. Exhibitor Participation & Booth Allocations
                  </h2>
                  <p className="mt-2">
                    Exhibitor space reservations are subject to organizer approval and confirmed booth allocation. An approved application does not automatically grant public directory visibility until the booth assignment has been finalized. Booth reassignment is subject to organizer discretion and hall availability.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    3. Attendee Registration & Capacity Enforcements
                  </h2>
                  <p className="mt-2">
                    Tickets grant access to published exhibition areas and sessions according to the purchased pass type. Session attendance is subject to venue room capacity limits enforced by event staff.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-[20px] font-bold text-slate-900">
                    4. Cancellations & Refunds
                  </h2>
                  <p className="mt-2">
                    Refund claims must be submitted through the portal prior to the published cancellation deadline. Approved refunds will be credited back to the original payment method after administrative review.
                  </p>
                </section>
              </>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12.5px] text-slate-500">
              For legal inquiries or data protection requests, please reach out to our compliance officer at legal@eventsphere.com.
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
