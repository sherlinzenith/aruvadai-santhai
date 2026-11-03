"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import { api } from "@/lib/api";
import { useOnboarding } from "@/lib/onboarding-context";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { state, unlockSeller } = useOnboarding();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enqQty, setEnqQty] = useState(1);
  const [enqUnit, setEnqUnit] = useState("quintal");
  const [enqGrade, setEnqGrade] = useState("Grade A");
  const [enqPackaging, setEnqPackaging] = useState("Standard Jute Bags (50kg)");
  const [enqTargetPrice, setEnqTargetPrice] = useState("");
  const [enqAttachmentUrl, setEnqAttachmentUrl] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [enqNotes, setEnqNotes] = useState("");
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProduct() {
      setLoading(true);
      setError("");
      const res = await api.fetchProductById(id);
      if (!active) return;
      if (res.success && res.product) {
        setProduct(res.product);
        setEnqQty(res.product.moq || 1);
        setEnqUnit(res.product.unit || "quintal");
        setEnqTargetPrice(res.product.price || "");
        setDeliveryLocation(state.individualDetails?.city || state.companyDetails?.city || "");
      } else {
        setError(res.error || "Commodity listing not found.");
      }
      setLoading(false);
    }

    if (id) {
      loadProduct();
    }

    return () => {
      active = false;
    };
  }, [id, state]);

  const handleUnlockContact = async () => {
    if (!product?.seller) return;
    const sellerId = product.seller.id || product.seller.businessName;
    const res = await unlockSeller(sellerId);
    if (res.success) {
      const prodRes = await api.fetchProductById(id);
      if (prodRes.success && prodRes.product) {
        setProduct(prodRes.product);
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
    setEnqSubmitting(true);
    const res = await api.submitEnquiry({
      productId: product.id,
      sellerId: product.seller?.id || product.seller?.userId || product.seller?.businessName,
      category: product.category,
      quantity: enqQty,
      unit: enqUnit || product.unit || "quintal",
      grade: enqGrade,
      packaging: enqPackaging,
      deliveryLocation,
      notes: enqNotes,
      targetPrice: enqTargetPrice || product.price,
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
                ← Back to Marketplace
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
              <p className="muted">Loading commodity listing details from database...</p>
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
              <h3 style={{ color: "#991B1B", margin: "0 0 8px 0" }}>Product Notice</h3>
              <p style={{ color: "#7F1D1D", margin: "0 0 16px 0" }}>{error}</p>
              <Link href="/dashboard" className="btn primary sm">
                Return to Dashboard
              </Link>
            </div>
          )}

          {product && !loading && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid var(--clr-border, #E5E7EB)",
                overflow: "hidden",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px", padding: "32px" }}>
                {/* Left: Product Image & Badges */}
                <div>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "340px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#f3f4f6",
                    }}
                  >
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", gap: "8px" }}>
                      <span className="badge" style={{ background: "#0F3D2E", color: "#fff", padding: "4px 8px" }}>
                        Grade {product.grade}
                      </span>
                      {product.organic && (
                        <span className="badge" style={{ background: "#059669", color: "#fff", padding: "4px 8px" }}>
                          Organic Certified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Product Details & Pricing */}
                <div>
                  <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                    {product.category}
                  </span>
                  <h1 style={{ fontSize: "28px", color: "var(--clr-forest, #0F3D2E)", margin: "8px 0 12px 0" }}>
                    {product.name}
                  </h1>
                  <p className="muted" style={{ margin: "0 0 16px 0" }}>
                    Harvest Location: <b>{product.origin}</b>
                  </p>

                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 700,
                      color: "#1E6E4D",
                      marginBottom: "20px",
                    }}
                  >
                    {product.price}
                  </div>

                  <div
                    style={{
                      background: "#F9FAFB",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "24px",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="muted">Minimum Order Quantity (MOQ):</span>
                      <b>
                        {product.moq} {product.unit}
                      </b>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span className="muted">Stock Availability:</span>
                      <span className={product.avail === "Limited" ? "warn" : "okc"}>● {product.avail}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="muted">Standard Packaging:</span>
                      <b>{product.packaging}</b>
                    </div>
                  </div>

                  <p style={{ lineHeight: "1.6", color: "#4B5563", marginBottom: "24px" }}>
                    {product.description}
                  </p>

                  <button
                    type="button"
                    className="btn primary block lg"
                    onClick={() => {
                      setEnqSuccess(false);
                      setEnquiryModalOpen(true);
                    }}
                  >
                    Send Direct Wholesale Enquiry →
                  </button>
                </div>
              </div>

              {/* Seller Public Profile Section */}
              <div
                style={{
                  borderTop: "1px solid #E5E7EB",
                  padding: "32px",
                  background: "#FBF8EC",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <span className="muted small" style={{ textTransform: "uppercase" }}>
                      Verified Producer / Seller
                    </span>
                    <h3 style={{ margin: "4px 0 8px 0", fontSize: "20px", color: "#0F3D2E" }}>
                      {product.seller.businessName}
                    </h3>
                    <p className="muted" style={{ margin: 0 }}>
                      {product.seller.businessCategory} · {product.seller.location}
                    </p>
                  </div>

                  <div>
                    {product.seller.isUnlocked ? (
                      <div
                        style={{
                          background: "#ECFDF5",
                          border: "1px solid #10B981",
                          borderRadius: "8px",
                          padding: "12px 16px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                          ✓ SELLER CONTACT UNLOCKED
                        </span>
                        <div style={{ fontSize: "14px", color: "#047857" }}>
                          <div>📞 {product.seller.contact?.mobile || "+91 98450 XXXXX"}</div>
                          <div>✉️ {product.seller.contact?.email || "verified-supplier@ulavansanthai.com"}</div>
                        </div>
                      </div>
                    ) : (
                      <button type="button" className="btn ghost sm" onClick={handleUnlockContact}>
                        Unlock Verified Seller Contact (1 view)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Send Enquiry */}
        {enquiryModalOpen && product && (
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
                  <h3 style={{ color: "#065F46" }}>Enquiry Sent to {product.seller?.businessName}!</h3>
                  <p className="muted" style={{ margin: "12px 0 20px 0" }}>
                    Your request for <b>{enqQty} {enqUnit}</b> of {product.name} ({enqGrade}, {enqPackaging}) has been routed directly to the verified seller.
                  </p>
                  <button type="button" className="btn primary block" onClick={() => setEnquiryModalOpen(false)}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendEnquiry} className="modal-form">
                  <div className="product-summary-bar" style={{ background: "#F3F4F6", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                    <b>{product.name}</b> · {product.origin} · {product.category} · Benchmark: {product.price}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Required Quantity *</label>
                      <input
                        type="number"
                        min={1}
                        value={enqQty}
                        onChange={(e) => setEnqQty(+e.target.value)}
                        required
                      />
                      <small className="muted">MOQ: {product.moq} {product.unit}</small>
                    </div>

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
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Delivery Location *</label>
                      <input
                        type="text"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        placeholder="Mandi, City or District"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Target Price (₹)</label>
                      <input
                        type="text"
                        value={enqTargetPrice}
                        onChange={(e) => setEnqTargetPrice(e.target.value)}
                        placeholder="e.g. ₹2,400 / quintal"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Additional Notes / Specifications</label>
                    <textarea
                      rows={2}
                      value={enqNotes}
                      onChange={(e) => setEnqNotes(e.target.value)}
                      placeholder="Specify required moisture %, maximum foreign matter, target delivery timeline, etc."
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

