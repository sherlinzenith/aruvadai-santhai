import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/sellers/[id]/contact
 * Secure endpoint to retrieve private seller contact details.
 * Strictly verifies whether the authenticated buyer has unlocked this seller.
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
        { error: "Unauthorized. Please sign in to access seller contact details." },
        { status: 401 }
      );
    }

    const { id: sellerId } = params;
    if (!sellerId) {
      return NextResponse.json({ error: "Missing seller ID." }, { status: 400 });
    }

    // 1. Fetch seller profile
    const sellerRows = await db.execute(sql`
      SELECT id, user_id, business_name, business_category, contact_person, mobile, email, address, city, state, is_verified
      FROM seller_profiles 
      WHERE id::text = ${sellerId} OR user_id = ${sellerId} OR business_name = ${sellerId}
      LIMIT 1
    `);

    if (!sellerRows || sellerRows.length === 0) {
      return NextResponse.json({ error: "Seller profile not found." }, { status: 404 });
    }

    const s = sellerRows[0];
    const targetKey = s.user_id || s.id;

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

    let isUnlocked = viewedSellers.includes(targetKey) || viewedSellers.includes(s.business_name);

    if (!isUnlocked) {
      try {
        const viewRow = await db.execute(sql`
          SELECT id FROM seller_views 
          WHERE buyer_user_id = ${user.id} AND seller_user_id = ${targetKey}
          LIMIT 1
        `);
        if (viewRow && viewRow.length > 0) isUnlocked = true;
      } catch {
        // Table may not exist yet
      }
    }

    // 3. Reject if not unlocked
    if (!isUnlocked) {
      return NextResponse.json(
        {
          error: "locked",
          message: "Seller contact details are locked. Please unlock using your seller view allowance.",
          remainingViews: buyerProfile?.[0]?.remaining_views ?? 0,
        },
        { status: 403 }
      );
    }

    // 4. Return authorized contact details
    return NextResponse.json({
      success: true,
      sellerId: targetKey,
      businessName: s.business_name,
      contact: {
        contactPerson: s.contact_person,
        mobile: s.mobile,
        email: s.email,
        address: s.address,
        city: s.city,
        state: s.state,
      },
    });
  } catch (error) {
    console.error("Seller Contact Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve seller contact information." },
      { status: 500 }
    );
  }
}

