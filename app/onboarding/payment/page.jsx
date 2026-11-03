"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";
import { PRICING } from "@/lib/config";
import { api } from "@/lib/api";
import { loadRazorpayScript } from "@/lib/razorpay-client";

export default function OnboardingPaymentPage() {
  const router = useRouter();
  const { state, calculatePaymentAmount, markPaymentCompleted } = useOnboarding();
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyPendingNotice, setKeyPendingNotice] = useState(false);

  const amount = calculatePaymentAmount();
  const isBuyer = state.roles.includes("buyer");
  const isSeller = state.roles.includes("seller");
  const isBoth = isBuyer && isSeller;

  const purchaseType = isBoth
    ? "both_roles"
    : isSeller
    ? "seller_monthly"
    : "buyer_base";

  // Preload Razorpay Checkout script on page mount
  useEffect(() => {
    loadRazorpayScript().catch((err) => {
      console.warn("Could not pre-load Razorpay checkout script:", err);
    });
  }, []);

  const handlePay = async () => {
    setProcessing(true);
    setErrorMessage("");
    setKeyPendingNotice(false);

    try {
      // 1. Create order on server
      const orderRes = await api.createPaymentOrder({ purchaseType });

      if (!orderRes.success) {
        if (orderRes.configured === false) {
          setKeyPendingNotice(true);
          setErrorMessage(orderRes.error || "Razorpay test keys are pending in .env.local.");
        } else {
          setErrorMessage(orderRes.error || "Failed to initiate payment order.");
        }
        setProcessing(false);
        return;
      }

      // 2. Ensure checkout.js is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === "undefined") {
        setErrorMessage("Unable to load Razorpay payment gateway. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      // 3. Configure Razorpay modal options
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "UlavanSanthai",
        description: "Platform Registration & Verification Fee",
        order_id: orderRes.orderId,
        prefill: {
          name: state.user?.name || "",
          email: state.user?.email || "",
          contact: state.user?.mobile || "",
        },
        theme: {
          color: "#0F3D2E", // UlavanSanthai brand green
        },
        handler: async function (response) {
          try {
            // 4. Verify signature on server
            const verifyRes = await api.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              purchaseType,
              receiptNumber: orderRes.receiptNumber,
              method: paymentMethod,
            });

            if (verifyRes.success) {
              markPaymentCompleted({
                transactionId: response.razorpay_payment_id,
                receiptNumber: verifyRes.receiptNumber,
                amount,
                method: paymentMethod,
              });
              router.push("/onboarding/status");
            } else {
              setErrorMessage(verifyRes.error || "Payment verification failed on server.");
              setProcessing(false);
            }
          } catch (err) {
            setErrorMessage(err.message || "Failed to verify payment with server.");
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on("payment.failed", function (response) {
        setErrorMessage(
          response.error?.description || "Payment failed or was declined by the bank."
        );
        setProcessing(false);
      });

      razorpayInstance.open();
    } catch (err) {
      setErrorMessage(err.message || "An unexpected error occurred during checkout.");
      setProcessing(false);
    }
  };

  return (
    <OnboardingGuard allowedPath="/onboarding/payment">
      <OnboardingLayout
        currentStep={4}
        title="Payment & verification commitment"
        subtitle="Every trading account clears a one-time gate. Payment is reviewed together with your account details."
      >
        <div className="payment-grid">
          {/* Order Summary */}
          <div className="payment-summary-card">
            <h3>Fee Breakdown</h3>
            <p className="muted small">Configured via lib/config.js</p>

            <div className="fee-line-items">
              {isBoth ? (
                <>
                  <div className="fee-item">
                    <div>
                      <strong>Buyer Access Plan</strong>
                      <small className="block muted">Unlock up to 10 verified sellers & direct enquiries</small>
                    </div>
                    <b>₹{PRICING.buyerBaseFee}</b>
                  </div>
                  <div className="fee-item">
                    <div>
                      <strong>Seller Monthly Subscription</strong>
                      <small className="block muted">Commodity listings, price slabs & Verified badge</small>
                    </div>
                    <b>₹{PRICING.sellerMonthlyFee}</b>
                  </div>
                </>
              ) : isSeller ? (
                <div className="fee-item">
                  <div>
                    <strong>Seller Monthly Subscription</strong>
                    <small className="block muted">Commodity listing access, MOQ slabs & Verified badge</small>
                  </div>
                  <b>₹{PRICING.sellerMonthlyFee}</b>
                </div>
              ) : (
                <div className="fee-item">
                  <div>
                    <strong>Buyer Base Access</strong>
                    <small className="block muted">Search filters, unlocking 10 sellers & bulk enquiries</small>
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

            {keyPendingNotice && (
              <div
                style={{
                  background: "#FEF3C7",
                  border: "1px solid #F59E0B",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#92400E",
                }}
              >
                <strong>Razorpay Test Keys Required:</strong>
                <p style={{ margin: "4px 0 0 0" }}>
                  Please add <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> to your{" "}
                  <code>.env.local</code> file to trigger the test sandbox checkout.
                </p>
              </div>
            )}

            {errorMessage && !keyPendingNotice && (
              <div
                style={{
                  background: "#FEE2E2",
                  border: "1px solid #EF4444",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#991B1B",
                }}
              >
                {errorMessage}
              </div>
            )}

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
                  <strong>Business / Personal Debit & Credit Card</strong>
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
              {processing ? "Connecting Razorpay Gateway..." : `Pay ₹${amount} with Razorpay →`}
            </button>

            <p className="payment-disclaimer">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured with 256-bit Razorpay Test Mode encryption. Replay attacks and duplicate entries prevented.
            </p>
          </div>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
