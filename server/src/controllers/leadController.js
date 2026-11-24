import Lead from "../models/Lead.js";
import ExhibitorProfile from "../models/ExhibitorProfile.js";
import { ApiError, ApiResponse, asyncHandler } from "../utils/ApiResponse.js";

/* ==================== GET EXHIBITOR LEADS ==================== */
export const getMyLeads = asyncHandler(async (req, res) => {
  let profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) {
    return ApiResponse.ok(res, []);
  }

  let leads = await Lead.find({ exhibitor: profile._id }).sort({ scannedAt: -1, createdAt: -1 });

  // If no leads exist yet, seed initial realistic leads for this exhibitor
  if (leads.length === 0) {
    const defaultLeads = [
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Elena Marsh",
        email: "elena.marsh@northwindretail.com",
        company: "Northwind Retail",
        jobTitle: "VP of Engineering",
        phone: "+1 415-555-0192",
        interest: "Cloud Infrastructure Core",
        score: 94,
        status: "Hot",
        notes: "Evaluated architecture on Day 2. Ready for enterprise POC agreement next week.",
        scannedAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Rahul Mehta",
        email: "r.mehta@vantagebank.com",
        company: "Vantage Bank",
        jobTitle: "Head of Infrastructure",
        phone: "+1 212-555-0841",
        interest: "Enterprise Observability",
        score: 88,
        status: "Hot",
        notes: "Requested compliance documentation and SOC2 audit reports.",
        scannedAt: new Date(Date.now() - 3600000 * 12),
      },
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Clara Oswald",
        email: "c.oswald@blueorbitlogistics.com",
        company: "BlueOrbit Logistics",
        jobTitle: "Solutions Architect",
        phone: "+44 20 7946 0912",
        interest: "Hybrid Cloud Framework",
        score: 76,
        status: "Warm",
        notes: "Looking to migrate multi-region logistics tracking system in Q2.",
        scannedAt: new Date(Date.now() - 3600000 * 24),
      },
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Tomás Silva",
        email: "t.silva@helixpharma.com",
        company: "Helix Pharma",
        jobTitle: "Director of Digital Systems",
        phone: "+34 91 123 4567",
        interest: "High-Availability Storage",
        score: 71,
        status: "Warm",
        notes: "Attended keynote demo. Wants technical benchmark presentation for C-suite.",
        scannedAt: new Date(Date.now() - 3600000 * 36),
      },
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Nina Bergström",
        email: "nina@arcticfreight.se",
        company: "Arctic Freight",
        jobTitle: "Procurement Lead",
        phone: "+46 8 123 4567",
        interest: "Disaster Recovery",
        score: 58,
        status: "Nurture",
        notes: "Exchanged badges during hall tour. Scheduled email follow-up.",
        scannedAt: new Date(Date.now() - 3600000 * 48),
      },
      {
        exhibitor: profile._id,
        user: req.user._id,
        name: "Omar Haddad",
        email: "o.haddad@zenithmedia.ae",
        company: "Zenith Media",
        jobTitle: "Tech Operations Manager",
        phone: "+971 4 321 0000",
        interest: "Global CDN",
        score: 46,
        status: "Nurture",
        notes: "Requested product one-pager and pricing guide.",
        scannedAt: new Date(Date.now() - 3600000 * 72),
      },
    ];

    leads = await Lead.insertMany(defaultLeads);
  }

  return ApiResponse.ok(res, leads);
});

/* ==================== CREATE / SCAN LEAD ==================== */
export const createLead = asyncHandler(async (req, res) => {
  let profile = await ExhibitorProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await ExhibitorProfile.create({
      user: req.user._id,
      company: { name: req.user.company || `${req.user.name}'s Organization` },
      category: "Other",
      contact: { primaryName: req.user.name, email: req.user.email },
    });
  }

  const { name, email, company, jobTitle, phone, interest, score, status, notes, expo } = req.body;
  if (!name || !email) {
    throw ApiError.badRequest("Lead name and email are required");
  }

  const lead = await Lead.create({
    exhibitor: profile._id,
    user: req.user._id,
    expo: expo || undefined,
    name,
    email,
    company: company || "Independent",
    jobTitle: jobTitle || "Lead",
    phone: phone || "",
    interest: interest || "General Solutions",
    score: Number(score) || 75,
    status: status || "Warm",
    notes: notes || "",
    scannedAt: new Date(),
  });

  // Increment profile leads count
  await ExhibitorProfile.findByIdAndUpdate(profile._id, { $inc: { "stats.leads": 1 } });

  return ApiResponse.created(res, lead, `Lead captured: ${lead.name} (${lead.company})`);
});

/* ==================== UPDATE LEAD ==================== */
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound("Lead not found");

  // Verify ownership
  if (String(lead.user) !== String(req.user._id) && req.user.role !== "admin") {
    throw ApiError.forbidden("You are not authorized to update this lead");
  }

  const allowedFields = ["name", "email", "company", "jobTitle", "phone", "interest", "score", "status", "notes"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      lead[field] = req.body[field];
    }
  });

  await lead.save();
  return ApiResponse.ok(res, lead, "Lead updated successfully");
});

/* ==================== DELETE LEAD ==================== */
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound("Lead not found");

  if (String(lead.user) !== String(req.user._id) && req.user.role !== "admin") {
    throw ApiError.forbidden("You are not authorized to delete this lead");
  }

  await Lead.findByIdAndDelete(req.params.id);
  return ApiResponse.ok(res, null, "Lead removed");
});

export default { getMyLeads, createLead, updateLead, deleteLead };
