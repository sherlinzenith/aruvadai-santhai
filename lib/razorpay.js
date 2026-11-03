import crypto from "crypto";

/**
 * Server-side helper: Create Razorpay Order
 * Uses official REST API endpoint (https://api.razorpay.com/v1/orders)
 *
 * @param {Object} params
 * @param {number} params.amountInRupees - Amount in INR (will be converted to paise)
 * @param {string} params.receipt - Internal receipt or order identifier
 * @param {Object} [params.notes] - Key-value metadata
 * @returns {Promise<Object>} Razorpay Order Object
 */
export async function createRazorpayOrder({ amountInRupees, receipt, notes = {} }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay test keys are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local."
    );
  }

  // Razorpay expects amount in the smallest currency sub-unit (paise for INR, ₹1 = 100 paise)
  const amountInPaise = Math.round(Number(amountInRupees) * 100);

  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt: String(receipt).slice(0, 40),
      notes,
      payment_capture: 1, // Automatically capture payments
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.message || "Failed to create Razorpay order.");
  }

  return data;
}

/**
 * Server-side helper: Verify Razorpay Payment Signature
 * Formula: HMAC_SHA256(order_id + "|" + razorpay_payment_id, secret) == razorpay_signature
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string} params.paymentId
 * @param {string} params.signature
 * @returns {boolean}
 */
export function verifyRazorpayPaymentSignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured in .env.local.");
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

/**
 * Server-side helper: Verify Razorpay Webhook Signature
 * Header: X-Razorpay-Signature
 * Formula: HMAC_SHA256(rawRequestBody, webhookSecret) == X-Razorpay-Signature
 *
 * @param {Object} params
 * @param {string} params.rawBody - Raw unparsed webhook request body string
 * @param {string} params.signature - Header 'x-razorpay-signature'
 * @returns {boolean}
 */
export function verifyRazorpayWebhookSignature({ rawBody, signature }) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured in .env.local.");
  }

  if (!rawBody || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return generatedSignature === signature;
}

