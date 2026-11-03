import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-auth.js";

export const dynamic = "force-dynamic";

export async function POST() {
  clearAdminSession();
  return NextResponse.json({ success: true });
}

