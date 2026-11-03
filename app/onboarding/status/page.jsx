"use client";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";
export default function OnboardingStatusPage() {
    const router = useRouter();
    const { state, setAdminStatus } = useOnboarding();
    const { status, reason, reviewedAt } = state.adminReview;
    const isCompany = state.accountType === "company" || state.accountType === "group";
    return (<OnboardingGuard allowedPath="/onboarding/status">
      <OnboardingLayout currentStep={5} title="Admin Review &amp; Approval Status" subtitle="Every account clears manual review. Payments and GSTIN documents are matched together.">
        <div className="status-container">
          {/* STATE 1: PENDING */}
          {status === "pending" && (<div className="review-card pending">
              <div className="status-badge-header">
                <span className="pulsing-amber-dot"/>
                <span className="status-title">Pending Administrator Review</span>
              </div>

              <h3>Your payment &amp; registration are under review</h3>
              <p className="status-explanation">
                Payment of <b>₹{state.payment.amount}</b> was recorded successfully (Receipt:{" "}
                <b>{state.payment.receiptNumber || "US-94821"}</b>, Txn:{" "}
                <b>{state.payment.transactionId || "TXN849102"}</b>).
              </p>

              <div className="review-items-list">
                <div className="review-check-item">
                  <span className="icon-check ok">✓</span>
                  <div>
                    <strong>Payment Transaction Match</strong>
                    <p className="muted small">Bank gateway reference verified for ₹{state.payment.amount}</p>
                  </div>
                </div>

                {isCompany ? (<div className="review-check-item">
                    <span className="icon-check pending">•</span>
                    <div>
                      <strong>GSTIN Validation &amp; Legal Entity Cross-Check</strong>
                      <p className="muted small">
                        GSTIN <b>{state.companyDetails?.gstin}</b> is currently being verified against legal name &ldquo;
                        {state.companyDetails?.legalName}&rdquo;
                      </p>
                    </div>
                  </div>) : (<div className="review-check-item">
                    <span className="icon-check ok">✓</span>
                    <div>
                      <strong>Individual Account Verification</strong>
                      <p className="muted small">No GSTIN required. Account classified as Individual.</p>
                    </div>
                  </div>)}
              </div>

              <div className="info-box">
                <p>
                  Typical approval turnaround is under 30 minutes during market hours.
                  Use the <b>Demo Admin Toggle</b> below to test the instant approval flow.
                </p>
              </div>
            </div>)}

          {/* STATE 2: APPROVED */}
          {status === "approved" && (<div className="review-card approved">
              <div className="status-badge-header">
                <span className="green-checkmark">✓</span>
                <span className="status-title success">Account Approved &amp; Active</span>
              </div>

              <h3>Welcome to UlavanSanthai!</h3>
              <p className="status-explanation">
                Your payment and credentials have been verified by the platform moderation team.
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

              <button type="button" className="btn primary lg block mt" onClick={() => router.push("/dashboard")}>
                Go to Trading Dashboard →
              </button>
            </div>)}

          {/* STATE 3: REJECTED */}
          {status === "rejected" && (<div className="review-card rejected">
              <div className="status-badge-header">
                <span className="red-cross">✕</span>
                <span className="status-title danger">Application Rejected</span>
              </div>

              <h3>Admin review could not be completed</h3>
              <div className="rejection-reason-box">
                <strong>Reason recorded by Administrator:</strong>
                <p>{reason || "Transaction reference or GSTIN details did not match government registry."}</p>
              </div>

              <div className="refund-notice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
                <span>
                  <b>Automatic Refund Flagged:</b> Your ₹{state.payment.amount} payment has been queued for immediate reversal to your original payment method within 24-48 business hours.
                </span>
              </div>
            </div>)}

          {/* DEMO ADMIN CONTROLS (SPEC REQUIREMENT) */}
          <div className="demo-admin-panel">
            <div className="demo-panel-header">
              <span className="admin-chip">Mock Admin Toggle</span>
              <b>Test the Platform Reviewer Flow:</b>
            </div>
            <p className="muted small">
              This panel simulates an administrator reviewing the registration queue in real-time.
            </p>
            <div className="demo-actions-row">
              <button type="button" className={`btn sm ${status === "approved" ? "primary" : "ghost"}`} onClick={() => setAdminStatus("approved")}>
                ✓ Simulate Admin Approval
              </button>
              <button type="button" className={`btn sm ${status === "rejected" ? "amber" : "ghost"}`} onClick={() => {
            const customReason = prompt("Enter simulated rejection reason (or leave default):", "GSTIN 33AAAAA0000A1Z5 does not match registered trade name.");
            setAdminStatus("rejected", customReason || undefined);
        }}>
                ✕ Simulate Admin Rejection
              </button>
              <button type="button" className={`btn sm ${status === "pending" ? "primary" : "ghost"}`} onClick={() => setAdminStatus("pending")}>
                ↻ Reset to Pending Review
              </button>
            </div>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>);
}
