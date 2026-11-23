/* ============================================================
   EventSphere — Extended mock data (frontend only)
   Kept separate from UI so it can later be swapped for APIs.
   ============================================================ */
import { AVATARS, EXPOS } from "./data";

/* --------------------------- Attendees --------------------------- */
export type Attendee = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  jobTitle: string;
  country: string;
  ticket: "Full Access" | "Day Pass" | "Exhibitor Guest" | "VIP" | "Press";
  status: "Confirmed" | "Checked-in" | "Waitlist" | "Cancelled" | "No-show";
  registered: string;
  eventsAttended: number;
  sessionsAttended: number;
  boothsVisited: number;
  spend: number;
  rating: number;
  notes?: string;
};

const NAMES: [string, string, string, string][] = [
  ["Elena Marsh", "Northwind Retail", "Head of Digital", "United Kingdom"],
  ["Rahul Mehta", "Vantage Bank", "VP Infrastructure", "India"],
  ["Clara Oswald", "BlueOrbit Logistics", "Ops Director", "Sweden"],
  ["Tomás Silva", "Helix Pharma", "IT Manager", "Portugal"],
  ["Nina Bergström", "Arctic Freight", "CTO", "Norway"],
  ["Omar Haddad", "Zenith Media", "Producer", "Jordan"],
  ["Yuki Tanaka", "Sakura Systems", "Engineer", "Japan"],
  ["Grace Njeri", "Savanna Telecom", "Product Lead", "Kenya"],
  ["Lukas Weber", "Rheinwerk AG", "Architect", "Germany"],
  ["Isabela Costa", "Verde Agro", "Analyst", "Brazil"],
  ["Ahmed Farouk", "Nile Analytics", "Data Lead", "Egypt"],
  ["Sofia Rossi", "Milano Design", "Creative Head", "Italy"],
  ["Daniel Cho", "Hanjin Tech", "Sales Engineer", "South Korea"],
  ["Priyanka Rao", "Indus Cloud", "Founder", "India"],
  ["Marc Dubois", "Lyon Energie", "Project Mgr", "France"],
  ["Hannah Cole", "Brightpath Edu", "Director", "Canada"],
  ["Felix Braun", "Alpen Robotics", "CTO", "Austria"],
  ["Aisha Rahman", "Gulf Fintech", "Compliance", "UAE"],
  ["Peter Novak", "Bohemia Steel", "Buyer", "Czechia"],
  ["Mei Ling", "Harbour Retail", "Marketing", "Singapore"],
  ["Carlos Ruiz", "Andes Mining", "Engineer", "Chile"],
  ["Freya Larsen", "Nordic Health", "Researcher", "Denmark"],
  ["Tariq Aziz", "Levant Media", "Journalist", "Lebanon"],
  ["Julia Kern", "Bavaria Auto", "Procurement", "Germany"],
];

const TICKETS: Attendee["ticket"][] = ["Full Access", "Day Pass", "VIP", "Press", "Exhibitor Guest"];
const STATUSES: Attendee["status"][] = ["Confirmed", "Checked-in", "Confirmed", "Waitlist", "Checked-in", "Cancelled", "Confirmed", "Checked-in"];

export const ATTENDEES: Attendee[] = NAMES.map((n, i) => ({
  id: `AT-${(10480 + i).toString()}`,
  name: n[0],
  email: `${n[0].toLowerCase().split(" ")[0].replace(/[^a-z]/g, "")}.${n[0].toLowerCase().split(" ")[1]?.replace(/[^a-z]/g, "") ?? "x"}@${n[1].toLowerCase().replace(/[^a-z]/g, "")}.com`,
  avatar: AVATARS[i % AVATARS.length],
  company: n[1],
  jobTitle: n[2],
  country: n[3],
  ticket: TICKETS[i % TICKETS.length],
  status: STATUSES[i % STATUSES.length],
  registered: `2026-0${(i % 3) + 1}-${String((i % 27) + 1).padStart(2, "0")}`,
  eventsAttended: (i % 5) + 1,
  sessionsAttended: (i * 3) % 14,
  boothsVisited: (i * 7) % 96,
  spend: [0, 149, 349, 469, 199, 349, 668, 149][i % 8],
  rating: [4.2, 4.6, 5, 3.8, 4.9, 4.4, 4.7, 4.1][i % 8],
}));

