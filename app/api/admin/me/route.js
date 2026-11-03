import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, admin: null });
  }

  return NextResponse.json({
    authenticated: true,
    admin: {
      id: session.id,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
    },
  });
}

