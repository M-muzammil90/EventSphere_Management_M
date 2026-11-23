import crypto from "node:crypto";
import { PaymentProvider } from "../paymentProvider.js";

/**
 * JazzCash (Pakistan) Payment Gateway Integration
 * Official JazzCash HTTP POST Integration
 * Flow:
 * 1. Merchant prepares parameters with HMAC-SHA256 signature calculated with IntegritySalt
 * 2. Form POST to JazzCash payment portal
 * 3. JazzCash IPN response verified using pp_SecureHash
 */
export class JazzCashProvider extends PaymentProvider {
  constructor() {
    super("jazzcash");
    this.merchantId = process.env.JAZZCASH_MERCHANT_ID || "";
    this.password = process.env.JAZZCASH_PASSWORD || "";
    this.integritySalt = process.env.JAZZCASH_INTEGERITY_SALT || "";
    this.environment = process.env.JAZZCASH_ENV || "sandbox"; // sandbox | production
    this.postUrl =
      this.environment === "production"
        ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform"
        : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
  }

  validateConfig() {
    const missing = [];
    if (!this.merchantId) missing.push("JAZZCASH_MERCHANT_ID");
    if (!this.password) missing.push("JAZZCASH_PASSWORD");
    if (!this.integritySalt) missing.push("JAZZCASH_INTEGERITY_SALT");
    return {
      valid: missing.length === 0,
      missing,
      provider: "jazzcash",
      instructions:
        "To obtain JazzCash credentials: Sign up as a business merchant at https://www.jazzcash.com.pk/business/, complete verification, and obtain Merchant ID, Password, and Integrity Salt from the JazzCash Merchant Portal.",
    };
  }

  calculateSecureHash(fields) {
    // JazzCash requires sorting all non-empty pp_* fields alphabetically and prefixing with Salt
    const sortedKeys = Object.keys(fields)
      .filter((k) => k !== "pp_SecureHash" && fields[k] !== undefined && fields[k] !== null && fields[k] !== "")
      .sort();

    const concatenatedString = sortedKeys.map((k) => fields[k]).join("&");
    const stringToHash = `${this.integritySalt}&${concatenatedString}`;
    return crypto.createHmac("sha256", this.integritySalt).update(stringToHash).digest("hex").toUpperCase();
  }

  async initiatePayment({ order, user, returnUrl }) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        status: "BLOCKED_BY_CREDENTIALS",
        error: "JazzCash credentials missing",
        missingKeys: config.missing,
        instructions: config.instructions,
      };
    }

    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000);
    const formatDate = (d) =>
      d.toISOString().replace(/[-:T]/g, "").slice(0, 14);

    const amountInPaisa = Math.round(Number(order.totalAmount) * 100).toString();

    const fields = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: this.merchantId,
      pp_SubMerchantID: "",
      pp_Password: this.password,
      pp_TxnRefNo: `T${Date.now()}`.slice(0, 20),
      pp_Amount: amountInPaisa,
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: formatDate(now),
      pp_BillReference: order.orderNumber,
      pp_Description: `EventSphere ${order.orderNumber}`.slice(0, 50),
      pp_TxnExpiryDateTime: formatDate(expiry),
      pp_ReturnURL: returnUrl || `${process.env.CLIENT_URL || "http://localhost:5173"}/#/checkout/${order._id}?status=check`,
      pp_SecureHash: "",
      ppmpf_1: String(order._id),
      ppmpf_2: user?.email || "",
    };

    fields.pp_SecureHash = this.calculateSecureHash(fields);

    return {
      provider: "jazzcash",
      redirectUrl: this.postUrl,
      formParams: fields,
      transactionId: fields.pp_TxnRefNo,
    };
  }

  async verifyPayment(transactionRef, queryParams = {}) {
    const config = this.validateConfig();
    if (!config.valid) {
      return {
        verified: false,
        status: "FAILED",
        reason: "JazzCash credentials not configured",
        blockedByCredentials: true,
      };
    }

    if (queryParams && queryParams.pp_ResponseCode) {
      const receivedHash = queryParams.pp_SecureHash;
      const expectedHash = this.calculateSecureHash(queryParams);
      const isAuthentic = receivedHash && receivedHash.toUpperCase() === expectedHash;
      const isSuccess = isAuthentic && queryParams.pp_ResponseCode === "000";

      return {
        verified: isSuccess,
        status: isSuccess ? "PAID" : "FAILED",
        amount: Number(queryParams.pp_Amount || 0) / 100,
        currency: "PKR",
        providerTransactionId: queryParams.pp_TxnRefNo,
        failureReason: queryParams.pp_ResponseMessage,
        raw: queryParams,
      };
    }

    return { verified: false, status: "FAILED", reason: "No transaction verification payload provided" };
  }

  async verifyWebhook(payload, signature) {
    const config = this.validateConfig();
    if (!config.valid) return { valid: false, reason: "JazzCash credentials missing" };

    const expectedHash = this.calculateSecureHash(payload);
    const valid = payload.pp_SecureHash && payload.pp_SecureHash.toUpperCase() === expectedHash;

    return {
      valid,
      transactionRef: payload.pp_BillReference || payload.pp_TxnRefNo,
      providerTransactionId: payload.pp_TxnRefNo,
      status: payload.pp_ResponseCode === "000" ? "PAID" : "FAILED",
      amount: Number(payload.pp_Amount) / 100,
      eventId: payload.pp_TxnRefNo,
    };
  }

  async processRefund({ payment, amount, reason }) {
    return {
      success: false,
      message: "JazzCash refunds must be processed through the JazzCash Merchant Portal directly for bank and wallet security.",
      manualRequired: true,
    };
  }
}

export default new JazzCashProvider();
