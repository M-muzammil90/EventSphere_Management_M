# EventSphere — Phase 1: Requirements Analysis

## 1. Existing Project Inventory (INSPECTED)

### Technology found
| Layer | Package | Status |
|---|---|---|
| UI | React 19 + TypeScript | ✅ Present |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) | ✅ Present |
| Routing | react-router-dom 7 | ✅ Present |
| Animation | framer-motion 14 | ✅ Present |
| Icons | lucide-react | ✅ Present |
| Build | Vite 7 + `vite-plugin-singlefile` | ✅ Present |

### Palette (already applied, verified in compiled CSS)
`#171C35` primary · `#6854D9` secondary · `#8B72EE` accent · `#F5F6FA` bg ·
`#FFFFFF` surface · `#20243A` text · `#777E91` muted · success `#16A36A` ·
warning `#F2A93B` · danger `#E05252`

### Existing pages (37 source files, 14,380 lines)
**Public (12):** Home, Explore Expos, Expo Details, Exhibitor Directory,
Exhibitor Profile, Event Schedule, Expo Floor Plan, About Us, Contact Us, Pricing, Support

**Auth (1 file, 3 modes):** Login, Register, Forgot Password

**Admin (11):** Overview, Expo Mgmt, Exhibitor Mgmt, Attendee Mgmt, Feedback Mgmt,
Schedule Mgmt, Floor Plan Editor, Analytics & Reports, Messages, Settings

**Exhibitor Portal (10 tabs):** Overview, Expo Applications, Booth & Floor Plan,
Leads, Appointments, Documents, Company Profile, Staff & Badges, Messages, Settings

**Attendee Dashboard (8 tabs):** Overview, My Agenda, Appointments, Feedback,
Exhibitor Search, Event Registration, Alerts, My Tickets

**Shared components:** `ui.tsx` (20 primitives), `kit.tsx` (pagination, skeletons,
confirm dialogs, dropdowns, notifications), `charts.tsx` (12 hand-built SVG charts),
`PortalLayout.tsx`, `AdminLayout.tsx`, `FloorPlanPreview.tsx`, `SiteLayout.tsx`

---

## 2. Gap Analysis

### Frontend gaps (must fix before backend)
| # | Gap | Severity |
|---|---|---|
| F-1 | **Reset Password page missing** (token-based) | HIGH |
| F-2 | **Admin Pricing Management page missing** | HIGH |
| F-3 | No API layer / Axios client | HIGH (blocks integration) |
| F-4 | No React Hook Form / Zod validation | MEDIUM |
| F-5 | No Recharts (custom SVG charts exist) | LOW — acceptable substitute |
| F-6 | No Socket.IO client | MEDIUM (real-time) |
| F-7 | Public registration allows selecting Admin role | **SECURITY** |
| F-8 | Data is mock-only (`lib/data.ts`, `lib/mock.ts`) | HIGH |

### Backend gaps (nothing exists)
All of Part 4/5/6/7/9 must be built from zero.

---

## 3. Functional Requirements Checklist

### A. Authentication (Part 6)
- [x] Register — Exhibitor / Attendee roles (frontend UI)
- [ ] Register — Admin **blocked** from public signup (F-7)
- [x] Login with role selection
- [x] Forgot password UI
- [ ] **Reset password with token** (F-1)
- [ ] bcryptjs hashing
- [ ] JWT in HttpOnly cookies
- [ ] Role middleware (admin / exhibitor / attendee)
- [ ] Ownership checks at query level

### B. Expo Management
- [x] Create / edit / delete / archive UI
- [ ] Banner upload (Cloudinary)
- [ ] Publish / unpublish
- [ ] View registrations

### C. Exhibitor Management
- [x] Apply for expo + document upload UI
- [x] Admin approve / reject with reason
- [ ] Booth assignment persisted
- [ ] Status tracking live

### D. Booth Management
- [x] Interactive floor plan (editor + preview)
- [x] Categories, dimensions, availability
- [ ] **Atomic reservation — no double-booking** (critical)
- [ ] Pricing per category / per expo

### E. Schedule Management
- [x] CRUD UI for sessions
- [x] Attendee browse / register / bookmark
- [ ] Capacity enforcement (no overbooking)

### F. Communication
- [x] Messaging UI (admin + portals)
- [ ] Socket.IO real-time delivery
- [ ] Conversation membership enforcement

### G. Notifications
- [x] Dropdown UI with read/unread
- [ ] Generated on: registration, approval, booth allocation,
      schedule change, appointment update, session reminder

