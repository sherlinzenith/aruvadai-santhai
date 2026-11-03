"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import { api } from "@/lib/api";
import { useOnboarding } from "@/lib/onboarding-context";
import { categories } from "@/lib/content";

export default function SellerProfilePage() {
  const params = useParams();
  const id = params?.id;
  const { state, unlockSeller } = useOnboarding();

  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Enquiry modal state
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enqCategory, setEnqCategory] = useState(categories[0]?.n || "Grains");
  const [enqQty, setEnqQty] = useState(50);
  const [enqUnit, setEnqUnit] = useState("quintal");
  const [enqGrade, setEnqGrade] = useState("Grade A");
  const [enqPackaging, setEnqPackaging] = useState("Standard Jute Bags (50kg)");
  const [enqTargetPrice, setEnqTargetPrice] = useState("");
  const [enqAttachmentUrl, setEnqAttachmentUrl] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState(
    state.individualDetails?.city || state.companyDetails?.city || ""
  );
  const [enqNotes, setEnqNotes] = useState("");
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadSeller() {
      setLoading(true);
      setError("");
      const res = await api.fetchSellerProfile(id);
      if (!active) return;
      if (res.success && res.seller) {
        setSeller(res.seller);
      } else {
        setError(res.error || "Seller profile not found.");
      }
      setLoading(false);
    }

    if (id) {
      loadSeller();
    }

    return () => {
      active = false;
    };
  }, [id]);

  const handleUnlock = async () => {
    if (!seller) return;
    const sellerId = seller.id || seller.userId || seller.businessName;
    const res = await unlockSeller(sellerId);
    if (res.success) {
      const sellerRes = await api.fetchSellerProfile(id);
      if (sellerRes.success && sellerRes.seller) {
        setSeller(sellerRes.seller);
      }
    } else {
      if (res.canPurchaseAddon || res.error === "insufficient_views") {
        alert("You have exhausted your 10 seller view allowance. Please purchase 10 more views for ₹10 from your dashboard.");
      } else {
        alert(res.message || "Failed to unlock seller contact.");
      }
    }
  };

  const handleSendEnquiry = async (e) => {
    e.preventDefault();
    if (!seller) return;
    setEnqSubmitting(true);
    const sellerId = seller.id || seller.userId || seller.businessName;
    const res = await api.submitEnquiry({
      sellerId,
      category: enqCategory,
      quantity: enqQty,
      unit: enqUnit,
      grade: enqGrade,
      packaging: enqPackaging,
      deliveryLocation,
      targetPrice: enqTargetPrice,
      notes: enqNotes,
      attachmentUrl: enqAttachmentUrl || null,
    });
    setEnqSubmitting(false);
    if (res.success) {
      setEnqSuccess(true);
    } else {
      alert(res.error || "Failed to submit enquiry.");
    }
  };

  return (
    <OnboardingGuard allowedPath="/dashboard">
      <div className="dashboard-shell">
        <header className="dash-nav">
          <div className="dash-nav-in wrap">
            <div className="row">
              <Link href="/dashboard" className="logo" aria-label="Back to dashboard">
                <Image src="/logo.png" alt="UlavanSanthai" width={180} height={40} priority className="brand-logo" />
              </Link>
              <Link href="/dashboard" className="btn ghost sm" style={{ marginLeft: "16px" }}>
                ← Back to Dashboard
              </Link>
            </div>
            <div className="dash-user-controls">
              <span className="dash-user-name">{state.user?.name || "Verified Buyer"}</span>
            </div>
          </div>
        </header>

        <main className="dash-main wrap" style={{ maxWidth: "1000px", margin: "32px auto", padding: "0 16px" }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div className="pulsing-amber-dot" style={{ margin: "0 auto 16px auto", width: "16px", height: "16px" }} />
              <p className="muted">Loading seller profile from database...</p>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <h3 style={{ color: "#991B1B", margin: "0 0 8px 0" }}>Seller Profile Notice</h3>
              <p style={{ color: "#7F1D1D", margin: "0 0 16px 0" }}>{error}</p>
              <Link href="/dashboard" className="btn primary sm">
                Return to Dashboard
              </Link>
            </div>
          )}

          {seller && !loading && (
            <div>
              {/* Seller Header Banner */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "32px",
                  marginBottom: "32px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h1 style={{ fontSize: "28px", color: "#0F3D2E", margin: 0 }}>{seller.businessName}</h1>
                      {seller.isVerified && (
                        <span className="badge ok" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          ✓ Verified Seller
                        </span>
                      )}
                    </div>
                    <p className="muted" style={{ margin: 0 }}>
                      {seller.businessCategory} · {seller.location.city}, {seller.location.state}
                    </p>
                    <small className="muted" style={{ display: "block", marginTop: "8px" }}>
                      Verified Partner since {seller.approvedAt ? new Date(seller.approvedAt).toLocaleDateString() : "2026"}
                    </small>
                  </div>

                  {/* Action Buttons: Contact Unlock & Send Enquiry */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => {
                        setEnqSuccess(false);
                        setEnquiryModalOpen(true);
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <span>✉️</span> Send Wholesale Enquiry
                    </button>

                    {seller.isUnlocked ? (
                      <div
                        style={{
                          background: "#ECFDF5",
                          border: "1px solid #10B981",
                          borderRadius: "8px",
                          padding: "16px 20px",
                          textAlign: "left",
                        }}
                      >
                        <strong style={{ display: "block", color: "#065F46", marginBottom: "8px" }}>
                          ✓ Direct Contact Details Unlocked
                        </strong>
                        <div style={{ fontSize: "14px", color: "#047857", lineHeight: "1.6" }}>
                          <div><b>Contact Person:</b> {seller.contact?.contactPerson || "Authorized Sales Representative"}</div>
                          <div><b>Direct Phone:</b> {seller.contact?.mobile || "+91 98450 XXXXX"}</div>
                          <div><b>Business Email:</b> {seller.contact?.email || "sales@ulavansanthai.com"}</div>
                          {seller.contact?.address && <div><b>Address:</b> {seller.contact.address}</div>}
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "right" }}>
                        <button type="button" className="btn ghost sm" onClick={handleUnlock}>
                          Unlock Direct Seller Contact (1 view)
                        </button>
                        <p className="muted small" style={{ marginTop: "6px" }}>
                          {state.remainingViews} remaining seller views in your plan
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Published Commodities by this seller */}
              <h2 style={{ fontSize: "22px", color: "#0F3D2E", marginBottom: "16px" }}>
                Published Commodities by {seller.businessName}
              </h2>

              {seller.publishedProducts?.length === 0 ? (
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px dashed #D1D5DB",
                    borderRadius: "8px",
                    padding: "32px",
                    textAlign: "center",
                  }}
                >
                  <p className="muted">No commodities currently published by this seller.</p>
                </div>
              ) : (
                <div className="dash-product-grid">
                  {seller.publishedProducts.map((p) => (
                    <article className="pcard" key={p.id}>
                      <div className="pimg">
                        <Image src={p.image || "/products/rice.jpg"} alt={p.name} fill className="pimg-photo" />
                        <span className="g">Grade {p.grade}</span>
                        {p.organic && <span className="o">Organic</span>}
                      </div>
                      <div className="pbody">
                        <h3>{p.name}</h3>
                        <p className="muted">{p.origin} · {p.category}</p>
                        <div className="price">{p.price}</div>
                        <div className="row between small">
                          <span>MOQ {p.moq} {p.unit}</span>
                          <span className={p.avail === "Limited" ? "warn" : "okc"}>● {p.avail}</span>
                        </div>
                        <Link href={`/dashboard/products/${p.id}`} className="btn primary sm block mt">
                          View Commodity Details →
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Modal: Send General Enquiry to Seller */}
        {enquiryModalOpen && seller && (
          <div className="modal-backdrop" onClick={() => setEnquiryModalOpen(false)}>
            <div className="modal-box large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h3>Direct Wholesale Purchase Enquiry</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setEnquiryModalOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {enqSuccess ? (
                <div className="modal-body text-center" style={{ padding: "24px 0" }}>
                  <div className="success-icon" style={{ fontSize: "36px", color: "#10B981", marginBottom: "8px" }}>✓</div>
                  <h3 style={{ color: "#065F46" }}>Enquiry Sent to {seller.businessName}!</h3>
                  <p className="muted" style={{ margin: "12px 0 20px 0" }}>
                    Your general enquiry for <b>{enqQty} {enqUnit}</b> of <b>{enqCategory}</b> ({enqGrade}, {enqPackaging}) has been routed directly to the verified seller.
                  </p>
                  <button type="button" className="btn primary block" onClick={() => setEnquiryModalOpen(false)}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendEnquiry} className="modal-form">
                  <div className="product-summary-bar" style={{ background: "#F3F4F6", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                    <b>Supplier:</b> {seller.businessName} · {seller.businessCategory} · {seller.location.city}, {seller.location.state}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Commodity Category *</label>
                      <select
                        value={enqCategory}
                        onChange={(e) => setEnqCategory(e.target.value)}
                        required
                      >
                        {categories.map((c) => (
                          <option key={c.n} value={c.n}>
                            {c.n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Required Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        value={enqQty}
                        onChange={(e) => setEnqQty(+e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Unit of Measurement *</label>
                      <select
                        value={enqUnit}
                        onChange={(e) => setEnqUnit(e.target.value)}
                        required
                      >
                        <option value="quintal">Quintal (100 kg)</option>
                        <option value="tonne">Metric Tonne (1,000 kg)</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="bag">Bag</option>
                        <option value="box">Box / Crate</option>
                        <option value="litre">Litre</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Required Grade / Quality</label>
                      <select
                        value={enqGrade}
                        onChange={(e) => setEnqGrade(e.target.value)}
                      >
                        <option value="Grade A">Grade A (Premium)</option>
                        <option value="Grade B">Grade B (Commercial)</option>
                        <option value="Grade C">Grade C (Standard)</option>
                        <option value="Export Quality">Export Quality</option>
                        <option value="Fair Average Quality (FAQ)">Fair Average Quality (FAQ)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Packaging Requirements</label>
                      <select
                        value={enqPackaging}
                        onChange={(e) => setEnqPackaging(e.target.value)}
                      >
                        <option value="Standard Jute Bags (50kg)">Standard Jute Bags (50kg)</option>
                        <option value="PP Woven Bags (25kg)">PP Woven Bags (25kg)</option>
                        <option value="PP Woven Bags (50kg)">PP Woven Bags (50kg)</option>
                        <option value="Corrugated Boxes">Corrugated Boxes</option>
                        <option value="Loose / Bulk Cargo">Loose / Bulk Cargo</option>
                        <option value="Custom Buyer Packaging">Custom Buyer Packaging</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Price (₹)</label>
                      <input
                        type="text"
                        value={enqTargetPrice}
                        onChange={(e) => setEnqTargetPrice(e.target.value)}
                        placeholder="e.g. ₹2,500 / quintal"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Delivery Location *</label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                      placeholder="Mandi, City or District (e.g. Salem APMC)"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Notes / Procurement Specifications</label>
                    <textarea
                      rows={2}
                      value={enqNotes}
                      onChange={(e) => setEnqNotes(e.target.value)}
                      placeholder="Specify required variety, moisture %, maximum foreign matter, target delivery timeline, etc."
                    />
                  </div>

                  <div className="form-group">
                    <label>Supporting Attachment Link (Optional)</label>
                    <input
                      type="url"
                      value={enqAttachmentUrl}
                      onChange={(e) => setEnqAttachmentUrl(e.target.value)}
                      placeholder="https://... (link to lab report, PO spec or sample benchmark)"
                    />
                  </div>

                  <button type="submit" className="btn primary block lg" disabled={enqSubmitting}>
                    {enqSubmitting ? "Submitting Enquiry..." : "Send Wholesale Enquiry Directly to Seller →"}
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

