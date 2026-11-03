import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { PRICING } from "@/lib/config";

export const runtime = "nodejs";

/**
 * POST /api/payment/verify
 * Verifies Razorpay HMAC-SHA256 signature and records payment in PostgreSQL.
 * Idempotently grants access entitlements upon success.
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to verify payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      orderId,
      paymentId,
      signature,
      purchaseType = "buyer_base",
      receiptNumber,
      method = "razorpay_checkout",
    } = body;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      console.error("Payment Signature Verification Failed:", { orderId, paymentId });
      return NextResponse.json(
        { error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    // 2. Check for existing payment record with this transaction ID (Idempotency)
    const existingPayment = await db.execute(sql`
      SELECT id, status, receipt_number 
      FROM payments 
      WHERE transaction_id = ${paymentId} 
         OR (gateway_payment_id = ${paymentId})
      LIMIT 1
    `).catch(() => {
      // Fallback if gateway_payment_id column doesn't exist yet
      return db.execute(sql`
        SELECT id, status, receipt_number 
        FROM payments 
        WHERE transaction_id = ${paymentId} 
        LIMIT 1
      `);
    });

    if (existingPayment && existingPayment.length > 0 && existingPayment[0].status === "completed") {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        receiptNumber: existingPayment[0].receipt_number,
        transactionId: paymentId,
        message: "Payment was already verified and processed.",
      });
    }

    // Calculate amount for recording
    let amount = PRICING.buyerBaseFee;
    if (purchaseType === "seller_monthly") amount = PRICING.sellerMonthlyFee;
    if (purchaseType === "both_roles") amount = PRICING.buyerBaseFee + PRICING.sellerMonthlyFee;
    if (purchaseType === "buyer_addon_views") amount = PRICING.buyerAddonFee;

    const finalReceipt = receiptNumber || `US-${Date.now().toString(36).toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}`;

    // 3. Persist payment record
    // Defensively check if extended columns exist
    try {
      await db.execute(sql`
        INSERT INTO payments (
          user_id, amount, method, payment_method, status, transaction_id, 
          gateway_order_id, gateway_payment_id, gateway_signature, 
          receipt_number, purchase_type, paid_at, created_at
        ) VALUES (
          ${user.id}, ${amount}, ${method}, ${method}, 'completed', ${paymentId},
          ${orderId}, ${paymentId}, ${signature},
          ${finalReceipt}, ${purchaseType}, now(), now()
        )
      `);
    } catch {
      // Fallback for baseline table schema before migration is applied
      await db.execute(sql`
        INSERT INTO payments (
          user_id, amount, method, payment_method, status, transaction_id, 
          receipt_number, paid_at, created_at
        ) VALUES (
          ${user.id}, ${amount}, ${method}, ${method}, 'completed', ${paymentId},
          ${finalReceipt}, now(), now()
        )
      `);
    }

    // 4. Grant Access Entitlements
    if (purchaseType === "buyer_base" || purchaseType === "both_roles") {
      // Grant 10 seller views for base buyer payment
      await db.execute(sql`
        UPDATE buyer_profiles 
        SET remaining_views = 10,
            seller_views_allowance = 10,
            is_active = true
        WHERE user_id = ${user.id}
      `);
    } else if (purchaseType === "buyer_addon_views") {
      // Add 10 views for add-on package
      await db.execute(sql`
        UPDATE buyer_profiles 
        SET remaining_views = remaining_views + 10,
            seller_views_allowance = seller_views_allowance + 10
        WHERE user_id = ${user.id}
      `);
    }

    if (purchaseType === "seller_monthly" || purchaseType === "both_roles") {
      // Activate seller subscription
      await db.execute(sql`
        UPDATE seller_profiles 
        SET subscription_status = 'active' 
        WHERE user_id = ${user.id}
      `).catch((err) => {
        console.warn("Seller profile not found or update skipped:", err.message);
      });
    }

    // 5. Update user_profiles admin review status to 'pending'
    await db.execute(sql`
      UPDATE user_profiles 
      SET admin_status = 'pending' 
      WHERE user_id = ${user.id}
    `).catch(() => {});

    return NextResponse.json({
      success: true,
      receiptNumber: finalReceipt,
      transactionId: paymentId,
      orderId,
      purchaseType,
      amount,
      message: "Payment successfully verified and access entitlements credited.",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal error during payment verification." },
      { status: 500 }
    );
  }
}

