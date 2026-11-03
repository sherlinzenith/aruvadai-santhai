import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/buyer/enquiries/[id]
 * Retrieves full details for a single enquiry.
 *
 * Security: Enforces that the authenticated buyer is the author of this enquiry (buyer_id = user.id).
 * Cross-user unauthorized access is strictly blocked with 403 Forbidden.
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
        { error: "Unauthorized. Please sign in to view enquiry details." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing enquiry ID." }, { status: 400 });
    }

    // 1. Fetch enquiry
    const rows = await db.execute(sql`
      SELECT 
        e.*,
        s.business_name as seller_name,
        s.business_category as seller_category,
        s.city as seller_city,
        s.state as seller_state,
        s.is_verified as seller_verified
      FROM enquiries e
      LEFT JOIN seller_profiles s ON e.seller_id = s.user_id OR e.seller_id = s.id::text
      WHERE e.id::text = ${id}
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    const enq = rows[0];

    // 2. Authorization check: Buyer must be the owner of this enquiry
    if (enq.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You are not authorized to access another buyer's enquiry." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      enquiry: {
        id: enq.id,
        buyerId: enq.buyer_id,
        sellerId: enq.seller_id,
        sellerName: enq.seller_name || "Verified Agro Supplier",
        sellerCategory: enq.seller_category || "Farmer or Producer",
        sellerLocation: `${enq.seller_city || ""}, ${enq.seller_state || ""}`.trim().replace(/^,\s*|,\s*$/g, ""),
        isSellerVerified: Boolean(enq.seller_verified),
        productId: enq.product_id,
        category: enq.category,
        quantity: enq.quantity,
        unit: enq.unit,
        grade: enq.grade,
        packaging: enq.packaging,
        deliveryLocation: enq.delivery_location,
        targetPrice: enq.target_price,
        notes: enq.notes,
        attachmentUrl: enq.attachment_url,
        status: enq.status,
        sellerResponse: enq.seller_response || null,
        respondedAt: enq.responded_at || null,
        createdAt: enq.created_at,
        updatedAt: enq.updated_at,
      },
    });
  } catch (error) {
    console.error("Enquiry Details Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enquiry details." },
      { status: 500 }
    );
  }
}

