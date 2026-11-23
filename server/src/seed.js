/* eslint-disable no-console */
/**
 * EventSphere database seeder
 * ====================================================================
 * Usage:
 *   npm run seed          # create the Admin + demo data (idempotent)
 *   npm run seed:fresh    # DROP the database first, then reseed
 *
 * SECURITY: the Admin account is created ONLY here or by an existing Admin
 * inside the dashboard. Public registration can never create one.
 * Change SEED_ADMIN_* in .env and rotate the password after first login.
 */
import "dotenv/config";
import mongoose from "mongoose";
import connectDB, { disconnectDB } from "./config/db.js";
import User from "./models/User.js";
import Expo from "./models/Expo.js";
import Booth from "./models/Booth.js";
import Session from "./models/Session.js";
import ExhibitorProfile from "./models/ExhibitorProfile.js";
import ExhibitorApplication from "./models/ExhibitorApplication.js";
import EventRegistration from "./models/EventRegistration.js";
import SessionRegistration from "./models/SessionRegistration.js";
import Appointment from "./models/Appointment.js";
import { Conversation, Message } from "./models/Message.js";
import Notification from "./models/Notification.js";
import Document from "./models/Document.js";
import { BoothPricing, TicketPricing, PricingSetting } from "./models/Pricing.js";
import Feedback from "./models/Feedback.js";
import Payment from "./models/Payment.js";

const FRESH = process.argv.includes("--fresh");
const AV = (i) => [
  "https://images.pexels.com/photos/6497112/pexels-photo-6497112.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/7752822/pexels-photo-7752822.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/7752805/pexels-photo-7752805.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/5649997/pexels-photo-5649997.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/33799456/pexels-photo-33799456.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
  "https://images.pexels.com/photos/14950779/pexels-photo-14950779.jpeg?auto=compress&cs=tinysrgb&dpr=1&h=200&w=200",
][i % 6];

