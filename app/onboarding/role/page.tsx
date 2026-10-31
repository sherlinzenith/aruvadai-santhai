"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";
import { RoleSelection, SystemRole } from "@/lib/config";

export default function OnboardingRolePage() {
  const router = useRouter();
  const { state, setRoles } = useOnboarding();

  // Determine initial selection
  const initialSelection: RoleSelection =
    state.roles.includes("buyer") && state.roles.includes("seller")
      ? "both"
      : state.roles.includes("seller")
      ? "seller"
      : "buyer";

  const [selected, setSelected] = useState<RoleSelection>(initialSelection);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    let rolesArray: SystemRole[] = [];
    if (selected === "buyer") rolesArray = ["buyer"];
    if (selected === "seller") rolesArray = ["seller"];
    if (selected === "both") rolesArray = ["buyer", "seller"];

    await setRoles(rolesArray);
    setLoading(false);
    router.push("/onboarding/account-type");
  };

  return (
    <OnboardingGuard allowedPath="/onboarding/role">
      <OnboardingLayout
        currentStep={1}
        title="Choose your trading role"
        subtitle="One login, three ways to participate. Trade as a Buyer, a Seller, or Both on the same account."
      >
        <div className="role-cards-grid">
          {/* Card 1: Buyer */}
          <div
            className={`selection-card ${selected === "buyer" ? "active" : ""}`}
            onClick={() => setSelected("buyer")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("buyer")}
          >
            <div className="card-top">
              <span className="role-pill buyer">Buyer</span>
              <span className="fee-tag">₹365 / 10 sellers</span>
            </div>
            <h3>Buyer</h3>
            <p className="card-desc">
              For individuals, bakeries, food processors, and businesses sourcing crops, spices, grains, and agri commodities.
            </p>
            <ul className="card-bullets">
              <li>Direct wholesale enquiries to verified farmers &amp; mills</li>
              <li>Unlock seller contact details &amp; location</li>
              <li>Individual and Company onboarding available</li>
            </ul>
            <div className="radio-indicator">
              <input
                type="radio"
                name="role"
                checked={selected === "buyer"}
                onChange={() => setSelected("buyer")}
                aria-label="Select Buyer role"
              />
              <span>Select Buyer</span>
            </div>
          </div>

          {/* Card 2: Seller */}
          <div
            className={`selection-card ${selected === "seller" ? "active" : ""}`}
            onClick={() => setSelected("seller")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("seller")}
          >
            <div className="card-top">
              <span className="role-pill seller">Seller</span>
              <span className="fee-tag">₹365 / month</span>
            </div>
            <h3>Seller</h3>
            <p className="card-desc">
              For farmers, FPOs, food processors, manufacturers, and traders listing agricultural commodities and finished food products.
            </p>
            <ul className="card-bullets">
              <li>Verified Seller badge after admin document review</li>
              <li>List commodities with price slabs &amp; MOQ</li>
              <li>Phone number and GSTIN kept private by default</li>
            </ul>
            <div className="radio-indicator">
              <input
                type="radio"
                name="role"
                checked={selected === "seller"}
                onChange={() => setSelected("seller")}
                aria-label="Select Seller role"
              />
              <span>Select Seller</span>
            </div>
          </div>

          {/* Card 3: Both */}
          <div
            className={`selection-card both ${selected === "both" ? "active" : ""}`}
            onClick={() => setSelected("both")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setSelected("both")}
          >
            <div className="card-top">
              <span className="role-pill dual">Buyer &amp; Seller (Both)</span>
              <span className="fee-tag">₹365 per role</span>
            </div>
            <h3>Both (Buyer + Seller)</h3>
            <p className="card-desc">
              For agro-processors, mills, and value-add businesses that procure raw ingredients and distribute processed commodities.
            </p>
            <ul className="card-bullets">
              <li>One unified business profile &amp; verified GSTIN</li>
              <li>Instant dashboard switcher between sourcing and listing</li>
              <li>Full access to buyer enquiries &amp; seller marketplace</li>
            </ul>
            <div className="radio-indicator">
              <input
                type="radio"
                name="role"
                checked={selected === "both"}
                onChange={() => setSelected("both")}
                aria-label="Select Both role"
              />
              <span>Select Both</span>
            </div>
          </div>
        </div>

        <div className="step-footer-actions">
          <button
            type="button"
            className="btn primary lg"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? "Saving role..." : "Continue to Account Type →"}
          </button>
        </div>
      </OnboardingLayout>
    </OnboardingGuard>
  );
}