/* --------------------------- Feedback ---------------------------- */
export type Feedback = {
  id: string;
  attendee: string;
  avatar: string;
  company: string;
  target: string;
  targetType: "Session" | "Expo" | "Exhibitor";
  rating: number;
  title: string;
  body: string;
  date: string;
  status: "New" | "In Review" | "Resolved" | "Closed";
  category: "Content" | "Logistics" | "Venue" | "Technology" | "Catering";
  reply?: string;
  repliedAt?: string;
};

export const FEEDBACK: Feedback[] = [
  { id: "FB-2041", attendee: "Elena Marsh", avatar: AVATARS[0], company: "Northwind Retail", target: "Opening Keynote: Intelligence at Scale", targetType: "Session", rating: 5, title: "Best keynote I've attended in years", body: "Dr. Vance's framing of the scaling problem was genuinely fresh — no vendor fluff at all. The 20-minute live demo was the highlight of my week.", date: "2026-03-18", status: "Resolved", category: "Content", reply: "Thank you Elena — we've passed this to Dr. Vance's team. She'll be speaking again on Day 3.", repliedAt: "2026-03-19" },
  { id: "FB-2042", attendee: "Rahul Mehta", avatar: AVATARS[2], company: "Vantage Bank", target: "Global Tech Summit 2026", targetType: "Expo", rating: 3, title: "Wi-Fi buckled in Hall 4 South", body: "Between 12:00 and 13:00 the wireless in the south zone was unusable. Our lead scanner kept timing out and we lost roughly 30 scans.", date: "2026-03-19", status: "In Review", category: "Technology" },
  { id: "FB-2043", attendee: "Clara Oswald", avatar: AVATARS[3], company: "BlueOrbit Logistics", target: "Hands-on: Ship a RAG Pipeline", targetType: "Session", rating: 4, title: "Great content, room too small", body: "Excellent workshop with real, runnable code. But 120 seats for a session this popular is too few — people were sitting on the floor.", date: "2026-03-18", status: "New", category: "Logistics" },
  { id: "FB-2044", attendee: "Tomás Silva", avatar: AVATARS[4], company: "Helix Pharma", target: "Nexora Cloud", targetType: "Exhibitor", rating: 5, title: "Incredibly knowledgeable booth staff", body: "I came with a hard multi-region compliance question and left with a documented answer. Followed up within a day too.", date: "2026-03-19", status: "New", category: "Content" },
  { id: "FB-2045", attendee: "Nina Bergström", avatar: AVATARS[5], company: "Arctic Freight", target: "Global Tech Summit 2026", targetType: "Expo", rating: 2, title: "Food queues were 40 minutes", body: "Only nine vendors for 9,000 people at peak. We lost most of the lunch window standing in line.", date: "2026-03-19", status: "In Review", category: "Catering" },
  { id: "FB-2046", attendee: "Omar Haddad", avatar: AVATARS[1], company: "Zenith Media", target: "Live Demo: Autonomous Quality Control", targetType: "Session", rating: 5, title: "Flawless live demo", body: "Running real hardware on stage with no pre-recorded fallback was brave and it worked. The vision QC accuracy numbers were impressive.", date: "2026-03-20", status: "Closed", category: "Content", reply: "Glad it landed! Full demo notes are available in the resource hub.", repliedAt: "2026-03-20" },
  { id: "FB-2047", attendee: "Yuki Tanaka", avatar: AVATARS[0], company: "Sakura Systems", target: "Lumen Robotics", targetType: "Exhibitor", rating: 4, title: "Good products, crowded booth", body: "Their cobot demo was excellent but the island layout funnelled everyone through one gap. Hard to have a real conversation.", date: "2026-03-20", status: "New", category: "Venue" },
  { id: "FB-2048", attendee: "Grace Njeri", avatar: AVATARS[3], company: "Savanna Telecom", target: "Panel: The Economics of Edge Compute", targetType: "Session", rating: 4, title: "Honest disagreement — refreshing", body: "The panellists actually disagreed with each other rather than reading prepared points. Moderation was excellent.", date: "2026-03-18", status: "Resolved", category: "Content", reply: "We'll invite the same moderator back next year.", repliedAt: "2026-03-21" },
  { id: "FB-2049", attendee: "Lukas Weber", avatar: AVATARS[2], company: "Rheinwerk AG", target: "Global Tech Summit 2026", targetType: "Expo", rating: 5, title: "The floor plan app saved me hours", body: "Being able to filter exhibitors and see live booth availability before arriving meant I walked in with a plan instead of wandering.", date: "2026-03-21", status: "Closed", category: "Technology", reply: "Delighted to hear it — the offline mode ships next month.", repliedAt: "2026-03-21" },
  { id: "FB-2050", attendee: "Isabela Costa", avatar: AVATARS[4], company: "Verde Agro", target: "Workshop: Designing Cashless Venues", targetType: "Session", rating: 3, title: "Too much slide time", body: "Marketed as hands-on but the first 45 minutes were slides. The last 45 were great.", date: "2026-03-19", status: "New", category: "Content" },
  { id: "FB-2051", attendee: "Ahmed Farouk", avatar: AVATARS[5], company: "Nile Analytics", target: "CyberFortis", targetType: "Exhibitor", rating: 5, title: "Best lead follow-up of the expo", body: "They sent a tailored architecture review 48 hours after we spoke. Nobody else came close on follow-up quality.", date: "2026-03-20", status: "Resolved", category: "Content" },
  { id: "FB-2052", attendee: "Sofia Rossi", avatar: AVATARS[1], company: "Milano Design", target: "Global Tech Summit 2026", targetType: "Expo", rating: 4, title: "Signage could be clearer", body: "Finding Forum B from the East entrance required asking three staff members. Otherwise a superbly run event.", date: "2026-03-21", status: "In Review", category: "Venue" },
  { id: "FB-2053", attendee: "Daniel Cho", avatar: AVATARS[0], company: "Hanjin Tech", target: "Zero Trust for OT Networks", targetType: "Session", rating: 5, title: "Roundtable was the right format", body: "Ninety people around one actual problem. We left with a shared checklist. More of these please.", date: "2026-03-19", status: "Closed", category: "Content", reply: "We're doubling roundtable count next edition.", repliedAt: "2026-03-22" },
  { id: "FB-2054", attendee: "Priyanka Rao", avatar: AVATARS[3], company: "Indus Cloud", target: "Global Tech Summit 2026", targetType: "Expo", rating: 1, title: "Registration desk chaos on Day 1", body: "Waited 55 minutes to collect a badge despite pre-registering. The QR fast-lane worked perfectly after that, but the first hour was unacceptable.", date: "2026-03-18", status: "Resolved", category: "Logistics", reply: "Sincere apologies — we opened six extra desks from Day 2. A full post-mortem has been shared with the venue.", repliedAt: "2026-03-19" },
  { id: "FB-2055", attendee: "Marc Dubois", avatar: AVATARS[2], company: "Lyon Energie", target: "HelioGrid Energy", targetType: "Exhibitor", rating: 4, title: "Strong technical depth", body: "Battery telemetry demo answered a question our own engineers had been arguing about for months.", date: "2026-03-21", status: "New", category: "Content" },
  { id: "FB-2056", attendee: "Hannah Cole", avatar: AVATARS[4], company: "Brightpath Edu", target: "Keynote: Building for a Billion Devices", targetType: "Session", rating: 4, title: "Ambitious but well grounded", body: "Concrete numbers rather than hand-waving. Would have liked more on failure modes.", date: "2026-03-20", status: "New", category: "Content" },
];

