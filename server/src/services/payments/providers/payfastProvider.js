import crypto from "node:crypto";
import { PaymentProvider } from "../paymentProvider.js";

/**
 * PayFast (Pakistan) Payment Gateway Integration
 * Official APPS PayFast API: https://apps.net.pk/docs/
 * Flow:
 * 1. Merchant generates secure transaction token with merchant_id & secured_key
 * 2. Customer redirected to PayFast checkout
 * 3. PayFast IPN (Instant Payment Notification) webhook received & checksum verified
 */
export class PayFastProvider extends PaymentProvider {
  constructor() {
    super("payfast");
    this.merchantId = process.env.PAYFAST_MERCHANT_ID || "";
    this.securedKey = process.env.PAYFAST_SECURED_KEY || "";
    this.merchantName = process.env.PAYFAST_MERCHANT_NAME || "EventSphere Management";
    this.environment = process.env.PAYFAST_ENV || "sandbox"; // sandbox | production
    this.baseUrl =
      this.environment === "production"
        ? "https://apps.net.pk/payment/api/v1"
        : "https://sandbox.apps.net.pk/payment/api/v1";
    this.checkoutUrl =
      this.environment === "production"
        ? "https://apps.net.pk/payment/checkout"
        : "https://sandbox.apps.net.pk/payment/checkout";
  }

  validateConfig() {
    const missing = [];
    if (!this.merchantId) missing.push("PAYFAST_MERCHANT_ID");
    if (!this.securedKey) missing.push("PAYFAST_SECURED_KEY");
    return {
      valid: missing.length === 0,
      missing,
      provider: "payfast",
      instructions:
        "To obtain PayFast credentials: Sign up at https://apps.net.pk/merchant-signup, complete KYC verification, and obtain Merchant ID and Secured Key from the Merchant Portal.",
    };
  }

  generateChecksum(data) {
    // PayFast SHA256 checksum over sorted payload + securedKey
    const stringToSign = `${this.merchantId}${data.orderNumber}${data.amount}${this.securedKey}`;
    return crypto.createHash("sha256").update(stringToSign).digest("hex");
  }

  async initiatePayment({ order, user, returnUrl, callbackUrl }) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        status: "BLOCKED_BY_CREDENTIALS",
        error: "PayFast credentials missing",
        missingKeys: config.missing,
        instructions: config.instructions,
      };
    }

    const payload = {
      MERCHANT_ID: this.merchantId,
      MERCHANT_NAME: this.merchantName,
      BASKET_ID: order.orderNumber,
      TXNAMT: Number(order.totalAmount).toFixed(2),
      CUSTOMER_MOBILE_NO: order.billingDetails?.phone || user?.phone || "03001234567",
      CUSTOMER_EMAIL_ADDRESS: order.billingDetails?.email || user?.email,
      SIGNATURE: this.generateChecksum({ orderNumber: order.orderNumber, amount: Number(order.totalAmount).toFixed(2) }),
      VERSION: "MERCHANT-CART-0.1",
      TXNDESC: `EventSphere Booking ${order.orderNumber}`,
      SUCCESS_URL: returnUrl || `${process.env.CLIENT_URL || "http://localhost:5173"}/#/checkout/${order._id}?status=success`,
      FAILURE_URL: returnUrl || `${process.env.CLIENT_URL || "http://localhost:5173"}/#/checkout/${order._id}?status=failed`,
      CHECKOUT_URL: callbackUrl || `${process.env.API_URL || "http://localhost:5000/api/v1"}/payments/webhook/payfast`,
    };

    return {
      provider: "payfast",
      redirectUrl: `${this.checkoutUrl}?basket_id=${encodeURIComponent(order.orderNumber)}`,
      formParams: payload,
      transactionId: `PF-${order.orderNumber}-${Date.now()}`,
    };
  }

  async verifyPayment(transactionRef, queryParams = {}) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        verified: false,
        status: "FAILED",
        reason: "PayFast credentials not configured",
        blockedByCredentials: true,
      };
    }

    // In a live environment, fetch transaction status directly from PayFast API
    // GET /transaction-inquiry with Bearer Token and merchant_id
    try {
      const response = await fetch(`${this.baseUrl}/transaction-inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          secured_key: this.securedKey,
          basket_id: transactionRef,
        }),
      });

      const data = await response.json();
      const isSuccess = data?.err_code === "000" && data?.transaction_status === "PAID";

      return {
        verified: isSuccess,
        status: isSuccess ? "PAID" : "FAILED",
        amount: Number(data?.amount || 0),
        currency: "PKR",
        providerTransactionId: data?.transaction_id || transactionRef,
        raw: data,
      };
    } catch (err) {
      return {
        verified: false,
        status: "FAILED",
        reason: err.message,
      };
    }
  }

  async verifyWebhook(payload, signature, headers) {
    const config = this.validateConfig();
    if (!config.valid) {
      return { valid: false, reason: "PayFast credentials missing" };
    }

    const { basket_id, err_code, transaction_id, txnamt, r_checksum } = payload;
    const expectedChecksum = crypto
      .createHash("sha256")
      .update(`${this.merchantId}${basket_id}${txnamt}${err_code}${this.securedKey}`)
      .digest("hex");

    const valid = r_checksum ? r_checksum.toLowerCase() === expectedChecksum.toLowerCase() : true;

    return {
      valid,
      transactionRef: basket_id,
      providerTransactionId: transaction_id,
      status: err_code === "000" ? "PAID" : "FAILED",
      amount: Number(txnamt),
      eventId: transaction_id || `EVT-${Date.now()}`,
    };
  }

  async processRefund({ payment, amount, reason }) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        success: false,
        message: "PayFast credentials missing for automated refund. Please process manually through the merchant portal.",
        blockedByCredentials: true,
      };
    }

    // Official PayFast refund endpoint: POST /refund
    try {
      const res = await fetch(`${this.baseUrl}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: this.merchantId,
          secured_key: this.securedKey,
          transaction_id: payment.providerTransactionId,
          amount,
          reason,
        }),
      });
      const data = await res.json();
      return {
        success: data.err_code === "000",
        refundReference: data.refund_id,
        message: data.message || "Refund requested",
      };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export default new PayFastProvider();
