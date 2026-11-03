import { NextResponse } from "next/server";
import { db, userApplicants } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user, roles, accountType, details } = body;

    const email = (user?.email || details?.email || "").trim().toLowerCase();
    const userId = user?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing required applicant email." },
        { status: 400 }
      );
    }

    const fullName =
      user?.name ||
      details?.name ||
      details?.contactPerson ||
      details?.legalName ||
      "New Applicant";

    const mobile = user?.mobile || details?.mobile || details?.phone || "9876543210";
    const userRoles = Array.isArray(roles) && roles.length > 0 ? roles : ["seller"];
    const accType = accountType || (details?.gstin ? "company" : "individual");
    const applicantDetails = details || {};

    const primaryRole =
      userRoles.includes("seller") && userRoles.includes("buyer")
        ? "buyer_seller"
        : userRoles[0] || "seller";

    // 1. Store and update applicant details in user_applicants table
    const existingApplicant = await db
      .select()
      .from(userApplicants)
      .where(or(eq(userApplicants.userId, userId), eq(userApplicants.email, email)))
      .limit(1);

    let savedUserId = userId;

    if (existingApplicant.length > 0) {
      savedUserId = existingApplicant[0].userId;
      await db
        .update(userApplicants)
        .set({
          fullName,
          email,
          mobile,
          role: primaryRole,
          roles: userRoles,
          accountType: accType,
          details: applicantDetails,
          status: "pending",
          updatedAt: new Date(),
        })
        .where(eq(userApplicants.id, existingApplicant[0].id));
    } else {
      await db.insert(userApplicants).values({
        userId: savedUserId,
        fullName,
        email,
        mobile,
        role: primaryRole,
        roles: userRoles,
        accountType: accType,
        details: applicantDetails,
        entryChannel: "web_registration",
        status: "pending",
      });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      userId: savedUserId,
      email,
      roles: userRoles,
      role: primaryRole,
      message: "Application recorded in user_applicants table and queued for admin review.",
    });
  } catch (error) {
    console.error("Error in onboarding submit API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit onboarding application." },
      { status: 500 }
    );
  }
}