export const RATING_BREAKDOWN = [
  { label: "5 stars", v: 68, count: 1142 },
  { label: "4 stars", v: 22, count: 370 },
  { label: "3 stars", v: 6, count: 101 },
  { label: "2 stars", v: 3, count: 50 },
  { label: "1 star", v: 1, count: 17 },
];

/* ------------------------- Conversations ------------------------- */
export type Message = { id: string; from: "me" | "them"; text: string; time: string; read?: boolean };
export type Conversation = {
  id: string;
  name: string;
  avatar?: string;
  company?: string;
  role: "Exhibitor" | "Organizer" | "Attendee" | "System";
  subject: string;
  last: string;
  lastTime: string;
  unread: number;
  status: "Active" | "Awaiting reply" | "Closed";
  messages: Message[];
  pinned?: boolean;
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "CV-01", name: "EventSphere Organizing Team", role: "Organizer", company: "EventSphere Management",
    subject: "Booth A-12 — power & rigging confirmation", last: "Load limit is 500 kg per point…", lastTime: "10:48", unread: 1, status: "Awaiting reply", pinned: true,
    messages: [
      { id: "m1", from: "them", text: "Hi Amara, your 3-phase power request for booth A-12 has been approved. Rigging inspection is scheduled for 07:00 on 18 March.", time: "Yesterday 16:20" },
      { id: "m2", from: "me", text: "That's great news. Could you confirm the rigging load limit so we can finalise the truss design?", time: "Today 09:12", read: true },
      { id: "m3", from: "them", text: "Load limit is 500 kg per point with a maximum of four points on your island. I've attached the technical pack.", time: "Today 10:48" },
    ],
  },
  {
    id: "CV-02", name: "Jonas Brandt", avatar: AVATARS[5], role: "Exhibitor", company: "Lumen Robotics",
    subject: "Collaboration on joint demo slot", last: "We're in B-04, right across…", lastTime: "09:31", unread: 2, status: "Active",
    messages: [
      { id: "m1", from: "them", text: "Hi! We're in B-04, right across from you. Interested in co-hosting the autonomous QC demo at 15:00 on Day 2?", time: "Yesterday 14:05" },
      { id: "m2", from: "me", text: "Definitely interested — what would you need from our side?", time: "Yesterday 15:30", read: true },
      { id: "m3", from: "them", text: "Mainly the vision pipeline — we'd handle the robotic cell. We'd also share the storage crate space.", time: "Today 08:14" },
      { id: "m4", from: "them", text: "Also worth looping in CyberFortis, they asked about the same slot.", time: "Today 09:31" },
    ],
  },
  {
    id: "CV-03", name: "Sofia Marchetti", avatar: AVATARS[3], role: "Exhibitor", company: "Vitalis MedTech",
    subject: "Shared storage for the demo rig", last: "Happy to split the cost.", lastTime: "Yesterday", unread: 0, status: "Active",
    messages: [
      { id: "m1", from: "them", text: "We have 6 sqm of spare storage if you need it for your crates. Happy to split the cost.", time: "Yesterday 11:02" },
      { id: "m2", from: "me", text: "Yes please — that would save us a full extra booking. What's the split?", time: "Yesterday 11:40", read: true },
      { id: "m3", from: "them", text: "50/50 works. I'll add your name to the storage manifest today.", time: "Yesterday 12:15" },
    ],
  },
  {
    id: "CV-04", name: "Finance Department", role: "Organizer", company: "EventSphere Management",
    subject: "Invoice #INV-2026-0412 paid", last: "Payment of $12,000 received…", lastTime: "2 days ago", unread: 0, status: "Closed",
    messages: [
      { id: "m1", from: "them", text: "Payment of $12,000 received for Platinum island booth A-12. Receipt attached.", time: "2 days ago 09:00" },
      { id: "m2", from: "me", text: "Received, thank you.", time: "2 days ago 09:22", read: true },
    ],
  },
  {
    id: "CV-05", name: "Noa Barak", avatar: AVATARS[1], role: "Exhibitor", company: "CyberFortis",
    subject: "Joint press release draft", last: "Let me know if the messaging…", lastTime: "3 days ago", unread: 0, status: "Awaiting reply",
    messages: [
      { id: "m1", from: "them", text: "Draft attached — let me know if the messaging on the zero-trust OT section works for you.", time: "3 days ago 13:45" },
      { id: "m2", from: "me", text: "Reading it now — one question on the joint customer reference.", time: "3 days ago 14:10", read: true },
    ],
  },
  {
    id: "CV-06", name: "Kenji Sato", avatar: AVATARS[4], role: "Exhibitor", company: "Synthwave Audio",
    subject: "Audio equipment for your theatre area", last: "We could lend you the full kit.", lastTime: "4 days ago", unread: 0, status: "Active",
    messages: [
      { id: "m1", from: "them", text: "We brought more spatial audio kit than we can demo. We could lend you the full setup for your theatre area.", time: "4 days ago 10:30" },
      { id: "m2", from: "me", text: "That would be brilliant. Can we pick it up on build-up day?", time: "4 days ago 10:55", read: true },
    ],
  },
];

