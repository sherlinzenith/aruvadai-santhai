"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
const CATEGORIES = [
    "Farmer or producer",
    "Bakery or food business",
    "Food processor",
    "Manufacturer",
    "Wholesaler",
    "Trader or distributor",
    "Retailer",
    "Reseller",
    "Other",
];
const PURPOSES = [
    "Personal use / Household",
    "Baking",
    "Food processing",
    "Manufacturing",
    "Resale / Wholesale",
    "Further processing",
    "Other",
];
export default function OnboardPage() {
    const router = useRouter();
    const { user, updateUser } = useAuth();
    // Current Step: 1 = Role Choice, 2 = Pay 365, 3 = Admin Review, 4 = Business Category / Setup
    const [step, setStep] = useState(1);
    // Stage 3 state
    const [selectedRole, setSelectedRole] = useState("buyer");
    const [purposes, setPurposes] = useState(["Personal use / Household"]);
    // Stage 4 state
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [upiId, setUpiId] = useState("");
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState("AS-10822");
    // Stage 5 state (Admin Review)
    const [adminReviewStatus, setAdminReviewStatus] = useState("pending");
    // Stage 5B state
    const [accountKind, setAccountKind] = useState("individual");
    const [skippedCategory, setSkippedCategory] = useState(false);
    const [businessCategory, setBusinessCategory] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [gstStatus, setGstStatus] = useState("Registered");
    const [gstin, setGstin] = useState("");
    const [pan, setPan] = useState("");
    const [fssaiNumber, setFssaiNumber] = useState("");
    const [fssaiExpiry, setFssaiExpiry] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("Madurai");
    const [state, setState] = useState("Tamil Nadu");
    const [pincode, setPincode] = useState("625020");
    const [documentsUploaded, setDocumentsUploaded] = useState(false);
    useEffect(() => {
        if (user) {
            if (user.role)
                setSelectedRole(user.role);
            if (user.isPaid)
                setStep(3);
        }
    }, [user]);
    // Stage 3 Handler
    const handleRoleSubmit = () => {
        updateUser({
            role: selectedRole,
            activeMode: selectedRole === "seller" ? "seller" : "buyer",
            purposes,
        });
        setStep(2);
    };
    // Stage 4 Handler (Pay 365)
    const handlePay = () => {
        setIsProcessingPayment(true);
        setTimeout(() => {
            const generatedReceipt = `AS-${Math.floor(10000 + Math.random() * 90000)}`;
            setReceiptNumber(generatedReceipt);
            setIsProcessingPayment(false);
            updateUser({
                isPaid: true,
                paymentReceipt: generatedReceipt,
            });
            setStep(3);
            // Simulate automated admin review transition after 1.5 seconds
            setTimeout(() => {
                setAdminReviewStatus("approved");
            }, 1500);
        }, 1200);
    };
    // Stage 5 Proceed to Category
    const handleProceedToCategory = () => {
        if (selectedRole === "seller") {
            setAccountKind("business");
            setSkippedCategory(false);
            setBusinessCategory("Farmer or producer");
        }
        setStep(4);
    };
    // Stage 5B: Choose Skip Category (Common User / Common Man)
    const handleSkipCategory = () => {
        setSkippedCategory(true);
        setAccountKind("individual");
        setBusinessCategory("");
        setGstin("");
    };
    // Stage 5B: Finalize Setup
    const handleFinalize = () => {
        updateUser({
            accountKind,
            businessCategory: skippedCategory ? undefined : businessCategory,
            businessName: skippedCategory ? undefined : businessName,
            gstin: skippedCategory ? undefined : gstin,
            gstStatus: selectedRole === "seller" ? gstStatus : undefined,
            pan: skippedCategory ? undefined : pan,
            fssaiNumber: selectedRole === "seller" ? fssaiNumber : undefined,
            fssaiExpiry: selectedRole === "seller" ? fssaiExpiry : undefined,
            address,
            city,
            state,
            pincode,
            sellerStatus: selectedRole === "seller" || selectedRole === "both" ? "Approved" : undefined,
            isVerified: true,
        });
        router.push("/dashboard");
    };
    const togglePurpose = (p) => {
        if (purposes.includes(p)) {
            setPurposes(purposes.filter((x) => x !== p));
        }
        else {
            setPurposes([...purposes, p]);
        }
    };
    return (<div className="onboard-page">
      <div className="onboard-container">
        {/* Top Header */}
        <div className="onboard-nav">
          <Link href="/" className="logo" aria-label="UlavanSanthai home">
            <Image src="/logo.png" alt="UlavanSanthai" width={190} height={42} priority className="brand-logo"/>
          </Link>
          <div className="onboard-progress">
            <span className={`step-dot ${step >= 1 ? "active" : ""}`}>1. Role</span>
            <span className="dot-sep">›</span>
            <span className={`step-dot ${step >= 2 ? "active" : ""}`}>2. Pay ₹365</span>
            <span className="dot-sep">›</span>
            <span className={`step-dot ${step >= 3 ? "active" : ""}`}>3. Admin Review</span>
            <span className="dot-sep">›</span>
            <span className={`step-dot ${step >= 4 ? "active" : ""}`}>4. Business Setup</span>
          </div>
        </div>

        {/* STEP 1: STAGE 3 ROLE SELECTION */}
        {step === 1 && (<div className="wizard-step">
            <div className="step-head">
              <span className="eyebrow">Stage 3 · View Options</span>
              <h2>Choose how you want to trade</h2>
              <p className="muted">
                One unified account with role flags. You can add the other role at any time from your dashboard.
              </p>
            </div>

            <div className="role-cards-grid">
              {/* Option 1: Buyer */}
              <div className={`role-select-card ${selectedRole === "buyer" ? "selected" : ""}`} onClick={() => setSelectedRole("buyer")}>
                <div className="role-radio">
                  <span className={`dot ${selectedRole === "buyer" ? "checked" : ""}`}/>
                </div>
                <div className="role-info">
                  <h3>Buyer</h3>
                  <span className="role-sub">Common Man or Business Buyer</span>
                  <p>
                    Browse verified grains, pulses, spices, oils and produce. Direct enquiries, private contacts, no middlemen.
                  </p>
                  <div className="role-highlight">₹365 for up to 10 seller contacts</div>
                </div>
              </div>

              {/* Option 2: Seller */}
              <div className={`role-select-card ${selectedRole === "seller" ? "selected" : ""}`} onClick={() => setSelectedRole("seller")}>
                <div className="role-radio">
                  <span className={`dot ${selectedRole === "seller" ? "checked" : ""}`}/>
                </div>
                <div className="role-info">
                  <h3>Seller</h3>
                  <span className="role-sub">Farmer, Producer, Processor or Trader</span>
                  <p>
                    List your commodities with MOQ and tiered price slabs. Receive direct purchase enquiries from buyers.
                  </p>
                  <div className="role-highlight">₹365 / month subscription</div>
                </div>
              </div>

              {/* Option 3: Both Buyer & Seller */}
              <div className={`role-select-card ${selectedRole === "both" ? "selected" : ""}`} onClick={() => setSelectedRole("both")}>
                <div className="role-radio">
                  <span className={`dot ${selectedRole === "both" ? "checked" : ""}`}/>
                </div>
                <div className="role-info">
                  <div className="row between">
                    <h3>Both Buyer &amp; Seller</h3>
                    <span className="badge amber">Dual Role</span>
                  </div>
                  <span className="role-sub">Complete trade capability</span>
                  <p>
                    Buy raw materials for processing while also selling your finished produce. Seamless 1-click toggle.
                  </p>
                  <div className="role-highlight">Unified account with dual role flags</div>
                </div>
              </div>
            </div>

            {/* If Buyer or Both: Purpose of Purchase */}
            {(selectedRole === "buyer" || selectedRole === "both") && (<div className="purpose-box">
                <h4>What is your purpose of purchase? *</h4>
                <p className="muted small">Select all that apply:</p>
                <div className="tags-row">
                  {PURPOSES.map((p) => (<button key={p} type="button" className={`tag-btn ${purposes.includes(p) ? "active" : ""}`} onClick={() => togglePurpose(p)}>
                      {purposes.includes(p) ? (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", marginRight: "4px" }}><polyline points="20 6 9 17 4 12"/></svg>) : "+ "}
                      {p}
                    </button>))}
                </div>
              </div>)}

            <div className="step-actions">
              <button type="button" className="btn primary lg" onClick={handleRoleSubmit}>
                Continue to Payment (₹365) →
              </button>
            </div>
          </div>)}

        {/* STEP 2: STAGE 4 PAYMENT OF ₹365 */}
        {step === 2 && (<div className="wizard-step">
            <div className="step-head">
              <span className="eyebrow">Stage 4 · Gateway Checkout</span>
              <h2>Pay ₹365 to verify your account</h2>
              <p className="muted">
                Payment comes first so every account is committed and reviewed by admin before unlocking.
              </p>
            </div>

            <div className="checkout-grid">
              {/* Order Summary */}
              <div className="order-summary-card">
                <h3>Order Summary</h3>
                <div className="summary-item">
                  <span>Selected Role</span>
                  <b>{selectedRole === "buyer" ? "Buyer Access" : selectedRole === "seller" ? "Seller Subscription" : "Dual Role (Buyer & Seller)"}</b>
                </div>
                <div className="summary-item">
                  <span>Plan Inclusions</span>
                  <small>
                    {selectedRole === "buyer"
                ? "10 Verified Seller Views + Enquiries"
                : "Monthly Product Listing + Verified Badge"}
                  </small>
                </div>
                <div className="summary-item">
                  <span>Base Amount</span>
                  <b>₹365.00</b>
                </div>
                <div className="summary-item">
                  <span>Taxes (GST)</span>
                  <b>₹0.00 (Inclusive)</b>
                </div>
                <div className="summary-total">
                  <span>Total Payable</span>
                  <span className="big-price">₹365</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pay-methods-card">
                <h3>Select Payment Method</h3>
                <div className="methods-tabs">
                  <button type="button" className={`method-btn ${paymentMethod === "upi" ? "on" : ""}`} onClick={() => setPaymentMethod("upi")}>
                    UPI (GPay / PhonePe)
                  </button>
                  <button type="button" className={`method-btn ${paymentMethod === "card" ? "on" : ""}`} onClick={() => setPaymentMethod("card")}>
                    Debit / Credit Card
                  </button>
                  <button type="button" className={`method-btn ${paymentMethod === "netbanking" ? "on" : ""}`} onClick={() => setPaymentMethod("netbanking")}>
                    Net Banking
                  </button>
                </div>

                <div className="method-fields">
                  {paymentMethod === "upi" && (<div className="upi-pane">
                      <label>Enter Virtual Payment Address (VPA / UPI ID)</label>
                      <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@okhdfcbank or 9876543210@upi"/>
                      <small className="muted">Instant verification via UPI 2.0 gateway</small>
                    </div>)}

                  {paymentMethod === "card" && (<div className="card-pane">
                      <label>Card Number</label>
                      <input type="text" placeholder="4111 2222 3333 4444" maxLength={19}/>
                      <div className="two-col mt">
                        <div>
                          <label>Expiry</label>
                          <input type="text" placeholder="MM/YY" maxLength={5}/>
                        </div>
                        <div>
                          <label>CVV</label>
                          <input type="password" placeholder="123" maxLength={4}/>
                        </div>
                      </div>
                    </div>)}

                  {paymentMethod === "netbanking" && (<div className="nb-pane">
                      <label>Select Bank</label>
                      <select>
                        <option>State Bank of India</option>
                        <option>HDFC Bank</option>
                        <option>ICICI Bank</option>
                        <option>Axis Bank</option>
                        <option>Canara Bank</option>
                      </select>
                    </div>)}
                </div>

                <button type="button" className="btn primary block lg mt" onClick={handlePay} disabled={isProcessingPayment}>
                  {isProcessingPayment ? "Processing Secure Payment..." : "Pay ₹365 & Generate Receipt"}
                </button>
              </div>
            </div>
          </div>)}

        {/* STEP 3: STAGE 5 ADMIN REVIEW */}
        {step === 3 && (<div className="wizard-step text-center">
            <div className="step-head">
              <span className="eyebrow">Stage 5 · Verification &amp; Review</span>
              <h2>Admin Review of Payment</h2>
              <p className="muted">Transaction and amount matched against gateway reference.</p>
            </div>

            <div className="admin-review-box">
              <div className="receipt-badge">
                <div className="rc-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3>Payment Approved</h3>
                <p>Transaction ID: <b>TXN-{Date.now().toString().slice(-7)}</b></p>
                <p>Receipt Number: <b>{receiptNumber}</b></p>
                <div className="status-pill ok">Account Status: Active</div>
              </div>

              <div className="review-meta">
                <div className="meta-row">
                  <span>Payment Amount</span>
                  <b>₹365.00 (Cleared)</b>
                </div>
                <div className="meta-row">
                  <span>Reviewed By</span>
                  <b>Admin Queue #4 · Verified</b>
                </div>
                <div className="meta-row">
                  <span>Seller View Allowance</span>
                  <b>10 Sellers Active</b>
                </div>
              </div>

              <button type="button" className="btn primary lg mt" onClick={handleProceedToCategory}>
                Proceed to Business Setup &amp; Category →
              </button>
            </div>
          </div>)}

        {/* STEP 4: STAGE 5B BUSINESS CATEGORY (THE 3 PATHS) */}
        {step === 4 && (<div className="wizard-step">
            <div className="step-head">
              <span className="eyebrow">Stage 5B · Business Setup</span>
              <h2>Business category and identity</h2>
              <p className="muted">
                Only users who choose a business category ever see GSTIN. Common buyers skip the category and are treated as Individuals.
              </p>
            </div>

            {/* Choice: Common User vs Business Buyer (Only for Buyer role) */}
            {selectedRole === "buyer" && !skippedCategory && !businessCategory && (<div className="lane-choice-grid">
                <div className="lane-card individual-lane" onClick={handleSkipCategory}>
                  <div className="lane-badge">Path 1: Common User</div>
                  <h3>Common Man / Individual Buyer</h3>
                  <p>
                    Buying for personal consumption, family, or small household needs. Skip company categories and <b>never see GSTIN</b>.
                  </p>
                  <ul className="lane-features">
                    <li><span className="dot-check">•</span> No GSTIN or company documents</li>
                    <li><span className="dot-check">•</span> Instant access to 10 verified sellers</li>
                    <li><span className="dot-check">•</span> Direct wholesale enquiries</li>
                  </ul>
                  <button type="button" className="btn ghost block mt">
                    Skip Category &amp; Continue as Individual →
                  </button>
                </div>

                <div className="lane-card business-lane" onClick={() => {
                    setAccountKind("business");
                    setSkippedCategory(false);
                    setBusinessCategory("Bakery or food business");
                }}>
                  <div className="lane-badge amber">Path 2: Business Buyer</div>
                  <h3>Business Buyer (Bakery, Processor, Reseller)</h3>
                  <p>
                    Buying for commercial production, hotel, bakery, or trading. Choose your business category and add optional GSTIN.
                  </p>
                  <ul className="lane-features">
                    <li><span className="dot-check">•</span> Commercial invoicing with GSTIN</li>
                    <li><span className="dot-check">•</span> Bulk quantities and recurring orders</li>
                    <li><span className="dot-check">•</span> Contract negotiation directly with farmers</li>
                  </ul>
                  <button type="button" className="btn amber block mt">
                    Select Business Category &amp; GSTIN →
                  </button>
                </div>
              </div>)}

            {/* FORM A: Common User (Individual) - NO GSTIN! */}
            {(selectedRole === "buyer" && skippedCategory) && (<div className="path-form-card">
                <div className="form-badge-bar">
                  <span className="tag-pill individual">Common Man / Individual Buyer</span>
                  <button type="button" className="text-btn" onClick={() => {
                    setSkippedCategory(false);
                    setAccountKind("business");
                    setBusinessCategory("Bakery or food business");
                }}>
                    Switch to Business Buyer
                  </button>
                </div>

                <h3>Delivery &amp; Profile Details</h3>
                <p className="muted small">
                  As an individual buyer, no business forms or GSTIN are required. Simply share your delivery location.
                </p>

                <div className="form-group mt">
                  <label>Full delivery address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / Door number, Street name, Area"/>
                </div>

                <div className="three-col">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)}/>
                  </div>
                </div>

                <div className="privacy-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Your phone number and address are kept private and never published publicly.
                </div>

                <button type="button" className="btn primary block lg mt" onClick={handleFinalize}>
                  Complete Setup &amp; Explore Marketplace →
                </button>
              </div>)}

            {/* FORM B: Business Buyer */}
            {selectedRole === "buyer" && !skippedCategory && businessCategory && (<div className="path-form-card">
                <div className="form-badge-bar">
                  <span className="tag-pill business">Business Buyer</span>
                  <button type="button" className="text-btn" onClick={handleSkipCategory}>
                    Skip category (Switch to Individual)
                  </button>
                </div>

                <h3>Business Category &amp; Details</h3>

                <div className="form-group">
                  <label>Business Category *</label>
                  <select value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)}>
                    {CATEGORIES.map((c) => (<option key={c} value={c}>
                        {c}
                      </option>))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Registered Business Name *</label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Annapoorna Bakers & Foods"/>
                </div>

                {/* GSTIN: Shown only after category is chosen, marked 'if applicable' */}
                <div className="form-group">
                  <label>GSTIN (if applicable)</label>
                  <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="15-character GSTIN (optional for buyers)" maxLength={15}/>
                  <small className="muted">Private · Visible to admin only</small>
                </div>

                <div className="three-col">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)}/>
                  </div>
                </div>

                <button type="button" className="btn primary block lg mt" onClick={handleFinalize}>
                  Save Business Details &amp; Start Trading →
                </button>
              </div>)}

            {/* FORM C: Seller Form (Required for Seller / Both) */}
            {(selectedRole === "seller" || selectedRole === "both") && (<div className="path-form-card">
                <div className="form-badge-bar">
                  <span className="tag-pill seller">
                    {selectedRole === "both" ? "Dual Role · Seller Setup" : "Seller Onboarding"}
                  </span>
                </div>

                <h3>Seller &amp; Farm Onboarding Form</h3>
                <p className="muted small">
                  GSTIN, FSSAI, and documents are checked by admin before a Verified badge is issued.
                </p>

                <div className="two-col mt">
                  <div className="form-group">
                    <label>Business Category (Required) *</label>
                    <select value={businessCategory || "Farmer or producer"} onChange={(e) => setBusinessCategory(e.target.value)}>
                      {CATEGORIES.map((c) => (<option key={c} value={c}>
                          {c}
                        </option>))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Farm / Business Name *</label>
                    <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Patel Organic Agro Mills"/>
                  </div>
                </div>

                <div className="form-group">
                  <label>GST Status *</label>
                  <div className="radio-row">
                    <label className="radio-opt">
                      <input type="radio" name="gststatus" checked={gstStatus === "Registered"} onChange={() => setGstStatus("Registered")}/>
                      <span>GST Registered</span>
                    </label>
                    <label className="radio-opt">
                      <input type="radio" name="gststatus" checked={gstStatus === "Unregistered"} onChange={() => setGstStatus("Unregistered")}/>
                      <span>Unregistered / Farmer PAN</span>
                    </label>
                  </div>
                </div>

                {gstStatus === "Registered" ? (<div className="form-group">
                    <label>GSTIN (15 characters) *</label>
                    <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="e.g. 24AAAAA0000A1Z5" maxLength={15}/>
                    <small className="muted">Private · Kept hidden from buyers</small>
                  </div>) : (<div className="form-group">
                    <label>PAN Number &amp; Exemption Reason *</label>
                    <input type="text" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F (Agriculturalist)" maxLength={10}/>
                  </div>)}

                <div className="two-col">
                  <div className="form-group">
                    <label>FSSAI Licence Number (if food produce)</label>
                    <input type="text" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} placeholder="14-digit FSSAI number"/>
                  </div>
                  <div className="form-group">
                    <label>FSSAI Expiry Date</label>
                    <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)}/>
                  </div>
                </div>

                <div className="form-group">
                  <label>Verification Document Upload *</label>
                  <div className={`upload-zone ${documentsUploaded ? "uploaded" : ""}`} onClick={() => setDocumentsUploaded(true)}>
                    {documentsUploaded ? (<p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g7)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <b>2 Documents uploaded:</b> GST_Certificate.pdf, Farm_Land_Proof.pdf
                      </p>) : (<p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="12" y1="18" x2="12" y2="12"/>
                          <line x1="9" y1="15" x2="15" y2="15"/>
                        </svg>
                        <span>Click to upload GST Certificate, FSSAI licence or Farm Proof (PDF / JPG up to 5MB)</span>
                      </p>)}
                  </div>
                  <small className="muted">Visible to admin only for verification</small>
                </div>

                <div className="three-col">
                  <div className="form-group">
                    <label>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)}/>
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)}/>
                  </div>
                </div>

                <button type="button" className="btn primary block lg mt" onClick={handleFinalize}>
                  Submit Seller Form &amp; Open Dashboard →
                </button>
              </div>)}
          </div>)}
      </div>
    </div>);
}
