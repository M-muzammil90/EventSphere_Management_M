import { z } from "zod";

/* ------------------------------------------------------------------
   Shared primitives
   ------------------------------------------------------------------ */
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(160);
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid identifier");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const common = { email, objectId, password };

/* ------------------------------------------------------------------
   Auth
   ------------------------------------------------------------------ */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email,
    password,
    passwordConfirm: z.string(),
    role: z.enum(["exhibitor", "attendee"]).default("attendee"),
    phone: z.string().trim().max(32).optional(),
    jobTitle: z.string().trim().max(100).optional(),
    company: z.string().trim().max(140).optional(),
    // multipart/form-data delivers booleans as "true"/"false" strings
    consent: z.preprocess((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v),
      z.boolean().refine((v) => v === true, "You must accept the terms and privacy policy")),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(72),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    password,
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

/* ------------------------------------------------------------------
   Expo
   ------------------------------------------------------------------ */
/* base object (kept separate so .partial() stays available) */
const expoBase = z.object({
  title: z.string().trim().min(3).max(140),
  category: z.enum([
    "Technology", "Healthcare", "Manufacturing", "Automotive", "Retail",
    "Sustainability", "Food & Beverage", "Aerospace", "Education", "Other",
  ]),
  industry: z.string().trim().max(140).optional(),
  theme: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(3000),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  venue: z.object({
    name: z.string().trim().min(2).max(140),
    hall: z.string().trim().max(80).optional(),
    city: z.string().trim().min(2).max(80),
    country: z.string().trim().min(2).max(80),
    address: z.string().trim().max(200).optional(),
  }),
  tags: z.array(z.string().trim().max(40)).max(12).optional(),
  capacity: z.object({
    attendees: z.number().int().min(1).max(500000).optional(),
    exhibitors: z.number().int().min(1).max(20000).optional(),
    booths: z.number().int().min(1).max(5000).optional(),
  }).optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(["draft", "published", "live", "completed", "archived"]).optional(),
});

export const createExpoSchema = expoBase.refine((d) => d.endDate >= d.startDate, {
  message: "End date must be on or after the start date",
  path: ["endDate"],
});

export const updateExpoSchema = expoBase.partial().refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: "End date must be on or after the start date", path: ["endDate"] }
);

/* ------------------------------------------------------------------
   Booth
   ------------------------------------------------------------------ */
export const createBoothSchema = z.object({
  expo: objectId,
  boothId: z.string().trim().min(1).max(20),
  zone: z.enum(["A", "B", "C", "D", "E", "F"]),
  category: z.enum(["Small", "Medium", "Large", "Island"]),
  sqm: z.number().min(4).max(400),
  price: z.number().min(0).max(1000000),
  currency: z.string().trim().max(3).optional(),
  status: z.enum(["available", "reserved", "booked", "blocked"]).optional(),
  exhibitor: z.union([objectId, z.string().trim().max(140)]).optional().nullable(),
  amenities: z.array(z.string().trim().max(60)).max(15).optional(),
  notes: z.string().trim().max(500).optional(),
  position: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(),
  size: z.object({ w: z.number().min(2).max(100), h: z.number().min(2).max(100) }).optional(),
});

export const updateBoothSchema = createBoothSchema.partial().omit({ expo: true });

export const reserveBoothSchema = z.object({
  holdMinutes: z.number().int().min(5).max(1440).optional(),
  note: z.string().trim().max(500).optional(),
});

export const assignBoothSchema = z.object({
  exhibitor: z.union([objectId, z.string().trim().max(140)]).optional().nullable(),
  status: z.enum(["available", "reserved", "booked", "blocked"]).default("booked"),
  note: z.string().trim().max(500).optional(),
});

/* ------------------------------------------------------------------
   Registration
   ------------------------------------------------------------------ */
export const eventRegistrationSchema = z.object({
  expo: objectId,
  ticketType: z.enum(["General", "Standard", "VIP", "Workshop"]).default("Standard"),
  attendee: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    company: z.string().trim().max(140).optional(),
    jobTitle: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(32).optional(),
  }),
  consent: z.object({
    terms: z.preprocess((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v), z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) })),
    marketing: z.preprocess((v) => v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v, z.boolean().optional().default(false)),
    dataProcessing: z.preprocess((v) => (v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : v), z.literal(true, { errorMap: () => ({ message: "You must consent to data processing" }) })),
  }),
});

