import { NextResponse } from "next/server";
import { db, userApplicants } from "@/lib/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fullName, email, mobile, password, role } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanMobile = (mobile || "").trim();
    const cleanName = (fullName || "New Applicant").trim();
    const cleanRole = (role || "seller").toLowerCase();
    const resolvedRoles =
      cleanRole === "buyer_seller" || cleanRole === "both"
        ? ["buyer", "seller"]
        : [cleanRole];

    if (!cleanEmail || !cleanName) {
      return NextResponse.json(
        { success: false, error: "Full name and email are required." },
        { status: 400 }
      );
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store applicant in user_applicants table with status 'pending'
    const existing = await db
      .select()
      .from(userApplicants)
      .where(eq(userApplicants.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userApplicants)
        .set({
          fullName: cleanName,
          mobile: cleanMobile || existing[0].mobile,
          role: cleanRole,
          roles: resolvedRoles,
          status: "pending",
          details: {
            fullName: cleanName,
            email: cleanEmail,
            mobile: cleanMobile || existing[0].mobile,
            role: cleanRole,
          },
          updatedAt: new Date(),
        })
        .where(eq(userApplicants.id, existing[0].id));
    } else {
      await db.insert(userApplicants).values({
        userId,
        fullName: cleanName,
        email: cleanEmail,
        mobile: cleanMobile || "9876543210",
        role: cleanRole,
        roles: resolvedRoles,
        accountType: "individual",
        entryChannel: "web_registration",
        status: "pending",
        details: {
          fullName: cleanName,
          email: cleanEmail,
          mobile: cleanMobile || "9876543210",
          role: cleanRole,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Applicant registered and stored in user_applicants awaiting admin review.",
      user: {
        id: existing.length > 0 ? existing[0].userId : userId,
        name: cleanName,
        email: cleanEmail,
        mobile: cleanMobile,
        role: cleanRole,
      },
    });
  } catch (error) {
    console.error("Error in /api/register route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register applicant." },
      { status: 500 }
    );
  }
}