/* ------------------------- Appointments -------------------------- */
export type Appointment = {
  id: string;
  with: string;
  company: string;
  avatar?: string;
  date: string;
  time: string;
  duration: number;
  type: "Meeting" | "Demo" | "Call" | "Site visit";
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  location: string;
  notes: string;
  initiatedBy: "me" | "them";
};

export const APPOINTMENTS: Appointment[] = [
  { id: "AP-3301", with: "Elena Marsh", company: "Northwind Retail", avatar: AVATARS[0], date: "2026-03-19", time: "11:00", duration: 30, type: "Meeting", status: "Confirmed", location: "Booth A-12 · Meeting pod 2", notes: "Multi-region compliance walkthrough — bring the EU data residency deck.", initiatedBy: "them" },
  { id: "AP-3302", with: "Rahul Mehta", company: "Vantage Bank", avatar: AVATARS[2], date: "2026-03-19", time: "14:30", duration: 45, type: "Demo", status: "Confirmed", location: "Booth A-12 · Demo bay", notes: "Managed DB failover demo for their DR team.", initiatedBy: "me" },
  { id: "AP-3303", with: "Clara Oswald", company: "BlueOrbit Logistics", avatar: AVATARS[3], date: "2026-03-20", time: "10:00", duration: 30, type: "Meeting", status: "Pending", location: "Networking Lounge", notes: "Edge CDN pricing for 12 distribution centres.", initiatedBy: "me" },
  { id: "AP-3304", with: "Tomás Silva", company: "Helix Pharma", avatar: AVATARS[4], date: "2026-03-20", time: "15:15", duration: 60, type: "Demo", status: "Pending", location: "Booth A-12 · Demo bay", notes: "Full platform demo — GxP validation questions expected.", initiatedBy: "them" },
  { id: "AP-3305", with: "Marc Dubois", company: "Lyon Energie", avatar: AVATARS[5], date: "2026-03-18", time: "09:30", duration: 30, type: "Meeting", status: "Completed", location: "Booth A-12 · Meeting pod 1", notes: "Intro call on grid telemetry integration.", initiatedBy: "them" },
  { id: "AP-3306", with: "Hannah Cole", company: "Brightpath Edu", avatar: AVATARS[1], date: "2026-03-18", time: "13:00", duration: 20, type: "Call", status: "Completed", location: "Press Room · Booth line", notes: "Renewal discussion for 40 seats.", initiatedBy: "me" },
  { id: "AP-3307", with: "Julia Kern", company: "Bavaria Auto", avatar: AVATARS[0], date: "2026-03-21", time: "11:45", duration: 45, type: "Site visit", status: "Cancelled", location: "Factory tour bus", notes: "Cancelled — procurement freeze until Q3.", initiatedBy: "them" },
  { id: "AP-3308", with: "Peter Novak", company: "Bohemia Steel", avatar: AVATARS[2], date: "2026-03-21", time: "16:00", duration: 30, type: "Meeting", status: "Confirmed", location: "Booth A-12 · Meeting pod 3", notes: "OT security requirements for three plants.", initiatedBy: "me" },
];

