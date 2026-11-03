import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db/index.js";
import { buyerProfiles, userProfiles, userApplicants } from "@/db/schema.js";
import { eq } from "drizzle-orm";
import { GSTIN_REGEX } from "@/lib/config.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/onboarding
 * Loads existing onboarding progress and profile from PostgreSQL for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { authenticated: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // 1. Fetch user_profile
    const userProfileRows = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);

    // 2. Fetch buyer_profile
    const buyerProfileRows = await db
      .select()
      .from(buyerProfiles)
      .where(eq(buyerProfiles.userId, user.id))
      .limit(1);

    const userProfile = userProfileRows[0] || null;
    const buyerProfile = buyerProfileRows[0] || null;

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || userProfile?.fullName || "",
        mobile: user.user_metadata?.mobile || userProfile?.mobile || "",
      },
      roles: userProfile?.roles || [],
      accountType: userProfile?.accountType || buyerProfile?.accountType || null,
      buyerProfile: buyerProfile,
      details: userProfile?.details || null,
      adminStatus: userProfile?.adminStatus || "pending",
    });
  } catch (error) {
    console.error("GET /api/onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to load onboarding profile." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Handles saving onboarding steps (roles, accountType, buyer details) into PostgreSQL.
 */
export async function POST(request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to save onboarding progress." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, payload } = body;

    const userEmail = user.email || "";
    const userMobile = user.user_metadata?.mobile || "";
    const userFullName = user.user_metadata?.full_name || userEmail.split("@")[0] || "Trader";

    // -------------------------------------------------------------
    // ACTION 1: SAVE ROLES
    // -------------------------------------------------------------
    if (action === "save_roles") {
      const rawRoles = Array.isArray(payload.roles) ? payload.roles : ["buyer"];
      // Security: Strip out any unauthorized roles (such as "admin")
      const safeRoles = rawRoles.filter((r) => r === "buyer" || r === "seller");
      if (safeRoles.length === 0) safeRoles.push("buyer");

      // Upsert into user_profiles
      await db
        .insert(userProfiles)
        .values({
          userId: user.id,
          fullName: userFullName,
          email: userEmail,
          mobile: userMobile,
          roles: safeRoles,
          accountType: "individual", // default until selected
          details: {},
          adminStatus: "pending",
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            roles: safeRoles,
          },
        });

      // Upsert into user_applicants for Person 2's tracking
      await db
        .insert(userApplicants)
        .values({
          userId: user.id,
          fullName: userFullName,
          email: userEmail,
          mobile: userMobile,
          role: safeRoles[0],
          roles: safeRoles,
          status: "pending",
        })
        .onConflictDoNothing();

      return NextResponse.json({ success: true, roles: safeRoles });
    }

    // -------------------------------------------------------------
    // ACTION 2: SAVE ACCOUNT TYPE
    // -------------------------------------------------------------
    if (action === "save_account_type") {
      const accountType = payload.accountType;
      if (!["individual", "company", "group"].includes(accountType)) {
        return NextResponse.json(
          { error: "Invalid account type. Must be individual, company, or group." },
          { status: 400 }
        );
      }

      await db
        .insert(userProfiles)
        .values({
          userId: user.id,
          fullName: userFullName,
          email: userEmail,
          mobile: userMobile,
          roles: ["buyer"],
          accountType: accountType,
          details: {},
          adminStatus: "pending",
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            accountType: accountType,
          },
        });

      return NextResponse.json({ success: true, accountType });
    }

    // -------------------------------------------------------------
    // ACTION 3: SAVE BUYER PROFILE DETAILS
    // -------------------------------------------------------------
    if (action === "save_buyer_details") {
      const { accountType, details } = payload;

      if (!details || !accountType) {
        return NextResponse.json(
          { error: "Missing required profile details or account type." },
          { status: 400 }
        );
      }

      const isIndividual = accountType === "individual";

      // Validation
      if (isIndividual) {
        if (!details.name || details.name.trim().length < 2) {
          return NextResponse.json(
            { error: "Full name must be at least 2 characters." },
            { status: 400 }
          );
        }
        if (!details.address || details.address.trim().length < 5) {
          return NextResponse.json(
            { error: "Please enter your street address / locality." },
            { status: 400 }
          );
        }
        if (!details.city || !details.state || !/^\d{6}$/.test(details.pincode)) {
          return NextResponse.json(
            { error: "Valid city, state, and 6-digit Indian pincode are required." },
            { status: 400 }
          );
        }
      } else {
        // Company or Group Validation
        if (!details.legalName || details.legalName.trim().length < 2) {
          return NextResponse.json(
            { error: "Legal business or group name is required." },
            { status: 400 }
          );
        }
        const cleanedGstin = (details.gstin || "").trim().toUpperCase();
        if (!GSTIN_REGEX.test(cleanedGstin)) {
          return NextResponse.json(
            { error: "A valid 15-character Indian GSTIN is mandatory for Company and Group accounts." },
            { status: 400 }
          );
        }
        if (!details.contactPerson || details.contactPerson.trim().length < 2) {
          return NextResponse.json(
            { error: "Contact person name is required." },
            { status: 400 }
          );
        }
        if (!details.businessCategory) {
          return NextResponse.json(
            { error: "Please select a business category." },
            { status: 400 }
          );
        }
        if (!details.address || !details.city || !details.state || !/^\d{6}$/.test(details.pincode)) {
          return NextResponse.json(
            { error: "Registered business address, city, state, and 6-digit pincode are required." },
            { status: 400 }
          );
        }
      }

      const buyerName = isIndividual ? details.name.trim() : details.contactPerson.trim();
      const buyerPurposes = Array.isArray(details.purposeOfPurchase) ? details.purposeOfPurchase : [];

      // 1. Upsert into buyer_profiles
      await db
        .insert(buyerProfiles)
        .values({
          userId: user.id,
          accountType: accountType,
          name: buyerName,
          email: userEmail,
          mobile: details.mobile || userMobile,
          companyLegalName: !isIndividual ? details.legalName.trim() : null,
          gstin: !isIndividual ? details.gstin.trim().toUpperCase() : null,
          businessCategory: !isIndividual ? details.businessCategory : null,
          purposes: buyerPurposes,
          address: details.address.trim(),
          city: details.city.trim(),
          state: details.state.trim(),
          pincode: details.pincode.trim(),
          sellerViewsAllowance: 10,
          remainingViews: 10,
          viewedSellers: [],
          isActive: true,
        })
        .onConflictDoUpdate({
          target: buyerProfiles.userId,
          set: {
            accountType: accountType,
            name: buyerName,
            mobile: details.mobile || userMobile,
            companyLegalName: !isIndividual ? details.legalName.trim() : null,
            gstin: !isIndividual ? details.gstin.trim().toUpperCase() : null,
            businessCategory: !isIndividual ? details.businessCategory : null,
            purposes: buyerPurposes,
            address: details.address.trim(),
            city: details.city.trim(),
            state: details.state.trim(),
            pincode: details.pincode.trim(),
          },
        });

      // 2. Upsert / synchronize into user_profiles for Person 2's admin review panel
      await db
        .insert(userProfiles)
        .values({
          userId: user.id,
          fullName: buyerName,
          email: userEmail,
          mobile: details.mobile || userMobile,
          roles: ["buyer"],
          accountType: accountType,
          details: details,
          adminStatus: "pending",
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            fullName: buyerName,
            accountType: accountType,
            details: details,
          },
        });

      return NextResponse.json({
        success: true,
        message: "Buyer profile saved successfully to PostgreSQL database.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process onboarding request." },
      { status: 500 }
    );
  }
}
