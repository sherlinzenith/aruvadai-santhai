import { NextResponse } from "next/server";
import { db, userApplicants, userProfiles, buyerProfiles, sellerProfiles, payments } from "@/lib/db";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { userId, adminId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required for approval." },
        { status: 400 }
      );
    }

    // 1. First locate applicant in user_applicants table
    let applicant = null;
    const applicantRows = await db
      .select()
      .from(userApplicants)
      .where(or(eq(userApplicants.userId, userId), eq(userApplicants.email, userId)))
      .limit(1);

    if (applicantRows.length > 0) {
      applicant = applicantRows[0];
    } else {
      // Fallback check in user_profiles
      const profileRows = await db
        .select()
        .from(userProfiles)
        .where(or(eq(userProfiles.userId, userId), eq(userProfiles.email, userId)))
        .limit(1);

      if (profileRows.length > 0) {
        applicant = profileRows[0];
      }
    }

    if (!applicant) {
      return NextResponse.json(
        { success: false, error: "Applicant record not found in user_applicants." },
        { status: 404 }
      );
    }

    const resolvedUserId = applicant.userId;
    const fullName = applicant.fullName;
    const email = applicant.email;
    const mobile = applicant.mobile;
    const details = applicant.details || {};
    const accountType = applicant.accountType || "individual";
    const isCompany = accountType === "company" || accountType === "group";

    let roles = Array.isArray(applicant.roles) && applicant.roles.length > 0
      ? applicant.roles
      : applicant.role === "buyer_seller" || applicant.role === "both"
      ? ["buyer", "seller"]
      : [applicant.role || "seller"];

    const createdProfiles = [];

    // 2. Make an insert with applicant data into user_profiles table
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(or(eq(userProfiles.userId, resolvedUserId), eq(userProfiles.email, email)))
      .limit(1);

    const profileData = {
      userId: resolvedUserId,
      fullName,
      email,
      mobile,
      roles,
      accountType,
      details,
      adminStatus: "approved",
      rejectionReason: null,
      submittedAt: applicant.createdAt || new Date(),
      reviewedAt: new Date(),
      reviewedBy: adminId || null,
    };

    if (existingProfile.length > 0) {
      await db
        .update(userProfiles)
        .set(profileData)
        .where(eq(userProfiles.id, existingProfile[0].id));
    } else {
      await db.insert(userProfiles).values(profileData);
    }
    createdProfiles.push("user_profiles");

    // 3. If user is a buyer, make a new insert into buyer_profiles table
    if (roles.includes("buyer")) {
      const existingBuyer = await db
        .select()
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, resolvedUserId))
        .limit(1);

      const buyerData = {
        userId: resolvedUserId,
        accountType,
        name: isCompany
          ? details.contactPerson || fullName
          : details.name || fullName,
        email,
        mobile,
        companyLegalName: isCompany ? details.legalName || null : null,
        gstin: isCompany ? details.gstin || null : null,
        businessCategory: isCompany ? details.businessCategory || "Business Buyer" : "Individual",
        purposes: details.purposeOfPurchase || ["Personal use"],
        address: details.address || "Main Road",
        city: details.city || "Salem",
        state: details.state || "Tamil Nadu",
        pincode: details.pincode || "636001",
        sellerViewsAllowance: 10,
        remainingViews: 10,
        viewedSellers: [],
        isActive: true,
        approvedAt: new Date(),
      };

      if (existingBuyer.length > 0) {
        await db
          .update(buyerProfiles)
          .set(buyerData)
          .where(eq(buyerProfiles.userId, resolvedUserId));
      } else {
        await db.insert(buyerProfiles).values(buyerData);
      }
      createdProfiles.push("buyer_profiles");
    }

    // 4. If user is a seller, make a new insert into seller_profiles table
    if (roles.includes("seller")) {
      const existingSeller = await db
        .select()
        .from(sellerProfiles)
        .where(eq(sellerProfiles.userId, resolvedUserId))
        .limit(1);

      const sellerData = {
        userId: resolvedUserId,
        accountType,
        businessName:
          details.legalName ||
          details.businessName ||
          (isCompany ? `${fullName} Enterprise` : `${fullName} Farms`),
        legalName: details.legalName || null,
        contactPerson: details.contactPerson || fullName,
        email,
        mobile,
        businessCategory: details.businessCategory || (isCompany ? "Producer" : "Farmer or producer"),
        gstStatus: isCompany && details.gstin ? "Registered" : "Unregistered",
        gstin: details.gstin || null,
        pan: details.pan || null,
        fssaiNumber: details.fssaiNumber || null,
        fssaiExpiry: details.fssaiExpiry || null,
        address: details.address || "Farm Road",
        city: details.city || "Coimbatore",
        state: details.state || "Tamil Nadu",
        pincode: details.pincode || "641001",
        isVerified: true,
        subscriptionStatus: "active",
        approvedAt: new Date(),
      };

      if (existingSeller.length > 0) {
        await db
          .update(sellerProfiles)
          .set(sellerData)
          .where(eq(sellerProfiles.userId, resolvedUserId));
      } else {
        await db.insert(sellerProfiles).values(sellerData);
      }
      createdProfiles.push("seller_profiles");
    }

    // 5. Update applicant status in user_applicants table to 'approved'
    await db
      .update(userApplicants)
      .set({
        status: "approved",
        updatedAt: new Date(),
      })
      .where(or(eq(userApplicants.userId, resolvedUserId), eq(userApplicants.email, email)));

    // 6. Update payments table if any record exists
    try {
      await db
        .update(payments)
        .set({ status: "approved" })
        .where(eq(payments.userId, resolvedUserId));
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Applicant approved successfully and registered in: ${createdProfiles.join(", ")}`,
      createdProfiles,
    });
  } catch (error) {
    console.error("Error in admin approve API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve user application." },
      { status: 500 }
    );
  }
}