/* --------------------- Exhibitor applications -------------------- */
export type Application = {
  id: string;
  expo: string;
  expoId: string;
  applied: string;
  status: "Approved" | "Pending" | "Rejected" | "Under review" | "Withdrawn";
  booth?: string;
  tier: "Platinum" | "Gold" | "Silver" | "Bronze";
  amount: number;
  docs: { name: string; status: "Verified" | "Pending" | "Rejected" | "Missing"; date: string }[];
  note?: string;
};

export const APPLICATIONS: Application[] = [
  { id: "APL-8841", expo: "Global Tech Summit 2026", expoId: "EX-2401", applied: "2025-09-14", status: "Approved", booth: "A-12", tier: "Platinum", amount: 12000, docs: [{ name: "Certificate of incorporation", status: "Verified", date: "2025-09-15" }, { name: "Public liability insurance", status: "Verified", date: "2025-09-15" }, { name: "Booth build risk assessment", status: "Verified", date: "2026-02-02" }] },
  { id: "APL-8867", expo: "MedExpo International", expoId: "EX-2398", applied: "2026-01-22", status: "Under review", tier: "Gold", amount: 8400, docs: [{ name: "Certificate of incorporation", status: "Verified", date: "2026-01-23" }, { name: "Product liability waiver", status: "Pending", date: "2026-01-23" }, { name: "Electrical certificate", status: "Missing", date: "—" }], note: "Awaiting electrical certificate before allocation." },
  { id: "APL-8871", expo: "Industrial Innovate Fair", expoId: "EX-2390", applied: "2026-02-04", status: "Rejected", tier: "Silver", amount: 5600, docs: [{ name: "Certificate of incorporation", status: "Verified", date: "2026-02-05" }, { name: "Booth build risk assessment", status: "Rejected", date: "2026-02-11" }], note: "Risk assessment did not cover the proposed mezzanine build." },
  { id: "APL-8890", expo: "Retail & Commerce Week", expoId: "EX-2371", applied: "2026-02-18", status: "Pending", tier: "Gold", amount: 8400, docs: [{ name: "Certificate of incorporation", status: "Pending", date: "2026-02-18" }] },
  { id: "APL-8902", expo: "GreenBuild Expo", expoId: "EX-2360", applied: "2026-01-09", status: "Approved", booth: "B-22", tier: "Gold", amount: 8400, docs: [{ name: "Certificate of incorporation", status: "Verified", date: "2026-01-10" }, { name: "Public liability insurance", status: "Verified", date: "2026-01-10" }, { name: "Sustainability statement", status: "Verified", date: "2026-01-14" }] },
];

