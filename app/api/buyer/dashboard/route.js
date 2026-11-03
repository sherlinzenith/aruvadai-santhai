import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyer/dashboard
 * Returns the currently authenticated buyer's real profile, view allowances,
 * payment history, and recent enquiries from PostgreSQL.
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
        { error: "Unauthorized. Please sign in to access buyer dashboard." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Fetch buyer profile
    const buyerProfileRows = await db.execute(sql`
      SELECT * FROM buyer_profiles 
      WHERE user_id = ${userId} 
      LIMIT 1
    `);

    // 2. Fetch user profile (admin review status and roles)
    const userProfileRows = await db.execute(sql`
      SELECT * FROM user_profiles 
      WHERE user_id = ${userId} 
      LIMIT 1
    `);

    // 3. Fetch latest payment record
    const paymentRows = await db.execute(sql`
      SELECT id, amount, status, receipt_number, transaction_id, created_at, paid_at
      FROM payments 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    // 4. Fetch recent enquiries (defensively checking if enquiries table exists)
    let enquiries = [];
    try {
      const enquiryRows = await db.execute(sql`
        SELECT * FROM enquiries 
        WHERE buyer_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      enquiries = enquiryRows || [];
    } catch {
      // Enquiries table may not exist yet if Person 2 has not run migration
      enquiries = [];
    }

    const buyer = buyerProfileRows?.[0] || null;
    const userProfile = userProfileRows?.[0] || null;
    const latestPayment = paymentRows?.[0] || null;

    const totalAllowance = buyer?.seller_views_allowance ?? 10;
    const remainingViews = buyer?.remaining_views ?? 10;
    const viewedSellers = Array.isArray(buyer?.viewed_sellers)
      ? buyer.viewed_sellers
      : [];
    const usedViews = Math.max(0, totalAllowance - remainingViews);

    const roles = Array.isArray(userProfile?.roles)
      ? userProfile.roles
      : ["buyer"];

    const accountType =
      buyer?.account_type || userProfile?.account_type || "individual";

    const adminStatus = userProfile?.admin_status || "pending";
    const rejectionReason = userProfile?.rejection_reason || null;

    return NextResponse.json({
      success: true,
      buyer: {
        userId,
        name: buyer?.name || userProfile?.full_name || user.user_metadata?.full_name || "Verified Buyer",
        email: buyer?.email || user.email || "",
        mobile: buyer?.mobile || user.user_metadata?.mobile || "",
        accountType,
        roles,
        details: {
          address: buyer?.address || "",
          city: buyer?.city || "",
          state: buyer?.state || "",
          pincode: buyer?.pincode || "",
          purposes: buyer?.purposes || [],
          companyLegalName: buyer?.company_legal_name || "",
          gstin: buyer?.gstin || "",
          businessCategory: buyer?.business_category || "",
        },
        profileCompletion: buyer ? 100 : 50,
        viewStats: {
          totalAllowance,
          remainingViews,
          usedViews,
          viewedSellers,
        },
        adminReview: {
          status: adminStatus,
          rejectionReason,
          reviewedAt: userProfile?.reviewed_at || null,
        },
        payment: latestPayment
          ? {
              isPaid: latestPayment.status === "completed",
              status: latestPayment.status,
              amount: Number(latestPayment.amount),
              receiptNumber: latestPayment.receipt_number,
              transactionId: latestPayment.transaction_id,
              date: latestPayment.paid_at || latestPayment.created_at,
            }
          : {
              isPaid: false,
              status: "pending",
              amount: 365,
            },
        recentPayments: paymentRows || [],
        recentEnquiries: enquiries,
      },
    });
  } catch (error) {
    console.error("Buyer Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching buyer dashboard data." },
      { status: 500 }
    );
  }
}
