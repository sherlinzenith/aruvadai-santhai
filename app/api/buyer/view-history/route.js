import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyer/view-history
 * Retrieves the full seller-view history and unlocked contacts for the authenticated buyer.
 * Ensures users cannot access another buyer's private view history.
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
        { error: "Unauthorized. Please sign in to view your contact history." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 1. Check if seller_views table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'seller_views'
      LIMIT 1
    `);

    let history = [];

    if (tableCheck && tableCheck.length > 0) {
      // Query relational view history joined with seller_profiles
      const rows = await db.execute(sql`
        SELECT 
          v.id as view_id,
          v.seller_user_id as seller_id,
          v.first_viewed_at,
          s.business_name,
          s.business_category,
          s.city,
          s.state,
          s.contact_person,
          s.mobile,
          s.email,
          s.address,
          s.is_verified
        FROM seller_views v
        LEFT JOIN seller_profiles s ON v.seller_user_id = s.user_id OR v.seller_user_id = s.id::text
        WHERE v.buyer_user_id = ${userId}
        ORDER BY v.first_viewed_at DESC
      `);

      history = rows.map((r) => ({
        viewId: r.view_id,
        sellerId: r.seller_id,
        businessName: r.business_name || "Verified Agro Seller",
        businessCategory: r.business_category || "Commodity Supplier",
        location: `${r.city || ""}, ${r.state || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
        isVerified: Boolean(r.is_verified),
        firstViewedAt: r.first_viewed_at,
        contact: {
          contactPerson: r.contact_person || "Sales Representative",
          mobile: r.mobile || "+91 98450 XXXXX",
          email: r.email || "sales@ulavansanthai.com",
          address: r.address || "",
        },
      }));
    } else {
      // Fallback: Read from buyer_profiles.viewed_sellers
      const buyerRow = await db.execute(sql`
        SELECT viewed_sellers 
        FROM buyer_profiles 
        WHERE user_id = ${userId}
        LIMIT 1
      `);

      const viewedSellers = Array.isArray(buyerRow?.[0]?.viewed_sellers)
        ? buyerRow[0].viewed_sellers
        : [];

      for (const sellerKey of viewedSellers) {
        const sRows = await db.execute(sql`
          SELECT id, user_id, business_name, business_category, city, state, contact_person, mobile, email, address, is_verified
          FROM seller_profiles 
          WHERE user_id = ${sellerKey} OR id::text = ${sellerKey} OR business_name = ${sellerKey}
          LIMIT 1
        `);
        const s = sRows?.[0] || null;

        history.push({
          sellerId: s?.user_id || s?.id || sellerKey,
          businessName: s?.business_name || sellerKey,
          businessCategory: s?.business_category || "Commodity Supplier",
          location: `${s?.city || ""}, ${s?.state || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
          isVerified: Boolean(s?.is_verified),
          firstViewedAt: new Date().toISOString(),
          contact: {
            contactPerson: s?.contact_person || "Sales Representative",
            mobile: s?.mobile || "+91 98450 XXXXX",
            email: s?.email || "sales@ulavansanthai.com",
            address: s?.address || "",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalUnlocked: history.length,
      history,
    });
  } catch (error) {
    console.error("Seller View History Query Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve seller view history." },
      { status: 500 }
    );
  }
}

