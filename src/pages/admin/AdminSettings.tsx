import { useState } from "react";
import { Badge, Button, Card, CardHeader, Field, Input, Progress, Select, Tabs, Textarea, Toggle } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { useStore } from "@/lib/store";
import { cn } from "@/utils/cn";
import { AVATARS } from "@/lib/data";
import { Bell, Check, CreditCard, Database, Download, Globe, KeyRound, LifeBuoy, Lock, Palette, Shield, Trash2, Upload, UserCog, Users } from "lucide-react";

const TEAM = [
  { n: "Sarah Whitfield", e: "sarah@eventsphere.io", r: "Owner", s: "Active", a: AVATARS[0] },
  { n: "Marcus Reid", e: "marcus@eventsphere.io", r: "Editor", s: "Active", a: AVATARS[2] },
  { n: "Priya Nair", e: "priya@eventsphere.io", r: "Analyst", s: "Active", a: AVATARS[1] },
  { n: "Kenji Sato", e: "kenji@eventsphere.io", r: "Viewer", s: "Invited", a: AVATARS[4] },
];

export default function AdminSettings() {
  const { user, toast } = useStore();
  const [tab, setTab] = useState("profile");
  const [prefs, setPrefs] = useState({
    scheduleAlerts: true,
    exhibitorAlerts: true,
    dailyDigest: false,
    boothChanges: true,
    weeklyReport: true,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({ profileVisible: true, dataSharing: false, analytics: true });
  const [twofa, setTwofa] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-[24px] font-bold tracking-[-0.02em] text-slate-900">Settings</h2>
        <p className="mt-1.5 text-[13.5px] text-slate-500">Account, team, security, notifications and data preferences.</p>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "profile", label: "Profile", icon: <UserCog className="size-3.5" /> },
          { id: "team", label: "Team & roles", icon: <Users className="size-3.5" /> },
          { id: "security", label: "Security", icon: <Shield className="size-3.5" /> },
          { id: "notifications", label: "Notifications", icon: <Bell className="size-3.5" /> },
          { id: "billing", label: "Billing", icon: <CreditCard className="size-3.5" /> },
          { id: "data", label: "Privacy & data", icon: <Database className="size-3.5" /> },
        ]}
      />

      {tab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Organizer profile" subtitle="Visible to exhibitors and attendees" />
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-slate-50 p-4">
                <Avatar src={user?.avatar} name={user?.name} size={72} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold text-slate-900">{user?.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-500">{user?.email}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button size="xs" variant="secondary" icon={<Upload className="size-3.5" />} onClick={() => toast({ title: "Upload avatar", body: "JPG or PNG, max 2 MB.", tone: "info" })}>Upload new</Button>
                    <Button size="xs" variant="ghost">Remove</Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required><Input defaultValue={user?.name} /></Field>
                <Field label="Email address" required><Input type="email" defaultValue={user?.email} /></Field>
                <Field label="Organization"><Input defaultValue="EventSphere Management" /></Field>
                <Field label="Job title"><Input defaultValue="Head of Events" /></Field>
                <Field label="Phone"><Input placeholder="+971 4 555 0134" /></Field>
                <Field label="Time zone"><Select defaultValue="Asia/Dubai">{["Asia/Dubai", "Europe/London", "Europe/Berlin", "America/New_York", "Asia/Singapore"].map((t) => <option key={t}>{t}</option>)}</Select></Field>
              </div>

              <Field label="Bio" hint="shown on public profile"><Textarea defaultValue="EventSphere Management builds and operates large-scale expos and trade shows across 14 countries." /></Field>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button variant="ghost">Discard</Button>
                <Button onClick={() => toast({ title: "Profile saved", tone: "success" })}>Save changes</Button>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Branding" subtitle="Applied to badges, emails and the portal" />
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                  <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-aqua-600 font-display text-[13px] font-bold text-white">ES</span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold text-slate-900">eventsphere-logo.svg</p>
                    <p className="text-[11px] text-slate-500">Primary · 24 KB</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-slate-700">Accent colour</p>
                  <div className="flex flex-wrap gap-2">
                    {["#5947c6", "#0ea5e9", "#f97316", "#10b981", "#a855f7", "#0f172a"].map((c, i) => (
                      <button key={c} onClick={() => toast({ title: "Accent updated", tone: "success" })} className={cn("size-9 rounded-xl transition hover:scale-110", i === 0 && "ring-2 ring-offset-2 ring-brand-500")} style={{ background: c }} aria-label={c} />
                    ))}
                  </div>
                </div>
                <Field label="Custom domain" hint="requires Scale plan"><Input placeholder="expo.yourbrand.com" /></Field>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                <Palette className="size-5" />
                <p className="mt-3 font-display text-[15px] font-bold">Portal preview</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/75">
                  See how your branding looks to exhibitors and attendees before publishing.
                </p>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toast({ title: "Opening preview", tone: "info" })}>Open preview</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "team" && (
        <Card>
          <CardHeader title="Team & role permissions" subtitle="4 members on the Growth plan · 2 seats remaining"
            right={<Button size="sm" icon={<Users className="size-4" />} onClick={() => toast({ title: "Invite sent", tone: "success" })}>Invite member</Button>} />
          <div className="divide-y divide-slate-100">
            {TEAM.map((m) => (
              <div key={m.e} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <Avatar src={m.a} name={m.n} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-slate-900">{m.n}</p>
                  <p className="text-[12px] text-slate-500">{m.e}</p>
                </div>
                <Badge tone={m.r === "Owner" ? "purple" : m.r === "Editor" ? "brand" : m.r === "Analyst" ? "info" : "neutral"}>{m.r}</Badge>
                <Badge tone={m.s === "Active" ? "success" : "warn"} dot>{m.s}</Badge>
                <Select defaultValue={m.r} className="h-9 w-[130px] text-[12.5px]">
                  {["Owner", "Editor", "Analyst", "Viewer"].map((r) => <option key={r}>{r}</option>)}
                </Select>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Owner", "Full access including billing & deletion"],
                ["Editor", "Create expos, approve exhibitors, edit schedules"],
                ["Analyst", "Read-only analytics plus report exports"],
                ["Viewer", "Read-only dashboards, no exports"],
              ].map(([r, d]) => (
                <div key={r} className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-[12.5px] font-bold text-slate-900">{r}</p>
                  <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {tab === "security" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Password" subtitle="Last changed 74 days ago" />
            <div className="space-y-4 p-5">
              <Field label="Current password" required><Input type="password" placeholder="••••••••" /></Field>
              <Field label="New password" required hint="8+ characters"><Input type="password" placeholder="••••••••" /></Field>
              <Field label="Confirm new password" required><Input type="password" placeholder="••••••••" /></Field>
              <div className="rounded-xl bg-emerald-50 p-3.5 text-[12px] text-emerald-800">
                Passwords are hashed with bcrypt (cost 12) and never stored in plain text.
              </div>
              <Button onClick={() => toast({ title: "Password updated", body: "You'll stay signed in on this device.", tone: "success" })} icon={<KeyRound className="size-4" />}>Update password</Button>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Two-factor authentication" subtitle="Add an extra layer of protection" />
              <div className="space-y-4 p-5">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", twofa ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {twofa ? <Check className="size-5" /> : <Lock className="size-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-slate-900">Authenticator app</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">{twofa ? "Enabled · added 12 Jan 2026" : "Not configured"}</p>
                  </div>
                  <Button size="sm" variant={twofa ? "secondary" : "primary"} onClick={() => setTwofa((v) => !v)}>{twofa ? "Disable" : "Enable"}</Button>
                </div>
                <div className="space-y-3">
                  <Toggle checked label="Require 2FA for all team members" desc="Enforced at next sign-in" onChange={() => toast({ title: "Team 2FA policy updated", tone: "success" })} />
                  <Toggle checked={false} label="Allow SMS fallback codes" desc="Less secure — app-based is recommended" onChange={() => {}} />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Active sessions" subtitle="Devices currently signed in" />
              <div className="divide-y divide-slate-100">
                {[
                  ["MacBook Pro · Chrome", "Dubai, AE · Current session", true],
                  ["iPhone 15 Pro · Safari", "Dubai, AE · 2 hours ago", false],
                  ["Windows 11 · Edge", "London, UK · 3 days ago", false],
                ].map(([d, meta, cur]) => (
                  <div key={d as string} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Globe className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-slate-900">{d as string}</p>
                      <p className="text-[11.5px] text-slate-500">{meta as string}</p>
                    </div>
                    {cur ? <Badge tone="success" dot>Active</Badge> : (
                      <button onClick={() => toast({ title: "Session revoked", tone: "info" })} className="text-[11.5px] font-bold text-rose-600 hover:underline">Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Event alerts" subtitle="What you're notified about in real time" />
            <div className="space-y-5 p-5">
              {([
                ["scheduleAlerts", "Schedule changes", "When a session is added, moved or cancelled"],
                ["exhibitorAlerts", "New exhibitor applications", "Instant alert for every new application"],
                ["boothChanges", "Booth allocation changes", "Any reservation, sale or release"],
              ] as const).map(([k, l, d]) => (
                <Toggle key={k} checked={prefs[k]} label={l} desc={d} onChange={(v) => { setPrefs({ ...prefs, [k]: v }); toast({ title: `${l} ${v ? "enabled" : "disabled"}`, tone: v ? "success" : "info" }); }} />
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Digests & reports" subtitle="Periodic summaries by email" />
            <div className="space-y-5 p-5">
              {([
                ["dailyDigest", "Daily performance digest", "Every morning at 07:00 in your time zone"],
                ["weeklyReport", "Weekly stakeholder report", "Mondays at 09:00, includes YTD comparisons"],
                ["marketing", "Product news & tips", "Occasional updates from the EventSphere team"],
              ] as const).map(([k, l, d]) => (
                <Toggle key={k} checked={prefs[k]} label={l} desc={d} onChange={(v) => setPrefs({ ...prefs, [k]: v })} />
              ))}
              <Field label="Notification email"><Input defaultValue={user?.email} /></Field>
              <Button variant="secondary" onClick={() => toast({ title: "Preferences saved", tone: "success" })}>Save preferences</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "billing" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Current plan" subtitle="Billed annually · renews 12 January 2027" />
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                <div>
                  <Badge tone="brand" className="bg-white/15 text-white ring-white/20">Growth</Badge>
                  <p className="mt-2.5 font-display text-[30px] font-extrabold leading-none">$119<span className="text-[14px] font-semibold">/mo</span></p>
                  <p className="mt-1.5 text-[12.5px] text-white/70">5 expos · 300 booths · 5,000 attendees</p>
                </div>
                <div className="text-right">
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-white/60">Seat usage</p>
                  <p className="mt-1 font-display text-[22px] font-bold">4 / 6</p>
                  <div className="mt-2 w-32"><Progress value={66} tone="success" /></div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <p className="text-[12.5px] font-bold uppercase tracking-wider text-slate-400">Payment method</p>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-slate-900 text-white"><CreditCard className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-slate-900">Visa •••• 4218</p>
                    <p className="text-[12px] text-slate-500">Expires 09/2028 · Sarah Whitfield</p>
                  </div>
                  <Button size="sm" variant="secondary">Update</Button>
                </div>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-[12.5px] font-bold uppercase tracking-wider text-slate-400">Recent invoices</p>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {[
                    ["INV-2026-0412", "12 Feb 2026", "$1,428.00", "Paid"],
                    ["INV-2026-0388", "12 Jan 2026", "$1,428.00", "Paid"],
                    ["INV-2025-1204", "12 Dec 2025", "$1,428.00", "Paid"],
                  ].map(([id, d, amt, s]) => (
                    <div key={id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-500"><Download className="size-4" /></span>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-bold text-slate-900">{id}</p>
                        <p className="text-[11.5px] text-slate-500">{d}</p>
                      </div>
                      <span className="ml-auto text-[13px] font-bold text-slate-900">{amt}</span>
                      <Badge tone="success">{s}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-ink-900 to-ink-800 p-5 text-white">
                <LifeBuoy className="size-5 text-brand-300" />
                <p className="mt-3 font-display text-[15px] font-bold">Need more capacity?</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-300">
                  Scale removes expo, booth and attendee limits and adds API access plus SSO.
                </p>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => toast({ title: "Upgrade request sent", body: "Our team will be in touch.", tone: "success" })}>Upgrade to Scale</Button>
              </div>
            </Card>
            <Card>
              <CardHeader title="Billing contact" />
              <div className="space-y-4 p-5">
                <Field label="Billing email"><Input defaultValue="finance@eventsphere.io" /></Field>
                <Field label="Tax ID / VAT"><Input defaultValue="AE-1004829130" /></Field>
                <Field label="Country"><Select defaultValue="United Arab Emirates">{["United Arab Emirates", "United Kingdom", "Germany", "United States"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
                <Button variant="secondary" full onClick={() => toast({ title: "Billing details saved", tone: "success" })}>Save</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Privacy controls" subtitle="GDPR & user consent" />
            <div className="space-y-5 p-5">
              <Toggle checked={privacy.profileVisible} label="Public organizer profile" desc="Show your name and organization on public expo pages" onChange={(v) => setPrivacy({ ...privacy, profileVisible: v })} />
              <Toggle checked={privacy.analytics} label="Product analytics" desc="Anonymous usage data that helps us improve EventSphere" onChange={(v) => setPrivacy({ ...privacy, analytics: v })} />
              <Toggle checked={privacy.dataSharing} label="Share data with partners" desc="Only aggregate, non-identifying statistics" onChange={(v) => setPrivacy({ ...privacy, dataSharing: v })} />
              <div className="rounded-xl bg-brand-50 p-4 text-[12.5px] leading-relaxed text-brand-900">
                All personal data is encrypted at rest (AES-256) and in transit (TLS 1.3). Backups run every 6 hours and are
                retained for 30 days. You can request deletion at any time.
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Export your data" subtitle="Download everything we hold" />
              <div className="space-y-3 p-5">
                {[
                  ["Expos & configurations", "JSON · includes floor plans"],
                  ["Exhibitor records", "CSV · all fields"],
                  ["Attendee registrations", "CSV · anonymised IP data"],
                  ["Messages & attachments", "ZIP · mbox format"],
                ].map(([n, d]) => (
                  <div key={n} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Download className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-bold text-slate-900">{n}</p>
                      <p className="text-[11px] text-slate-500">{d}</p>
                    </div>
                    <Button size="xs" variant="secondary" onClick={() => toast({ title: "Export requested", body: "You'll get a download link by email.", tone: "success" })}>Request</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-rose-200">
              <CardHeader title="Danger zone" subtitle="Irreversible actions" />
              <div className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                  <div>
                    <p className="text-[13px] font-bold text-rose-900">Delete this account</p>
                    <p className="mt-0.5 text-[11.5px] text-rose-800/70">Removes your profile, 8 expos and 4 team members.</p>
                  </div>
                  <Button variant="danger" size="sm" icon={<Trash2 className="size-4" />} onClick={() => toast({ title: "Account deletion requires confirmation by email", tone: "warn" })}>Delete</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