export const sessionRegistrationSchema = z.object({
  type: z.enum(["registered", "bookmarked"]).default("registered"),
});

/* ------------------------------------------------------------------
   Exhibitor
   ------------------------------------------------------------------ */
export const exhibitorProfileSchema = z.object({
  company: z.object({
    name: z.string().trim().min(2, "Company name must be at least 2 characters").max(140),
    registrationNo: z.string().trim().max(60).optional(),
    website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
    description: z.string().trim().max(2000).optional(),
  }),
  category: z.enum([
    "Cloud Infrastructure", "Industrial Automation", "Medical Devices", "Renewables",
    "Data & AI", "Cybersecurity", "Logistics", "Fintech & Payments", "Materials",
    "Consumer Electronics", "Other",
  ]),
  contact: z.object({
    primaryName: z.string().trim().max(100).optional(),
    email: email.optional().or(z.literal("")),
    phone: z.string().trim().max(32).optional(),
    country: z.string().trim().max(80).optional(),
  }),
  visibility: z.object({
    showBoothOnPlan: z.boolean().optional(),
    allowAttendeeChat: z.boolean().optional(),
    showEmailPublicly: z.boolean().optional(),
  }).optional(),
});

export const updateExhibitorProfileSchema = z.object({
  company: z.object({
    name: z.string().trim().min(2, "Company name must be at least 2 characters").max(140).optional(),
    registrationNo: z.string().trim().max(60).optional(),
    website: z.string().trim().url("Enter a valid URL").max(200).optional().or(z.literal("")),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
    description: z.string().trim().max(2000).optional(),
  }).optional(),
  category: z.enum([
    "Cloud Infrastructure", "Industrial Automation", "Medical Devices", "Renewables",
    "Data & AI", "Cybersecurity", "Logistics", "Fintech & Payments", "Materials",
    "Consumer Electronics", "Other",
  ]).optional(),
  contact: z.object({
    primaryName: z.string().trim().max(100).optional(),
    email: email.optional().or(z.literal("")),
    phone: z.string().trim().max(32).optional(),
    country: z.string().trim().max(80).optional(),
  }).optional(),
  products: z.array(z.any()).optional(),
  logo: z.any().optional(),
  visibility: z.object({
    showBoothOnPlan: z.boolean().optional(),
    allowAttendeeChat: z.boolean().optional(),
    showEmailPublicly: z.boolean().optional(),
  }).optional(),
});

/** `expo` arrives as a URL param, not in the body. */
export const applicationSchema = z.object({
  tier: z.enum(["Platinum", "Gold", "Silver", "Bronze"]).default("Silver"),
  requestedZone: z.enum(["A", "B", "C", "D", "E", "F"]).optional(),
  requestedCategory: z.enum(["Small", "Medium", "Large", "Island"]).optional(),
  showcaseSummary: z.string().trim().max(1500).optional(),
  boothQty: z.number().int().min(1).max(10).default(1),
});

export const reviewApplicationSchema = z.object({
  status: z.enum(["under_review", "approved", "rejected"]),
  booth: objectId.optional(),
  rejectionReason: z.string().trim().max(800).optional(),
  adminNotes: z.string().trim().max(1000).optional(),
  amountQuoted: z.number().min(0).optional(),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  role: z.string().trim().max(80).optional(),
  permissions: z.enum(["lead_scanner_full", "lead_scanner_only", "demo_only"]).optional(),
});

export const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  price: z.string().trim().max(60).optional(),
  isBeta: z.boolean().optional(),
});

/* ------------------------------------------------------------------
   Schedule
   ------------------------------------------------------------------ */
const sessionBase = z.object({
    expo: objectId,
    title: z.string().trim().min(4).max(200),
    description: z.string().trim().max(3000).optional(),
    type: z.enum(["Keynote", "Workshop", "Panel", "Demo", "Roundtable"]),
    track: z.string().trim().max(80).optional(),
    tags: z.array(z.string().trim().max(40)).max(10).optional(),
    speaker: z.object({
      name: z.string().trim().min(2).max(100),
      role: z.string().trim().max(140).optional(),
      company: z.string().trim().max(140).optional(),
      bio: z.string().trim().max(1200).optional(),
    }),
    date: z.coerce.date(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)"),
    stage: z.string().trim().min(2).max(80),
    capacity: z.number().int().min(1).max(20000),
    isPublished: z.boolean().optional(),
  });

