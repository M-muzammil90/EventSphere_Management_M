/**
 * Abstract Payment Provider Interface
 * All payment providers (PayFast, JazzCash, Easypaisa) must inherit and implement these methods.
 */
export class PaymentProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Validate required environment variables and credentials
   * @returns {{ valid: boolean, missing: string[] }}
   */
  validateConfig() {
    throw new Error("validateConfig() must be implemented by subclass");
  }

  /**
   * Check if provider is ready to process live transactions
   * @returns {boolean}
   */
  isConfigured() {
    return this.validateConfig().valid;
  }

  /**
   * Initialize payment with provider
   * @param {Object} params
   * @returns {Promise<{ redirectUrl?: string, transactionId: string, formParams?: Object, raw: any }>}
   */
  async initiatePayment(params) {
    throw new Error("initiatePayment() must be implemented by subclass");
  }

  /**
   * Verify transaction with provider directly via API inquiry
   * @param {string} transactionRef
   * @param {Object} queryParams
   * @returns {Promise<{ verified: boolean, status: string, amount: number, currency: string, failureReason?: string, raw: any }>}
   */
  async verifyPayment(transactionRef, queryParams) {
    throw new Error("verifyPayment() must be implemented by subclass");
  }

  /**
   * Verify signed webhook from payment gateway
   * @param {Object} payload
   * @param {string} signature
   * @param {Object} headers
   * @returns {Promise<{ valid: boolean, transactionRef: string, status: string, amount: number, eventId: string }>}
   */
  async verifyWebhook(payload, signature, headers) {
    throw new Error("verifyWebhook() must be implemented by subclass");
  }

  /**
   * Request refund from provider
   * @param {Object} params
   * @returns {Promise<{ success: boolean, refundReference?: string, message?: string }>}
   */
  async processRefund(params) {
    throw new Error("processRefund() must be implemented by subclass");
  }
}

export default PaymentProvider;
