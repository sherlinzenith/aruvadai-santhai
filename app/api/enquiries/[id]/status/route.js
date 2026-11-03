import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/enquiries/[id]/status
 * Seller/Admin response workflow to update an enquiry's status and response message.
 *
 * Valid status values: 'sent', 'reviewed', 'accepted', 'rejected'
 * Rule: Buyers cannot approve or reject their own enquiries.
 */
export async function PATCH(request, { params }) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to update enquiry status." },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Missing enquiry ID." }, { status: 400 });
    }

    const body = await request.json();
    const { status, sellerResponse = "" } = body;

    const validStatuses = ["sent", "reviewed", "accepted", "rejected"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // 1. Fetch current enquiry
    const enqRows = await db.execute(sql`
      SELECT id, buyer_id, seller_id, status FROM enquiries 
      WHERE id::text = ${id}
      LIMIT 1
    `);

    if (!enqRows || enqRows.length === 0) {
      return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });
    }

    const enq = enqRows[0];

    // 2. Prevent buyer from self-approving or self-rejecting their own enquiry
    if (enq.buyer_id === user.id && (status === "accepted" || status === "rejected")) {
      return NextResponse.json(
        { error: "Forbidden. Buyers are not permitted to accept or reject their own enquiries." },
        { status: 403 }
      );
    }

    // 3. Update status and seller response
    const updated = await db.execute(sql`
      UPDATE enquiries 
      SET status = ${status.toLowerCase()},
          seller_response = ${sellerResponse || null},
          responded_at = now(),
          updated_at = now()
      WHERE id::text = ${id}
      RETURNING id, status, seller_response, responded_at, updated_at
    `);

    return NextResponse.json({
      success: true,
      message: `Enquiry status updated to '${status}'.`,
      enquiry: updated[0],
    });
  } catch (error) {
    console.error("Enquiry Status Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update enquiry status." },
      { status: 500 }
    );
  }
}

