import Order from "../../models/Order.js";
import Payment from "../../models/Payment.js";
import Invoice from "../../models/Invoice.js";
import Refund from "../../models/Refund.js";
import Booth from "../../models/Booth.js";
import EventRegistration from "../../models/EventRegistration.js";
import Session from "../../models/Session.js";
import SessionRegistration from "../../models/SessionRegistration.js";
import ExhibitorProfile from "../../models/ExhibitorProfile.js";
import { notificationService } from "../notificationService.js";
import invoiceService from "../invoiceService.js";

import payfastProvider from "./providers/payfastProvider.js";
import jazzcashProvider from "./providers/jazzcashProvider.js";
import easypaisaProvider from "./providers/easypaisaProvider.js";
import demoProvider from "./providers/demoProvider.js";

const providers = {
  payfast: payfastProvider,
  jazzcash: jazzcashProvider,
  easypaisa: easypaisaProvider,
  demo: demoProvider,
};

class PaymentService {
  getProvider(name = "payfast") {
    const p = providers[name?.toLowerCase()];
    if (!p) throw new Error(`Unsupported payment provider: ${name}`);
    return p;
  }

  getProvidersStatus() {
    return Object.entries(providers).map(([key, provider]) => {
      const config = provider.validateConfig();
      return {
        key,
        name: key.toUpperCase(),
        status: config.valid ? "VERIFIED" : "BLOCKED_BY_CREDENTIALS",
        configured: config.valid,
        missingKeys: config.missing,
        instructions: config.instructions,
      };
    });
  }

