import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyer/enquiries
 * Retrieves all enquiries submitted by the authenticated buyer from PostgreSQL.
 *
 * Security: Strictly filters by buyer_id = user.id. Buyers cannot see enquiries of other users.
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
        { error: "Unauthorized. Please sign in to view your enquiries." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check if enquiries table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'enquiries'
      LIMIT 1
    `);

    if (!tableCheck || tableCheck.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        enquiries: [],
      });
    }

    // Fetch buyer's enquiries joined with seller_profiles
    const enquiryRows = await db.execute(sql`
      SELECT 
        e.*,
        s.business_name as seller_name,
        s.business_category as seller_category,
        s.city as seller_city,
        s.state as seller_state,
        s.is_verified as seller_verified
      FROM enquiries e
      LEFT JOIN seller_profiles s ON e.seller_id = s.user_id OR e.seller_id = s.id::text
      WHERE e.buyer_id = ${userId}
      ORDER BY e.created_at DESC
    `);

    const enquiries = enquiryRows.map((r) => ({
      id: r.id,
      buyerId: r.buyer_id,
      sellerId: r.seller_id,
      sellerName: r.seller_name || "Verified Agro Supplier",
      sellerCategory: r.seller_category || "Farmer or Producer",
      sellerLocation: `${r.seller_city || ""}, ${r.seller_state || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
      isSellerVerified: Boolean(r.seller_verified),
      productId: r.product_id,
      category: r.category || "Commodities",
      quantity: r.quantity,
      unit: r.unit || "quintal",
      grade: r.grade || "Grade A",
      packaging: r.packaging || "Standard Jute Bags (50kg)",
      deliveryLocation: r.delivery_location,
      targetPrice: r.target_price,
      notes: r.notes,
      attachmentUrl: r.attachment_url,
      status: r.status || "sent", // 'sent' | 'reviewed' | 'accepted' | 'rejected'
      sellerResponse: r.seller_response || null,
      respondedAt: r.responded_at || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({
      success: true,
      total: enquiries.length,
      enquiries,
    });
  } catch (error) {
    console.error("Buyer Enquiries Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve enquiry history from database." },
      { status: 500 }
    );
  }
}

