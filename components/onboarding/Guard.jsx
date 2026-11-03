"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useOnboarding } from "@/lib/onboarding-context";

export default function OnboardingGuard({ children, allowedPath }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { getFirstIncompletePath, state } = useOnboarding();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;

    // 1. Enforce active authentication
    if (!user) {
      router.replace(`/signin?redirect=${encodeURIComponent(pathname || allowedPath)}`);
      return;
    }

    // 2. Onboarding step guards
    const requiredPath = getFirstIncompletePath();

    // Special case for dashboard: must be approved
    if (allowedPath === "/dashboard" && state.adminReview.status !== "approved") {
      router.replace(requiredPath);
      return;
    }

    // Special case for status: user must have paid
    if (allowedPath === "/onboarding/status" && !state.payment.isPaid) {
      router.replace(requiredPath);
      return;
    }

    const STEP_ORDER = [
      "/signin",
      "/onboarding/role",
      "/onboarding/account-type",
      "/onboarding/details",
      "/onboarding/payment",
      "/onboarding/status",
      "/dashboard",
    ];

    const currentIdx = STEP_ORDER.indexOf(allowedPath);
    const requiredIdx = STEP_ORDER.indexOf(requiredPath);

    if (currentIdx > requiredIdx) {
      // Trying to skip ahead: redirect to first incomplete
      router.replace(requiredPath);
    } else {
      setChecked(true);
    }
  }, [user, loading, allowedPath, pathname, router, state, getFirstIncompletePath]);

  if (loading || !checked) {
    return (
      <div className="guard-loading">
        <div className="spinner" />
        <p>Verifying secure session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
