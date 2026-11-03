import { NextResponse } from "next/server";
import { db, userApplicants, userProfiles } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: "userId or email query parameter is required." },
        { status: 400 }
      );
    }

    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. Check user_profiles first (approved/rejected profiles live here)
    const profileConditions = [];
    if (userId) profileConditions.push(eq(userProfiles.userId, userId));
    if (cleanEmail) profileConditions.push(eq(userProfiles.email, cleanEmail));

    const profileRows = await db
      .select()
      .from(userProfiles)
      .where(or(...profileConditions))
      .limit(1);

    if (profileRows.length > 0) {
      const profile = profileRows[0];
      return NextResponse.json({
        success: true,
        found: true,
        status: profile.adminStatus || "pending",
        reason: profile.rejectionReason,
        reviewedAt: profile.reviewedAt,
        roles: profile.roles,
        accountType: profile.accountType,
      });
    }

    // 2. Check user_applicants table
    const applicantConditions = [];
    if (userId) applicantConditions.push(eq(userApplicants.userId, userId));
    if (cleanEmail) applicantConditions.push(eq(userApplicants.email, cleanEmail));

    const applicantRows = await db
      .select()
      .from(userApplicants)
      .where(or(...applicantConditions))
      .limit(1);

    if (applicantRows.length > 0) {
      const applicant = applicantRows[0];
      return NextResponse.json({
        success: true,
        found: true,
        status: applicant.status || "pending",
        reason: applicant.rejectionReason,
        reviewedAt: applicant.updatedAt,
        roles: applicant.roles,
        accountType: applicant.accountType,
      });
    }

    return NextResponse.json({
      success: true,
      found: false,
      status: "pending",
    });
  } catch (error) {
    console.error("Error in onboarding status API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch status." },
      { status: 500 }
    );
  }
}
