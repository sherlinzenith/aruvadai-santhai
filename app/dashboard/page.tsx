"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import { useOnboarding } from "@/lib/onboarding-context";
import { categories, products, Product } from "@/lib/content";

export default function DashboardPage() {
  const router = useRouter();
  const { state, unlockSeller, signOutUser } = useOnboarding();

  const isBuyerRole = state.roles.includes("buyer");
  const isSellerRole = state.roles.includes("seller");
  const isBoth = isBuyerRole && isSellerRole;

  // Active tab: default to buyer if available, else seller
  const [activeTab, setActiveTab] = useState<"buyer" | "seller">(
    isBuyerRole ? "buyer" : "seller"
  );

  // Buyer search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  // Modal states
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [enqQty, setEnqQty] = useState(10);
  const [enqSuccess, setEnqSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCat === "All" || p.cat === selectedCat;
      const matchesQuery = (p.name + p.seller + p.origin)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCat]);

  const handleUnlockContact = (sellerName: string) => {
    if (state.remainingViews <= 0 && !state.viewedSellers.includes(sellerName)) {
      alert("You have reached your 10 seller view allowance. In the full platform, add 10 more views for ₹10.");
      return;
    }
    unlockSeller(sellerName);
  };

  const openEnquiry = (p: Product) => {
    setSelectedProduct(p);
    setEnqQty(p.moq);
    setEnqSuccess(false);
    setEnquiryModalOpen(true);
  };

  return (
    <OnboardingGuard allowedPath="/dashboard">
      <div className="dashboard-shell">
        {/* Navigation Bar */}
        <header className="dash-nav">
          <div className="dash-nav-in wrap">
            <div className="row">
              <Link href="/" className="logo" aria-label="UlavanSanthai home">
                <Image
                  src="/logo.png"
                  alt="UlavanSanthai"
                  width={180}
                  height={40}
                  priority
                  className="brand-logo"
                />
              </Link>

              {/* Both Role Tab Switcher */}
              {isBoth && (
                <div className="role-switcher-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "buyer"}
                    className={`switch-tab ${activeTab === "buyer" ? "active" : ""}`}
                    onClick={() => setActiveTab("buyer")}
                  >
                    Buyer Marketplace
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "seller"}
                    className={`switch-tab ${activeTab === "seller" ? "active" : ""}`}
                    onClick={() => setActiveTab("seller")}
                  >
                    Seller Portal
                  </button>
                </div>
              )}
            </div>

            <div className="dash-user-controls">
              <div className="dash-badge-group">
                <span className="badge role-badge">
                  {isBoth ? "Both (Buyer + Seller)" : isBuyerRole ? "Buyer" : "Seller"}
                </span>
                <span className="badge type-badge">
                  {(state.accountType || "Individual").toUpperCase()}
                </span>
              </div>
              <span className="dash-user-name">
                {state.user?.name || "Verified Trader"}
              </span>
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  signOutUser();
                  router.push("/signin");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="dash-main wrap">
          {/* =========================================================
              VIEW 1: BUYER TAB
              ========================================================= */}
          {activeTab === "buyer" && isBuyerRole && (
            <div className="buyer-dashboard-view">
              {/* Buyer Stats Bar */}
              <div className="buyer-stats-bar">
                <div className="stat-pill-box">
                  <span className="stat-label">Sellers Viewed</span>
                  <div className="stat-counter">
                    <b>{10 - state.remainingViews}</b>
                    <span>/ 10 allowance</span>
                  </div>
                </div>

                <div className="stat-pill-box">
                  <span className="stat-label">Remaining Unlocks</span>
                  <div className="stat-counter highlight">
                    <b>{state.remainingViews}</b>
                    <span>contacts left</span>
                  </div>
                </div>

                <div className="stat-pill-box">
                  <span className="stat-label">Account Verification</span>
                  <div className="stat-counter green">
                    <b>Active</b>
                    <span>Admin Approved</span>
                  </div>
                </div>
              </div>

              {/* Search & Filters Placeholder */}
              <div className="buyer-search-bar">
                <div className="search-input-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commodities, origins, or verified agro-mills..."
                  />
                </div>

                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="cat-select"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.n} value={c.n}>
                      {c.n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products Grid */}
              <div className="dash-product-grid">
                {filteredProducts.map((p) => {
                  const isUnlocked = state.viewedSellers.includes(p.seller);

                  return (
                    <article className="pcard" key={p.name}>
                      <div className="pimg">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          className="pimg-photo"
                        />
                        <span className="g">Grade {p.grade}</span>
                        {p.organic && <span className="o">Organic</span>}
                      </div>

                      <div className="pbody">
                        <h3>{p.name}</h3>
                        <p className="muted">{p.origin} · {p.cat}</p>
                        <div className="price">{p.price}</div>

                        <div className="row between small">
                          <span>MOQ {p.moq} {p.unit}</span>
                          <span className={p.avail === "Limited" ? "warn" : "okc"}>● {p.avail}</span>
                        </div>

                        <div className="seller mt">
                          <span className="badge ok">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Verified
                          </span>
                          <b>{p.seller}</b>
                        </div>

                        {/* Seller Contact Status */}
                        {isUnlocked ? (
                          <div className="unlocked-contact-card">
                            <span className="contact-label">Seller Contact Unlocked:</span>
                            <div className="contact-details">
                              <span>📞 +91 98450 XXXXX</span>
                              <span>✉ sales@{p.seller.toLowerCase().replace(/\s+/g, "")}.com</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn ghost sm block mt"
                            onClick={() => handleUnlockContact(p.seller)}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </svg>
                            Unlock Seller Contact (1 view)
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn primary sm block mt"
                          onClick={() => openEnquiry(p)}
                        >
                          Send Wholesale Enquiry →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 2: SELLER TAB
              ========================================================= */}
          {activeTab === "seller" && isSellerRole && (
            <div className="seller-dashboard-view">
              {/* SPEC REQUIREMENT: Complete seller form card, shown until admin approval */}
              <div className="seller-onboarding-callout-card">
                <div className="callout-header">
                  <span className="step-pill">Phase 2 · Seller Onboarding</span>
                  <h3>Complete seller form</h3>
                  <p className="muted">
                    This step is required to publish wholesale commodity listings and receive direct purchase orders.
                  </p>
                </div>

                <div className="form-preview-list">
                  <div className="form-step-item">
                    <span className="step-num">1</span>
                    <div>
                      <strong>Business Verification &amp; FSSAI Licence</strong>
                      <p className="muted small">Upload FSSAI registration certificate and APMC mandi licence</p>
                    </div>
                  </div>

                  <div className="form-step-item">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Commodity Catalog Submission</strong>
                      <p className="muted small">Define crop varieties, harvest origin, grade (A/B/C), MOQ &amp; price slabs</p>
                    </div>
                  </div>

                  <div className="form-step-item">
                    <span className="step-num">3</span>
                    <div>
                      <strong>Admin Listing Moderation</strong>
                      <p className="muted small">Quality check before items are published live to verified bulk buyers</p>
                    </div>
                  </div>
                </div>

                <div className="seller-status-box">
                  <span className="status-label">Seller Application Status:</span>
                  <b>Form opening in next phase (Subscription active at ₹365/mo)</b>
                </div>

                <button
                  type="button"
                  className="btn primary lg"
                  onClick={() => alert("The full commodity submission form opens in the next phase as planned in the BRD.")}
                >
                  Start Seller Onboarding Form (Next Phase) →
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Send Enquiry */}
        {enquiryModalOpen && selectedProduct && (
          <div className="modal-backdrop" onClick={() => setEnquiryModalOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Direct Purchase Enquiry</h3>
                <button type="button" className="close-btn" onClick={() => setEnquiryModalOpen(false)} aria-label="Close">
                  &times;
                </button>
              </div>

              {enqSuccess ? (
                <div className="modal-body text-center">
                  <div className="success-icon">✓</div>
                  <h3>Enquiry Sent to {selectedProduct.seller}!</h3>
                  <p className="muted">
                    Your request for <b>{enqQty} {selectedProduct.unit}</b> of {selectedProduct.name} has been routed directly to the verified seller.
                  </p>
                  <button
                    type="button"
                    className="btn primary block mt"
                    onClick={() => setEnquiryModalOpen(false)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setEnqSuccess(true);
                  }}
                  className="modal-form"
                >
                  <div className="product-summary-bar">
                    <b>{selectedProduct.name}</b> · {selectedProduct.origin} · {selectedProduct.price}
                  </div>

                  <div className="form-group">
                    <label>Required Quantity ({selectedProduct.unit}) *</label>
                    <input
                      type="number"
                      min={selectedProduct.moq}
                      value={enqQty}
                      onChange={(e) => setEnqQty(+e.target.value)}
                      required
                    />
                    <small className="muted">Minimum order quantity is {selectedProduct.moq} {selectedProduct.unit}</small>
                  </div>

                  <div className="form-group">
                    <label>Delivery Location *</label>
                    <input
                      type="text"
                      defaultValue={state.individualDetails?.city || state.companyDetails?.city || "Salem"}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Notes / Quality Specifications</label>
                    <textarea
                      rows={3}
                      placeholder="Specify required moisture percentage, gunny bag packaging, or target delivery timeline..."
                    />
                  </div>

                  <button type="submit" className="btn primary block lg">
                    Send Enquiry Directly to Seller →
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </OnboardingGuard>
  );
}
