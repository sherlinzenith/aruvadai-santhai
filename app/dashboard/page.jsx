"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import { useOnboarding } from "@/lib/onboarding-context";
import { categories, products } from "@/lib/content";

export default function DashboardPage() {
  const router = useRouter();
  const { state, unlockSeller, signOutUser } = useOnboarding();

  const isBuyerRole = state.roles.includes("buyer");
  const isSellerRole = state.roles.includes("seller");
  const isBoth = isBuyerRole && isSellerRole;

  // Active tab: default to seller if seller role, else buyer
  const [activeTab, setActiveTab] = useState(
    isSellerRole && !isBuyerRole ? "seller" : "buyer"
  );

  // Buyer search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  // Modal states (Buyer Wholesale Enquiry)
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [enqQty, setEnqQty] = useState(10);
  const [enqSuccess, setEnqSuccess] = useState(false);

  // Seller Dashboard State
  const [sellerListings, setSellerListings] = useState([
    {
      id: "list_1",
      name: "Sona Masoori Paddy (Raw Rice)",
      cat: "Grains & cereals",
      grade: "Grade A",
      price: "₹46 / kg",
      moq: "20 quintal",
      avail: "Available",
      origin: "Salem, Tamil Nadu",
      date: "Active Today",
    },
    {
      id: "list_2",
      name: "Organic Curcumin Turmeric Fingers",
      cat: "Spices & masalas",
      grade: "Grade A",
      price: "₹175 / kg",
      moq: "5 quintal",
      avail: "Available",
      origin: "Erode, Tamil Nadu",
      date: "Active Today",
    },
    {
      id: "list_3",
      name: "Toor Dal (Unpolished Farm Gate)",
      cat: "Pulses & lentils",
      grade: "Grade B",
      price: "₹122 / kg",
      moq: "10 quintal",
      avail: "In Harvest",
      origin: "Dharmapuri, Tamil Nadu",
      date: "Harvest in 7 days",
    },
  ]);

  // Inbound Buyer Enquiries (RFQs)
  const [inboundRfqs, setInboundRfqs] = useState([
    {
      id: "rfq_1",
      buyerName: "Annapoorna Bakers & Foods",
      buyerContact: "+91 98450 12345",
      commodity: "Sona Masoori Paddy (Raw Rice)",
      quantity: "50 quintals",
      deliveryCity: "Coimbatore, Tamil Nadu",
      targetPrice: "₹45/kg",
      status: "New Enquiry",
      date: "2 hours ago",
    },
    {
      id: "rfq_2",
      buyerName: "Kongu Agro Processors",
      buyerContact: "+91 97890 54321",
      commodity: "Organic Curcumin Turmeric Fingers",
      quantity: "15 quintals",
      deliveryCity: "Erode, Tamil Nadu",
      targetPrice: "₹172/kg",
      status: "Responded",
      date: "Yesterday",
    },
  ]);

  // Add Commodity Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newCommodity, setNewCommodity] = useState({
    name: "",
    cat: "Grains & cereals",
    grade: "Grade A",
    price: "",
    moq: "",
    avail: "Available",
    origin: "Salem, Tamil Nadu",
  });
  const [addFeedback, setAddFeedback] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCat === "All" || p.cat === selectedCat;
      const matchesQuery = (p.name + p.seller + p.origin)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [searchQuery, selectedCat]);

  const handleUnlockContact = (sellerName) => {
    if (state.remainingViews <= 0 && !state.viewedSellers.includes(sellerName)) {
      alert("You have reached your 10 seller view allowance. In the full platform, add 10 more views for ₹10.");
      return;
    }
    unlockSeller(sellerName);
  };

  const openEnquiry = (p) => {
    setSelectedProduct(p);
    setEnqQty(p.moq);
    setEnqSuccess(false);
    setEnquiryModalOpen(true);
  };

  const handleAddCommoditySubmit = (e) => {
    e.preventDefault();
    if (!newCommodity.name || !newCommodity.price) return;

    const created = {
      id: `list_${Date.now()}`,
      name: newCommodity.name,
      cat: newCommodity.cat,
      grade: newCommodity.grade,
      price: newCommodity.price.includes("₹") ? newCommodity.price : `₹${newCommodity.price} / kg`,
      moq: newCommodity.moq ? `${newCommodity.moq} quintal` : "10 quintal",
      avail: newCommodity.avail,
      origin: newCommodity.origin || "Tamil Nadu",
      date: "Just Now",
    };

    setSellerListings([created, ...sellerListings]);
    setAddFeedback(`✓ "${created.name}" published live to the wholesale marketplace!`);
    setTimeout(() => {
      setAddFeedback("");
      setAddModalOpen(false);
      setNewCommodity({
        name: "",
        cat: "Grains & cereals",
        grade: "Grade A",
        price: "",
        moq: "",
        avail: "Available",
        origin: "Salem, Tamil Nadu",
      });
    }, 1200);
  };

  const handleToggleRfqStatus = (rfqId) => {
    setInboundRfqs(
      inboundRfqs.map((r) =>
        r.id === rfqId ? { ...r, status: r.status === "New Enquiry" ? "Responded" : "Completed" } : r
      )
    );
  };

  // Profile details
  const businessDetails = state.companyDetails || state.individualDetails || {};
  const businessName =
    businessDetails.legalName ||
    businessDetails.businessName ||
    `${state.user?.name || "Verified"} Agri Farms`;

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
                    Seller Trading Portal
                  </button>
                </div>
              )}
            </div>

            <div className="dash-user-controls">
              <div className="dash-badge-group">
                <span className="badge role-badge">
                  {isBoth ? "Both (Buyer + Seller)" : isSellerRole ? "Seller" : "Buyer"}
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

              {/* Search & Filters */}
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
              VIEW 2: REAL FUNCTIONAL SELLER DASHBOARD
              ========================================================= */}
          {activeTab === "seller" && isSellerRole && (
            <div className="seller-dashboard-view">
              {/* Seller KPI Bar */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginBottom: "28px",
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Active Listings
                  </span>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--g9)", marginTop: "4px" }}>
                    {sellerListings.length}
                  </div>
                  <span className="badge ok" style={{ marginTop: "6px" }}>
                    ✓ Published to Marketplace
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Inbound Buyer Enquiries
                  </span>
                  <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--amber-d)", marginTop: "4px" }}>
                    {inboundRfqs.length}
                  </div>
                  <span className="badge amber" style={{ marginTop: "6px" }}>
                    ● Direct RFQs Awaiting Reply
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Seller Verification
                  </span>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--g7)", marginTop: "6px" }}>
                    ✓ Verified Active
                  </div>
                  <span className="muted small" style={{ display: "block", marginTop: "4px" }}>
                    Admin Approved &amp; Document Checked
                  </span>
                </div>

                <div
                  style={{
                    background: "#fff",
                    padding: "20px",
                    borderRadius: "14px",
                    border: "1px solid var(--line)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  }}
                >
                  <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Trading Farm Entity
                  </span>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--g9)", marginTop: "6px" }}>
                    {businessName}
                  </div>
                  <span className="muted small" style={{ display: "block", marginTop: "4px" }}>
                    Mandi Location: {businessDetails.city || "Tamil Nadu"}
                  </span>
                </div>
              </div>

              {/* Action Header: Commodity Listings */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#fff",
                  padding: "18px 24px",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, color: "var(--g9)" }}>My Commodity Listings</h3>
                  <p className="muted small" style={{ margin: "2px 0 0" }}>
                    Wholesale crop varieties live for verified buyers across Tamil Nadu and South India.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => setAddModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span>+</span> Add New Commodity Listing
                </button>
              </div>

              {/* Commodity Listings Table */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  overflow: "hidden",
                  marginBottom: "36px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                    <thead>
                      <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--line)", color: "var(--mut)" }}>
                        <th style={{ padding: "14px 20px" }}>Commodity / Variety</th>
                        <th style={{ padding: "14px 20px" }}>Category</th>
                        <th style={{ padding: "14px 20px" }}>Grade</th>
                        <th style={{ padding: "14px 20px" }}>Price / Unit</th>
                        <th style={{ padding: "14px 20px" }}>MOQ</th>
                        <th style={{ padding: "14px 20px" }}>Availability</th>
                        <th style={{ padding: "14px 20px" }}>Farm Origin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerListings.map((l) => (
                        <tr key={l.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "14px 20px", fontWeight: 600, color: "var(--g9)" }}>
                            {l.name}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span className="pill" style={{ fontSize: "0.82rem" }}>{l.cat}</span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span className="badge" style={{ background: "#e6f4ec", color: "#0f3d2e", fontWeight: 700 }}>
                              {l.grade}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", fontWeight: 700, color: "var(--g8)" }}>
                            {l.price}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            {l.moq}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <span
                              className="badge"
                              style={{
                                background: l.avail === "Available" ? "#e6f4ec" : "#fef08a",
                                color: l.avail === "Available" ? "#0f3d2e" : "#854d0e",
                                fontWeight: 600,
                              }}
                            >
                              ● {l.avail}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", color: "var(--mut)" }}>
                            {l.origin}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Inbound Wholesale Buyer Enquiries */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid var(--line)",
                  padding: "24px",
                  marginBottom: "36px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--g9)" }}>Inbound Wholesale Buyer Enquiries (RFQs)</h3>
                    <p className="muted small" style={{ margin: "2px 0 0" }}>
                      Direct purchase orders sent by commercial buyers sourcing from your listings.
                    </p>
                  </div>
                  <span className="badge amber" style={{ fontWeight: 700 }}>
                    {inboundRfqs.length} Active Requests
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {inboundRfqs.map((rfq) => (
                    <div
                      key={rfq.id}
                      style={{
                        padding: "16px 20px",
                        background: "var(--cream)",
                        borderRadius: "10px",
                        border: "1px solid var(--line)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <strong style={{ color: "var(--g9)", fontSize: "1.05rem" }}>{rfq.buyerName}</strong>
                          <span className="badge ok" style={{ fontSize: "0.78rem" }}>Verified Buyer</span>
                          <span className="muted small">· {rfq.date}</span>
                        </div>
                        <p style={{ margin: "4px 0", fontSize: "0.92rem", color: "var(--g8)" }}>
                          Requesting <b>{rfq.quantity}</b> of <b>{rfq.commodity}</b> for delivery to <b>{rfq.deliveryCity}</b>
                        </p>
                        <div style={{ display: "flex", gap: "16px", fontSize: "0.85rem", color: "var(--mut)" }}>
                          <span>📞 {rfq.buyerContact}</span>
                          <span>Target Price: <b>{rfq.targetPrice}</b></span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          className={`badge ${rfq.status === "New Enquiry" ? "amber" : "ok"}`}
                          style={{ textTransform: "uppercase", fontWeight: 700 }}
                        >
                          {rfq.status}
                        </span>
                        <button
                          type="button"
                          className="btn ghost sm"
                          onClick={() => handleToggleRfqStatus(rfq.id)}
                        >
                          {rfq.status === "New Enquiry" ? "Send Quote / Accept →" : "Fulfilled ✓"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Verified Business Card */}
              <div
                style={{
                  background: "#f7fbf9",
                  borderRadius: "14px",
                  border: "1px solid #d1ead9",
                  padding: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="green-checkmark" style={{ fontSize: "1.2rem" }}>✓</span>
                    <h4 style={{ margin: 0, color: "#0f3d2e", fontSize: "1.1rem" }}>
                      {businessName} — Verified Seller Status
                    </h4>
                  </div>
                  <p className="muted small" style={{ margin: "6px 0 0" }}>
                    Your commodities carry the verified green badge on the marketplace. Phone and tax documents remain private.
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="badge ok" style={{ fontSize: "0.88rem", padding: "6px 12px" }}>
                    Subscription Active
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Add New Commodity Listing */}
        {addModalOpen && (
          <div className="modal-backdrop" onClick={() => setAddModalOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
              <div className="modal-header">
                <h3>Publish New Commodity Listing</h3>
                <button type="button" className="close-btn" onClick={() => setAddModalOpen(false)} aria-label="Close">
                  &times;
                </button>
              </div>

              {addFeedback ? (
                <div className="modal-body text-center">
                  <div className="success-icon" style={{ fontSize: "2rem", color: "var(--g7)" }}>✓</div>
                  <h3 style={{ color: "var(--g9)", marginTop: "8px" }}>Listing Published!</h3>
                  <p className="muted">{addFeedback}</p>
                </div>
              ) : (
                <form onSubmit={handleAddCommoditySubmit} className="modal-form">
                  <div className="form-group">
                    <label>Commodity / Crop Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Salem Bangalora Mango or Guntur Chilli"
                      value={newCommodity.name}
                      onChange={(e) => setNewCommodity({ ...newCommodity, name: e.target.value })}
                    />
                  </div>

                  <div className="two-col">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        value={newCommodity.cat}
                        onChange={(e) => setNewCommodity({ ...newCommodity, cat: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c.n} value={c.n}>{c.n}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Grade *</label>
                      <select
                        value={newCommodity.grade}
                        onChange={(e) => setNewCommodity({ ...newCommodity, grade: e.target.value })}
                      >
                        <option value="Grade A">Grade A (Premium)</option>
                        <option value="Grade B">Grade B (Standard)</option>
                        <option value="Grade C">Grade C (Commercial)</option>
                      </select>
                    </div>
                  </div>

                  <div className="two-col">
                    <div className="form-group">
                      <label>Price per Unit (₹) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 52 / kg or 5200 / quintal"
                        value={newCommodity.price}
                        onChange={(e) => setNewCommodity({ ...newCommodity, price: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Minimum Order (MOQ) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 20 quintal"
                        value={newCommodity.moq}
                        onChange={(e) => setNewCommodity({ ...newCommodity, moq: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="two-col">
                    <div className="form-group">
                      <label>Availability *</label>
                      <select
                        value={newCommodity.avail}
                        onChange={(e) => setNewCommodity({ ...newCommodity, avail: e.target.value })}
                      >
                        <option value="Available">Available Live</option>
                        <option value="In Harvest">Harvesting in 7-14 Days</option>
                        <option value="Limited">Limited Stock</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Farm / Mandi Location *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Salem, Tamil Nadu"
                        value={newCommodity.origin}
                        onChange={(e) => setNewCommodity({ ...newCommodity, origin: e.target.value })}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn primary block lg mt">
                    Publish Commodity to Marketplace →
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Send Enquiry (Buyer) */}
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
