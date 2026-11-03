"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedPaymentPage() {
  const router = useRouter();

  useEffect(() => {
    // Payment removed from registration flow; forward directly to status
    router.replace("/onboarding/status");
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div className="spinner" />
        <p className="muted" style={{ marginTop: "12px" }}>
          Redirecting to registration review status...
        </p>
      </div>
    </div>
  );
}

