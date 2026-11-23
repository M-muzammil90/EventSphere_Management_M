/* ============================================================
   EventSphere — Central mock data layer (frontend only)
   ============================================================ */

export type Role = "admin" | "organizer" | "exhibitor" | "attendee";

export const MEDIA = {
  heroVideo:
    "https://videos.pexels.com/video-files/31575321/13456307_3840_2160_25fps.mp4",
  heroPoster:
    "https://images.pexels.com/videos/31575321/commercial-real-estate-corporate-event-marquee-31575321.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=630&w=1200",
  conferenceVideo:
    "https://videos.pexels.com/video-files/19197406/19197406-uhd_3840_2160_30fps.mp4",
};

export const IMG = {
  expoTech:
    "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoTrade:
    "https://images.pexels.com/photos/35138560/pexels-photo-35138560.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoIndustrial:
    "https://images.pexels.com/photos/36522033/pexels-photo-36522033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoAuto:
    "https://images.pexels.com/photos/12712474/pexels-photo-12712474.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoCenter:
    "https://images.pexels.com/photos/19425033/pexels-photo-19425033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoFair:
    "https://images.pexels.com/photos/19425035/pexels-photo-19425035.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoCar:
    "https://images.pexels.com/photos/37263348/pexels-photo-37263348.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  expoSignage:
    "https://images.pexels.com/photos/37439236/pexels-photo-37439236.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

export const AVATARS = [
  "https://images.pexels.com/photos/6497112/pexels-photo-6497112.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/7752805/pexels-photo-7752805.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/5649997/pexels-photo-5649997.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/33799456/pexels-photo-33799456.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
];

/* ---------------------------- Expos ---------------------------- */
export type Expo = {
  id: string;
  title: string;
  slug: string;
  category: string;
  industry: string;
  cover: string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  description: string;
  theme: string;
  status: "Live" | "Upcoming" | "Completed" | "Draft";
  attendees: number;
  exhibitors: number;
  sessions: number;
  boothsTotal: number;
  boothsSold: number;
  price: number;
  rating: number;
  tags: string[];
  featured?: boolean;
};

export const EXPOS: Expo[] = [
  {
    id: "EX-2401",
    title: "Global Tech Summit 2026",
    slug: "global-tech-summit",
    category: "Technology",
    industry: "SaaS · AI · Cloud",
    cover: IMG.expoTech,
    city: "Dubai, UAE",
    venue: "Dubai World Trade Centre — Hall 4",
    startDate: "2026-03-18",
    endDate: "2026-03-21",
    description:
      "The region's largest gathering of software leaders, AI researchers and cloud architects. Four days of keynotes, hands-on labs and 480+ product demos across three halls.",
    theme: "Intelligence at Scale",
    status: "Upcoming",
    attendees: 18420,
    exhibitors: 486,
    sessions: 92,
    boothsTotal: 520,
    boothsSold: 486,
    price: 149,
    rating: 4.9,
    tags: ["AI", "Cloud", "DevOps", "Startups"],
    featured: true,
  },
  {
    id: "EX-2398",
    title: "MedExpo International",
    slug: "medexpo-international",
    category: "Healthcare",
    industry: "MedTech · Pharma · Diagnostics",
    cover: IMG.expoTrade,
    city: "Singapore",
    venue: "Marina Bay Sands Expo — Level 1",
    startDate: "2026-04-09",
    endDate: "2026-04-11",
    description:
      "Connecting medical device manufacturers with hospital procurement teams. Featuring a live surgical simulation theatre and regulatory roundtables.",
    theme: "Precision Care",
    status: "Upcoming",
    attendees: 12750,
    exhibitors: 342,
    sessions: 58,
    boothsTotal: 400,
    boothsSold: 342,
    price: 199,
    rating: 4.7,
    tags: ["MedTech", "Devices", "Regulatory"],
    featured: true,
  },
  {
    id: "EX-2390",
    title: "Industrial Innovate Fair",
    slug: "industrial-innovate-fair",
    category: "Manufacturing",
    industry: "Robotics · Automation · IoT",
    cover: IMG.expoIndustrial,
    city: "Munich, Germany",
    venue: "Messe München — Hall B2",
    startDate: "2026-02-24",
    endDate: "2026-02-27",
    description:
      "Automation, robotics and smart-factory infrastructure on one floor. Includes guided factory tours and an OEM matchmaking programme.",
    theme: "Factory of the Future",
    status: "Live",
    attendees: 9310,
    exhibitors: 268,
    sessions: 44,
    boothsTotal: 320,
    boothsSold: 297,
    price: 129,
    rating: 4.8,
    tags: ["Robotics", "Automation", "IIoT"],
    featured: true,
  },
  {
    id: "EX-2384",
    title: "AutoVision Expo",
    slug: "autovision-expo",
    category: "Automotive",
    industry: "EV · Mobility · Components",
    cover: IMG.expoAuto,
    city: "Tokyo, Japan",
    venue: "Tokyo Big Sight — East Hall",
    startDate: "2026-05-14",
    endDate: "2026-05-17",
    description:
      "Electric mobility, charging infrastructure and next-gen components. Over 60 test-drive bays and an investor pitch arena.",
    theme: "Electric Everything",
    status: "Upcoming",
    attendees: 22100,
    exhibitors: 510,
    sessions: 76,
    boothsTotal: 600,
    boothsSold: 389,
    price: 99,
    rating: 4.6,
    tags: ["EV", "Charging", "Batteries"],
  },
  {
    id: "EX-2371",
    title: "Retail & Commerce Week",
    slug: "retail-commerce-week",
    category: "Retail",
    industry: "POS · Payments · Logistics",
    cover: IMG.expoSignage,
    city: "London, UK",
    venue: "ExCeL London — North Hall",
    startDate: "2026-06-02",
    endDate: "2026-06-04",
    description:
      "The commerce value chain end-to-end: payments, in-store tech, fulfilment and customer analytics. Includes a live cashless store.",
    theme: "Frictionless Commerce",
    status: "Upcoming",
    attendees: 8420,
    exhibitors: 214,
    sessions: 38,
    boothsTotal: 280,
    boothsSold: 141,
    price: 89,
    rating: 4.5,
    tags: ["Payments", "POS", "Fulfilment"],
  },
  {
    id: "EX-2360",
    title: "GreenBuild Expo",
    slug: "greenbuild-expo",
    category: "Sustainability",
    industry: "Construction · Energy · Materials",
    cover: IMG.expoCenter,
    city: "Amsterdam, Netherlands",
    venue: "RAI Amsterdam — Hall 7",
    startDate: "2026-07-08",
    endDate: "2026-07-10",
    description:
      "Net-zero construction, circular materials and renewable systems. Hosted in a carbon-neutral venue with a fully digital floor plan.",
    theme: "Build Net Zero",
    status: "Upcoming",
    attendees: 6780,
    exhibitors: 186,
    sessions: 30,
    boothsTotal: 240,
    boothsSold: 88,
    price: 79,
    rating: 4.4,
    tags: ["NetZero", "Materials", "Solar"],
  },
  {
    id: "EX-2344",
    title: "FoodTech & Flavours",
    slug: "foodtech-flavours",
    category: "Food & Beverage",
    industry: "FoodTech · Packaging · Supply",
    cover: IMG.expoCar,
    city: "Barcelona, Spain",
    venue: "Fira Barcelona — Gran Via",
    startDate: "2026-08-19",
    endDate: "2026-08-22",
    description:
      "Tasting labs, alt-protein showcases and cold-chain innovation. The largest food-tech buyer programme in Southern Europe.",
    theme: "Future of Food",
    status: "Upcoming",
    attendees: 15300,
    exhibitors: 398,
    sessions: 51,
    boothsTotal: 460,
    boothsSold: 176,
    price: 69,
    rating: 4.7,
    tags: ["AltProtein", "Packaging", "ColdChain"],
  },
  {
    id: "EX-2310",
    title: "Aero & Defence Systems",
    slug: "aero-defence-systems",
    category: "Aerospace",
    industry: "Avionics · Space · Defence",
    cover: IMG.expoFair,
    city: "Riyadh, Saudi Arabia",
    venue: "Riyadh Exhibition Center — Hall 1&2",
    startDate: "2025-11-12",
    endDate: "2025-11-15",
    description:
      "Completed edition — 412 exhibitors, 74 delegations and a record $2.1B in announced contracts.",
    theme: "Air Superiority",
    status: "Completed",
    attendees: 19760,
    exhibitors: 412,
    sessions: 63,
    boothsTotal: 480,
    boothsSold: 480,
    price: 249,
    rating: 4.8,
    tags: ["Avionics", "Space", "Defence"],
  },
];

/* -------------------------- Exhibitors -------------------------- */
export type Exhibitor = {
  id: string;
  _id?: string;
  company: string;
  logoText: string;
  logoBg: string;
  category: string;
  booth: string;
  hall: string;
  country: string;
  rep: string;
  avatar: string;
  status: "Approved" | "Pending" | "Rejected" | "Waitlist";
  docs: "Complete" | "Missing";
  staff: number;
  leadScore: number;
  rating: number;
  products: string[];
  joined: string;
  traffic: number;
  revenue: number;
  description: string;
  badgeTier: "Platinum" | "Gold" | "Silver" | "Bronze";
  tier?: string;
  email?: string;
  leads?: number;
};

export const EXHIBITORS: Exhibitor[] = [
  { id: "XB-1042", company: "Nexora Cloud", logoText: "NX", logoBg: "from-indigo-500 to-violet-600", category: "Cloud Infrastructure", booth: "A-12", hall: "Hall 4 — North", country: "United States", rep: "Amara Osei", avatar: AVATARS[0], status: "Approved", docs: "Complete", staff: 8, leadScore: 92, rating: 4.9, products: ["Kubernetes Platform", "Edge CDN", "Managed DB"], joined: "2025-09-14", traffic: 4820, revenue: 128000, description: "Multi-region cloud platform purpose-built for regulated industries.", badgeTier: "Platinum" },
  { id: "XB-1043", company: "Lumen Robotics", logoText: "LR", logoBg: "from-cyan-500 to-blue-600", category: "Industrial Automation", booth: "B-04", hall: "Hall 4 — Central", country: "Germany", rep: "Jonas Brandt", avatar: AVATARS[2], status: "Approved", docs: "Complete", staff: 12, leadScore: 88, rating: 4.7, products: ["Cobots", "Vision QC", "AMR Fleet"], joined: "2025-09-22", traffic: 3910, revenue: 96500, description: "Collaborative robotic cells for mid-volume manufacturing lines.", badgeTier: "Platinum" },
  { id: "XB-1044", company: "Vitalis MedTech", logoText: "VM", logoBg: "from-rose-500 to-pink-600", category: "Medical Devices", booth: "A-27", hall: "Hall 4 — North", country: "Switzerland", rep: "Sofia Marchetti", avatar: AVATARS[3], status: "Approved", docs: "Complete", staff: 6, leadScore: 81, rating: 4.8, products: ["Patient Monitors", "Surgical Robots"], joined: "2025-10-02", traffic: 3120, revenue: 88000, description: "Class III diagnostic and surgical systems with CE and FDA clearance.", badgeTier: "Gold" },
  { id: "XB-1045", company: "Quantum Ledger", logoText: "QL", logoBg: "from-amber-500 to-orange-600", category: "Fintech & Payments", booth: "C-15", hall: "Hall 5 — South", country: "Singapore", rep: "Wei Lin Tan", avatar: AVATARS[4], status: "Pending", docs: "Missing", staff: 4, leadScore: 64, rating: 4.3, products: ["Settlement Rails", "Stablecoin API"], joined: "2026-01-11", traffic: 0, revenue: 0, description: "Institutional settlement infrastructure for cross-border commerce.", badgeTier: "Silver" },
  { id: "XB-1046", company: "HelioGrid Energy", logoText: "HG", logoBg: "from-emerald-500 to-teal-600", category: "Renewables", booth: "B-22", hall: "Hall 4 — Central", country: "Netherlands", rep: "Daan Vos", avatar: AVATARS[5], status: "Approved", docs: "Complete", staff: 9, leadScore: 77, rating: 4.6, products: ["Solar Canopy", "Grid Battery"], joined: "2025-10-19", traffic: 2680, revenue: 61000, description: "Modular solar canopies and grid-scale storage for commercial sites.", badgeTier: "Gold" },
  { id: "XB-1047", company: "Orbital Freight", logoText: "OF", logoBg: "from-slate-600 to-slate-800", category: "Logistics", booth: "C-08", hall: "Hall 5 — South", country: "United Kingdom", rep: "Priya Nair", avatar: AVATARS[1], status: "Pending", docs: "Complete", staff: 5, leadScore: 58, rating: 4.2, products: ["Cold Chain", "Last-mile AI"], joined: "2026-01-24", traffic: 0, revenue: 0, description: "Cold-chain logistics orchestration with predictive routing.", badgeTier: "Silver" },
  { id: "XB-1048", company: "Aurora Analytics", logoText: "AA", logoBg: "from-fuchsia-500 to-purple-600", category: "Data & AI", booth: "A-04", hall: "Hall 4 — North", country: "Canada", rep: "Marcus Reid", avatar: AVATARS[2], status: "Approved", docs: "Complete", staff: 7, leadScore: 85, rating: 4.7, products: ["Event Intel Suite", "Demand Models"], joined: "2025-11-04", traffic: 3540, revenue: 74500, description: "Real-time behavioural analytics for large-scale venues.", badgeTier: "Gold" },
  { id: "XB-1049", company: "TerraWool", logoText: "TW", logoBg: "from-lime-500 to-green-600", category: "Materials", booth: "D-11", hall: "Hall 5 — East", country: "Sweden", rep: "Elin Karlsson", avatar: AVATARS[3], status: "Rejected", docs: "Missing", staff: 3, leadScore: 34, rating: 3.9, products: ["Circular Insulation"], joined: "2026-01-30", traffic: 0, revenue: 0, description: "Insulation panels from reclaimed textile fibre.", badgeTier: "Bronze" },
  { id: "XB-1050", company: "Synthwave Audio", logoText: "SA", logoBg: "from-violet-500 to-indigo-700", category: "Consumer Electronics", booth: "B-31", hall: "Hall 4 — Central", country: "Japan", rep: "Kenji Sato", avatar: AVATARS[4], status: "Waitlist", docs: "Complete", staff: 6, leadScore: 61, rating: 4.4, products: ["Spatial Headsets"], joined: "2026-02-02", traffic: 0, revenue: 0, description: "Spatial audio hardware for immersive retail environments.", badgeTier: "Silver" },
  { id: "XB-1051", company: "CyberFortis", logoText: "CF", logoBg: "from-red-500 to-rose-700", category: "Cybersecurity", booth: "A-19", hall: "Hall 4 — North", country: "Israel", rep: "Noa Barak", avatar: AVATARS[1], status: "Approved", docs: "Complete", staff: 10, leadScore: 90, rating: 4.9, products: ["Zero Trust NAC", "Threat Graph"], joined: "2025-08-27", traffic: 4310, revenue: 112000, description: "Zero-trust network access for industrial and enterprise fleets.", badgeTier: "Platinum" },
];

/* --------------------------- Sessions --------------------------- */
export type Session = {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  avatar: string;
  day: string;
  date: string;
  start: string;
  end: string;
  stage: string;
  type: "Keynote" | "Workshop" | "Panel" | "Demo" | "Roundtable";
  track: string;
  capacity: number;
  registered: number;
  rating: number;
  bookmarked?: boolean;
  tags: string[];
  expoId?: string;
  time?: string;
  role?: string;
  company?: string;
  description?: string;
};

export const SESSIONS: Session[] = [
  { id: "SS-01", title: "Opening Keynote: Intelligence at Scale", speaker: "Dr. Elena Vance", speakerRole: "CTO, Nexora Cloud", avatar: AVATARS[0], day: "Day 1", date: "2026-03-18", start: "09:00", end: "10:00", stage: "Main Stage", type: "Keynote", track: "Vision", capacity: 3000, registered: 2841, rating: 4.9, bookmarked: true, tags: ["AI", "Strategy"] },
  { id: "SS-02", title: "Hands-on: Ship a RAG Pipeline in 90 Minutes", speaker: "Marcus Reid", speakerRole: "Principal ML, Aurora Analytics", avatar: AVATARS[2], day: "Day 1", date: "2026-03-18", start: "11:00", end: "12:30", stage: "Lab 2", type: "Workshop", track: "Engineering", capacity: 120, registered: 118, rating: 4.8, tags: ["LLM", "Lab"] },
  { id: "SS-03", title: "Panel: The Economics of Edge Compute", speaker: "Wei Lin Tan", speakerRole: "CEO, Quantum Ledger", avatar: AVATARS[4], day: "Day 1", date: "2026-03-18", start: "14:00", end: "15:00", stage: "Forum A", type: "Panel", track: "Infrastructure", capacity: 450, registered: 402, rating: 4.6, tags: ["Edge", "Cost"] },
  { id: "SS-04", title: "Live Demo: Autonomous Quality Control", speaker: "Jonas Brandt", speakerRole: "Head of Product, Lumen Robotics", avatar: AVATARS[5], day: "Day 2", date: "2026-03-19", start: "10:30", end: "11:15", stage: "Demo Arena", type: "Demo", track: "Automation", capacity: 600, registered: 588, rating: 4.9, bookmarked: true, tags: ["Vision", "Robotics"] },
  { id: "SS-05", title: "Zero Trust for OT Networks", speaker: "Noa Barak", speakerRole: "VP Security, CyberFortis", avatar: AVATARS[1], day: "Day 2", date: "2026-03-19", start: "13:00", end: "14:00", stage: "Forum B", type: "Roundtable", track: "Security", capacity: 90, registered: 87, rating: 4.7, tags: ["OT", "ZeroTrust"] },
  { id: "SS-06", title: "Workshop: Designing Cashless Venues", speaker: "Priya Nair", speakerRole: "Director, Orbital Freight", avatar: AVATARS[3], day: "Day 2", date: "2026-03-19", start: "15:30", end: "17:00", stage: "Lab 1", type: "Workshop", track: "Commerce", capacity: 110, registered: 96, rating: 4.4, tags: ["Payments"] },
  { id: "SS-07", title: "Keynote: Building for a Billion Devices", speaker: "Dr. Elena Vance", speakerRole: "CTO, Nexora Cloud", avatar: AVATARS[0], day: "Day 3", date: "2026-03-20", start: "09:30", end: "10:30", stage: "Main Stage", type: "Keynote", track: "Vision", capacity: 3000, registered: 2190, rating: 4.8, tags: ["Scale"] },
  { id: "SS-08", title: "Panel: Regulation in the Age of Agents", speaker: "Sofia Marchetti", speakerRole: "Regulatory Lead, Vitalis MedTech", avatar: AVATARS[3], day: "Day 3", date: "2026-03-20", start: "12:00", end: "13:00", stage: "Forum A", type: "Panel", track: "Governance", capacity: 450, registered: 377, rating: 4.5, tags: ["Policy", "Agents"] },
  { id: "SS-09", title: "Demo: Grid-Scale Battery Telemetry", speaker: "Daan Vos", speakerRole: "Founder, HelioGrid Energy", avatar: AVATARS[5], day: "Day 4", date: "2026-03-21", start: "10:00", end: "10:45", stage: "Demo Arena", type: "Demo", track: "Energy", capacity: 600, registered: 411, rating: 4.3, tags: ["Energy"] },
  { id: "SS-10", title: "Closing Roundtable: What Ships in 2027", speaker: "Kenji Sato", speakerRole: "Design Lead, Synthwave Audio", avatar: AVATARS[4], day: "Day 4", date: "2026-03-21", start: "15:00", end: "16:00", stage: "Forum B", type: "Roundtable", track: "Foresight", capacity: 90, registered: 74, rating: 4.6, tags: ["Foresight"] },
];

/* -------------------------- Booths / Floor -------------------------- */
export type Booth = {
  id: string;
  _id?: string;
  zone: "A" | "B" | "C" | "D";
  size: "Small" | "Medium" | "Large" | "Island";
  sqm: number;
  price: number;
  status: "available" | "reserved" | "sold" | "blocked";
  owner?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const boothDefs: Array<[Booth["zone"], number, Booth["size"], number, number, number, number, number, number, string | undefined]> = [
  ["A", 1, "Island", 72, 12000, 4, 4, 22, 22, "Nexora Cloud"],
  ["A", 2, "Large", 48, 8400, 28, 4, 18, 22, "CyberFortis"],
  ["A", 3, "Medium", 30, 5600, 48, 4, 14, 16, "Aurora Analytics"],
  ["A", 4, "Medium", 30, 5600, 48, 22, 14, 16, "Vitalis MedTech"],
  ["A", 12, "Large", 48, 8400, 4, 28, 18, 20, "Nexora Cloud"],
  ["A", 19, "Medium", 30, 5600, 24, 28, 14, 16, "CyberFortis"],
  ["A", 27, "Medium", 30, 5600, 40, 28, 14, 16, "Vitalis MedTech"],
  ["A", 34, "Small", 12, 2600, 56, 28, 12, 14, undefined],
  ["A", 41, "Small", 12, 2600, 4, 50, 12, 14, undefined],
  ["A", 42, "Small", 12, 2600, 18, 50, 12, 14, undefined],
  ["A", 43, "Small", 12, 2600, 32, 50, 12, 14, undefined],
  ["A", 44, "Small", 12, 2600, 46, 50, 12, 14, undefined],
  ["A", 45, "Small", 12, 2600, 60, 50, 12, 14, undefined],

  ["B", 4, "Island", 72, 12000, 78, 6, 20, 20, "Lumen Robotics"],
  ["B", 9, "Medium", 30, 5600, 78, 28, 14, 16, "HelioGrid Energy"],
  ["B", 16, "Small", 12, 2600, 78, 46, 12, 12, undefined],
  ["B", 22, "Medium", 30, 5600, 78, 60, 14, 16, "HelioGrid Energy"],
  ["B", 31, "Medium", 30, 5600, 78, 78, 14, 16, "Synthwave Audio"],
  ["B", 38, "Small", 12, 2600, 78, 96, 12, 12, undefined],
  ["B", 44, "Small", 12, 2600, 78, 110, 12, 12, undefined],

  ["C", 8, "Medium", 30, 5600, 100, 8, 14, 16, undefined],
  ["C", 15, "Medium", 30, 5600, 100, 26, 14, 16, "Quantum Ledger"],
  ["C", 22, "Small", 12, 2600, 100, 44, 12, 12, undefined],
  ["C", 29, "Small", 12, 2600, 100, 58, 12, 12, undefined],
  ["C", 33, "Large", 48, 8400, 100, 72, 16, 22, undefined],
  ["C", 41, "Small", 12, 2600, 100, 96, 12, 12, undefined],

  ["D", 11, "Medium", 30, 5600, 120, 8, 14, 16, undefined],
  ["D", 18, "Small", 12, 2600, 120, 26, 12, 12, undefined],
  ["D", 25, "Small", 12, 2600, 120, 40, 12, 12, undefined],
  ["D", 30, "Medium", 30, 5600, 120, 54, 14, 16, undefined],
  ["D", 37, "Small", 12, 2600, 120, 72, 12, 12, undefined],
  ["D", 42, "Small", 12, 2600, 120, 86, 12, 12, undefined],
];

export const BOOTHS: Booth[] = boothDefs.map(
  ([zone, num, size, sqm, price, x, y, w, h, owner]) => ({
    id: `${zone}-${num}`,
    zone,
    size,
    sqm,
    price,
    status: owner ? (num % 7 === 0 ? "reserved" : "sold") : num % 11 === 0 ? "blocked" : "available",
    owner,
    x,
    y,
    w,
    h,
  })
);

/* --------------------------- Analytics --------------------------- */
export const ATTENDANCE_TREND = [
  { label: "Mon", a: 4200, b: 3100 },
  { label: "Tue", a: 6800, b: 4900 },
  { label: "Wed", a: 9200, b: 6100 },
  { label: "Thu", a: 8100, b: 7200 },
  { label: "Fri", a: 10400, b: 8300 },
  { label: "Sat", a: 7600, b: 6900 },
  { label: "Sun", a: 5200, b: 4300 },
];

export const MONTHLY_REVENUE = [
  { label: "Jan", v: 182 },
  { label: "Feb", v: 214 },
  { label: "Mar", v: 268 },
  { label: "Apr", v: 241 },
  { label: "May", v: 312 },
  { label: "Jun", v: 389 },
  { label: "Jul", v: 356 },
  { label: "Aug", v: 428 },
  { label: "Sep", v: 502 },
  { label: "Oct", v: 574 },
  { label: "Nov", v: 618 },
  { label: "Dec", v: 703 },
];

export const BOOTH_TRAFFIC_HOURS = [
  { label: "9a", v: 34 },
  { label: "10a", v: 58 },
  { label: "11a", v: 82 },
  { label: "12p", v: 96 },
  { label: "1p", v: 71 },
  { label: "2p", v: 88 },
  { label: "3p", v: 94 },
  { label: "4p", v: 66 },
  { label: "5p", v: 41 },
  { label: "6p", v: 22 },
];

export const SESSION_POPULARITY = [
  { label: "Keynotes", v: 5031 },
  { label: "Workshops", v: 214 },
  { label: "Panels", v: 779 },
  { label: "Demos", v: 999 },
  { label: "Roundtables", v: 161 },
];

export const REGISTRATION_SPLIT = [
  { label: "Attendee", value: 68, color: "#6854d9" },
  { label: "Exhibitor", value: 19, color: "#0ea5e9" },
  { label: "Press", value: 7, color: "#f97316" },
  { label: "VIP / Speaker", value: 6, color: "#a855f7" },
];

export const LEAD_FUNNEL = [
  { label: "Badge Scans", v: 18420, pct: 100 },
  { label: "Qualified Leads", v: 11280, pct: 61 },
  { label: "Meetings Booked", v: 5240, pct: 28 },
  { label: "Proposals Sent", v: 2180, pct: 12 },
  { label: "Closed Won", v: 890, pct: 5 },
];

export const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const HEATMAP_HOURS = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];
export const HEATMAP_VALUES: number[][] = [
  [18, 34, 52, 61, 40, 55, 68, 49, 26],
  [26, 48, 71, 84, 58, 76, 89, 63, 34],
  [31, 58, 88, 96, 66, 84, 94, 71, 42],
  [28, 52, 79, 88, 61, 79, 90, 66, 38],
  [22, 41, 63, 72, 49, 62, 74, 52, 24],
];

export const ACTIVITY_FEED = [
  { id: 1, who: "Quantum Ledger", avatar: AVATARS[4], action: "submitted an exhibitor application for", target: "Global Tech Summit 2026", time: "4 min ago", tone: "info" as const },
  { id: 2, who: "You", avatar: AVATARS[0], action: "approved", target: "HelioGrid Energy", time: "18 min ago", tone: "success" as const },
  { id: 3, who: "CyberFortis", avatar: AVATARS[1], action: "reserved booth", target: "A-19", time: "1 hr ago", tone: "info" as const },
  { id: 4, who: "System", avatar: "", action: "published schedule update for", target: "Day 3 sessions", time: "2 hr ago", tone: "warn" as const },
  { id: 5, who: "TerraWool", avatar: AVATARS[3], action: "application rejected — documents missing for", target: "GreenBuild Expo", time: "5 hr ago", tone: "danger" as const },
  { id: 6, who: "Aurora Analytics", avatar: AVATARS[2], action: "uploaded 3 new product assets to", target: "booth A-04", time: "8 hr ago", tone: "info" as const },
];

export const MESSAGES = [
  { id: "m1", from: "EventSphere Organizing Team", avatar: "", subject: "Booth A-12 — power & rigging confirmation", preview: "Hi Amara, your 3-phase power request for booth A-12 has been approved. Rigging inspection is scheduled for 07:00 on 18 March.", date: "Today", unread: true, tag: "Operations" },
  { id: "m2", from: "Lumen Robotics", avatar: AVATARS[5], subject: "Collaboration on joint demo slot", preview: "We're in B-04, right across from you. Interested in co-hosting the autonomous QC demo at 15:00 on Day 2?", date: "Today", unread: true, tag: "Neighbour" },
  { id: "m3", from: "Vitalis MedTech", avatar: AVATARS[3], subject: "Shared storage for the demo rig", preview: "We have 6 sqm of spare storage if you need it for your crates. Happy to split the cost.", date: "Yesterday", unread: false, tag: "Neighbour" },
  { id: "m4", from: "Finance Department", avatar: "", subject: "Invoice #INV-2026-0412 paid", preview: "Payment of $12,000 received for Platinum island booth A-12. Receipt attached.", date: "2 days ago", unread: false, tag: "Billing" },
  { id: "m5", from: "CyberFortis", avatar: AVATARS[1], subject: "Joint press release draft", preview: "Draft attached — let me know if the messaging on the zero-trust OT section works for you.", date: "3 days ago", unread: false, tag: "Neighbour" },
];

export const NOTIFICATIONS = [
  { id: "n1", title: "Schedule change: SS-07 moved to 10:00", body: "Main Stage · Day 3", time: "12m", tone: "warn" as const },
  { id: "n2", title: "Your bookmarked session starts in 45 minutes", body: "Live Demo: Autonomous Quality Control", time: "1h", tone: "info" as const },
  { id: "n3", title: "3 new exhibitors matched your interests", body: "Robotics · Energy · Cybersecurity", time: "3h", tone: "success" as const },
  { id: "n4", title: "Booth B-04 neighbour posted a collaboration request", body: "Lumen Robotics", time: "6h", tone: "info" as const },
];

export const TESTIMONIALS = [
  { name: "Amara Osei", role: "VP Marketing, Nexora Cloud", avatar: AVATARS[0], quote: "We booked 214 qualified meetings in three days — the floor plan and lead routing are simply better than anything we've used.", stat: "214 meetings" },
  { name: "Jonas Brandt", role: "Head of Product, Lumen Robotics", avatar: AVATARS[5], quote: "Booth selection took eleven minutes. Our neighbour-matching feature alone generated two partnership deals.", stat: "2 partnerships" },
  { name: "Priya Nair", role: "Director, Orbital Freight", avatar: AVATARS[1], quote: "Real-time schedule sync meant zero no-shows across 38 sessions. The analytics dashboard paid for itself.", stat: "0 no-shows" },
];

export const PARTNERS = ["NEXORA", "LUMEN", "VITALIS", "CYBERFORTIS", "HELOGRID", "AURORA", "ORBITAL", "SYNTHWAVE"];

export const FEATURES = [
  { icon: "LayoutDashboard", title: "Unified Command Center", body: "One dashboard for every expo — revenue, booths, sessions, exhibitors and live footfall in a single view." },
  { icon: "Map", title: "Interactive Floor Plans", body: "Drag-to-allocate booths, see sold vs. available inventory live, and let exhibitors self-serve reserve space." },
  { icon: "ShieldCheck", title: "Role-Based Access", body: "Granular permissions for organizers, exhibitors and attendees with encrypted, GDPR-compliant storage." },
  { icon: "BarChart3", title: "Real-Time Analytics", body: "Booth traffic heatmaps, session popularity and lead funnels refreshed every 30 seconds." },
  { icon: "MessagesSquare", title: "Built-In Messaging", body: "Organizer-to-exhibitor threads plus neighbour-to-neighbour collaboration channels." },
  { icon: "CalendarClock", title: "Smart Scheduling", body: "Publish sessions, assign speakers and push instant updates to every bookmarked attendee." },
];

export const FAQS = [
  { q: "How long does it take to set up an expo?", a: "Most organizers publish a fully configured expo — floor plan, ticket tiers and schedule — in under 40 minutes. Import exhibitor lists via CSV or connect your CRM." },
  { q: "Can exhibitors choose their own booth?", a: "Yes. Exhibitors browse the live floor plan, filter by zone, size and price, then reserve instantly. You retain approval control before any space is locked." },
  { q: "Does the platform work on mobile?", a: "The entire interface is mobile-first and responsive, from the organizer dashboard down to the attendee schedule and bookmarked-session reminders." },
  { q: "How is data secured?", a: "Passwords are hashed and salted, all traffic runs over TLS 1.3, and access control is enforced per role. Data is encrypted at rest with automated daily backups." },
  { q: "Do you support accessibility standards?", a: "The interface targets WCAG 2.1 AA — keyboard navigation, semantic landmarks, focus management and sufficient colour contrast throughout." },
  { q: "Can I export analytics reports?", a: "Any chart or table can be exported to CSV, XLSX or PDF. Scheduled email digests are available for stakeholders." },
];

export const TICKETS = [
  { id: "t1", name: "Expo Day Pass", price: 149, unit: "per day", best: false, perks: ["Full access to all halls", "Digital floor plan & exhibitor search", "Complimentary keynote seating", "e-Badge with QR check-in"] },
  { id: "t2", name: "Full Access Pass", price: 349, unit: "all 4 days", best: true, perks: ["Everything in Day Pass", "All workshops & roundtables", "Session recordings for 12 months", "Priority demo-arena seating", "Lead-exchange networking lounge"] },
  { id: "t3", name: "Exhibitor Pack", price: 2600, unit: "per booth", best: false, perks: ["Island or peninsula booth space", "4 staff e-Badges", "Lead scanner with CRM export", "Neighbour collaboration channel", "Featured listing in the app"] },
];
