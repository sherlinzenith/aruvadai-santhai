"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";
import { PRICING } from "@/lib/config";

export default function OnboardingPaymentPage() {
  const router = useRouter();
  const { state, calculatePaymentAmount, submitPayment } = useOnboarding();

  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [processing, setProcessing] = useState(false);

  const amount = calculatePaymentAmount();
  const isBuyer = state.roles.includes("buyer");
  const isSeller = state.roles.includes("seller");
  const isBoth = isBuyer && isSeller;

  const handlePay = async () => {
    setProcessing(true);
    const success = await submitPayment(paymentMethod);
    setProcessing(false);
    if (success) {
      router.push("/onboarding/status");
    }
  };

  return (
    <OnboardingGuard allowedPath="/onboarding/payment">
      <OnboardingLayout
        currentStep={4}
        title="Payment &amp; verification commitment"
        subtitle="Every trading account clears a one-time gate. Payment is reviewed together with your account details."
      >
        <div className="payment-grid">
          {/* Order Summary */}
          <div className="payment-summary-card">
            <h3>Fee Breakdown</h3>
            <p className="muted small">Configured via lib/config.ts</p>

            <div className="fee-line-items">
              {isBoth ? (
                <>
                  <div className="fee-item">
                    <div>
                      <strong>Buyer Access Plan</strong>
                      <small className="block muted">Unlock up to 10 verified sellers &amp; direct enquiries</small>
                    </div>
                    <b>₹{PRICING.buyerBaseFee}</b>
                  </div>
                  <div className="fee-item">
                    <div>
                      <strong>Seller Monthly Subscription</strong>
                      <small className="block muted">Commodity listings, price slabs &amp; Verified badge</small>
                    </div>
                    <b>₹{PRICING.sellerMonthlyFee}</b>
                  </div>
                </>
              ) : isSeller ? (
                <div className="fee-item">
                  <div>
                    <strong>Seller Monthly Subscription</strong>
                    <small className="block muted">Commodity listing access, MOQ slabs &amp; Verified badge</small>
                  </div>
                  <b>₹{PRICING.sellerMonthlyFee}</b>
                </div>
              ) : (
                <div className="fee-item">
                  <div>
                    <strong>Buyer Base Access</strong>
                    <small className="block muted">Search filters, unlocking 10 sellers &amp; bulk enquiries</small>
                  </div>
                  <b>₹{PRICING.buyerBaseFee}</b>
                </div>
              )}

              <div className="fee-total-row">
                <span>Total Amount Payable</span>
                <span className="total-amt">₹{amount}</span>
              </div>
            </div>

            <div className="review-timing-callout">
              <span className="bullet-pulse">•</span>
              <div>
                <strong>Combined Admin Verification</strong>
                <p>
                  Because you completed your details first, the platform administrator will review your{" "}
                  <b>payment transaction</b> and <b>GSTIN</b> together before activating your dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-card">
            <h3>Choose Payment Method</h3>

            <div className="method-options">
              <label
                className={`method-option ${paymentMethod === "upi" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("upi")}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "upi"}
                  onChange={() => setPaymentMethod("upi")}
                />
                <div className="method-info">
                  <strong>Instant UPI (Google Pay, PhonePe, Paytm, BHIM)</strong>
                  <p>Fastest clearance · Auto-matches transaction reference</p>
                </div>
              </label>

              <label
                className={`method-option ${paymentMethod === "card" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />
                <div className="method-info">
                  <strong>Business / Personal Debit &amp; Credit Card</strong>
                  <p>Visa, MasterCard, RuPay with commercial tax invoice</p>
                </div>
              </label>

              <label
                className={`method-option ${paymentMethod === "netbanking" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("netbanking")}
              >
                <input
                  type="radio"
                  name="method"
                  checked={paymentMethod === "netbanking"}
                  onChange={() => setPaymentMethod("netbanking")}
                />
                <div className="method-info">
                  <strong>Corporate NetBanking / NEFT / RTGS</strong>
                  <p>SBI, HDFC, ICICI, Axis and 50+ commercial banks</p>
                </div>
              </label>
            </div>

            <button
              type="button"
              className="btn primary block lg mt"
              onClick={handlePay}
              disabled={processing}
            >
              {processing ? "Connecting gateway..." : `Pay ₹${amount} (Mock Gateway) →`}
            </button>

            <p className="payment-disclaimer">
              🔒 256-bit encrypted gateway simulation. Rejections record reason and refund flag.
            </p>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}