/* ------------------------- Exhibitor docs ------------------------ */
export type ExhibitorDoc = { id: string; name: string; type: string; size: string; uploaded: string; status: "Verified" | "Pending" | "Rejected"; note?: string };

export const EXHIBITOR_DOCS: ExhibitorDoc[] = [
  { id: "DC-11", name: "certificate-of-incorporation.pdf", type: "PDF", size: "412 KB", uploaded: "2025-09-15", status: "Verified" },
  { id: "DC-12", name: "public-liability-insurance.pdf", type: "PDF", size: "1.2 MB", uploaded: "2025-09-15", status: "Verified" },
  { id: "DC-13", name: "product-liability-waiver.pdf", type: "PDF", size: "860 KB", uploaded: "2026-01-18", status: "Verified" },
  { id: "DC-14", name: "booth-build-risk-assessment-v2.pdf", type: "PDF", size: "2.1 MB", uploaded: "2026-02-02", status: "Verified" },
  { id: "DC-15", name: "electrical-certificate.pdf", type: "PDF", size: "540 KB", uploaded: "2026-02-14", status: "Verified" },
  { id: "DC-16", name: "staff-list-and-badges.xlsx", type: "XLSX", size: "98 KB", uploaded: "2026-02-09", status: "Verified" },
  { id: "DC-17", name: "medexpo-electrical-cert.pdf", type: "PDF", size: "505 KB", uploaded: "2026-01-23", status: "Pending", note: "Under review — typically 2 business days." },
  { id: "DC-18", name: "iso-27001-certificate.pdf", type: "PDF", size: "780 KB", uploaded: "2026-02-20", status: "Pending" },
];