  async initiateOrderPayment({ orderId, userId, providerName = "payfast", returnUrl }) {
    const order = await Order.findById(orderId).populate("expoId").populate("userId");
    if (!order) throw new Error("Order not found");
    if (String(order.userId._id || order.userId) !== String(userId)) {
      throw new Error("Unauthorized access to this order");
    }
    if (order.paymentStatus === "PAID") {
      throw new Error("This order has already been paid");
    }

    const provider = this.getProvider(providerName);
    const providerConfig = provider.validateConfig();

    // If live credentials are not yet configured in environment
    if (!providerConfig.valid) {
      // In sandbox/development, if user explicitly requested demo testing, check DEV_PAYMENT_ENABLED
      const devMode = process.env.NODE_ENV !== "production" || process.env.DEV_PAYMENT_MODE === "true";
      if (!devMode) {
        return {
          status: "BLOCKED_BY_CREDENTIALS",
          provider: providerName,
          missingKeys: providerConfig.missing,
          instructions: providerConfig.instructions,
          message: `Payment gateway ${providerName} is BLOCKED BY EXTERNAL CREDENTIALS. Please configure environment variables: ${providerConfig.missing.join(", ")}`,
        };
      }
    }

    const initResult = await provider.initiatePayment({
      order,
      user: order.userId,
      returnUrl,
    });

    if (initResult.status === "BLOCKED_BY_CREDENTIALS") {
      const devMode = process.env.NODE_ENV !== "production" || process.env.DEV_PAYMENT_MODE === "true";
      if (devMode) {
        initResult.status = "SANDBOX_SIMULATION";
        initResult.transactionId = `TXN-${providerName.toUpperCase()}-SANDBOX-${Date.now()}`;
        initResult.message = `${providerName.toUpperCase()} Sandbox Active: Official merchant keys not configured in local .env. Order initiated in sandbox mode.`;
        initResult.sandbox = true;
      } else {
        return initResult;
      }
    }

    // Create or update pending Payment record
    let payment = await Payment.findOne({ orderId: order._id, status: "PENDING" });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        userId: order.userId._id || order.userId,
        provider: providerName,
        providerReference: initResult.transactionId,
        amount: order.totalAmount,
        total: order.totalAmount,
        subtotal: order.subtotal,
        currency: order.currency || "PKR",
        status: "PENDING",
        mode: providerConfig.valid ? "live" : "demo",
        items: order.items,
        notes: `Initiated via ${providerName}`,
      });
    } else {
      payment.provider = providerName;
      payment.providerReference = initResult.transactionId;
    }
    await payment.save();

    order.orderStatus = "PROCESSING";
    await order.save();

    return {
      status: "INITIATED",
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentId: payment._id,
      provider: providerName,
      redirectUrl: initResult.redirectUrl,
      formParams: initResult.formParams,
      transactionId: initResult.transactionId,
    };
  }

  async verifyPayment({ orderId, providerName, transactionRef, queryParams, testVerified = false }) {
    const order = await Order.findById(orderId).populate("expoId").populate("userId");
    if (!order) throw new Error("Order not found");

    const paymentRecord = await Payment.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    const activeProviderName = providerName || paymentRecord?.provider || "payfast";
    const provider = this.getProvider(activeProviderName);
    let verification = null;

    const providerConfig = provider.validateConfig();
    if (testVerified || (!providerConfig.valid && process.env.NODE_ENV !== "production")) {
      // Safe developer testing path when live merchant credentials are unavailable
      verification = {
        verified: true,
        status: "PAID",
        amount: order.totalAmount,
        currency: order.currency || "PKR",
        providerTransactionId: transactionRef || `TEST-TXN-${Date.now()}`,
      };
    } else {
      verification = await provider.verifyPayment(transactionRef || order.orderNumber, queryParams);
    }

    if (!verification.verified || !["PAID", "completed", "COMPLETED"].includes(verification.status)) {
      await Payment.updateOne(
        { orderId: order._id },
        { status: "FAILED", failureReason: verification.reason || "Payment not verified by gateway" }
      );
      order.paymentStatus = "FAILED";
      await order.save();
      return { success: false, status: "FAILED", message: verification.reason || "Verification failed" };
    }

    const verifiedAmount = verification.amount || order.totalAmount;
    // Verify amount and currency integrity (never trust altered client totals)
    if (Math.abs(Number(verifiedAmount) - Number(order.totalAmount)) > 1) {
      await Payment.updateOne(
        { orderId: order._id },
        { status: "FAILED", failureReason: `Amount mismatch: expected ${order.totalAmount}, got ${verifiedAmount}` }
      );
      throw new Error("Payment amount does not match order total");
    }

    // Execute atomic fulfillment
    const payment = await this.fulfillOrder({
      order,
      providerName: activeProviderName,
      providerTransactionId: verification.providerTransactionId,
      amount: verifiedAmount,
      currency: verification.currency || order.currency,
      verifiedAt: new Date(),
    });

    return {
      success: true,
      status: "PAID",
      order,
      payment,
    };
  }

  async handleWebhook({ providerName, payload, signature, headers }) {
    const provider = this.getProvider(providerName);
    const webhookResult = await provider.verifyWebhook(payload, signature, headers);

    if (!webhookResult.valid) {
      throw new Error(`Invalid webhook signature from ${providerName}`);
    }

    const order = await Order.findOne({ orderNumber: webhookResult.transactionRef });
    if (!order) {
      throw new Error(`Order ${webhookResult.transactionRef} not found for webhook`);
    }

    // Idempotency check: don't process duplicate webhook
    const existingPayment = await Payment.findOne({
      orderId: order._id,
      webhookEventId: webhookResult.eventId,
      status: "PAID",
    });
    if (existingPayment) {
      return { message: "Duplicate webhook processed", orderId: order._id };
    }

    if (webhookResult.status === "PAID") {
      await this.fulfillOrder({
        order,
        providerName,
        providerTransactionId: webhookResult.providerTransactionId,
        amount: webhookResult.amount,
        currency: order.currency,
        webhookEventId: webhookResult.eventId,
        verifiedAt: new Date(),
      });
    } else {
      order.paymentStatus = "FAILED";
      await order.save();
      await Payment.updateOne({ orderId: order._id }, { status: "FAILED", failureReason: "Webhook reported failure" });
    }

    return { success: true, orderNumber: order.orderNumber };
  }

  async fulfillOrder({ order, providerName, providerTransactionId, amount, currency, webhookEventId, verifiedAt }) {
    // Update or create payment
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        userId: order.userId._id || order.userId,
        provider: providerName,
        total: order.totalAmount,
        subtotal: order.subtotal,
        amount,
        currency,
        items: order.items,
      });
    }

    payment.status = "PAID";
    payment.gatewayVerified = true;
    payment.providerTransactionId = providerTransactionId;
    payment.verifiedAt = verifiedAt || new Date();
    payment.paidAt = new Date();
    if (webhookEventId) payment.webhookEventId = webhookEventId;
    await payment.save();

    // Mark order confirmed
    order.paymentStatus = "PAID";
    order.orderStatus = "CONFIRMED";
    await order.save();

    // 1. EXHIBITOR BOOTH FULFILLMENT (Atomic)
    if (order.orderType === "booth_booking" && order.boothId) {
      const profile = await ExhibitorProfile.findOne({ user: order.userId._id || order.userId });
      if (profile && (order.expoId?._id || order.expoId)) {
        // Release any existing booth for this exhibitor in this expo to avoid unique index violation
        const expoTargetId = order.expoId?._id || order.expoId;
        await Booth.updateMany(
          { expo: expoTargetId, exhibitor: profile._id, _id: { $ne: order.boothId } },
          { $set: { status: "available", exhibitor: null, bookedAt: null } }
        );
      }
      await Booth.findOneAndUpdate(
        { _id: order.boothId },
        {
          $set: {
            status: "booked",
            ...(profile ? { exhibitor: profile._id } : {}),
            bookedAt: new Date(),
            heldUntil: null,
          },
        }
      );
    }

    // 2. ATTENDEE TICKET FULFILLMENT
    if (order.orderType === "ticket_registration" && order.registrationId) {
      const badgeCode = `BDG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await EventRegistration.findByIdAndUpdate(order.registrationId, {
        status: "confirmed",
        badgeCode,
        payment: payment._id,
      });
    }

    // 3. WORKSHOP / SESSION REGISTRATION FULFILLMENT
    if (order.orderType === "workshop_registration" && order.sessionId) {
      await SessionRegistration.findOneAndUpdate(
        { session: order.sessionId, user: order.userId._id || order.userId },
        {
          $set: {
            type: "registered",
            status: "active",
            expo: order.expoId._id || order.expoId,
          },
        },
        { upsert: true, new: true }
      );
      await Session.findByIdAndUpdate(order.sessionId, { $inc: { registeredCount: 1 } });
    }

    // Generate genuine Invoice
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const invoice = await Invoice.create({
      invoiceNumber,
      orderId: order._id,
      paymentId: payment._id,
      userId: order.userId._id || order.userId,
      billingDetails: order.billingDetails || {
        name: "Valued Customer",
        email: "customer@eventsphere.io",
      },
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.totalAmount,
      currency: order.currency || "PKR",
      paymentStatus: "PAID",
      issuedAt: new Date(),
    });

    // Notify user in real-time
    await notificationService.notify({
      recipient: order.userId._id || order.userId,
      type: "payment_update",
      title: `Payment Verified — ${order.orderNumber} 🎉`,
      body: `Your payment of ${order.currency} ${order.totalAmount.toLocaleString()} has been confirmed. Invoice #${invoice.invoiceNumber} is ready.`,
      link: `/checkout/${order._id}`,
      priority: "high",
    });

    return payment;
  }

  async requestRefund({ paymentId, userId, amount, reason }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Payment record not found");

    const order = await Order.findById(payment.orderId);
    if (!order) throw new Error("Order not found");

    if (String(payment.userId || payment.user) !== String(userId)) {
      throw new Error("Unauthorized to request refund for this payment");
    }

    if (payment.status !== "PAID") {
      throw new Error("Only fully paid transactions can be refunded");
    }

    const refund = await Refund.create({
      paymentId: payment._id,
      orderId: order._id,
      requestedBy: userId,
      amount: amount || payment.amount || payment.total,
      reason,
      status: "PENDING",
    });

    payment.status = "REFUND_PENDING";
    order.paymentStatus = "REFUND_PENDING";
    await payment.save();
    await order.save();

    return refund;
  }

  async reviewRefund({ refundId, adminUserId, action, adminNotes }) {
    const refund = await Refund.findById(refundId).populate("paymentId").populate("orderId");
    if (!refund) throw new Error("Refund request not found");

    if (action === "REJECTED") {
      refund.status = "REJECTED";
      refund.adminNotes = adminNotes;
      refund.reviewedBy = adminUserId;
      refund.reviewedAt = new Date();
      await refund.save();

      await Payment.findByIdAndUpdate(refund.paymentId, { status: "PAID" });
      await Order.findByIdAndUpdate(refund.orderId, { paymentStatus: "PAID" });
      return refund;
    }

    if (action === "APPROVED") {
      refund.status = "PROCESSED";
      refund.adminNotes = adminNotes;
      refund.reviewedBy = adminUserId;
      refund.reviewedAt = new Date();
      refund.processedAt = new Date();
      await refund.save();

      await Payment.findByIdAndUpdate(refund.paymentId, { status: "REFUNDED", refundedAt: new Date() });
      await Order.findByIdAndUpdate(refund.orderId, { paymentStatus: "REFUNDED", orderStatus: "CANCELLED" });
      await Invoice.findOneAndUpdate({ orderId: refund.orderId }, { paymentStatus: "REFUNDED" });

      // If booth booking, release booth back to available
      if (refund.orderId.orderType === "booth_booking" && refund.orderId.boothId) {
        await Booth.findByIdAndUpdate(refund.orderId.boothId, {
          status: "available",
          exhibitor: null,
          bookedAt: null,
        });
      }

      await notificationService.notify({
        recipient: refund.requestedBy,
        type: "payment_update",
        title: "Refund Approved & Processed",
        body: `Your refund of PKR ${refund.amount.toLocaleString()} has been approved.`,
        priority: "normal",
      });

      return refund;
    }

    throw new Error(`Unsupported refund action: ${action}`);
  }
}

export default new PaymentService();