const IMG = {
  tech: "https://images.pexels.com/photos/38041486/pexels-photo-38041486.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  trade: "https://images.pexels.com/photos/35138560/pexels-photo-35138560.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  industrial: "https://images.pexels.com/photos/36522033/pexels-photo-36522033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  auto: "https://images.pexels.com/photos/12712474/pexels-photo-12712474.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  center: "https://images.pexels.com/photos/19425033/pexels-photo-19425033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  signage: "https://images.pexels.com/photos/37439236/pexels-photo-37439236.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

const daysFromNow = (n) => new Date(Date.now() + n * 86400000);

/* ============================== SEEDERS ============================== */

async function seedUsers() {
  console.log("\n👤  Users…");

  /* ---- Admin (SECURITY: only created here) ---- */
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@eventsphere.io").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";

  const admin =
    (await User.findOne({ email: adminEmail })) ??
    (await User.create({
      name: process.env.SEED_ADMIN_NAME || "EventSphere Owner",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      jobTitle: "Founder & CEO",
      avatar: AV(0),
    }));
  console.log(`   ✔ Admin      : ${admin.email}  (role: ${admin.role})`);

  /* ---- Required test accounts (task spec) ---- */
  const testAdmin =
    (await User.findOne({ email: "admin@eventsphere.com" })) ??
    (await User.create({ name: "Admin User", email: "admin@eventsphere.com", password: "Admin@1234", role: "admin" }));
  console.log(`   ✔ Test Admin : ${testAdmin.email}`);

  const testExhibitorUser =
    (await User.findOne({ email: "exhibitor@eventsphere.com" })) ??
    (await User.create({ name: "Test Exhibitor", email: "exhibitor@eventsphere.com", password: "Exhibitor@1234", role: "exhibitor", jobTitle: "Test Company Ltd" }));
  await ExhibitorProfile.findOneAndUpdate(
    { user: testExhibitorUser._id },
    {
      user: testExhibitorUser._id,
      company: { name: "Test Company Ltd", description: "Test exhibitor account for EventSphere." },
      category: "Other",
      contact: { primaryName: "Test Exhibitor", email: "exhibitor@eventsphere.com" },
      verificationStatus: "verified",
    },
    { upsert: true, new: true }
  );
  console.log(`   ✔ Test Exhibitor: ${testExhibitorUser.email}`);

  const testAttendee =
    (await User.findOne({ email: "attendee@eventsphere.com" })) ??
    (await User.create({ name: "Test Attendee", email: "attendee@eventsphere.com", password: "Attendee@1234", role: "attendee" }));
  console.log(`   ✔ Test Attendee: ${testAttendee.email}`);

  /* ---- Organizer staff ---- */
  const organizerEmails = ["sarah.whitfield@eventsphere.io", "marcus.reid@eventsphere.io"];
  const organizers = [];
  for (const [i, email] of organizerEmails.entries()) {
    const u =
      (await User.findOne({ email })) ??
      (await User.create({
        name: ["Sarah Whitfield", "Marcus Reid"][i],
        email, password: "Organizer!2026", role: "organizer",
        jobTitle: ["Head of Events", "Head of Product"][i], avatar: AV(i + 1),
      }));
    organizers.push(u);
    console.log(`   ✔ Organizer  : ${u.email}`);
  }

  /* ---- Exhibitors ---- */
  const exSpecs = [
    ["Amara Osei", "amara@nexoracloud.com", "Nexora Cloud", "Cloud Infrastructure", "Platinum", "United States"],
    ["Jonas Brandt", "jonas@lumenrobotics.com", "Lumen Robotics", "Industrial Automation", "Platinum", "Germany"],
    ["Sofia Marchetti", "sofia@vitalismedtech.com", "Vitalis MedTech", "Medical Devices", "Gold", "Switzerland"],
    ["Wei Lin Tan", "wei@quantumledger.com", "Quantum Ledger", "Fintech & Payments", "Silver", "Singapore"],
    ["Daan Vos", "daan@heliogrid.com", "HelioGrid Energy", "Renewables", "Gold", "Netherlands"],
    ["Noa Barak", "noa@cyberfortis.com", "CyberFortis", "Cybersecurity", "Platinum", "Israel"],
  ];
  const exhibitorUsers = [];
  for (const [i, [name, email, company, category, tier, country]] of exSpecs.entries()) {
    const u =
      (await User.findOne({ email })) ??
      (await User.create({ name, email, password: "Exhibitor!2026", role: "exhibitor", avatar: AV(i + 2) }));

    await ExhibitorProfile.findOneAndUpdate(
      { user: u._id },
      {
        user: u._id,
        company: {
          name: company,
          website: `https://${company.toLowerCase().replace(/\s+/g, "")}.com`,
          description: `${company} builds ${category.toLowerCase()} solutions for enterprise teams, demonstrated live at every edition.`,
        },
        category, tier,
        contact: { primaryName: name, email, country },
        verificationStatus: "verified",
        rating: [4.9, 4.7, 4.8, 4.3, 4.6, 4.9][i],
        stats: { traffic: [4820, 3910, 3120, 840, 2680, 4310][i], leads: [2940, 2380, 1900, 510, 1630, 2630][i], revenue: [128000, 96500, 88000, 0, 61000, 112000][i] },
        products: [
          { name: `${category} Core Platform`, description: "Primary product, demonstrated on-booth.", price: "From $2,400 / mo" },
          { name: "Managed Service Tier", description: "Fully managed operations with SLA.", price: "Usage based" },
        ],
        staff: [
          { name, email, role: "Booth Lead", permissions: "lead_scanner_full", badgeIssued: true, avatar: AV(i + 2) },
          { name: "Daniel Cho", email: `daniel.${i}@${company.toLowerCase().replace(/\s+/g, "")}.com`, role: "Sales Engineer", permissions: "lead_scanner_only", badgeIssued: true },
        ],
      },
      { upsert: true, new: true }
    );
    exhibitorUsers.push(u);
    console.log(`   ✔ Exhibitor  : ${u.email}  (${company})`);
  }

  /* ---- Attendees ---- */
  const attSpecs = [
    ["Elena Marsh", "elena@northwindretail.com", "Northwind Retail", "United Kingdom"],
    ["Rahul Mehta", "rahul@vantagebank.com", "Vantage Bank", "India"],
    ["Clara Oswald", "clara@blueorbit.com", "BlueOrbit Logistics", "Sweden"],
    ["Tomás Silva", "tomas@helixpharma.com", "Helix Pharma", "Portugal"],
    ["Nina Bergström", "nina@arcticfreight.com", "Arctic Freight", "Norway"],
    ["Omar Haddad", "omar@zenithmedia.com", "Zenith Media", "Jordan"],
    ["Yuki Tanaka", "yuki@sakurasystems.com", "Sakura Systems", "Japan"],
    ["Grace Njeri", "grace@savannatelecom.com", "Savanna Telecom", "Kenya"],
  ];
  const attendees = [];
  for (const [i, [name, email, company, country]] of attSpecs.entries()) {
    const u =
      (await User.findOne({ email })) ??
      (await User.create({
        name, email, password: "Attendee!2026", role: "attendee",
        jobTitle: ["Head of Digital", "VP Infrastructure", "Ops Director", "IT Manager", "CTO", "Producer", "Engineer", "Product Lead"][i],
        avatar: AV(i), address: { country },
        preferences: { marketing: i % 3 === 0, dataSharing: false },
      }));
    attendees.push(u);
  }
  console.log(`   ✔ Attendees  : ${attendees.length} accounts`);

  return { admin, organizers, exhibitorUsers, attendees };
}

async function seedExpos(owner) {
  console.log("\n🎪  Expos…");
  const specs = [
    ["Global Tech Summit 2026", "Technology", "SaaS · AI · Cloud", IMG.tech, "Dubai, UAE", "Dubai World Trade Centre — Hall 4", 26, 30, "published", true],
    ["MedExpo International", "Healthcare", "MedTech · Pharma", IMG.trade, "Singapore", "Marina Bay Sands Expo — Level 1", 48, 51, "published", true],
    ["Industrial Innovate Fair", "Manufacturing", "Robotics · Automation", IMG.industrial, "Munich, Germany", "Messe München — Hall B2", -4, 0, "live", true],
    ["AutoVision Expo", "Automotive", "EV · Mobility", IMG.auto, "Tokyo, Japan", "Tokyo Big Sight — East Hall", 78, 82, "published", false],
    ["Retail & Commerce Week", "Retail", "POS · Payments", IMG.signage, "London, UK", "ExCeL London — North Hall", 108, 111, "draft", false],
  ];

  const expos = [];
  for (const [i, [title, category, industry, banner, city, venue, s, e, status, featured]] of specs.entries()) {
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
    const expo =
      (await Expo.findOne({ slug })) ??
      (await Expo.create({
        title, slug, category, industry, theme: ["Intelligence at Scale", "Precision Care", "Factory of the Future", "Electric Everything", "Frictionless Commerce"][i],
        description: `${title} brings together leading ${industry.split(" · ").join(" and ").toLowerCase()} companies for four days of keynotes, hands-on labs and live demonstrations. Every booth, session and badge is managed live on EventSphere.`,
        startDate: daysFromNow(s), endDate: daysFromNow(e),
        venue: { name: venue.split(" — ")[0], hall: venue.split(" — ")[1] ?? "Hall 1", city: city.includes(", ") ? city.split(", ")[0] : city, country: city.includes(", ") ? city.split(", ")[1] : city, address: venue },
        banner: { url: banner },
        tags: industry.split(" · ").map((t) => t.toLowerCase()),
        status, isFeatured: featured,
        capacity: { attendees: [18420, 12750, 9310, 22100, 8420][i], exhibitors: [486, 342, 268, 510, 214][i], booths: [520, 400, 320, 600, 280][i] },
        organizer: owner._id,
        publishedAt: status === "draft" ? undefined : new Date(),
      }));
    expos.push(expo);
    console.log(`   ✔ ${expo.title} (${expo.status})`);
  }
  return expos;
}

async function seedPricing(expos) {
  console.log("\n💰  Pricing…");
  const CAT = [["Small", 12, 2600], ["Medium", 30, 5600], ["Large", 48, 8400], ["Island", 72, 12000]];

  for (const [i, expo] of expos.entries()) {
    for (const [category, sqm, base] of CAT) {
      const discount = i === 0 && category === "Island" ? 10 : 0;
      await BoothPricing.findOneAndUpdate(
        { expo: expo._id, category },
        { expo: expo._id, category, sqm, basePrice: base, discountPercent: discount, effectivePrice: Math.round(base * (1 - discount / 100)), currency: "USD", status: "active" },
        { upsert: true, new: true }
      );
    }

    for (const [name, price, cap] of [["General", 49, 4000], ["Standard", 149, 2500], ["VIP", 349, 400], ["Workshop", 120, 120]]) {
      await TicketPricing.findOneAndUpdate(
        { expo: expo._id, name },
        { expo: expo._id, name, price, capacity: cap, soldCount: i === 0 ? [3120, 1841, 388, 118][["General", "Standard", "VIP", "Workshop"].indexOf(name)] : 0, currency: "USD", status: "active",
          perks: ["Hall access", "All halls + keynote seating", "Everything + workshops + recordings", "Single hands-on lab"][["General", "Standard", "VIP", "Workshop"].indexOf(name)] },
        { upsert: true, new: true }
      );
    }

    await PricingSetting.findOneAndUpdate(
      { expo: expo._id },
      { expo: expo._id, currency: "USD", taxRate: [5, 8, 19, 10, 20][i], taxLabel: "VAT", earlyBirdEnabled: i < 3, earlyBirdPercent: [10, 15, 5][i] ?? 0, multiBoothEnabled: i % 2 === 0, multiBoothPercent: 8, demoPaymentsEnabled: true },
      { upsert: true, new: true }
    );
  }
  console.log(`   ✔ ${expos.length} expos × 4 booth categories + 4 ticket types + settings`);
}

async function seedBooths(expos, exhibitorUsers) {
  console.log("\n🗺️  Booths & floor plan…");
  let total = 0;

  for (const [ei, expo] of expos.entries()) {
    // skip if booths already exist
    if (await Booth.countDocuments({ expo: expo._id })) { total += await Booth.countDocuments({ expo: expo._id }); continue; }

    const docs = [];
    const zones = ["A", "B", "C", "D"];
    let n = 1;

    for (const [zi, zone] of zones.entries()) {
      const rows = 8;
      for (let r = 0; r < rows; r++) {
        const isIsland = zi === 0 && r === 0;
        const isLarge = r === 1;
        const category = isIsland ? "Island" : isLarge ? "Large" : r % 3 === 0 ? "Medium" : "Small";
        const sqm = { Small: 12, Medium: 30, Large: 48, Island: 72 }[category];
        const price = { Small: 2600, Medium: 5600, Large: 8400, Island: 12000 }[category] + ei * 250;

        // assign the first booths to our seeded exhibitors
        const owner = (zi === 0 && r < exhibitorUsers.length) ? exhibitorUsers[r] : null;
        const status = owner ? "booked" : (n % 11 === 0 ? "blocked" : "available");

        const profile = owner ? await ExhibitorProfile.findOne({ user: owner._id }) : null;

        docs.push({
          expo: expo._id, boothId: `${zone}-${n}`, zone, category, sqm, price, currency: "USD",
          status,
          exhibitor: profile?._id ?? null,
          bookedAt: status === "booked" ? new Date() : undefined,
          position: { x: 4 + zi * 24, y: 4 + r * 12 },
          size: { w: category === "Island" ? 22 : category === "Large" ? 18 : 14, h: category === "Island" ? 22 : category === "Large" ? 20 : 14 },
          amenities: ["3-phase power", "Wi-Fi", "1 table", "2 chairs"],
        });
        n++;
      }
    }

    await Booth.insertMany(docs, { ordered: false });
    total += docs.length;
    console.log(`   ✔ ${expo.title}: ${docs.length} booths across 4 zones`);
  }
  console.log(`   Total booths: ${total}`);
}

async function seedSessions(expos, exhibitorUsers) {
  console.log("\n🎤  Sessions…");
  if (await Session.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const SPEAKERS = [
    ["Dr. Elena Vance", "CTO", "Nexora Cloud"],
    ["Marcus Reid", "Principal ML", "Aurora Analytics"],
    ["Wei Lin Tan", "CEO", "Quantum Ledger"],
    ["Jonas Brandt", "Head of Product", "Lumen Robotics"],
    ["Noa Barak", "VP Security", "CyberFortis"],
    ["Priya Nair", "Director", "Orbital Freight"],
    ["Daan Vos", "Founder", "HelioGrid Energy"],
    ["Kenji Sato", "Design Lead", "Synthwave Audio"],
  ];
  const STAGES = ["Main Stage", "Forum A", "Forum B", "Lab 1", "Lab 2", "Demo Arena"];
  const TYPES = ["Keynote", "Workshop", "Panel", "Demo", "Roundtable"];
  const TRACKS = ["Vision", "Engineering", "Infrastructure", "Automation", "Security", "Commerce", "Governance", "Energy", "Foresight"];

  let count = 0;
  for (const [ei, expo] of expos.slice(0, 3).entries()) {
    for (let d = 0; d < 4; d++) {
      const dayDate = new Date(expo.startDate);
      dayDate.setDate(dayDate.getDate() + d);

      for (let s = 0; s < 3; s++) {
        const idx = (ei * 12 + d * 3 + s) % SPEAKERS.length;
        const [name, role, company] = SPEAKERS[idx];
        const type = TYPES[(d + s) % TYPES.length];
        const startH = 9 + s * 3;
        const capacity = type === "Keynote" ? 3000 : type === "Workshop" ? 120 : type === "Roundtable" ? 90 : type === "Demo" ? 600 : 450;

        await Session.create({
          expo: expo._id,
          title: `${type}: ${["Intelligence at Scale", "Ship a RAG Pipeline", "Economics of Edge Compute", "Autonomous Quality Control", "Zero Trust for OT Networks", "Designing Cashless Venues"][s % 6]}${d > 0 ? ` — Day ${d + 1}` : ""}`,
          description: `A ${type.toLowerCase()} covering practical implementation, real trade-offs and a live demonstration. Led by ${name} (${role}, ${company}).`,
          type,
          track: TRACKS[(d + s) % TRACKS.length],
          tags: ["ai", "cloud", "security"].slice(0, (s % 3) + 1),
          speaker: { name, role, company, avatar: AV(idx), bio: `${name} has led ${company}'s technical strategy for over a decade.` },
          date: dayDate,
          startTime: `${String(startH).padStart(2, "0")}:00`,
          endTime: `${String(startH + (type === "Workshop" ? 2 : 1)).padStart(2, "0")}:00`,
          stage: STAGES[(d + s) % STAGES.length],
          capacity,
          registeredCount: Math.floor(capacity * (0.55 + ((d + s) % 4) * 0.12)),
          isPublished: true,
        });
        count++;
      }
    }
  }
  console.log(`   ✔ ${count} sessions across ${Math.min(3, expos.length)} expos`);
}

async function seedRegistrations(expos, attendees) {
  console.log("\n🎟️  Event registrations…");
  if (await EventRegistration.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const TYPES = ["General", "Standard", "VIP", "Workshop"];
  let count = 0;

  for (const expo of expos.slice(0, 3)) {
    for (const [i, user] of attendees.entries()) {
      const ticketType = TYPES[i % TYPES.length];
      const price = { General: 49, Standard: 149, VIP: 349, Workshop: 120 }[ticketType];
      const subtotal = price;
      const tax = Math.round(subtotal * 0.05 * 100) / 100;

      await EventRegistration.create({
        expo: expo._id, user: user._id, ticketType,
        status: i % 7 === 6 ? "waitlisted" : i % 5 === 4 ? "attended" : "confirmed",
        attendeeSnapshot: { name: user.name, email: user.email, company: user.jobTitle, jobTitle: user.jobTitle, phone: user.phone },
        pricing: { unitPrice: price, quantity: 1, discount: 0, taxRate: 5, subtotal, taxAmount: tax, total: subtotal + tax, currency: "USD" },
        consent: { terms: true, marketing: i % 3 === 0, dataProcessing: true },
        checkedInAt: i % 5 === 4 ? new Date() : undefined,
      });
      count++;
    }
  }
  console.log(`   ✔ ${count} registrations`);
}

async function seedApplications(expos, exhibitorUsers) {
  console.log("\n📋  Exhibitor applications…");
  if (await ExhibitorApplication.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  for (const [i, expo] of expos.entries()) {
    for (const [j, user] of exhibitorUsers.slice(0, 4).entries()) {
      const profile = await ExhibitorProfile.findOne({ user: user._id });
      if (!profile) continue;
      if (await ExhibitorApplication.findOne({ expo: expo._id, exhibitor: profile._id })) continue;

      const booth = await Booth.findOne({ expo: expo._id, exhibitor: profile._id });
      const status = booth ? "approved" : i === 4 ? "pending" : j === 3 ? "rejected" : "pending";

      await ExhibitorApplication.create({
        expo: expo._id, exhibitor: profile._id, user: user._id,
        status,
        tier: profile.tier,
        requestedZone: ["A", "B", "C", "D"][j],
        requestedCategory: ["Island", "Large", "Medium", "Small"][j],
        showcaseSummary: `${profile.company.name} will demo ${profile.products.length} products with ${profile.staff.length} staff on-booth.`,
        boothQty: 1,
        booth: booth?._id ?? null,
        boothLabel: booth?.boothId ?? null,
        amountQuoted: booth?.price ?? 0,
        reviewedBy: status === "approved" ? (await User.findOne({ role: "admin" }))?._id : undefined,
        reviewedAt: status === "approved" ? new Date() : undefined,
        rejectionReason: status === "rejected" ? "Risk assessment did not cover the proposed mezzanine build." : undefined,
        submittedAt: daysFromNow(-(60 - i * 10 - j)),
      });
    }
  }
  console.log(`   ✔ applications across ${expos.length} expos`);
}

async function seedDocuments(exhibitorUsers) {
  console.log("\n📄  Exhibitor documents…");
  if (await Document.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const TYPES = ["certificate_of_incorporation", "public_liability_insurance", "product_liability_waiver", "booth_build_risk_assessment", "electrical_certificate"];

  for (const user of exhibitorUsers) {
    const profile = await ExhibitorProfile.findOne({ user: user._id });
    if (!profile) continue;

    for (const [i, docType] of TYPES.entries()) {
      await Document.create({
        owner: user._id, exhibitor: profile._id, docType,
        filename: `${docType}.pdf`,
        originalName: `${profile.company.name.toLowerCase().replace(/\s+/g, "-")}-${docType}.pdf`,
        storage: "local",
        url: `/uploads/documents/${docType}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 400000 + i * 120000,
        status: "verified",
        verifiedBy: (await User.findOne({ role: "admin" }))?._id,
        verifiedAt: daysFromNow(-30 + i),
        isPrivate: true,
      });
    }
  }
  console.log(`   ✔ ${TYPES.length} documents × ${exhibitorUsers.length} exhibitors`);
}

async function seedAppointments(expos, attendees, exhibitorUsers) {
  console.log("\n📅  Appointments…");
  if (await Appointment.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const TYPES = ["Meeting", "Demo", "Call", "Site visit"];
  const expo = expos[0];

  for (const [i, attendee] of attendees.entries()) {
    const exUser = exhibitorUsers[i % exhibitorUsers.length];
    const profile = await ExhibitorProfile.findOne({ user: exUser._id });
    const date = new Date(expo.startDate);
    date.setDate(date.getDate() + (i % 3));

    await Appointment.create({
      expo: expo._id,
      requester: attendee._id,
      exhibitor: profile._id,
      recipient: exUser._id,
      title: `${TYPES[i % TYPES.length]} with ${profile.company.name}`,
      date,
      startTime: `${String(9 + (i % 7)).padStart(2, "0")}:00`,
      durationMinutes: [30, 45, 30, 60][i % 4],
      type: TYPES[i % TYPES.length],
      location: i % 2 ? "Networking Lounge" : `Booth ${profile.tier} meeting pod`,
      agenda: "Walkthrough of the platform for a regulated environment.",
      status: ["confirmed", "pending", "confirmed", "completed", "cancelled", "pending", "confirmed", "pending"][i],
      initiatedBy: i % 3 === 0 ? "exhibitor" : "attendee",
    });
  }
  console.log(`   ✔ ${attendees.length} appointments`);
}

async function seedConversations(users) {
  console.log("\n💬  Conversations…");
  if (await Conversation.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const { admin, exhibitorUsers, attendees } = users;
  const threads = [
    [admin, exhibitorUsers[0], "Booth A-1 — power & rigging confirmation", [
      [admin, "Hi Amara, your 3-phase power request for your booth has been approved. Rigging inspection is at 07:00 on build-up day."],
      [exhibitorUsers[0], "That's great news. Could you confirm the rigging load limit so we can finalise the truss design?"],
      [admin, "Load limit is 500 kg per point with a maximum of four points on your island. I've attached the technical pack."],
    ]],
    [exhibitorUsers[1], exhibitorUsers[0], "Collaboration on joint demo slot", [
      [exhibitorUsers[1], "We're right across from you. Interested in co-hosting the autonomous QC demo at 15:00 on Day 2?"],
      [exhibitorUsers[0], "Definitely interested — what would you need from our side?"],
    ]],
    [attendees[0], exhibitorUsers[0], "Meeting request — multi-region compliance", [
      [attendees[0], "Hi, I'd like to understand your EU data residency options for a regulated environment."],
      [exhibitorUsers[0], "Happy to walk you through it — shall we book 30 minutes at the booth on Day 2?"],
    ]],
  ];

  for (const [a, b, subject, msgs] of threads) {
    const conversation = await Conversation.create({
      participants: [a._id, b._id],
      subject,
      lastMessage: msgs[msgs.length - 1][1].slice(0, 200),
      lastMessageAt: new Date(),
      lastSender: msgs[msgs.length - 1][0]._id,
      status: "active",
      readState: [
        { user: a._id, unread: 0, lastReadAt: new Date() },
        { user: b._id, unread: 1 },
      ],
    });

    for (const [sender, text] of msgs) {
      await Message.create({
        conversation: conversation._id, sender: sender._id, body: text,
        readBy: [sender._id], createdAt: new Date(Date.now() - Math.random() * 86400000),
      });
    }
  }
  console.log(`   ✔ ${threads.length} conversations with message history`);
}

async function seedFeedback(expos, attendees, exhibitorUsers) {
  console.log("\n⭐  Feedback…");
  if (await Feedback.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const SAMPLES = [
    [5, "Best keynote I've attended in years", "No vendor fluff at all — the live demo was the highlight of my week.", "Content"],
    [3, "Wi-Fi buckled at peak", "Between 12:00 and 13:00 the wireless was unusable and we lost roughly 30 scans.", "Technology"],
    [4, "Great content, room too small", "Excellent workshop with runnable code, but 120 seats is too few for a session this popular.", "Logistics"],
    [5, "Incredibly knowledgeable booth staff", "Came with a hard compliance question and left with a documented answer.", "Content"],
    [2, "Food queues were 40 minutes", "Only nine vendors for 9,000 people at peak — we lost most of the lunch window.", "Catering"],
    [4, "The floor plan app saved me hours", "Filtering exhibitors and seeing live availability meant I walked in with a plan.", "Technology"],
    [5, "Best lead follow-up of the expo", "They sent a tailored architecture review 48 hours after we spoke.", "Content"],
  ];

  for (const [i, [rating, title, body, category]] of SAMPLES.entries()) {
    const author = attendees[i % attendees.length];
    const type = ["expo", "session", "exhibitor"][i % 3];

    await Feedback.create({
      author: author._id,
      targetType: type,
      expo: type === "expo" ? expos[0]._id : undefined,
      exhibitor: type === "exhibitor" ? (await ExhibitorProfile.findOne({ user: exhibitorUsers[0]._id }))._id : undefined,
      targetLabel: type === "expo" ? expos[0].title : type === "exhibitor" ? "Nexora Cloud" : "Opening Keynote",
      rating, title, body, category,
      status: ["new", "in_review", "resolved", "closed"][i % 4],
      wouldRecommend: rating >= 4,
      ...(i < 3 ? { reply: "Thank you for the detailed feedback — we've passed this to the relevant team.", repliedBy: (await User.findOne({ role: "admin" }))._id, repliedAt: daysFromNow(-2) } : {}),
    });
  }
  console.log(`   ✔ ${SAMPLES.length} feedback entries with replies`);
}

async function seedPayments(expos, attendees) {
  console.log("\n💳  Payments…");
  if (await Payment.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  for (const [i, user] of attendees.slice(0, 5).entries()) {
    const price = [49, 149, 349, 120, 149][i];
    const tax = Math.round(price * 0.05 * 100) / 100;

    await Payment.create({
      user: user._id,
      purpose: "event_ticket",
      expo: expos[0]._id,
      items: [{ description: "Standard ticket", quantity: 1, unitPrice: price, amount: price }],
      subtotal: price, discountTotal: 0, taxRate: 5, taxAmount: tax,
      total: price + tax, currency: "USD",
      status: "paid", mode: "demo", gateway: "demo", gatewayVerified: false,
      transactionRef: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      paidAt: daysFromNow(-10 + i),
    });
  }
  console.log(`   ✔ 5 demo payments (gatewayVerified: false by design)`);
}

async function seedNotifications(users) {
  console.log("\n🔔  Notifications…");
  if (await Notification.countDocuments({})) { console.log("   ↷ already seeded"); return; }

  const { attendees, exhibitorUsers, admin } = users;

  await Notification.insertMany([
    ...attendees.slice(0, 4).map((u, i) => ({
      recipient: u._id, type: ["registration_confirmed", "schedule_change", "session_reminder", "appointment_update"][i],
      title: ["You're registered for Global Tech Summit 2026", "Schedule update: keynote moved to 10:00", "Your session starts in 45 minutes", "Appointment confirmed"][i],
      body: ["Your Standard pass is confirmed.", "Main Stage · Day 3", "Live Demo: Autonomous Quality Control", "Booth meeting at 11:00"][i],
      link: "/attendee", read: i > 1, readAt: i > 1 ? new Date() : undefined, deliveredAt: new Date(),
    })),
    ...exhibitorUsers.slice(0, 3).map((u, i) => ({
      recipient: u._id, type: ["application_approved", "booth_allocated", "new_message"][i],
      title: ["Your application was approved", "Booth allocated", "New message from EventSphere"][i],
      body: ["Booth A-1 has been allocated to you.", "Your booth is confirmed.", "Re: rigging confirmation"][i],
      link: "/portal", read: false, priority: "high", deliveredAt: new Date(),
    })),
    { recipient: admin._id, type: "system", title: "3 applications awaiting review", body: "Quantum Ledger, Orbital Freight and Synthwave Audio are pending.", link: "/admin/exhibitors", read: false, priority: "high", deliveredAt: new Date() },
  ]);

  console.log(`   ✔ notifications for attendees, exhibitors and admin`);
}

/* ================================ MAIN ============================== */
async function seed() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  EventSphere — database seeder");
  console.log(`  Database : ${mongoose.connection.name}`);
  console.log(`  Mode     : ${FRESH ? "FRESH (drop + reseed)" : "idempotent"}`);
  console.log("═══════════════════════════════════════════════════════════");

  await connectDB();

  if (FRESH) {
    console.warn("\n⚠  Dropping database…");
    await mongoose.connection.dropDatabase();
    console.log("   ✔ dropped");
  }

  const users = await seedUsers();
  const expos = await seedExpos(users.admin);
  await seedPricing(expos);
  await seedBooths(expos, users.exhibitorUsers);
  await seedSessions(expos, users.exhibitorUsers);
  await seedRegistrations(expos, users.attendees);
  await seedApplications(expos, users.exhibitorUsers);
  await seedDocuments(users.exhibitorUsers);
  await seedAppointments(expos, users.attendees, users.exhibitorUsers);
  await seedConversations(users);
  await seedFeedback(expos, users.attendees, users.exhibitorUsers);
  await seedPayments(expos, users.attendees);
  await seedNotifications(users);

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  ✅  SEED COMPLETE");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n  DEMO LOGIN CREDENTIALS");
  console.log("  ─────────────────────────────────────────────────────────");
  console.log(`  Admin      : ${(process.env.SEED_ADMIN_EMAIL || "admin@eventsphere.io")} / ${(process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026")}`);
  console.log("  Organizer  : sarah.whitfield@eventsphere.io / Organizer!2026");
  console.log("  Exhibitor  : amara@nexoracloud.com / Exhibitor!2026");
  console.log("  Attendee   : elena@northwindretail.com / Attendee!2026");
  console.log("\n  ⚠  Rotate the admin password immediately after first login.");
  console.log("═══════════════════════════════════════════════════════════\n");
}

seed()
  .catch((err) => {
    console.error("\n✖ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
    process.exit(process.exitCode ?? 0);
  });
