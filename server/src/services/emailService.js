import nodemailer from "nodemailer";

const configured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
let etherealChecked = false;

async function getTransporter() {
  if (transporter) return transporter;
  if (configured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log("✔ SMTP configured:", process.env.SMTP_HOST);
    return transporter;
  }
  if (!etherealChecked && process.env.NODE_ENV !== "test") {
    etherealChecked = true;
    try {
      const testAcc = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAcc.user, pass: testAcc.pass },
      });
      console.log("✔ Ethereal test email transport ready:", testAcc.user);
      return transporter;
    } catch {
      console.log("ℹ SMTP not configured — emails are logged to the console instead");
    }
  }
  return null;
}

const FROM = () => process.env.EMAIL_FROM || "EventSphere <no-reply@eventsphere.io>";
const CLIENT = () => process.env.CLIENT_URL || "http://localhost:5173";

/* ------------------------------- send -------------------------------- */
async function send({ to, subject, html, text }) {
  if (!to) throw new Error("Recipient email is required");
  if (process.env.NODE_ENV === "test") return { messageId: "silent", sent: true, previewUrl: null };

  const tx = await getTransporter();
  if (!tx) {
    console.log("──────────────────── EMAIL (console) ────────────────────");
    console.log(`To      : ${to}`);
    console.log(`Subject : ${subject}`);
    console.log(text || html?.replace(/<[^>]+>/g, " ").slice(0, 400));
    console.log("─────────────────────────────────────────────────────────");
    return { messageId: `console-${Date.now()}`, sent: true, previewUrl: null };
  }

  const info = await tx.sendMail({ from: FROM(), to, subject, html, text });
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`✉ Email sent to ${to} — Preview: ${previewUrl}`);
  }
  return { messageId: info.messageId, sent: true, previewUrl };
}

/* ------------------------------ layouts ------------------------------ */
const wrap = (title, bodyHtml, ctaLabel, ctaUrl) => `
<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#F5F6FA;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E7E9F2">
    <div style="background:#171C35;padding:24px 28px">
      <span style="font-size:19px;font-weight:800;color:#fff;letter-spacing:-.5px">Event<span style="color:#8B72EE">Sphere</span></span>
    </div>
    <div style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:20px;color:#20243A">${title}</h1>
      <div style="font-size:14px;line-height:1.65;color:#4E5473">${bodyHtml}</div>
      ${ctaUrl ? `<a href="${ctaUrl}" style="display:inline-block;margin-top:22px;background:#6854D9;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px">${ctaLabel || "Open EventSphere"}</a>` : ""}
    </div>
    <div style="padding:18px 28px;background:#F5F6FA;border-top:1px solid #E7E9F2;font-size:11.5px;color:#777E91">
      You are receiving this because you have an EventSphere account.
      Manage your notification preferences in Settings.
    </div>
  </div>
</div>`;

