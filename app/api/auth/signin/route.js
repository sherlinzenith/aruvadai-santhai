import { NextResponse } from "next/server";
import { db, userProfiles, userApplicants, sellerProfiles, buyerProfiles } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Email address or mobile number is required." },
        { status: 400 }
      );
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanMobile = identifier.replace(/\D/g, "");

    // 1. Look up in user_profiles (Approved & Central Platform Profiles)
    const profileConditions = [eq(userProfiles.email, cleanInput)];
    if (cleanMobile.length >= 10) {
      profileConditions.push(eq(userProfiles.mobile, cleanMobile));
    }

    const profileRows = await db
      .select()
      .from(userProfiles)
      .where(or(...profileConditions))
      .limit(1);

    if (profileRows.length > 0) {
      const profile = profileRows[0];
      const roles = profile.roles || ["buyer"];

      // Fetch dedicated role profiles if approved
      let sellerData = null;
      let buyerData = null;

      if (roles.includes("seller")) {
        try {
          const sRows = await db
            .select()
            .from(sellerProfiles)
            .where(eq(sellerProfiles.userId, profile.userId))
            .limit(1);
          if (sRows.length > 0) sellerData = sRows[0];
        } catch (e) {
          console.warn("Could not query seller_profiles:", e);
        }
      }

      if (roles.includes("buyer")) {
        try {
          const bRows = await db
            .select()
            .from(buyerProfiles)
            .where(eq(buyerProfiles.userId, profile.userId))
            .limit(1);
          if (bRows.length > 0) buyerData = bRows[0];
        } catch (e) {
          console.warn("Could not query buyer_profiles:", e);
        }
      }

      return NextResponse.json({
        success: true,
        source: "user_profiles",
        user: {
          id: profile.userId,
          name: profile.fullName,
          email: profile.email,
          mobile: profile.mobile,
        },
        roles,
        accountType: profile.accountType,
        details: profile.details || {},
        status: profile.adminStatus || "approved",
        rejectionReason: profile.rejectionReason,
        sellerProfile: sellerData,
        buyerProfile: buyerData,
      });
    }

    // 2. Look up in user_applicants (Queue / Awaiting Approval)
    const applicantConditions = [eq(userApplicants.email, cleanInput)];
    if (cleanMobile.length >= 10) {
      applicantConditions.push(eq(userApplicants.mobile, cleanMobile));
    }

    const applicantRows = await db
      .select()
      .from(userApplicants)
      .where(or(...applicantConditions))
      .limit(1);

    if (applicantRows.length > 0) {
      const applicant = applicantRows[0];
      const roles = Array.isArray(applicant.roles) && applicant.roles.length > 0
        ? applicant.roles
        : applicant.role === "buyer_seller" || applicant.role === "both"
        ? ["buyer", "seller"]
        : [applicant.role || "seller"];

      return NextResponse.json({
        success: true,
        source: "user_applicants",
        user: {
          id: applicant.userId,
          name: applicant.fullName,
          email: applicant.email,
          mobile: applicant.mobile,
        },
        roles,
        accountType: applicant.accountType || "individual",
        details: applicant.details || {},
        status: applicant.status || "pending",
        rejectionReason: applicant.rejectionReason,
      });
    }

    // 3. User does not exist in either table
    return NextResponse.json(
      {
        success: false,
        error: "No account found matching this email or mobile number. Please register first.",
      },
      { status: 404 }
    );
  } catch (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process sign in." },
      { status: 500 }
    );
  }
}

