import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * POST /api/payment/webhook
 * Receives asynchronous webhook events from Razorpay.
 * Enforces cryptographic signature verification and replay protection.
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let isValid = false;
    try {
      isValid = verifyRazorpayWebhookSignature({ rawBody, signature });
    } catch (err) {
      console.error("Webhook secret missing or verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook verification configuration error." },
        { status: 500 }
      );
    }

    if (!isValid) {
      console.warn("Unauthorized webhook attempt rejected: invalid signature.");
      return NextResponse.json(
        { error: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload?.payment?.entity;

    if (!payload) {
      return NextResponse.json({ status: "ignored_no_payload" });
    }

    const paymentId = payload.id;
    const orderId = payload.order_id;
    const amountInRupees = payload.amount / 100;
    const method = payload.method || "razorpay";
    const notes = payload.notes || {};
    const userId = notes.userId;
    const purchaseType = notes.purchaseType || "buyer_base";
    const receiptNumber = notes.receiptNumber || `US-${Date.now().toString(36).toUpperCase()}`;

    if (eventType === "payment.captured") {
      // Check if already processed
      const existing = await db.execute(sql`
        SELECT id, status FROM payments 
        WHERE transaction_id = ${paymentId} 
           OR (gateway_payment_id = ${paymentId})
        LIMIT 1
      `).catch(() => {
        return db.execute(sql`
          SELECT id, status FROM payments 
          WHERE transaction_id = ${paymentId} 
          LIMIT 1
        `);
      });

      if (!existing || existing.length === 0) {
        // Record payment
        try {
          await db.execute(sql`
            INSERT INTO payments (
              user_id, amount, method, payment_method, status, transaction_id, 
              gateway_order_id, gateway_payment_id, gateway_signature, 
              receipt_number, purchase_type, paid_at, created_at
            ) VALUES (
              ${userId || "unknown"}, ${amountInRupees}, ${method}, ${method}, 'completed', ${paymentId},
              ${orderId}, ${paymentId}, ${signature},
              ${receiptNumber}, ${purchaseType}, now(), now()
            )
          `);
        } catch {
          await db.execute(sql`
            INSERT INTO payments (
              user_id, amount, method, payment_method, status, transaction_id, 
              receipt_number, paid_at, created_at
            ) VALUES (
              ${userId || "unknown"}, ${amountInRupees}, ${method}, ${method}, 'completed', ${paymentId},
              ${receiptNumber}, now(), now()
            )
          `);
        }

        // Grant access entitlements if userId is known
        if (userId) {
          if (purchaseType === "buyer_base" || purchaseType === "both_roles") {
            await db.execute(sql`
              UPDATE buyer_profiles 
              SET remaining_views = 10,
                  seller_views_allowance = 10,
                  is_active = true
              WHERE user_id = ${userId}
            `);
          } else if (purchaseType === "buyer_addon_views") {
            await db.execute(sql`
              UPDATE buyer_profiles 
              SET remaining_views = remaining_views + 10,
                  seller_views_allowance = seller_views_allowance + 10
              WHERE user_id = ${userId}
            `);
          }

          if (purchaseType === "seller_monthly" || purchaseType === "both_roles") {
            await db.execute(sql`
              UPDATE seller_profiles 
              SET subscription_status = 'active' 
              WHERE user_id = ${userId}
            `).catch(() => {});
          }
        }
      }
    } else if (eventType === "payment.failed") {
      try {
        await db.execute(sql`
          INSERT INTO payments (
            user_id, amount, method, status, transaction_id, 
            gateway_order_id, receipt_number, created_at
          ) VALUES (
            ${userId || "unknown"}, ${amountInRupees}, ${method}, 'failed', ${paymentId},
            ${orderId}, ${receiptNumber}, now()
          )
        `);
      } catch {
        // Fallback
        await db.execute(sql`
          INSERT INTO payments (
            user_id, amount, method, status, transaction_id, 
            receipt_number, created_at
          ) VALUES (
            ${userId || "unknown"}, ${amountInRupees}, ${method}, 'failed', ${paymentId},
            ${receiptNumber}, now()
          )
        `);
      }
    }

    return NextResponse.json({ status: "success", event: eventType });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook handler encountered an error." },
      { status: 500 }
    );
  }
}

