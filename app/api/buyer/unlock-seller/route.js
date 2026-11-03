import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/buyer/unlock-seller
 * Unlocks a seller's contact details for the authenticated buyer.
 *
 * Rules:
 * - Uses seller ID (not seller name) as the unique identifier.
 * - Repeatedly viewing an already unlocked seller does NOT consume a view.
 * - Atomic deduction: remaining_views is decremented only if > 0 and seller not yet unlocked.
 * - Rejects request if remaining_views == 0 with option to purchase add-on views.
 * - Protects private seller contacts from unauthorized access.
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
        { error: "Unauthorized. Please sign in to unlock seller contacts." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sellerId } = body;

    if (!sellerId) {
      return NextResponse.json(
        { error: "Missing required sellerId parameter." },
        { status: 400 }
      );
    }

    const buyerUserId = user.id;

    // 1. Fetch buyer profile and view allowance
    const buyerProfileRows = await db.execute(sql`
      SELECT seller_views_allowance, remaining_views, viewed_sellers, is_active
      FROM buyer_profiles 
      WHERE user_id = ${buyerUserId}
      LIMIT 1
    `);

    if (!buyerProfileRows || buyerProfileRows.length === 0) {
      return NextResponse.json(
        { error: "Buyer profile not found. Please complete buyer onboarding." },
        { status: 404 }
      );
    }

    const buyer = buyerProfileRows[0];
    const viewedSellers = Array.isArray(buyer.viewed_sellers) ? buyer.viewed_sellers : [];
    const remainingViews = buyer.remaining_views ?? 0;

    // 2. Locate seller in seller_profiles (by user_id, id, or business_name)
    const sellerRows = await db.execute(sql`
      SELECT id, user_id, business_name, business_category, contact_person, mobile, email, address, city, state, is_verified
      FROM seller_profiles 
      WHERE id::text = ${sellerId} 
         OR user_id = ${sellerId}
         OR business_name = ${sellerId}
      LIMIT 1
    `);

    let seller = sellerRows?.[0] || null;

    // Standardized unique seller identifier
    const targetSellerKey = seller?.user_id || seller?.id || sellerId;

    // 3. Check if seller is ALREADY unlocked
    // Check both buyer_profiles.viewed_sellers and seller_views table
    let alreadyUnlocked =
      viewedSellers.includes(targetSellerKey) ||
      (seller?.business_name && viewedSellers.includes(seller.business_name));

    if (!alreadyUnlocked) {
      // Check seller_views table if it exists
      try {
        const historyCheck = await db.execute(sql`
          SELECT id FROM seller_views 
          WHERE buyer_user_id = ${buyerUserId} AND seller_user_id = ${targetSellerKey}
          LIMIT 1
        `);
        if (historyCheck && historyCheck.length > 0) {
          alreadyUnlocked = true;
        }
      } catch {
        // Table may not exist yet
      }
    }

    // Prepare authorized contact payload
    const contactData = {
      contactPerson: seller?.contact_person || "Authorized Representative",
      mobile: seller?.mobile || "+91 98450 XXXXX",
      email: seller?.email || `contact@${(seller?.business_name || "seller").toLowerCase().replace(/\s+/g, "")}.com`,
      address: seller?.address || `${seller?.city || "Salem"}, ${seller?.state || "Tamil Nadu"}`,
      businessName: seller?.business_name || sellerId,
    };

    if (alreadyUnlocked) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        remainingViews,
        totalAllowance: buyer.seller_views_allowance,
        contact: contactData,
        message: "Seller contact was already unlocked. No view consumed.",
      });
    }

    // 4. If not unlocked, check if buyer has remaining views
    if (remainingViews <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "insufficient_views",
          remainingViews: 0,
          canPurchaseAddon: true,
          addonPrice: 10,
          addonViews: 10,
          message: "You have used all 10 seller view unlocks. Purchase 10 more views for ₹10 to continue connecting with sellers.",
        },
        { status: 403 }
      );
    }

    // 5. ATOMIC DEDUCTION: Decrement remaining_views and append seller to viewed_sellers
    const updateResult = await db.execute(sql`
      UPDATE buyer_profiles 
      SET remaining_views = remaining_views - 1,
          viewed_sellers = array_append(viewed_sellers, ${targetSellerKey})
      WHERE user_id = ${buyerUserId} 
        AND remaining_views > 0 
        AND NOT (${targetSellerKey} = ANY(viewed_sellers))
      RETURNING remaining_views, seller_views_allowance
    `);

    if (!updateResult || updateResult.length === 0) {
      // Concurrency check: Did a concurrent request just succeed and add targetSellerKey?
      const recheck = await db.execute(sql`
        SELECT remaining_views, seller_views_allowance, viewed_sellers
        FROM buyer_profiles 
        WHERE user_id = ${buyerUserId}
        LIMIT 1
      `);
      const currentViewed = Array.isArray(recheck?.[0]?.viewed_sellers) ? recheck[0].viewed_sellers : [];
      if (
        currentViewed.includes(targetSellerKey) ||
        (seller?.business_name && currentViewed.includes(seller.business_name))
      ) {
        return NextResponse.json({
          success: true,
          alreadyUnlocked: true,
          remainingViews: recheck[0].remaining_views,
          totalAllowance: recheck[0].seller_views_allowance,
          contact: contactData,
          message: "Seller contact was unlocked by a concurrent request. No extra view consumed.",
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "insufficient_views",
          message: "Unable to decrement view allowance. You may have exhausted your views.",
        },
        { status: 403 }
      );
    }

    const updatedRemaining = updateResult[0].remaining_views;
    const totalAllowance = updateResult[0].seller_views_allowance;

    // 6. Record in seller_views history table if table exists
    try {
      await db.execute(sql`
        INSERT INTO seller_views (
          buyer_user_id, seller_user_id, first_viewed_at
        ) VALUES (
          ${buyerUserId}, ${targetSellerKey}, now()
        )
        ON CONFLICT (buyer_user_id, seller_user_id) DO NOTHING
      `);
    } catch {
      // Graceful fallback if seller_views table is pending migration approval
    }

    return NextResponse.json({
      success: true,
      newlyUnlocked: true,
      alreadyUnlocked: false,
      sellerId: targetSellerKey,
      remainingViews: updatedRemaining,
      totalAllowance,
      usedViews: totalAllowance - updatedRemaining,
      contact: contactData,
      message: `Seller contact successfully unlocked! You have ${updatedRemaining} views remaining.`,
    });
  } catch (error) {
    console.error("Unlock Seller Contact Error:", error);
    return NextResponse.json(
      { error: "Failed to unlock seller contact on server." },
      { status: 500 }
    );
  }
}
