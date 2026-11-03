import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { PRICING } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyer/access
 * Retrieves current buyer seller-view allowance, remaining unlocks,
 * and add-on purchase availability.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to check access entitlement." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Fetch buyer profile
    const buyerRows = await db.execute(sql`
      SELECT seller_views_allowance, remaining_views, viewed_sellers, is_active
      FROM buyer_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    // 2. Fetch user profile (admin approval status)
    const userProfileRows = await db.execute(sql`
      SELECT admin_status, roles
      FROM user_profiles 
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    // 3. Fetch latest payment status
    const paymentRows = await db.execute(sql`
      SELECT status, amount, receipt_number, created_at, paid_at
      FROM payments 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    const buyer = buyerRows?.[0] || null;
    const userProfile = userProfileRows?.[0] || null;
    const latestPayment = paymentRows?.[0] || null;

    const totalAllowance = buyer?.seller_views_allowance ?? PRICING.baseSellerViews;
    const remainingViews = buyer?.remaining_views ?? PRICING.baseSellerViews;
    const usedViews = Math.max(0, totalAllowance - remainingViews);
    const viewedSellers = Array.isArray(buyer?.viewed_sellers) ? buyer.viewed_sellers : [];

    const isPaid = latestPayment?.status === "completed";
    const adminStatus = userProfile?.admin_status || "pending";
    const isApproved = adminStatus === "approved";

    return NextResponse.json({
      success: true,
      entitlement: {
        userId,
        totalAllowance,
        remainingViews,
        usedViews,
        unlockedCount: viewedSellers.length,
        canUnlock: remainingViews > 0,
        isPaid,
        adminStatus,
        isApproved,
        addonPackage: {
          fee: PRICING.buyerAddonFee, // ₹10
          viewsGranted: PRICING.addonSellerViews, // 10
        },
      },
    });
  } catch (error) {
    console.error("Buyer Access Query Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve access entitlement." },
      { status: 500 }
    );
  }
}

