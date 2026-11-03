"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";

export default function OnboardingAccountTypePage() {
  const router = useRouter();
  const { state, setAccountType } = useOnboarding();
  const [selected, setSelected] = useState(state.accountType || "individual");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (state.accountType) {
      setSelected(state.accountType);
    }
  }, [state.accountType]);

  const handleContinue = async () => {
    setErrorMsg("");
    setLoading(true);
    try {
      await setAccountType(selected);
      setLoading(false);
      router.push("/onboarding/details");
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Failed to save account type. Please try again.");
    }
  };

  return (
    <OnboardingGuard allowedPath="/onboarding/account-type">
      <OnboardingLayout
        currentStep={2}
        title="Choose who you are"
        subtitle="This filter determines your onboarding requirements and tax documentation before payment."
      >
        {errorMsg && (
          <div className="alert-error" role="alert" style={{ marginBottom: "20px" }}>
            {errorMsg}
          </div>
        )}

        <div className="account-type-grid">
          {/* Individual */}
          <div
            className={`selection-card ${selected === "individual" ? "active" : ""}`}
            onClick={() => setSelected("individual")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("individual")}
          >
            <div className="card-top">
              <span className="role-pill common">Individual</span>
              <span className="spec-badge green">No GSTIN required</span>
            </div>
            <h3>Individual</h3>
            <p className="card-desc">
              For common buyers, home users, individual farmers, and personal purchase. No business forms.
            </p>
            <div className="filter-highlight individual-highlight">
              <strong>What you see in next step:</strong>
              <p>Short profile with name and delivery address only. <b>Zero GSTIN or corporate fields.</b></p>
            </div>
            <div className="radio-indicator">
              <input
                type="radio"
                name="accountType"
                checked={selected === "individual"}
                onChange={() => setSelected("individual")}
                aria-label="Select Individual account"
              />
              <span>Select Individual</span>
            </div>
          </div>

          {/* Company */}
          <div
            className={`selection-card ${selected === "company" ? "active" : ""}`}
            onClick={() => setSelected("company")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("company")}
          >
            <div className="card-top">
              <span className="role-pill business">Company</span>
              <span className="spec-badge amber">GSTIN Required</span>
            </div>
            <h3>Company</h3>
            <p className="card-desc">
              For registered businesses, bakeries, food manufacturers, mills, distributors, and corporate buyers.
            </p>
            <div className="filter-highlight company-highlight">
              <strong>What you see in next step:</strong>
              <p>Business form with corporate legal name, category &amp; <b>mandatory 15-character GSTIN</b>.</p>
            </div>
            <div className="radio-indicator">
              <input
                type="radio"
                name="accountType"
                checked={selected === "company"}
                onChange={() => setSelected("company")}
                aria-label="Select Company account"
              />
              <span>Select Company</span>
            </div>
          </div>

          {/* Group */}
          <div
            className={`selection-card ${selected === "group" ? "active" : ""}`}
            onClick={() => setSelected("group")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("group")}
          >
            <div className="card-top">
              <span className="role-pill dual">Group</span>
              <span className="spec-badge amber">GSTIN Required</span>
            </div>
            <h3>Group</h3>
            <p className="card-desc">
              For Farmer Producer Organisations (FPO), cooperative societies, grower clusters, and trading collectives.
            </p>
            <div className="filter-highlight company-highlight">
              <strong>What you see in next step:</strong>
              <p>Group name, contact person, collective category &amp; <b>mandatory 15-character GSTIN</b>.</p>
            </div>
            <div className="radio-indicator">
              <input
                type="radio"
                name="accountType"
                checked={selected === "group"}
                onChange={() => setSelected("group")}
                aria-label="Select Group account"
              />
              <span>Select Group</span>
            </div>
          </div>
        </div>

        <div className="step-footer-actions">
          <button
            type="button"
            className="btn ghost lg"
            onClick={() => router.push("/onboarding/role")}
          >
            ← Back to Role
          </button>
          <button
            type="button"
            className="btn primary lg"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Saving to database..." : "Continue to Fill Details →"}
          </button>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}
