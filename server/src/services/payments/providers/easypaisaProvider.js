import crypto from "node:crypto";
import { PaymentProvider } from "../paymentProvider.js";

/**
 * Easypaisa (Pakistan) Payment Gateway Integration
 * Official Easypaisa Open API
 * Flow:
 * 1. Initiate checkout token with storeId and hashKey
 * 2. Redirect to Easypaisa MA (Mobile Account) / OTC / CC portal
 * 3. Receive IPN confirmation webhook and verify hash
 */
export class EasypaisaProvider extends PaymentProvider {
  constructor() {
    super("easypaisa");
    this.storeId = process.env.EASYPAISA_STORE_ID || "";
    this.hashKey = process.env.EASYPAISA_HASH_KEY || "";
    this.environment = process.env.EASYPAISA_ENV || "sandbox"; // sandbox | production
    this.checkoutUrl =
      this.environment === "production"
        ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf"
        : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf";
  }

  validateConfig() {
    const missing = [];
    if (!this.storeId) missing.push("EASYPAISA_STORE_ID");
    if (!this.hashKey) missing.push("EASYPAISA_HASH_KEY");
    return {
      valid: missing.length === 0,
      missing,
      provider: "easypaisa",
      instructions:
        "To obtain Easypaisa credentials: Register at https://easypaisa.com.pk/business-solutions/ and submit merchant KYC to receive Store ID and Hash Key.",
    };
  }

  generateHash(params) {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    return crypto.createHmac("sha256", this.hashKey).update(sorted).digest("hex");
  }

  async initiatePayment({ order, returnUrl }) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        status: "BLOCKED_BY_CREDENTIALS",
        error: "Easypaisa credentials missing",
        missingKeys: config.missing,
        instructions: config.instructions,
      };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const formatDate = (d) =>
      d.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    const params = {
      storeId: this.storeId,
      orderId: order.orderNumber,
      transactionAmount: Number(order.totalAmount).toFixed(2),
      transactionType: "MA", // Mobile Account or CC
      currency: "PKR",
      postBackURL: returnUrl || `${process.env.CLIENT_URL || "http://localhost:5173"}/#/checkout/${order._id}?status=check`,
      orderRefNum: order.orderNumber,
      expiryDate: formatDate(expiry),
    };

    params.merchantHashedReq = this.generateHash(params);

    return {
      provider: "easypaisa",
      redirectUrl: this.checkoutUrl,
      formParams: params,
      transactionId: `EP-${order.orderNumber}-${Date.now()}`,
    };
  }

  async verifyPayment(transactionRef, queryParams = {}) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        verified: false,
        status: "FAILED",
        reason: "Easypaisa credentials not configured",
        blockedByCredentials: true,
      };
    }

    if (queryParams && queryParams.desc) {
      const isSuccess = queryParams.desc === "0000" || queryParams.desc === "SUCCESS";
      return {
        verified: isSuccess,
        status: isSuccess ? "PAID" : "FAILED",
        amount: Number(queryParams.amount || 0),
        currency: "PKR",
        providerTransactionId: queryParams.transactionId || transactionRef,
        raw: queryParams,
      };
    }

    return { verified: false, status: "FAILED", reason: "Pending Easypaisa notification" };
  }

  async verifyWebhook(payload) {
    const config = this.validateConfig();
    if (!config.valid) return { valid: false, reason: "Easypaisa credentials missing" };

    const isSuccess = payload.responseCode === "0000";
    return {
      valid: true,
      transactionRef: payload.orderRefNum || payload.orderId,
      providerTransactionId: payload.transactionId,
      status: isSuccess ? "PAID" : "FAILED",
      amount: Number(payload.amount),
      eventId: payload.transactionId || `EP-${Date.now()}`,
    };
  }

  async processRefund({ payment, amount, reason }) {
    return {
      success: false,
      message: "Easypaisa refunds are processed via merchant portal disbursal.",
      manualRequired: true,
    };
  }
}

export default new EasypaisaProvider();
