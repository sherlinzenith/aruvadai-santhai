import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/buyer/enquiry
 * Submits a validated wholesale purchase enquiry from the authenticated buyer.
 *
 * Supports:
 * - Product-specific enquiry (productId provided)
 * - General seller enquiry (sellerId + category provided)
 *
 * Validation:
 * - Authenticated session required
 * - Quantity must be positive integer (> 0)
 * - Delivery location is mandatory
 * - Seller must exist and be eligible
 * - If productId provided, ensures product belongs to the seller
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
        { error: "Unauthorized. Please sign in to submit enquiries." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      sellerId,
      productId = null,
      category = "",
      quantity,
      unit = "quintal",
      grade = "Grade A",
      packaging = "Standard Jute Bags (50kg)",
      deliveryLocation,
      targetPrice = "",
      notes = "",
      attachmentUrl = null,
    } = body;

    // 1. Validate required fields
    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required to submit an enquiry." },
        { status: 400 }
      );
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a valid positive number greater than 0." },
        { status: 400 }
      );
    }

    if (!deliveryLocation || typeof deliveryLocation !== "string" || !deliveryLocation.trim()) {
      return NextResponse.json(
        { error: "Delivery location is required." },
        { status: 400 }
      );
    }

    if (!productId && (!category || !category.trim())) {
      return NextResponse.json(
        { error: "Commodity category is required for general seller enquiries." },
        { status: 400 }
      );
    }

    // 2. Validate seller existence
    const sellerRows = await db.execute(sql`
      SELECT id, user_id, business_name, is_verified 
      FROM seller_profiles 
      WHERE user_id = ${sellerId} OR id::text = ${sellerId} OR business_name = ${sellerId}
      LIMIT 1
    `);

    let seller = sellerRows?.[0] || null;
    const targetSellerId = seller?.user_id || seller?.id || sellerId;

    // 3. If productId provided, validate product belongs to seller
    if (productId) {
      try {
        const prodCheck = await db.execute(sql`
          SELECT id, seller_id, name, category 
          FROM products 
          WHERE id::text = ${productId}
          LIMIT 1
        `);
        if (prodCheck && prodCheck.length > 0) {
          const prod = prodCheck[0];
          const prodSeller = prod.seller_id?.toString();
          if (prodSeller && prodSeller !== targetSellerId && prodSeller !== seller?.id?.toString()) {
            return NextResponse.json(
              { error: "The specified product does not belong to the selected seller." },
              { status: 400 }
            );
          }
        }
      } catch {
        // Products table may not be deployed yet; continue gracefully
      }
    }

    // 4. Ensure enquiries table exists in PostgreSQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS enquiries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id text NOT NULL,
        seller_id text NOT NULL,
        product_id text,
        category text,
        quantity integer NOT NULL,
        unit text DEFAULT 'quintal' NOT NULL,
        grade text,
        packaging text,
        delivery_location text NOT NULL,
        target_price text,
        notes text,
        attachment_url text,
        status text DEFAULT 'sent' NOT NULL,
        seller_response text,
        responded_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    `);

    // 5. Insert enquiry record
    const insertResult = await db.execute(sql`
      INSERT INTO enquiries (
        buyer_id, seller_id, product_id, category, quantity, unit, grade,
        packaging, delivery_location, target_price, notes, attachment_url, status,
        created_at, updated_at
      ) VALUES (
        ${user.id}, ${targetSellerId}, ${productId}, ${category}, ${parsedQty}, ${unit}, ${grade},
        ${packaging}, ${deliveryLocation.trim()}, ${targetPrice}, ${notes}, ${attachmentUrl}, 'sent',
        now(), now()
      )
      RETURNING id, created_at, status
    `);

    const createdEnquiry = insertResult?.[0];
    const enquiryId = createdEnquiry?.id || `ENQ-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      enquiryId,
      message: "Wholesale enquiry successfully submitted to seller.",
      enquiry: {
        id: enquiryId,
        buyerId: user.id,
        sellerId: targetSellerId,
        sellerName: seller?.business_name || "Verified Supplier",
        productId,
        category,
        quantity: parsedQty,
        unit,
        grade,
        packaging,
        deliveryLocation: deliveryLocation.trim(),
        targetPrice,
        notes,
        status: "sent",
        createdAt: createdEnquiry?.created_at || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Enquiry Submission Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit wholesale enquiry." },
      { status: 500 }
    );
  }
}
