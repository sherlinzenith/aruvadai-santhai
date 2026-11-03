import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sellers/[id]
 * Retrieves public seller profile information and their published commodities.
 * Protects private seller phone, email, and GSTIN until unlocked by the buyer.
 */
export async function GET(request, { params }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view seller profile." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing seller ID." }, { status: 400 });
    }

    // 1. Fetch seller profile from PostgreSQL
    const sellerRows = await db.execute(sql`
      SELECT * FROM seller_profiles 
      WHERE id::text = ${id} OR user_id = ${id}
      LIMIT 1
    `);

    if (!sellerRows || sellerRows.length === 0) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const s = sellerRows[0];

    // 2. Check if buyer has unlocked this seller
    const buyerProfile = await db.execute(sql`
      SELECT viewed_sellers, remaining_views 
      FROM buyer_profiles 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `);

    const viewedSellers = Array.isArray(buyerProfile?.[0]?.viewed_sellers)
      ? buyerProfile[0].viewed_sellers
      : [];

    const isUnlocked =
      viewedSellers.includes(s.id) ||
      viewedSellers.includes(s.user_id) ||
      viewedSellers.includes(s.business_name);

    // 3. Fetch published products by this seller if products table exists
    let publishedProducts = [];
    try {
      const prodRows = await db.execute(sql`
        SELECT id, name, category, origin, grade, moq, unit, price, avail, organic, image, created_at
        FROM products 
        WHERE (seller_id::text = ${s.user_id} OR seller_id::text = ${s.id})
          AND status = 'published'
        ORDER BY created_at DESC
      `);
      publishedProducts = prodRows || [];
    } catch {
      publishedProducts = [];
    }

    // 4. Return sanitized public profile
    const sellerProfile = {
      id: s.id,
      userId: s.user_id,
      businessName: s.business_name,
      businessCategory: s.business_category,
      accountType: s.account_type,
      location: {
        city: s.city,
        state: s.state,
        pincode: isUnlocked ? s.pincode : undefined,
      },
      isVerified: Boolean(s.is_verified),
      approvedAt: s.approved_at,
      subscriptionStatus: s.subscription_status,
      publishedProducts,
      isUnlocked,
      // Protected seller contact information
      contact: isUnlocked
        ? {
            contactPerson: s.contact_person,
            mobile: s.mobile,
            email: s.email,
            address: s.address,
          }
        : null,
      buyerRemainingViews: buyerProfile?.[0]?.remaining_views ?? 0,
    };

    return NextResponse.json({ success: true, seller: sellerProfile });
  } catch (error) {
    console.error("Seller Profile API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch seller profile." },
      { status: 500 }
    );
  }
}