/* --------------------------- Products ---------------------------- */
export const COMPANY_PRODUCTS = [
  { id: "PR-01", name: "Kubernetes Platform", desc: "Managed multi-region control planes with policy-as-code and automated drift repair.", price: "From $2,400 / mo", status: "Live", demos: 34 },
  { id: "PR-02", name: "Edge CDN", desc: "285 PoPs with per-request WAF rules and real bandwidth analytics.", price: "Usage based", status: "Live", demos: 28 },
  { id: "PR-03", name: "Managed DB", desc: "Postgres and MySQL with cross-region failover under 30 seconds RTO.", price: "From $680 / mo", status: "Live", demos: 41 },
  { id: "PR-04", name: "Compliance Vault", desc: "Immutable audit log store with regional data residency controls.", price: "Beta", status: "Beta", demos: 12 },
];

/* ----------------------- Company / About ------------------------- */
export const ABOUT = {
  mission: "To remove every layer of friction between the people who build expos, the companies who exhibit at them, and the audiences who attend them — by replacing spreadsheets, PDFs and reply-all threads with one live source of truth.",
  vision: "A world where any event team, regardless of size or budget, can deliver an expo experience that feels effortless to every exhibitor and every attendee who walks through the door.",
  intro:
    "EventSphere Management is an event-technology company specialising in large-scale expos and trade shows. Since 2014 we have produced 480 editions across 14 countries, and we built this platform because the software we were asked to use never matched the standard of the events themselves.",
  values: [
    { title: "Transparency first", body: "Every stakeholder sees the same live data. No selective reporting, no hidden spreadsheets, no surprises on build-up day.", icon: "Eye" },
    { title: "Craft over volume", body: "We would rather ship one polished module than five half-finished ones. Every feature ships keyboard-accessible and tested.", icon: "Sparkles" },
    { title: "Reliability is a feature", body: "99.9% uptime with automated six-hourly backups. When you are mid-expo, the platform simply has to work.", icon: "ShieldCheck" },
    { title: "Accessible by default", body: "WCAG 2.1 AA is our floor, not our target. Contrast, focus order and semantics are checked on every release.", icon: "Accessibility" },
  ],
  timeline: [
    { year: "2014", title: "Founded in Dubai", body: "Two event producers and one engineer, building registration tools for a 90-booth trade show." },
    { year: "2017", title: "First 10,000-attendee expo", body: "Our floor-plan engine was born out of necessity — hand-drawn booth maps did not survive contact with reality." },
    { year: "2020", title: "Fully digital editions", body: "When halls closed we shipped virtual booths and live session streaming in eleven days." },
    { year: "2023", title: "Real-time analytics", body: "Badge-scan telemetry and booth traffic heatmaps went live, refreshed every 30 seconds." },
    { year: "2026", title: "480 editions delivered", body: "Now serving 12,400 exhibitor teams and 3.2 million attendee check-ins across 14 countries." },
  ],
  team: [
    { name: "Sarah Whitfield", role: "Founder & CEO", avatar: AVATARS[0], bio: "Produced 120+ expos before deciding to build the tooling instead." },
    { name: "Marcus Reid", role: "Head of Product", avatar: AVATARS[2], bio: "Previously principal analyst; obsessive about dashboards that answer questions." },
    { name: "Priya Nair", role: "Engineering Lead", avatar: AVATARS[1], bio: "Keeps the platform at 99.9% uptime through expo week peaks." },
    { name: "Kenji Sato", role: "Design Lead", avatar: AVATARS[4], bio: "Responsible for the accessibility standard across every surface." },
  ],
  offices: [
    { city: "Dubai", address: "Level 14, Index Tower, DIFC, Dubai, UAE", phone: "+971 4 555 0134", tz: "GST · UTC+4" },
    { city: "London", address: "22 Clerkenwell Green, London EC1R 0DP, UK", phone: "+44 20 7946 0821", tz: "GMT · UTC+0" },
    { city: "Singapore", address: "9 Temasek Boulevard, #29-01, Singapore 038989", phone: "+65 6011 8842", tz: "SGT · UTC+8" },
  ],
  socials: [
    { name: "X (Twitter)", href: "#" },
    { name: "LinkedIn", href: "#" },
    { name: "Instagram", href: "#" },
    { name: "YouTube", href: "#" },
    { name: "Facebook", href: "#" },
  ],
};

