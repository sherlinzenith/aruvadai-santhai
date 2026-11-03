"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding-context";

export default function OnboardingGuard({ children, allowedPath }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getFirstIncompletePath, state } = useOnboarding();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // If user navigates to deprecated payment page, redirect straight to review status
    if (allowedPath === "/onboarding/payment") {
      router.replace("/onboarding/status");
      return;
    }

    // Check state or localStorage to avoid false redirect during hydration
    let hasUser = state.user && state.otpVerified;
    if (!hasUser && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("ulavansanthai_onboarding_store_v2");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.user && parsed?.otpVerified) {
            hasUser = true;
          }
        }
      } catch {}
    }

    const requiredPath = getFirstIncompletePath();

    // Special case for dashboard: must be approved
    if (allowedPath === "/dashboard" && state.adminReview.status !== "approved") {
      router.replace(requiredPath);
      return;
    }

    // If on onboarding path and user is verified, allow directly
    if (allowedPath.startsWith("/onboarding/") && hasUser) {
      setChecked(true);
      return;
    }

    // Step order without payment
    const STEP_ORDER = [
      "/signin",
      "/onboarding/role",
      "/onboarding/account-type",
      "/onboarding/details",
      "/onboarding/status",
      "/dashboard",
    ];

    const currentIdx = STEP_ORDER.indexOf(allowedPath);
    const requiredIdx = STEP_ORDER.indexOf(requiredPath);

    if (currentIdx > requiredIdx && requiredIdx !== -1) {
      router.replace(requiredPath);
    } else {
      setChecked(true);
    }
  }, [allowedPath, pathname, router, state, getFirstIncompletePath]);

  if (!checked) {
    return (
      <div className="guard-loading">
        <div className="spinner" />
        <p>Verifying onboarding progress...</p>
      </div>
    );
  }

  return <>{children}</>;
}