/* --------------------------- templates ------------------------------- */
export const emailService = {
  configured,

  async sendWelcome({ to, name, role }) {
    return send({
      to,
      subject: "Welcome to EventSphere",
      text: `Welcome to EventSphere, ${name}! Your ${role} account is ready.`,
      html: wrap(
        `Welcome, ${name}!`,
        `<p>Your <b>${role}</b> account has been created successfully.</p>
         <p>You can now sign in and complete your profile to get started.</p>`,
        "Sign in",
        `${CLIENT()}/#/login`
      ),
    });
  },

  /** NEVER sends the user's password — only a one-time reset link. */
  async sendPasswordReset({ to, name, token }) {
    const url = `${CLIENT()}/reset-password/${token}`;
    return send({
      to,
      subject: "Reset your EventSphere password (valid 30 minutes)",
      text: `Hi ${name}, reset your password: ${url}\n\nThis link expires in 30 minutes and can only be used once.`,
      html: wrap(
        "Reset your password",
        `<p>Hi ${name},</p>
         <p>We received a request to reset your EventSphere password. Click the button below to choose a new one.</p>
         <p style="background:#FFF8E6;border:1px solid #F2A93B;border-radius:10px;padding:12px 14px;font-size:12.5px;color:#7A5A16">
           <b>Security note:</b> this link expires in <b>30 minutes</b> and can be used <b>once only</b>.
           We never email you your existing password. If you did not request this, you can safely ignore this message.
         </p>`,
        "Choose a new password",
        url
      ),
    });
  },

  async sendPasswordChanged({ to, name }) {
    return send({
      to,
      subject: "Your EventSphere password was changed",
      text: `Hi ${name}, your EventSphere password was changed. If this wasn't you, reset it immediately.`,
      html: wrap(
        "Password changed",
        `<p>Hi ${name},</p><p>Your EventSphere password was just changed and all other sessions were signed out.</p>
         <p>If this wasn't you, reset your password immediately and contact support.</p>`,
        "Reset password",
        `${CLIENT()}/forgot-password`
      ),
    });
  },

  async sendRegistrationConfirmation({ to, name, expoTitle, badgeCode, ticketType }) {
    return send({
      to,
      subject: `You're registered — ${expoTitle}`,
      text: `Hi ${name}, your ${ticketType} pass for ${expoTitle} is confirmed. Badge: ${badgeCode}`,
      html: wrap(
        "Registration confirmed 🎉",
        `<p>Hi ${name},</p>
         <p>Your <b>${ticketType}</b> pass for <b>${expoTitle}</b> is confirmed.</p>
         <p style="background:#F3F0FD;border:1px solid #D3C9F7;border-radius:10px;padding:14px;text-align:center">
           <span style="font-size:11px;color:#6854D9;font-weight:700;letter-spacing:.08em">YOUR BADGE CODE</span><br>
           <span style="font-family:monospace;font-size:20px;font-weight:700;color:#171C35">${badgeCode}</span>
         </p>
         <p>Present this code at the fast-lane entrance to skip the registration desk.</p>`,
        "View my pass",
        `${CLIENT()}/attendee`
      ),
    });
  },

  async sendApplicationDecision({ to, name, expoTitle, approved, boothLabel, reason }) {
    const body = approved
      ? `<p>Great news — your application to exhibit at <b>${expoTitle}</b> has been <span style="color:#16A36A;font-weight:700">approved</span>.</p>
         ${boothLabel ? `<p>Your booth allocation is <b>${boothLabel}</b>. You can now manage your booth details and staff badges.</p>` : ""}`
      : `<p>We're sorry — your application to exhibit at <b>${expoTitle}</b> was not successful this time.</p>
         ${reason ? `<p style="background:#FDECEC;border:1px solid #E05252;border-radius:10px;padding:12px 14px"><b>Reason:</b> ${reason}</p>` : ""}
         <p>You're welcome to re-apply for a future edition.</p>`;
    return send({
      to,
      subject: `${approved ? "Approved" : "Update"} — your ${expoTitle} application`,
      text: body.replace(/<[^>]+>/g, " "),
      html: wrap(approved ? "Application approved" : "Application outcome", body, "Open dashboard", `${CLIENT()}/portal`),
    });
  },

  async sendBoothAllocation({ to, name, expoTitle, boothLabel, price, currency }) {
    return send({
      to,
      subject: `Booth ${boothLabel} allocated — ${expoTitle}`,
      text: `Hi ${name}, booth ${boothLabel} at ${expoTitle} has been allocated to you.`,
      html: wrap(
        "Booth allocated",
        `<p>Hi ${name},</p><p>Booth <b>${boothLabel}</b> at <b>${expoTitle}</b> is now allocated to you.</p>
         ${price ? `<p>Rate: <b>${currency} ${price.toLocaleString()}</b></p>` : ""}
         <p>The public floor plan reflects this allocation immediately.</p>`,
        "View floor plan",
        `${CLIENT()}/floor-plan`
      ),
    });
  },

  async sendScheduleChange({ to, name, sessionTitle, change }) {
    return send({
      to,
      subject: `Schedule update — ${sessionTitle}`,
      text: `Hi ${name}, a session you bookmarked has been updated: ${change}`,
      html: wrap(
        "Schedule updated",
        `<p>Hi ${name},</p><p>A session on your agenda has changed:</p>
         <p style="background:#F3F0FD;border-left:3px solid #6854D9;padding:12px 14px"><b>${sessionTitle}</b><br>${change}</p>`,
        "View my agenda",
        `${CLIENT()}/attendee`
      ),
    });
  },

  async sendAppointmentUpdate({ to, name, counterpart, status, date, time }) {
    const map = {
      confirmed: ["Appointment confirmed", "#16A36A"],
      declined: ["Appointment declined", "#E05252"],
      cancelled: ["Appointment cancelled", "#E05252"],
      rescheduled: ["Appointment rescheduled", "#F2A93B"],
    };
    const [label, colour] = map[status] || ["Appointment update", "#6854D9"];
    return send({
      to,
      subject: `${label} — ${counterpart}`,
      text: `Hi ${name}, your appointment with ${counterpart} on ${date} at ${time} is now ${status}.`,
      html: wrap(
        label,
        `<p>Hi ${name},</p><p>Your appointment with <b>${counterpart}</b> is now
         <span style="color:${colour};font-weight:700">${status}</span>.</p>
         <p><b>${date}</b> at <b>${time}</b></p>`,
        "View appointments",
        `${CLIENT()}/attendee`
      ),
    });
  },

  async sendFeedbackReply({ to, name, reply }) {
    return send({
      to,
      subject: "We've replied to your feedback",
      text: `Hi ${name}, the EventSphere team replied to your feedback: ${reply}`,
      html: wrap(
        "Reply to your feedback",
        `<p>Hi ${name},</p><p>The organizing team replied to your feedback:</p>
         <blockquote style="margin:0;border-left:3px solid #8B72EE;padding:10px 14px;background:#F5F6FA;color:#4E5473">${reply}</blockquote>`,
        "View feedback",
        `${CLIENT()}/attendee`
      ),
    });
  },
};

export default emailService;
