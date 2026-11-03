import { NextResponse } from "next/server";
import { db, userApplicants } from "@/lib/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const applicants = await db
      .select()
      .from(userApplicants)
      .orderBy(desc(userApplicants.createdAt));

    return NextResponse.json({
      success: true,
      count: applicants.length,
      applicants,
    });
  } catch (error) {
    console.error("Error in admin applicants API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load applicants." },
      { status: 500 }
    );
  }
}