export const EXHIBITOR_BENEFITS = [
  { title: "Choose your space visually", body: "Browse the live floor plan, filter by zone, size and price, then reserve in a click — no email chains, no PDF maps.", metric: "11 min", metricLabel: "median booth selection" },
  { title: "Leads, not business cards", body: "Scan attendee badges with your phone. Every lead is scored, enriched and exportable to your CRM the same day.", metric: "61%", metricLabel: "qualification rate" },
  { title: "Staff badges in one place", body: "Issue, edit and revoke e-Badges for your whole team. Set granular permissions per person.", metric: "8 badges", metricLabel: "included per booth" },
  { title: "Neighbour collaboration", body: "Message adjacent exhibitors directly — co-host demos, split storage, share rigging costs.", metric: "2 deals", metricLabel: "avg. per neighbour channel" },
  { title: "See what actually worked", body: "Booth traffic, scan volume, product interest and meeting conversion in one exhibitor dashboard.", metric: "30s", metricLabel: "data refresh" },
  { title: "Documents without the chase", body: "Upload your compliance pack once. Track verification status and swap files any time.", metric: "6 files", metricLabel: "typical pack" },
];

export const ATTENDEE_BENEFITS = [
  { title: "Plan before you arrive", body: "Filter thousands of exhibitors by category, product and keyword. Build a route, not a wander.", metric: "486", metricLabel: "exhibitors searchable" },
  { title: "Never miss a session", body: "Bookmark anything on the schedule and get a reminder 45 minutes before it starts — including last-minute room changes.", metric: "45 min", metricLabel: "reminder lead time" },
  { title: "Find the right vendor", body: "Detailed exhibitor profiles with products, booth location and direct messaging or appointment booking.", metric: "1 tap", metricLabel: "to book a meeting" },
  { title: "Digital badge, fast lane", body: "Your QR pass lives on your phone. Skip the desk entirely and walk straight into the hall.", metric: "0 min", metricLabel: "average entry wait" },
  { title: "Your data, your control", body: "Choose what exhibitors can see, opt out of marketing, and export or delete your data at any time.", metric: "GDPR", metricLabel: "compliant by design" },
  { title: "Keep what you learned", body: "Session recordings, slides and your personal notes stay available for twelve months after the event.", metric: "12 mo", metricLabel: "content access" },
];

export const HOME_FAQS = [
  { q: "How long does it take to set up an expo?", a: "Most organizers publish a fully configured expo — floor plan, ticket tiers and schedule — in under 40 minutes. Import an exhibitor list via CSV or connect your CRM." },
  { q: "Can exhibitors choose their own booth?", a: "Yes. Exhibitors browse the live floor plan, filter by zone, size and price, then reserve instantly. You keep approval control before any space is locked." },
  { q: "Does the platform work on mobile?", a: "Every surface is mobile-first and responsive — from the organizer dashboard to the attendee schedule and badge scanner. No separate app install required." },
  { q: "How is my data secured?", a: "Passwords are hashed and salted, all traffic runs over TLS 1.3, and access control is enforced per role. Data is encrypted at rest with automated six-hourly backups." },
  { q: "Do you support accessibility standards?", a: "We target WCAG 2.1 AA across the entire interface — keyboard navigation, semantic landmarks, focus management and verified colour contrast." },
  { q: "Can I export analytics reports?", a: "Any chart or table exports to CSV, XLSX or PDF. Scheduled email digests are available for stakeholders who prefer inbox delivery." },
  { q: "What does it cost to exhibit?", a: "Booth rates start at $2,600 for a standard 12 m² space and scale with zone and size. Every booth includes four staff e-Badges and the lead scanner." },
  { q: "Can I get a refund on my ticket?", a: "Full refunds are available up to 14 days before the event. Within 14 days you can transfer your pass to a colleague at no charge." },
];

export const CONTACT_TOPICS = [
  "General enquiry",
  "Hosting an expo",
  "Exhibiting at an expo",
  "Press & media",
  "Partnership",
  "Billing",
  "Report a problem",
];

export const OPEN_EXPOS = EXPOS.filter((e) => e.status !== "Completed");
