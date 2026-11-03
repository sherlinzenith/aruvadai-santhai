"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";

export default function OnboardingStatusPage() {
  const router = useRouter();
  const { state, setAdminStatus } = useOnboarding();

  const { status, reason, reviewedAt } = state.adminReview;
  const isCompany = state.accountType === "company" || state.accountType === "group";
  const [lastChecked, setLastChecked] = useState("");

  // Live polling: Poll the database every 3 seconds for real administrator decision
  useEffect(() => {
    if (!state.user?.id && !state.user?.email) return;

    let isMounted = true;

    const checkStatus = async () => {
      try {
        const query = state.user?.id
          ? `userId=${encodeURIComponent(state.user.id)}`
          : `email=${encodeURIComponent(state.user?.email || "")}`;

        const res = await fetch(`/api/onboarding/status?${query}`);
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data.success && data.found) {
          setLastChecked(new Date().toLocaleTimeString());
          if (data.status !== status) {
            setAdminStatus(data.status, data.reason);
          }
        }
      } catch (err) {
        console.warn("Status poll error:", err);
      }
    };

    // Check immediately
    checkStatus();

    // Poll if pending
    const interval = setInterval(checkStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state.user, status, setAdminStatus]);

  return (
    <OnboardingGuard allowedPath="/onboarding/status">
      <OnboardingLayout
        currentStep={4}
        title="Admin Review & Approval Status"
        subtitle="Every account clears administrator review. Profile details, identity, and GSTIN documents are validated before dashboard activation."
      >
        <div className="status-container">
          {/* STATE 1: PENDING (WAITING FOR REAL ADMIN APPROVAL) */}
          {status === "pending" && (
            <div className="review-card pending">
              <div className="status-badge-header">
                <span className="pulsing-amber-dot" />
                <span className="status-title">Pending Administrator Review</span>
              </div>

              <h3>Your registration is under administrator review</h3>
              <p className="status-explanation">
                Your profile information has been securely received by the platform moderation team.
              </p>

              <div className="review-items-list">
                <div className="review-check-item">
                  <span className="icon-check ok">✓</span>
                  <div>
                    <strong>Registration Details Recorded</strong>
                    <p className="muted small">Contact information, location, and account classifications logged</p>
                  </div>
                </div>

                {isCompany ? (
                  <div className="review-check-item">
                    <span className="icon-check pending">•</span>
                    <div>
                      <strong>GSTIN Validation & Legal Entity Cross-Check</strong>
                      <p className="muted small">
                        GSTIN <b>{state.companyDetails?.gstin}</b> is currently queued for verification against legal name &ldquo;
                        {state.companyDetails?.legalName}&rdquo;
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="review-check-item">
                    <span className="icon-check ok">✓</span>
                    <div>
                      <strong>Individual Account Verification</strong>
                      <p className="muted small">No GSTIN required. Account classified as Individual.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="info-box">
                <p>
                  ⏳ <b>Awaiting administrator moderation.</b> Once an administrator approves your profile, this page will automatically update and grant you immediate access to the trading dashboard.
                  {lastChecked && <span className="block muted small mt">Live sync active · Last checked at {lastChecked}</span>}
                </p>
              </div>

              <div className="admin-portal-link-box">
                <span className="admin-chip">Administrator Access</span>
                <p className="small muted">
                  Reviewing this application as an admin? Log in to approve or reject:
                </p>
                <Link href="/signin" className="btn ghost sm">
                  Sign in with Admin Credentials →
                </Link>
              </div>
            </div>
          )}

          {/* STATE 2: APPROVED */}
          {status === "approved" && (
            <div className="review-card approved">
              <div className="status-badge-header">
                <span className="green-checkmark">✓</span>
                <span className="status-title success">Account Approved & Active</span>
              </div>

              <h3>Welcome to UlavanSanthai!</h3>
              <p className="status-explanation">
                Your credentials have been verified by the platform moderation team.
                {reviewedAt && <span className="block muted small mt">Approved at: {new Date(reviewedAt).toLocaleString()}</span>}
              </p>

              <div className="approved-perks">
                <div className="perk-box">
                  <strong>Role(s) Activated</strong>
                  <span>{state.roles.map((r) => r.toUpperCase()).join(" + ")}</span>
                </div>
                <div className="perk-box">
                  <strong>Account Type</strong>
                  <span>{(state.accountType || "Individual").toUpperCase()}</span>
                </div>
                <div className="perk-box">
                  <strong>Seller Contact Allowance</strong>
                  <span>{state.remainingViews} Seller Views Active</span>
                </div>
              </div>

              <button
                type="button"
                className="btn primary lg block mt"
                onClick={() => router.push("/dashboard")}
              >
                Go to Trading Dashboard →
              </button>
            </div>
          )}

          {/* STATE 3: REJECTED */}
          {status === "rejected" && (
            <div className="review-card rejected">
              <div className="status-badge-header">
                <span className="red-cross">✕</span>
                <span className="status-title danger">Application Rejected</span>
              </div>

              <h3>Admin review could not be completed</h3>
              <div className="rejection-reason-box">
                <strong>Reason recorded by Administrator:</strong>
                <p>{reason || "Business credentials or GSTIN details did not match government registry."}</p>
              </div>
            </div>
          )}
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
