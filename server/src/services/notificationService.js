import Notification from "../models/Notification.js";
import { emitToUser, emitToUsers } from "./socketService.js";
import emailService from "./emailService.js";

/**
 * Creates a notification, pushes it over Socket.IO, and optionally emails it.
 * Private by construction — emitToUser targets a single user's private room.
 */
export const notificationService = {
  async notify({ recipient, type = "system", title, body, link, priority = "normal", relatedType, relatedId, email = false, emailTemplate }) {
    if (!recipient) return null;

    const notification = await Notification.create({
      recipient, type, title, body, link, priority,
      relatedType, relatedId,
      deliveredAt: new Date(),
    });

    // Real-time push to this user only
    emitToUser(String(recipient), "notification:new", {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      createdAt: notification.createdAt,
    });

    // Optional email fan-out
    if (email && emailTemplate) {
      try {
        await emailTemplate();
        notification.emailedAt = new Date();
        await notification.save();
      } catch (err) {
        console.error("Notification email failed:", err.message);
      }
    }

    return notification;
  },

  async notifyMany(recipients, payload) {
    const list = recipients.filter(Boolean);
    const docs = await Notification.insertMany(
      list.map((r) => ({
        recipient: r, type: payload.type || "system", title: payload.title,
        body: payload.body, link: payload.link, priority: payload.priority || "normal",
        relatedType: payload.relatedType, relatedId: payload.relatedId, deliveredAt: new Date(),
      }))
    );
    emitToUsers(list.map(String), "notification:new", {
      type: payload.type, title: payload.title, body: payload.body, link: payload.link,
    });
    return docs;
  },

  /** Fires on any schedule change to everyone registered/bookmarked a session. */
  async notifyScheduleChange({ session, recipients, change }) {
    if (!recipients?.length) return [];
    return this.notifyMany(recipients, {
      type: "schedule_change",
      title: `Schedule update: ${session.title}`,
      body: change,
      link: "/schedule",
      relatedType: "session",
      relatedId: session._id,
      priority: "high",
    });
  },

  async notifyApplicationDecision({ application, exhibitorUser, approved, boothLabel, reason }) {
    return this.notify({
      recipient: exhibitorUser,
      type: approved ? "application_approved" : "application_rejected",
      title: approved
        ? `Your application for ${application.expo?.title ?? "the expo"} was approved`
        : `Your application was not successful`,
      body: approved
        ? boothLabel
          ? `Booth ${boothLabel} has been allocated to you.`
          : "You can now select a booth from the floor plan."
        : reason || "Please review the organizer's note and consider re-applying.",
      link: "/portal",
      relatedType: "application",
      relatedId: application._id,
      priority: approved ? "high" : "normal",
      email: true,
      emailTemplate: () =>
        emailService.sendApplicationDecision({
          to: application.applicantEmail ?? undefined,
          name: exhibitorUser?.name,
          expoTitle: application.expo?.title,
          approved,
          boothLabel,
          reason,
        }),
    });
  },

  async notifyBoothAllocation({ recipient, expoTitle, boothLabel, price, currency }) {
    return this.notify({
      recipient,
      type: "booth_allocated",
      title: `Booth ${boothLabel} allocated`,
      body: `Your booth at ${expoTitle} is confirmed.`,
      link: "/portal",
      relatedType: "booth",
      priority: "high",
      email: true,
      emailTemplate: () =>
        emailService.sendBoothAllocation({ to: undefined, name: undefined, expoTitle, boothLabel, price, currency })
            .catch(() => {}),
    });
  },

  async notifyRegistrationConfirmed({ recipient, user, expoTitle, badgeCode, ticketType }) {
    return this.notify({
      recipient,
      type: "registration_confirmed",
      title: `You're registered for ${expoTitle}`,
      body: `Your ${ticketType} pass is confirmed. Badge code: ${badgeCode}`,
      link: "/attendee",
      relatedType: "expo",
      priority: "high",
      email: true,
      emailTemplate: () =>
        emailService.sendRegistrationConfirmation({
          to: user?.email, name: user?.name, expoTitle, badgeCode, ticketType,
        }),
    });
  },

  async notifyAppointmentUpdate({ recipient, user, counterpart, status, date, time }) {
    return this.notify({
      recipient,
      type: "appointment_update",
      title: `Appointment ${status}`,
      body: `${counterpart} — ${date} at ${time}`,
      link: "/attendee",
      relatedType: "appointment",
      priority: status === "confirmed" ? "high" : "normal",
      email: true,
      emailTemplate: () =>
        emailService.sendAppointmentUpdate({ to: user?.email, name: user?.name, counterpart, status, date, time }),
    });
  },

  async notifyFeedbackReply({ recipient, user, reply }) {
    return this.notify({
      recipient,
      type: "feedback_reply",
      title: "We replied to your feedback",
      body: reply.slice(0, 140),
      link: "/attendee",
      relatedType: "feedback",
      email: true,
      emailTemplate: () => emailService.sendFeedbackReply({ to: user?.email, name: user?.name, reply }),
    });
  },

  async notifyNewMessage({ recipient, senderName, conversationId, preview }) {
    return this.notify({
      recipient,
      type: "new_message",
      title: `New message from ${senderName}`,
      body: preview?.slice(0, 120),
      link: "/portal",
      relatedType: "message",
      relatedId: conversationId,
      priority: "normal",
    });
  },
};

export default notificationService;