export const createSessionSchema = sessionBase.refine((d) => d.endTime > d.startTime, {
  message: "End time must be after the start time",
  path: ["endTime"],
});

export const updateSessionSchema = sessionBase.partial().refine(
  (d) => !d.startTime || !d.endTime || d.endTime > d.startTime,
  { message: "End time must be after the start time", path: ["endTime"] }
);

/* ------------------------------------------------------------------
   Messaging / appointments / feedback
   ------------------------------------------------------------------ */
export const startConversationSchema = z.object({
  participants: z.array(objectId).min(1).max(10),
  subject: z.string().trim().max(200).optional(),
  relatedType: z.enum(["booth", "application", "support", "general", "neighbour"]).optional(),
  relatedId: objectId.optional(),
  expo: objectId.optional(),
  initialMessage: z.string().trim().min(1).max(4000).optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(4000),
});

export const createAppointmentSchema = z.object({
  expo: objectId,
  exhibitor: objectId.optional(),
  recipient: objectId.optional(),
  title: z.string().trim().max(160).optional(),
  date: z.coerce.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM"),
  durationMinutes: z.number().int().min(15).max(240).default(30),
  type: z.enum(["Meeting", "Demo", "Call", "Site visit"]).default("Meeting"),
  location: z.string().trim().max(160).optional(),
  agenda: z.string().trim().max(1500).optional(),
  initiatedBy: z.enum(["attendee", "exhibitor"]).default("attendee"),
});

export const respondAppointmentSchema = z.object({
  status: z.enum(["confirmed", "declined", "cancelled", "rescheduled"]),
  reason: z.string().trim().max(500).optional(),
  newDate: z.coerce.date().optional(),
  newStartTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

export const createFeedbackSchema = z.object({
  targetType: z.enum(["expo", "session", "exhibitor"]),
  expo: objectId.optional(),
  session: objectId.optional(),
  exhibitor: objectId.optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().min(10, "Please provide at least 10 characters").max(2000),
  category: z.enum(["Content", "Logistics", "Venue", "Technology", "Catering", "General"]).optional(),
  wouldRecommend: z.boolean().optional(),
});

export const replyFeedbackSchema = z.object({
  reply: z.string().trim().min(2).max(1500),
  status: z.enum(["new", "in_review", "resolved", "closed"]).optional(),
  assignedTo: z.string().trim().max(80).optional(),
});

/* ------------------------------------------------------------------
   Pricing / payments
   ------------------------------------------------------------------ */
export const boothPricingSchema = z.object({
  expo: objectId,
  category: z.enum(["Small", "Medium", "Large", "Island"]),
  sqm: z.number().int().min(4).max(400),
  basePrice: z.number().min(0),
  discountPercent: z.number().min(0).max(50).default(0),
  currency: z.string().trim().max(3).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
});

export const ticketPricingSchema = z.object({
  expo: objectId,
  name: z.enum(["General", "Standard", "VIP", "Workshop"]),
  price: z.number().min(0),
  capacity: z.number().int().min(1).max(200000),
  perks: z.array(z.string().trim().max(120)).max(12).optional(),
  description: z.string().trim().max(800).optional(),
  status: z.enum(["active", "draft", "sold_out", "archived"]).optional(),
});

export const pricingSettingSchema = z.object({
  currency: z.string().trim().max(3).optional(),
  taxRate: z.number().min(0).max(50).optional(),
  taxLabel: z.string().trim().max(20).optional(),
  earlyBirdEnabled: z.boolean().optional(),
  earlyBirdPercent: z.number().min(0).max(50).optional(),
  earlyBirdDeadline: z.coerce.date().optional(),
  multiBoothEnabled: z.boolean().optional(),
  multiBoothPercent: z.number().min(0).max(30).optional(),
  multiBoothMinQty: z.number().int().min(2).optional(),
  demoPaymentsEnabled: z.boolean().optional(),
});

export const quoteSchema = z.object({
  purpose: z.enum(["booth_reservation", "event_ticket", "workshop_addon", "sponsorship"]),
  expo: objectId,
  booth: objectId.optional(),
  ticketType: z.enum(["General", "Standard", "VIP", "Workshop"]).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  promoCode: z.string().trim().max(40).optional(),
});

export const confirmPaymentSchema = z.object({
  transactionRef: z.string().trim().min(4).max(80).optional(),
  note: z.string().trim().max(400).optional(),
});
