import { NextResponse } from "next/server";
import { db, userApplicants } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawApplicants = await db
      .select()
      .from(userApplicants)
      .orderBy(desc(userApplicants.createdAt));

    const enriched = rawApplicants.map((ap) => {
      const details = ap.details || {};
      const roles = Array.isArray(ap.roles) && ap.roles.length > 0
        ? ap.roles
        : ap.role === "buyer_seller" || ap.role === "both"
        ? ["buyer", "seller"]
        : [ap.role || "seller"];

      return {
        id: ap.id,
        userId: ap.userId,
        fullName: ap.fullName,
        email: ap.email,
        mobile: ap.mobile,
        role: ap.role,
        roles,
        accountType: ap.accountType || "individual",
        details,
        adminStatus: (ap.status || "pending").toLowerCase(),
        rejectionReason: ap.rejectionReason || null,
        submittedAt: ap.createdAt,
        updatedAt: ap.updatedAt,
      };
    });

    const pending = enriched.filter((a) => a.adminStatus === "pending");
    const approved = enriched.filter((a) => a.adminStatus === "approved");
    const rejected = enriched.filter((a) => a.adminStatus === "rejected");

    return NextResponse.json({
      success: true,
      pending,
      approved,
      rejected,
      counts: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: enriched.length,
      },
    });
  } catch (error) {
    console.error("Error in admin pending API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin queue." },
      { status: 500 }
    );
  }
}