### H. Analytics
- [x] Full dashboard with charts
- [ ] **Computed from MongoDB aggregation** (not hardcoded)

### I. Pricing & Payment (Part 9)
- [ ] Booth pricing config per expo + category
- [ ] Ticket types: General / Standard / VIP / Workshop
- [ ] Booking summary: subtotal, tax, discount, total
- [ ] Payment status + transaction ref + receipt
- [ ] Honest **DEMO payment mode** (no real gateway)

---

## 4. Page Inventory — Target vs Existing

| Required page | Route | Status |
|---|---|---|
| Home | `/` | ✅ |
| Explore Expos | `/expos` | ✅ |
| Expo Details | `/expos/:slug` | ✅ |
| Exhibitor Directory | `/exhibitors` | ✅ |
| Exhibitor Profile | `/exhibitors/:id` | ✅ |
| Event Schedule | `/schedule` | ✅ |
| Expo Floor Plan | `/floor-plan` | ✅ |
| About Us | `/about` | ✅ |
| Contact Us | `/contact` | ✅ |
| Login / Register / Forgot | `/login` `/register` `/forgot-password` | ✅ |
| **Reset Password** | `/reset-password/:token` | ❌ **F-1** |
| Admin × 12 | `/admin/*` | ✅ 11 + **Pricing ❌ F-2** |
| Exhibitor × 12 | `/portal` (tabs) | ✅ |
| Attendee × 12 | `/attendee` (tabs) | ✅ |

---

## 5. Database Entity Plan (15 collections)

```
User ──1:1── ExhibitorProfile ──1:N── ExhibitorApplication ──N:1── Expo
  │                                     │
  │                                     └──1:N── Document
  │
  ├──1:N── EventRegistration ──N:1── Expo ──1:N── Booth
  ├──1:N── SessionRegistration ──N:1── Session ──N:1── Expo
  ├──1:N── Appointment (requester ↔ exhibitor)
  ├──1:N── Message (sender ↔ recipient, Conversation)
  ├──1:N── Notification
  ├──1:N── Feedback (target: expo | session | exhibitor)
  └──1:N── Payment ──N:1── Pricing
```

**Indexes:** `User.email` (unique), `Expo.slug` (unique), `Booth.{expo,boothId}` (unique compound),
`EventRegistration.{user,expo}` (unique compound), `SessionRegistration.{user,session}` (unique compound),
`Notification.{recipient,read}`, `Message.conversation`, text index on `Expo.title/tags`.

**Duplicate prevention:** compound unique indexes + atomic `findOneAndUpdate` guards.

---

## 6. API Plan (15 route groups, ~90 endpoints)

| Route file | Key endpoints |
|---|---|
| authRoutes | POST register/login/logout/forgot/reset, GET me |
| userRoutes | GET/PATCH profile, password |
| expoRoutes | CRUD, publish, banners, search |
| exhibitorRoutes | profile CRUD, applications, documents, staff, products |
| boothRoutes | floor plan CRUD, availability, **reserve (atomic)**, assign |
| scheduleRoutes | session CRUD, register, bookmark |
| attendeeRoutes | list, filter, detail, history |
| registrationRoutes | event register, my registrations, cancel |
| messageRoutes | conversations, send, mark-read |
| appointmentRoutes | request, respond, my appointments |
| feedbackRoutes | submit, list, reply, status |
| notificationRoutes | list, mark-read, mark-all-read |
| pricingRoutes | booth pricing, ticket types |
| paymentRoutes | create intent (demo), confirm, receipt |
| analyticsRoutes | overview, attendees, booths, sessions, events |

---

## 7. Development Sequence

1. **Phase 2a** — Frontend gaps: Reset Password page, Admin Pricing page, remove Admin from public registration ✅
2. **Phase 2b** — API client + auth store refactor (Axios, RHF, Zod)
3. **Phase 3** — Frontend completion gate (build + route audit)
4. **Phase 4** — Backend scaffolding (server.js, config, utils, middleware)
5. **Phase 5** — Mongoose models (15)
6. **Phase 6** — Controllers + routes (MVC)
7. **Phase 7** — Validators + services (email, cloudinary, notification)
8. **Phase 8** — Seed script (creates Admin securely)
9. **Phase 9** — Integration (swap mock → API)
10. **Phase 10** — Tests (Vitest + Supertest)
11. **Phase 11** — README + .env.example
