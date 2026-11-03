import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/products/[id]
 * Retrieves single product details with sanitized public seller profile.
 * Only unlocks private contact details if buyer has previously consumed a view entitlement.
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
        { error: "Unauthorized. Please sign in to view product details." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing product ID." }, { status: 400 });
    }

    // Check if products table exists
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'products'
      LIMIT 1
    `);

    if (!tableCheck || tableCheck.length === 0) {
      return NextResponse.json(
        { error: "Products table is not yet deployed by Person 2." },
        { status: 404 }
      );
    }

    // Fetch product with seller join
    const rows = await db.execute(sql`
      SELECT 
        p.*,
        s.id as seller_id,
        s.user_id as seller_user_id,
        s.business_name,
        s.business_category,
        s.city as seller_city,
        s.state as seller_state,
        s.is_verified as seller_verified,
        s.mobile as seller_mobile,
        s.email as seller_email,
        s.contact_person as seller_contact_person
      FROM products p
      LEFT JOIN seller_profiles s ON p.seller_id::text = s.user_id OR p.seller_id = s.id
      WHERE p.id::text = ${id}
      LIMIT 1
    `);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const r = rows[0];

    // Check if buyer has unlocked this seller
    const buyerProfile = await db.execute(sql`
      SELECT viewed_sellers, remaining_views 
      FROM buyer_profiles 
      WHERE user_id = ${user.id} 
      LIMIT 1
    `);

    const viewedSellers = Array.isArray(buyerProfile?.[0]?.viewed_sellers)
      ? buyerProfile[0].viewed_sellers
      : [];

    const sellerIdentifier = r.seller_user_id || r.seller_id || r.business_name;
    const isUnlocked = viewedSellers.includes(sellerIdentifier) || viewedSellers.includes(r.business_name);

    const product = {
      id: r.id,
      name: r.name,
      category: r.category,
      origin: r.origin,
      grade: r.grade || "A",
      moq: Number(r.moq) || 1,
      unit: r.unit || "quintal",
      price: r.price,
      avail: r.avail || "Available",
      organic: Boolean(r.organic),
      image: r.image || "/products/rice.jpg",
      description: r.description || "Fresh commodity direct from verified agro producer.",
      variety: r.variety || null,
      size: r.size || null,
      packaging: r.packaging || "Standard jute gunny bags",
      priceSlabs: r.price_slabs || null,
      gstDetails: r.gst_details || null,
      status: r.status || "published",
      createdAt: r.created_at,
      seller: {
        id: r.seller_id,
        businessName: r.business_name || "Verified Agro Producer",
        businessCategory: r.business_category || "Wholesale Farmer",
        location: `${r.seller_city || ""}, ${r.seller_state || ""}`.trim().replace(/^,\s*|,\s*$/g, "") || r.origin,
        isVerified: Boolean(r.seller_verified),
        isUnlocked,
        // Only disclose private contact info if unlocked
        contact: isUnlocked
          ? {
              person: r.seller_contact_person,
              mobile: r.seller_mobile,
              email: r.seller_email,
            }
          : null,
      },
      buyerAccess: {
        remainingViews: buyerProfile?.[0]?.remaining_views ?? 0,
      },
    };

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Single Product Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details." },
      { status: 500 }
    );
  }
}
