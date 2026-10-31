"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/onboarding-context";

interface GuardProps {
  children: React.ReactNode;
  allowedPath: string;
}

export default function OnboardingGuard({ children, allowedPath }: GuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { getFirstIncompletePath, state } = useOnboarding();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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

    // If allowedPath is behind or matches requiredPath, let them view it
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

