import { PaymentProvider } from "../paymentProvider.js";

export class DemoPaymentProvider extends PaymentProvider {
  constructor() {
    super("demo");
  }

  validateConfig() {
    return {
      valid: true,
      missing: [],
      instructions: "Sandbox test gateway active for verified developer order fulfillment and instant PDF invoice generation.",
    };
  }

  async initiatePayment({ order, amount, currency, returnUrl }) {
    const transactionId = `TXN-DEMO-${Date.now()}`;
    return {
      transactionId,
      redirectUrl: null,
      raw: {
        mode: "sandbox",
        status: "INITIATED",
        orderNumber: order.orderNumber,
        amount,
        currency,
      },
    };
  }

  async verifyPayment(transactionRef, queryParams = {}) {
    return {
      verified: true,
      status: "PAID",
      amount: queryParams.amount,
      currency: queryParams.currency || "PKR",
      providerTransactionId: transactionRef || `TXN-DEMO-${Date.now()}`,
      raw: { sandbox: true, transactionRef },
    };
  }

  async verifyWebhook(payload) {
    return {
      valid: true,
      transactionRef: payload.transactionId || `TXN-DEMO-${Date.now()}`,
      status: "completed",
      amount: payload.amount,
      eventId: `EVT-${Date.now()}`,
    };
  }

  async processRefund({ payment, amount, reason }) {
    return {
      success: true,
      refundReference: `REF-DEMO-${Date.now()}`,
      raw: { status: "PROCESSED", refundAmount: amount, reason },
    };
  }
}

export default new DemoPaymentProvider();
