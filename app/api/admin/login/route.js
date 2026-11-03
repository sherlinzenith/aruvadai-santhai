import { NextResponse } from "next/server";
import { db, adminProfiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyPassword, setAdminSession } from "@/lib/admin-auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter your admin email and password." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query admin_profiles table
    const rows = await db
      .select()
      .from(adminProfiles)
      .where(eq(adminProfiles.email, cleanEmail))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    const admin = rows[0];
    const hash = admin.hashedPassword || admin.passwordHash;

    if (!hash) {
      return NextResponse.json(
        { success: false, error: "Admin account has no password hash set." },
        { status: 401 }
      );
    }

    // Verify bcrypt password hash
    const isValid = await verifyPassword(password, hash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    // Set signed Next.js HTTP-only session cookie
    setAdminSession({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName || "System Administrator",
      role: admin.role || "admin",
    });

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName || "System Administrator",
        role: admin.role || "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Authentication error." },
      { status: 500 }
    );
  }
}
