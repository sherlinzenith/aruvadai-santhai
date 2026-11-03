import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { createRazorpayOrder } from "@/lib/razorpay";
import { PRICING } from "@/lib/config";

export const runtime = "nodejs";

/**
 * POST /api/payment/create-order
 * Creates a server-side order with Razorpay in Test Mode.
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
        { error: "Unauthorized. Please sign in to initiate payment." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { purchaseType = "buyer_base", customAmount } = body;

    // Calculate exact pricing based on purchase type
    let expectedAmount = 0;
    if (purchaseType === "buyer_base") {
      expectedAmount = PRICING.buyerBaseFee; // 365
    } else if (purchaseType === "seller_monthly") {
      expectedAmount = PRICING.sellerMonthlyFee; // 365
    } else if (purchaseType === "both_roles") {
      expectedAmount = PRICING.buyerBaseFee + PRICING.sellerMonthlyFee; // 730
    } else if (purchaseType === "buyer_addon_views") {
      expectedAmount = customAmount || PRICING.buyerAddonFee; // 10
    } else {
      return NextResponse.json(
        { error: `Invalid purchase type '${purchaseType}'.` },
        { status: 400 }
      );
    }

    // Check if Razorpay keys are configured in environment
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          configured: false,
          error:
            "Razorpay Test Mode credentials are not yet configured in .env.local. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        },
        { status: 503 }
      );
    }

    // Generate internal receipt identifier: US-timestamp-shortId
    const receiptNumber = `US-${Date.now().toString(36).toUpperCase()}-${user.id.slice(0, 4).toUpperCase()}`;

    // Create order on Razorpay
    const order = await createRazorpayOrder({
      amountInRupees: expectedAmount,
      receipt: receiptNumber,
      notes: {
        userId: user.id,
        userEmail: user.email || "",
        purchaseType,
        receiptNumber,
      },
    });

    return NextResponse.json({
      success: true,
      configured: true,
      orderId: order.id,
      amount: order.amount, // in paise
      amountInRupees: expectedAmount,
      currency: order.currency,
      receiptNumber,
      keyId, // Public Key ID passed to client checkout modal
      purchaseType,
    });
  } catch (error) {
    console.error("Payment Order Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order." },
      { status: 500 }
    );
  }
}

