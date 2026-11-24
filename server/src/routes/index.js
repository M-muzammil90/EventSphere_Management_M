import { Router } from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import expoRoutes from "./expoRoutes.js";
import exhibitorRoutes from "./exhibitorRoutes.js";
import boothRoutes from "./boothRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import attendeeRoutes from "./attendeeRoutes.js";
import registrationRoutes from "./registrationRoutes.js";
import messageRoutes from "./messageRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import feedbackRoutes from "./feedbackRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import pricingRoutes from "./pricingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import orderRoutes from "./orderRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import supportRoutes from "./supportRoutes.js";
import leadRoutes from "./leadRoutes.js";

const router = Router();

router.get("/", (_req, res) =>
  res.json({
    success: true,
    data: {
      name: "EventSphere API",
      version: "1.0.0",
      docs: "/api/v1",
      endpoints: {
        auth: "/api/v1/auth",
        users: "/api/v1/users",
        expos: "/api/v1/expos",
        exhibitors: "/api/v1/exhibitors",
        booths: "/api/v1/booths",
        schedule: "/api/v1/schedule",
        attendees: "/api/v1/attendees",
        registrations: "/api/v1/registrations",
        messages: "/api/v1/messages",
        appointments: "/api/v1/appointments",
        feedback: "/api/v1/feedback",
        notifications: "/api/v1/notifications",
        pricing: "/api/v1/pricing",
        payments: "/api/v1/payments",
        analytics: "/api/v1/analytics",
      },
    },
  })
);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/expos", expoRoutes);
router.use("/exhibitors", exhibitorRoutes);
router.use("/booths", boothRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/attendees", attendeeRoutes);
router.use("/registrations", registrationRoutes);
router.use("/messages", messageRoutes);
router.use("/conversations", messageRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/notifications", notificationRoutes);
router.use("/pricing", pricingRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/invoices", paymentRoutes);
router.use("/refunds", paymentRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/support", supportRoutes);
router.use("/leads", leadRoutes);

export default router;
