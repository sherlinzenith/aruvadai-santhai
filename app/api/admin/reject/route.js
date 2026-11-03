import { NextResponse } from "next/server";
import { db, userApplicants, userProfiles, payments } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { userId, reason, adminId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required for rejection." },
        { status: 400 }
      );
    }

    const rejectionReason =
      reason || "Business credentials, documents, or details could not be verified by platform moderation.";

    // 1. Update user_applicants table
    await db
      .update(userApplicants)
      .set({
        status: "rejected",
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(or(eq(userApplicants.userId, userId), eq(userApplicants.email, userId)));

    // 2. Update user_profiles table if record exists
    try {
      await db
        .update(userProfiles)
        .set({
          adminStatus: "rejected",
          rejectionReason,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        })
        .where(or(eq(userProfiles.userId, userId), eq(userProfiles.email, userId)));
    } catch {}

    // 3. Update payments table if record exists
    try {
      await db
        .update(payments)
        .set({
          status: "rejected",
        })
        .where(eq(payments.userId, userId));
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully.",
      reason: rejectionReason,
    });
  } catch (error) {
    console.error("Error in admin reject API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reject application." },
      { status: 500 }
    );
  }
}
