"use client";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/Guard";
import { useOnboarding } from "@/lib/onboarding-context";
import { api } from "@/lib/api";
import { categories } from "@/lib/content";
import { loadRazorpayScript } from "@/lib/razorpay-client";

export default function DashboardPage() {
  const router = useRouter();
  const { state, unlockSeller, addViewsEntitlement, signOutUser } = useOnboarding();

  const isBuyerRole = state.roles.includes("buyer");
  const isSellerRole = state.roles.includes("seller");
  const isBoth = isBuyerRole && isSellerRole;

  // Active tab: default to buyer if available, else seller
  const [activeTab, setActiveTab] = useState(isBuyerRole ? "buyer" : "seller");

  // Real Database Buyer Profile & Dashboard State
  const [buyerData, setBuyerData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Unlocked Seller Contact History State
  const [viewHistory, setViewHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Marketplace Products State
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [person2Notice, setPerson2Notice] = useState("");

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedGrade, setSelectedGrade] = useState("Any");
  const [isOrganic, setIsOrganic] = useState(false);
  const [selectedAvail, setSelectedAvail] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Unlock Feedback Notification
  const [unlockNotice, setUnlockNotice] = useState(null);

  // Add-on Views Purchase State (₹10 for 10 views)
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const [addonPurchasing, setAddonPurchasing] = useState(false);
  const [addonError, setAddonError] = useState("");
  const [addonSuccess, setAddonSuccess] = useState(false);

  // Modal states for Direct Purchase Enquiry from product card
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [enqQty, setEnqQty] = useState(10);
  const [enqUnit, setEnqUnit] = useState("quintal");
  const [enqGrade, setEnqGrade] = useState("Grade A");
  const [enqPackaging, setEnqPackaging] = useState("Standard Jute Bags (50kg)");
  const [enqTargetPrice, setEnqTargetPrice] = useState("");
  const [enqAttachmentUrl, setEnqAttachmentUrl] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [enqNotes, setEnqNotes] = useState("");
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqSuccess, setEnqSuccess] = useState(false);

  // Wholesale Enquiries list & detail modal state
  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [selectedEnquiryModal, setSelectedEnquiryModal] = useState(null);

  // New Wholesale Enquiry from Dashboard modal state
  const [dashboardEnquiryOpen, setDashboardEnquiryOpen] = useState(false);
  const [dashEnqSellerId, setDashEnqSellerId] = useState("");
  const [dashEnqCategory, setDashEnqCategory] = useState("Grains");
  const [dashEnqQty, setDashEnqQty] = useState(50);
  const [dashEnqUnit, setDashEnqUnit] = useState("quintal");
  const [dashEnqGrade, setDashEnqGrade] = useState("Grade A");
  const [dashEnqPackaging, setDashEnqPackaging] = useState("Standard Jute Bags (50kg)");
  const [dashEnqTargetPrice, setDashEnqTargetPrice] = useState("");
  const [dashEnqLocation, setDashEnqLocation] = useState("");
  const [dashEnqNotes, setDashEnqNotes] = useState("");
  const [dashEnqAttachmentUrl, setDashEnqAttachmentUrl] = useState("");
  const [dashEnqSubmitting, setDashEnqSubmitting] = useState(false);
  const [dashEnqSuccess, setDashEnqSuccess] = useState(false);

  // 1. Fetch real buyer dashboard info from PostgreSQL
  const loadBuyerDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    const res = await api.fetchBuyerDashboard();
    if (res.success && res.buyer) {
      setBuyerData(res.buyer);
      if (res.buyer.details?.city) {
        setDeliveryLocation(res.buyer.details.city);
        setDashEnqLocation(res.buyer.details.city);
      }
    }
    setLoadingDashboard(false);
  }, []);

  // 2. Fetch seller view history
  const loadViewHistory = useCallback(async () => {
    setLoadingHistory(true);
    const res = await api.fetchViewHistory();
    if (res.success && res.history) {
      setViewHistory(res.history);
      if (res.history.length > 0) {
        setDashEnqSellerId(res.history[0].sellerId || "");
      }
    }
    setLoadingHistory(false);
  }, []);

  // 3. Fetch buyer wholesale enquiries
  const loadBuyerEnquiries = useCallback(async () => {
    setLoadingEnquiries(true);
    const res = await api.fetchBuyerEnquiries();
    if (res.success && res.enquiries) {
      setEnquiries(res.enquiries);
    }
    setLoadingEnquiries(false);
  }, []);

  useEffect(() => {
    loadBuyerDashboard();
    loadViewHistory();
    loadBuyerEnquiries();
  }, [loadBuyerDashboard, loadViewHistory, loadBuyerEnquiries]);

  // 3. Fetch marketplace products with search, filters, sorting & pagination
  const loadMarketplaceProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError("");
    setPerson2Notice("");

    const params = {
      q: searchQuery,
      category: selectedCat,
      grade: selectedGrade,
      availability: selectedAvail,
      organic: isOrganic ? true : undefined,
      sort: sortOption,
      page: currentPage,
      limit: 9,
    };

    const res = await api.fetchProducts(params);
    if (res.success) {
      setProducts(res.products || []);
      setTotalProducts(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
      if (res.person2Integration?.tableStatus === "missing") {
        setPerson2Notice(res.person2Integration.message);
      }
    } else {
      setProductsError(res.error || "Failed to load marketplace commodities.");
    }
    setLoadingProducts(false);
  }, [searchQuery, selectedCat, selectedGrade, selectedAvail, isOrganic, sortOption, currentPage]);

  useEffect(() => {
    loadMarketplaceProducts();
  }, [loadMarketplaceProducts]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCat("All");
    setSelectedGrade("Any");
    setSelectedAvail("All");
    setIsOrganic(false);
    setSortOption("newest");
    setCurrentPage(1);
  };

  // 4. Secure Seller Contact Unlocking by Seller ID
  const handleUnlockContact = async (sellerId, sellerName) => {
    const targetId = sellerId || sellerName;
    const res = await unlockSeller(targetId);

    if (res.success) {
      if (res.newlyUnlocked) {
        setUnlockNotice({
          type: "success",
          message: `✓ Contact unlocked for ${sellerName || "Seller"}! (${res.remainingViews} views left)`,
        });
      } else if (res.alreadyUnlocked) {
        setUnlockNotice({
          type: "info",
          message: `ℹ ${sellerName || "Seller"} is already unlocked. No view allowance consumed.`,
        });
      }
      loadBuyerDashboard();
      loadViewHistory();
      loadMarketplaceProducts();
    } else {
      if (res.canPurchaseAddon || res.error === "insufficient_views") {
        setAddonError("");
        setAddonSuccess(false);
        setAddonModalOpen(true);
      } else {
        alert(res.message || res.error || "Could not unlock seller contact.");
      }
    }
  };

  // 5. Purchase Additional Views (₹10 for 10 seller views)
  const handleBuyAddonViews = async () => {
    setAddonPurchasing(true);
    setAddonError("");

    try {
      const orderRes = await api.createPaymentOrder({
        purchaseType: "buyer_addon_views",
        customAmount: 10,
      });

      if (!orderRes.success) {
        if (orderRes.configured === false) {
          setAddonError("Razorpay Test Mode credentials are not yet set in .env.local.");
        } else {
          setAddonError(orderRes.error || "Failed to create payment order.");
        }
        setAddonPurchasing(false);
        return;
      }

      await loadRazorpayScript();
      if (typeof window.Razorpay === "undefined") {
        setAddonError("Unable to load Razorpay payment gateway.");
        setAddonPurchasing(false);
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: "INR",
        name: "UlavanSanthai",
        description: "10 Additional Seller Contact Views (₹10)",
        order_id: orderRes.orderId,
        prefill: {
          name: state.user?.name || "",
          email: state.user?.email || "",
          contact: state.user?.mobile || "",
        },
        theme: {
          color: "#0F3D2E",
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              purchaseType: "buyer_addon_views",
              receiptNumber: orderRes.receiptNumber,
              method: "upi",
            });

            if (verifyRes.success) {
              addViewsEntitlement(10);
              setAddonSuccess(true);
              setAddonPurchasing(false);
              loadBuyerDashboard();
              setTimeout(() => {
                setAddonModalOpen(false);
              }, 1800);
            } else {
              setAddonError(verifyRes.error || "Payment verification failed.");
              setAddonPurchasing(false);
            }
          } catch (err) {
            setAddonError(err.message || "Failed to verify addon payment.");
            setAddonPurchasing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setAddonPurchasing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setAddonError(resp.error?.description || "Payment failed or was cancelled.");
        setAddonPurchasing(false);
      });
      rzp.open();
    } catch (e) {
      setAddonError(e.message || "An unexpected error occurred.");
      setAddonPurchasing(false);
    }
  };

  const openEnquiry = (p) => {
    setSelectedProduct(p);
    setEnqQty(p.moq || 1);
    setEnqUnit(p.unit || "quintal");
    setEnqGrade(p.grade ? `Grade ${p.grade}` : "Grade A");
    setEnqPackaging("Standard Jute Bags (50kg)");
    setEnqTargetPrice(p.price || "");
    setEnqAttachmentUrl("");
    setDeliveryLocation(buyerData?.details?.city || state.individualDetails?.city || state.companyDetails?.city || "Salem");
    setEnqNotes("");
    setEnqSuccess(false);
    setEnquiryModalOpen(true);
  };

  const submitEnquiryForm = async (e) => {
    e.preventDefault();
    setEnqSubmitting(true);
    const sellerId = selectedProduct?.seller?.id || selectedProduct?.seller?.businessName;
    const res = await api.submitEnquiry({
      productId: selectedProduct?.id,
      sellerId: sellerId,
      category: selectedProduct?.category,
      quantity: enqQty,
      unit: enqUnit,
      grade: enqGrade,
      packaging: enqPackaging,
      deliveryLocation,
      notes: enqNotes,
      targetPrice: enqTargetPrice || selectedProduct?.price,
      attachmentUrl: enqAttachmentUrl || null,
    });
    setEnqSubmitting(false);
    if (res.success) {
      setEnqSuccess(true);
      loadBuyerDashboard();
      loadBuyerEnquiries();
    } else {
      alert(res.error || "Failed to submit enquiry.");
    }
  };

  const submitDashEnquiryForm = async (e) => {
    e.preventDefault();
    if (!dashEnqSellerId) {
      alert("Please select or enter a seller ID.");
      return;
    }
    setDashEnqSubmitting(true);
    const res = await api.submitEnquiry({
      sellerId: dashEnqSellerId,
      category: dashEnqCategory,
      quantity: dashEnqQty,
      unit: dashEnqUnit,
      grade: dashEnqGrade,
      packaging: dashEnqPackaging,
      deliveryLocation: dashEnqLocation || deliveryLocation,
      targetPrice: dashEnqTargetPrice,
      notes: dashEnqNotes,
      attachmentUrl: dashEnqAttachmentUrl || null,
    });
    setDashEnqSubmitting(false);
    if (res.success) {
      setDashEnqSuccess(true);
      loadBuyerDashboard();
      loadBuyerEnquiries();
    } else {
      alert(res.error || "Failed to submit enquiry.");
    }
  };

  const renderStatusBadge = (status) => {
    const s = (status || "sent").toLowerCase();
    if (s === "accepted") {
      return (
        <span style={{ background: "#ECFDF5", color: "#047857", border: "1px solid #A7F3D0", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ● Accepted
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ● Declined
        </span>
      );
    }
    if (s === "reviewed") {
      return (
        <span style={{ background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
          ● Reviewed
        </span>
      );
    }
    return (
      <span style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
        ● Sent
      </span>
    );
  };

  // Profile data precedence: real DB buyer profile -> state
  const displayName = buyerData?.name || state.user?.name || "Verified Trader";
  const displayAccountType = (buyerData?.accountType || state.accountType || "Individual").toUpperCase();
  const totalViewsAllowance = buyerData?.viewStats?.totalAllowance ?? 10;
  const remainingViews = buyerData?.viewStats?.remainingViews ?? state.remainingViews;
  const usedViews = buyerData?.viewStats?.usedViews ?? Math.max(0, totalViewsAllowance - remainingViews);
  const adminApprovalStatus = buyerData?.adminReview?.status || "pending";
  const paymentStatus = buyerData?.payment?.status || (state.payment?.isPaid ? "completed" : "pending");

  return (
    <OnboardingGuard allowedPath="/dashboard">
      <div className="dashboard-shell">
        {/* Navigation Bar */}
        <header className="dash-nav">
          <div className="dash-nav-in wrap">
            <div className="row">
              <Link href="/" className="logo" aria-label="UlavanSanthai home">
                <Image src="/logo.png" alt="UlavanSanthai" width={180} height={40} priority className="brand-logo" />
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
                <span className="badge type-badge">{displayAccountType}</span>
              </div>
              <span className="dash-user-name">{displayName}</span>
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
              {/* Unlock Feedback Banner */}
              {unlockNotice && (
                <div
                  style={{
                    background: unlockNotice.type === "success" ? "#ECFDF5" : "#EFF6FF",
                    border: `1px solid ${unlockNotice.type === "success" ? "#10B981" : "#3B82F6"}`,
                    color: unlockNotice.type === "success" ? "#065F46" : "#1E40AF",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{unlockNotice.message}</span>
                  <button
                    type="button"
                    onClick={() => setUnlockNotice(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "inherit" }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Buyer Stats Bar - 100% Real Database Data */}
              <div className="buyer-stats-bar">
                <div className="stat-pill-box">
                  <span className="stat-label">Sellers Viewed</span>
                  <div className="stat-counter">
                    <b>{usedViews}</b>
                    <span>/ {totalViewsAllowance} allowance</span>
                  </div>
                </div>

                <div className="stat-pill-box">
                  <span className="stat-label">Remaining Unlocks</span>
                  <div className={`stat-counter ${remainingViews > 0 ? "highlight" : ""}`}>
                    <b>{remainingViews}</b>
                    <span>{remainingViews === 0 ? "exhausted" : "contacts left"}</span>
                  </div>
                  {remainingViews === 0 && (
                    <button
                      type="button"
                      className="btn primary sm mt"
                      style={{ marginTop: "6px", width: "100%", padding: "4px 8px", fontSize: "12px" }}
                      onClick={() => {
                        setAddonError("");
                        setAddonSuccess(false);
                        setAddonModalOpen(true);
                      }}
                    >
                      + Add 10 Views (₹10)
                    </button>
                  )}
                </div>

                <div className="stat-pill-box">
                  <span className="stat-label">Admin Approval</span>
                  <div className={`stat-counter ${adminApprovalStatus === "approved" ? "green" : ""}`}>
                    <b>{adminApprovalStatus === "approved" ? "Approved" : "Under Review"}</b>
                    <span>{adminApprovalStatus === "approved" ? "Verified Trader" : "GSTIN / Payment Review"}</span>
                  </div>
                </div>

                <div className="stat-pill-box">
                  <span className="stat-label">Payment Status</span>
                  <div className={`stat-counter ${paymentStatus === "completed" ? "green" : ""}`}>
                    <b>{paymentStatus === "completed" ? "Verified" : "Pending"}</b>
                    <span>₹{buyerData?.payment?.amount || 365} Paid</span>
                  </div>
                </div>
              </div>

              {/* View Exhaustion Notice Banner */}
              {remainingViews === 0 && (
                <div
                  style={{
                    background: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginBottom: "24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <strong style={{ color: "#92400E", fontSize: "14px" }}>
                      ⚠️ You have exhausted your 10 seller view allowance!
                    </strong>
                    <p style={{ margin: "4px 0 0 0", color: "#B45309", fontSize: "13px" }}>
                      You can continue viewing your previously unlocked sellers anytime for free. To connect with new sellers, add 10 more views for ₹10.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => {
                      setAddonError("");
                      setAddonSuccess(false);
                      setAddonModalOpen(true);
                    }}
                  >
                    Buy 10 Views (₹10) →
                  </button>
                </div>
              )}

              {/* Profile Details Snapshot */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <span className="muted">Authenticated Buyer: </span>
                  <b>{displayName}</b> ({buyerData?.email || state.user?.email}) ·{" "}
                  <span>{buyerData?.details?.city || state.individualDetails?.city || "Salem"}, {buyerData?.details?.state || "Tamil Nadu"}</span>
                  {buyerData?.details?.gstin && (
                    <span style={{ marginLeft: "8px", color: "#0F3D2E", fontWeight: 600 }}>
                      [GSTIN: {buyerData.details.gstin}]
                    </span>
                  )}
                </div>
                <div>
                  <span className="badge ok">Profile: 100% Completed</span>
                </div>
              </div>

              {/* Search & Multi-Filter Control Bar */}
              <div className="buyer-search-bar" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <div className="search-input-wrapper" style={{ flex: "1 1 240px" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search commodity name, variety, origin, or agro-mill..."
                  />
                </div>

                <select
                  value={selectedCat}
                  onChange={(e) => {
                    setSelectedCat(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cat-select"
                  aria-label="Filter Category"
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.n} value={c.n}>
                      {c.n}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cat-select"
                  aria-label="Filter Grade"
                >
                  <option value="Any">Any Grade</option>
                  <option value="A">Grade A</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                </select>

                <select
                  value={selectedAvail}
                  onChange={(e) => {
                    setSelectedAvail(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="cat-select"
                  aria-label="Filter Availability"
                >
                  <option value="All">All Stock</option>
                  <option value="Available">Available</option>
                  <option value="Limited">Limited Stock</option>
                </select>

                <button
                  type="button"
                  className={`toggle ${isOrganic ? "on" : ""}`}
                  onClick={() => {
                    setIsOrganic(!isOrganic);
                    setCurrentPage(1);
                  }}
                  style={{ height: "42px", padding: "0 12px" }}
                >
                  <span>Organic Only</span>
                </button>

                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="cat-select"
                  aria-label="Sort Options"
                >
                  <option value="newest">Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>

                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={handleClearFilters}
                  style={{ height: "42px" }}
                >
                  Clear Filters
                </button>
              </div>

              {/* Person 2 Schema / Table Notice */}
              {person2Notice && (
                <div
                  style={{
                    background: "#FEF3C7",
                    border: "1px solid #F59E0B",
                    borderRadius: "8px",
                    padding: "14px 18px",
                    margin: "16px 0",
                    fontSize: "13px",
                    color: "#92400E",
                  }}
                >
                  <strong>Person 2 Shared Integration Notice:</strong> {person2Notice}
                </div>
              )}

              {/* Loading State */}
              {loadingProducts && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div className="pulsing-amber-dot" style={{ margin: "0 auto 12px auto" }} />
                  <p className="muted">Searching marketplace database...</p>
                </div>
              )}

              {/* Error State */}
              {productsError && !loadingProducts && (
                <div style={{ background: "#FEE2E2", border: "1px solid #EF4444", borderRadius: "8px", padding: "16px", margin: "20px 0", color: "#991B1B" }}>
                  {productsError}
                </div>
              )}

              {/* Empty State */}
              {!loadingProducts && !productsError && products.length === 0 && (
                <div
                  style={{
                    background: "#F9FAFB",
                    border: "1px dashed #D1D5DB",
                    borderRadius: "12px",
                    padding: "48px 24px",
                    textAlign: "center",
                    margin: "24px 0",
                  }}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px auto" }}>
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <h3 style={{ color: "#374151", margin: "0 0 6px 0" }}>No approved commodities found</h3>
                  <p className="muted" style={{ margin: "0 0 16px 0" }}>
                    No products matched your search or filters. Products appear here once published by verified sellers and approved by platform moderators.
                  </p>
                  <button type="button" className="btn primary sm" onClick={handleClearFilters}>
                    Reset Search & Filters
                  </button>
                </div>
              )}

              {/* Products Grid */}
              {!loadingProducts && products.length > 0 && (
                <div>
                  <div className="dash-product-grid">
                    {products.map((p) => {
                      const sellerId = p.seller?.id || p.seller?.userId;
                      const sellerName = p.seller?.businessName || "Verified Agro Seller";
                      const isUnlocked =
                        buyerData?.viewStats?.viewedSellers?.includes(sellerId) ||
                        buyerData?.viewStats?.viewedSellers?.includes(sellerName) ||
                        state.viewedSellers.includes(sellerId) ||
                        state.viewedSellers.includes(sellerName);

                      return (
                        <article className="pcard" key={p.id}>
                          <div className="pimg">
                            <Image
                              src={p.image || "/products/rice.jpg"}
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
                            <p className="muted">
                              {p.origin} · {p.category}
                            </p>
                            <div className="price">{p.price}</div>

                            <div className="row between small">
                              <span>
                                MOQ {p.moq} {p.unit}
                              </span>
                              <span className={p.avail === "Limited" ? "warn" : "okc"}>
                                ● {p.avail}
                              </span>
                            </div>

                            <div className="seller mt">
                              <span className="badge ok">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Verified
                              </span>
                              <Link
                                href={`/dashboard/sellers/${sellerId || encodeURIComponent(sellerName)}`}
                                style={{ color: "#0F3D2E", fontWeight: 600, textDecoration: "underline" }}
                              >
                                {sellerName}
                              </Link>
                            </div>

                            {/* Seller Contact Status */}
                            {isUnlocked ? (
                              <div className="unlocked-contact-card">
                                <span className="contact-label">Seller Contact Unlocked:</span>
                                <div className="contact-details">
                                  <span>📞 {p.seller?.contact?.mobile || "+91 98450 XXXXX"}</span>
                                  <span>✉️ {p.seller?.contact?.email || "sales@ulavansanthai.com"}</span>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="btn ghost sm block mt"
                                onClick={() => handleUnlockContact(sellerId, sellerName)}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                                {remainingViews > 0
                                  ? "Unlock Seller Contact (1 view)"
                                  : "Unlock (No views left - Add for ₹10)"}
                              </button>
                            )}

                            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                              <Link
                                href={`/dashboard/products/${p.id}`}
                                className="btn ghost sm"
                                style={{ flex: 1, textAlign: "center" }}
                              >
                                Details
                              </Link>
                              <button
                                type="button"
                                className="btn primary sm"
                                style={{ flex: 2 }}
                                onClick={() => openEnquiry(p)}
                              >
                                Send Enquiry →
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "32px",
                        padding: "16px 0",
                      }}
                    >
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      >
                        ← Previous
                      </button>
                      <span className="muted small">
                        Page <b>{currentPage}</b> of <b>{totalPages}</b> ({totalProducts} items)
                      </span>
                      <button
                        type="button"
                        className="btn ghost sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: Unlocked Seller Contact History */}
              <div style={{ marginTop: "48px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "18px", color: "#0F3D2E", margin: 0 }}>
                    Your Unlocked Seller Contacts Directory
                  </h3>
                  <span className="muted small">
                    {viewHistory.length} unique sellers unlocked
                  </span>
                </div>

                {loadingHistory ? (
                  <p className="muted small">Loading contact history...</p>
                ) : viewHistory.length > 0 ? (
                  <div style={{ overflowX: "auto", background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                          <th style={{ padding: "12px 16px" }}>Seller / Mandi</th>
                          <th style={{ padding: "12px 16px" }}>Category</th>
                          <th style={{ padding: "12px 16px" }}>Phone</th>
                          <th style={{ padding: "12px 16px" }}>Email</th>
                          <th style={{ padding: "12px 16px" }}>Location</th>
                          <th style={{ padding: "12px 16px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewHistory.map((item, idx) => (
                          <tr key={item.sellerId || idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                              <Link href={`/dashboard/sellers/${item.sellerId}`} style={{ color: "#0F3D2E", textDecoration: "underline" }}>
                                {item.businessName}
                              </Link>
                            </td>
                            <td style={{ padding: "12px 16px" }}>{item.businessCategory}</td>
                            <td style={{ padding: "12px 16px", color: "#047857", fontWeight: 600 }}>
                              {item.contact?.mobile}
                            </td>
                            <td style={{ padding: "12px 16px" }}>{item.contact?.email}</td>
                            <td style={{ padding: "12px 16px", color: "#6B7280" }}>{item.location}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <a
                                href={`tel:${item.contact?.mobile}`}
                                className="btn ghost sm"
                                style={{ padding: "4px 8px", fontSize: "11px" }}
                              >
                                Call
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: "#F9FAFB", border: "1px dashed #E5E7EB", borderRadius: "8px", padding: "24px", textAlign: "center" }}>
                    <p className="muted small" style={{ margin: 0 }}>
                      You haven&apos;t unlocked any seller contacts yet. Unlock contacts from any commodity card above.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION: Recent Wholesale Enquiries Table */}
              <div style={{ marginTop: "40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", color: "#0F3D2E", margin: 0 }}>
                      Your Wholesale Purchase Enquiries
                    </h3>
                    <p className="muted small" style={{ margin: "4px 0 0 0" }}>
                      Track status and seller quotations across your purchase orders
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => {
                      setDashEnqSuccess(false);
                      setDashboardEnquiryOpen(true);
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>+</span> New Wholesale Enquiry
                  </button>
                </div>

                {loadingEnquiries && enquiries.length === 0 ? (
                  <p className="muted small">Loading enquiries from database...</p>
                ) : (enquiries.length > 0 || (buyerData?.recentEnquiries && buyerData.recentEnquiries.length > 0)) ? (
                  <div style={{ overflowX: "auto", background: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB", textAlign: "left" }}>
                          <th style={{ padding: "12px 16px" }}>Enquiry Ref</th>
                          <th style={{ padding: "12px 16px" }}>Commodity / Category</th>
                          <th style={{ padding: "12px 16px" }}>Supplier / Mandi</th>
                          <th style={{ padding: "12px 16px" }}>Quantity</th>
                          <th style={{ padding: "12px 16px" }}>Delivery Location</th>
                          <th style={{ padding: "12px 16px" }}>Status</th>
                          <th style={{ padding: "12px 16px" }}>Date</th>
                          <th style={{ padding: "12px 16px" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(enquiries.length > 0 ? enquiries : buyerData.recentEnquiries).map((enq) => (
                          <tr key={enq.id || enq.enquiry_id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0F3D2E" }}>
                              {enq.id ? `ENQ-${String(enq.id).slice(0, 8).toUpperCase()}` : (enq.enquiry_id || "ENQ-REF")}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {enq.category || enq.product_name || "Wholesale Commodity"}
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: 500 }}>
                              {enq.sellerName || enq.seller_name || enq.sellerId || "Verified Partner"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <b>{enq.quantity}</b> {enq.unit || "quintal"}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#4B5563" }}>
                              {enq.deliveryLocation || enq.delivery_location}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {renderStatusBadge(enq.status)}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#6B7280" }}>
                              {new Date(enq.createdAt || enq.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <button
                                type="button"
                                className="btn ghost sm"
                                onClick={() => setSelectedEnquiryModal(enq)}
                                style={{ padding: "4px 8px", fontSize: "11px", whiteSpace: "nowrap" }}
                              >
                                View Details →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: "#F9FAFB", border: "1px dashed #E5E7EB", borderRadius: "8px", padding: "28px", textAlign: "center" }}>
                    <p className="muted small" style={{ margin: "0 0 12px 0" }}>
                      You haven&apos;t sent any wholesale commodity enquiries yet.
                    </p>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => {
                        setDashEnqSuccess(false);
                        setDashboardEnquiryOpen(true);
                      }}
                    >
                      Create First Enquiry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
            VIEW 2: SELLER TAB (Managed by Person 2)
            ========================================================= */}
          {activeTab === "seller" && isSellerRole && (
            <div className="seller-dashboard-view">
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
                      <strong>Business Verification & FSSAI Licence</strong>
                      <p className="muted small">Upload FSSAI registration certificate and APMC mandi licence</p>
                    </div>
                  </div>

                  <div className="form-step-item">
                    <span className="step-num">2</span>
                    <div>
                      <strong>Commodity Catalog Submission</strong>
                      <p className="muted small">Define crop varieties, harvest origin, grade (A/B/C), MOQ & price slabs</p>
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
                  <b>Seller portal managed in Person 2 module (Subscription active at ₹365/mo)</b>
                </div>

                <button
                  type="button"
                  className="btn primary lg"
                  onClick={() => alert("The seller onboarding form is owned by Person 2.")}
                >
                  Seller Portal (Person 2 Integration) →
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Purchase 10 Additional Seller Views (₹10) */}
        {addonModalOpen && (
          <div className="modal-backdrop" onClick={() => !addonPurchasing && setAddonModalOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
              <div className="modal-header">
                <h3>Purchase Additional Seller Views</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => !addonPurchasing && setAddonModalOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="modal-body" style={{ padding: "20px 24px" }}>
                {addonSuccess ? (
                  <div className="text-center" style={{ padding: "20px 0" }}>
                    <div className="success-icon" style={{ fontSize: "36px", color: "#10B981", marginBottom: "8px" }}>
                      ✓
                    </div>
                    <h3 style={{ color: "#065F46" }}>10 Views Added!</h3>
                    <p className="muted">
                      Your payment of ₹10 was verified. You now have 10 more seller contact unlocks available.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        background: "#FBF8EC",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <strong>Add-On Seller View Pack</strong>
                          <p className="muted small" style={{ margin: "2px 0 0 0" }}>
                            Unlock 10 more verified suppliers
                          </p>
                        </div>
                        <b style={{ fontSize: "20px", color: "#0F3D2E" }}>₹10</b>
                      </div>
                    </div>

                    <p style={{ fontSize: "13px", color: "#4B5563", lineHeight: "1.5", margin: "0 0 16px 0" }}>
                      Per UlavanSanthai fair access rules, base registration includes 10 seller unlocks. Each additional pack grants 10 views for ₹10.
                    </p>

                    {addonError && (
                      <div
                        style={{
                          background: "#FEE2E2",
                          border: "1px solid #EF4444",
                          borderRadius: "6px",
                          padding: "10px 12px",
                          marginBottom: "16px",
                          fontSize: "12px",
                          color: "#991B1B",
                        }}
                      >
                        {addonError}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn primary block lg"
                      onClick={handleBuyAddonViews}
                      disabled={addonPurchasing}
                    >
                      {addonPurchasing ? "Connecting Razorpay..." : "Pay ₹10 with Razorpay →"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Direct Purchase Enquiry from Product */}
        {enquiryModalOpen && selectedProduct && (
          <div className="modal-backdrop" onClick={() => setEnquiryModalOpen(false)}>
            <div className="modal-box large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h3>Direct Purchase Enquiry</h3>
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
                  <h3 style={{ color: "#065F46" }}>Enquiry Sent to {selectedProduct.seller?.businessName || "Seller"}!</h3>
                  <p className="muted" style={{ margin: "12px 0 20px 0" }}>
                    Your request for <b>{enqQty} {enqUnit}</b> of {selectedProduct.name} ({enqGrade}, {enqPackaging}) has been routed directly to the verified seller.
                  </p>
                  <button type="button" className="btn primary block" onClick={() => setEnquiryModalOpen(false)}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submitEnquiryForm} className="modal-form">
                  <div className="product-summary-bar" style={{ background: "#F3F4F6", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
                    <b>{selectedProduct.name}</b> · {selectedProduct.origin} · Benchmark: {selectedProduct.price}
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
                      <small className="muted">
                        MOQ: {selectedProduct.moq || 1} {selectedProduct.unit || "unit"}
                      </small>
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
                        placeholder="Mandi or Delivery City"
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
                      placeholder="Specify required moisture percentage, gunny bag packaging, or target delivery timeline..."
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
                    {enqSubmitting ? "Routing Enquiry..." : "Send Wholesale Enquiry Directly to Seller →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: New Wholesale Enquiry from Dashboard */}
        {dashboardEnquiryOpen && (
          <div className="modal-backdrop" onClick={() => setDashboardEnquiryOpen(false)}>
            <div className="modal-box large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <h3>Submit New Wholesale Purchase Enquiry</h3>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setDashboardEnquiryOpen(false)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              {dashEnqSuccess ? (
                <div className="modal-body text-center" style={{ padding: "24px 0" }}>
                  <div className="success-icon" style={{ fontSize: "36px", color: "#10B981", marginBottom: "8px" }}>✓</div>
                  <h3 style={{ color: "#065F46" }}>Enquiry Successfully Routed!</h3>
                  <p className="muted" style={{ margin: "12px 0 20px 0" }}>
                    Your request for <b>{dashEnqQty} {dashEnqUnit}</b> of <b>{dashEnqCategory}</b> has been dispatched directly to the supplier.
                  </p>
                  <button type="button" className="btn primary block" onClick={() => setDashboardEnquiryOpen(false)}>
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submitDashEnquiryForm} className="modal-form">
                  <div className="form-group">
                    <label>Select Supplier / Mandi Seller *</label>
                    {viewHistory.length > 0 ? (
                      <select
                        value={dashEnqSellerId}
                        onChange={(e) => setDashEnqSellerId(e.target.value)}
                        required
                      >
                        <option value="">-- Choose from your unlocked sellers --</option>
                        {viewHistory.map((s) => (
                          <option key={s.sellerId} value={s.sellerId}>
                            {s.businessName} ({s.businessCategory} · {s.location})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={dashEnqSellerId}
                        onChange={(e) => setDashEnqSellerId(e.target.value)}
                        placeholder="Enter Seller Business Name or ID"
                        required
                      />
                    )}
                    <small className="muted">Enquiries are securely delivered to verified suppliers on UlavanSanthai.</small>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Commodity Category *</label>
                      <select
                        value={dashEnqCategory}
                        onChange={(e) => setDashEnqCategory(e.target.value)}
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
                        value={dashEnqQty}
                        onChange={(e) => setDashEnqQty(+e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="form-group">
                      <label>Unit of Measurement *</label>
                      <select
                        value={dashEnqUnit}
                        onChange={(e) => setDashEnqUnit(e.target.value)}
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
                        value={dashEnqGrade}
                        onChange={(e) => setDashEnqGrade(e.target.value)}
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
                        value={dashEnqPackaging}
                        onChange={(e) => setDashEnqPackaging(e.target.value)}
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
                        value={dashEnqTargetPrice}
                        onChange={(e) => setDashEnqTargetPrice(e.target.value)}
                        placeholder="e.g. ₹2,600 / quintal"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Delivery Location *</label>
                    <input
                      type="text"
                      value={dashEnqLocation}
                      onChange={(e) => setDashEnqLocation(e.target.value)}
                      placeholder="Mandi or Delivery City"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Notes / Specifications</label>
                    <textarea
                      rows={2}
                      value={dashEnqNotes}
                      onChange={(e) => setDashEnqNotes(e.target.value)}
                      placeholder="Specify required moisture percentage, crop year, gunny bag packaging, or target timeline..."
                    />
                  </div>

                  <div className="form-group">
                    <label>Supporting Attachment Link (Optional)</label>
                    <input
                      type="url"
                      value={dashEnqAttachmentUrl}
                      onChange={(e) => setDashEnqAttachmentUrl(e.target.value)}
                      placeholder="https://... (link to lab report, PO spec or sample benchmark)"
                    />
                  </div>

                  <button type="submit" className="btn primary block lg" disabled={dashEnqSubmitting}>
                    {dashEnqSubmitting ? "Routing Wholesale Enquiry..." : "Submit Wholesale Enquiry →"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: View Enquiry Details & Seller Response */}
        {selectedEnquiryModal && (
          <div className="modal-backdrop" onClick={() => setSelectedEnquiryModal(null)}>
            <div className="modal-box large" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div className="modal-header">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0 }}>Wholesale Enquiry Details</h3>
                    {renderStatusBadge(selectedEnquiryModal.status)}
                  </div>
                  <small className="muted">
                    Ref: {selectedEnquiryModal.id ? `ENQ-${String(selectedEnquiryModal.id).slice(0, 8).toUpperCase()}` : selectedEnquiryModal.id} · Submitted {new Date(selectedEnquiryModal.createdAt || selectedEnquiryModal.created_at || Date.now()).toLocaleString()}
                  </small>
                </div>
                <button
                  type="button"
                  className="close-btn"
                  onClick={() => setSelectedEnquiryModal(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="modal-body" style={{ padding: "20px 0" }}>
                {/* Seller Response Section */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                    Seller Response & Quotation
                  </label>
                  {(selectedEnquiryModal.status || "sent") === "sent" ? (
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "8px", padding: "16px" }}>
                      <p style={{ margin: 0, color: "#1E40AF", fontSize: "14px" }}>
                        ⏳ <b>Awaiting seller review:</b> This enquiry has been delivered to <b>{selectedEnquiryModal.sellerName || "the supplier"}</b>. You will see their quotation and status update here once reviewed.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: selectedEnquiryModal.status === "accepted" ? "#ECFDF5" : selectedEnquiryModal.status === "rejected" ? "#FEF2F2" : "#FFFBEB",
                        border: `1px solid ${selectedEnquiryModal.status === "accepted" ? "#10B981" : selectedEnquiryModal.status === "rejected" ? "#EF4444" : "#F59E0B"}`,
                        borderRadius: "8px",
                        padding: "16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <strong style={{ color: selectedEnquiryModal.status === "accepted" ? "#065F46" : selectedEnquiryModal.status === "rejected" ? "#991B1B" : "#92400E" }}>
                          Status: {selectedEnquiryModal.status?.toUpperCase()}
                        </strong>
                        {selectedEnquiryModal.respondedAt && (
                          <small className="muted">
                            Responded on {new Date(selectedEnquiryModal.respondedAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "14px", color: "#374151", whiteSpace: "pre-wrap" }}>
                        {selectedEnquiryModal.sellerResponse || "The seller has updated the enquiry status."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Enquiry Specifications */}
                <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#0F3D2E" }}>Procurement Specifications</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                    <div>
                      <span className="muted">Supplier:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.sellerName || selectedEnquiryModal.seller_name || "Verified Supplier"}</div>
                    </div>
                    <div>
                      <span className="muted">Commodity / Category:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.category || "Agro Commodity"}</div>
                    </div>
                    <div>
                      <span className="muted">Required Quantity:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.quantity} {selectedEnquiryModal.unit || "quintal"}</div>
                    </div>
                    <div>
                      <span className="muted">Target Price:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.targetPrice || selectedEnquiryModal.target_price || "Negotiable / Benchmark"}</div>
                    </div>
                    <div>
                      <span className="muted">Required Grade:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.grade || "Grade A"}</div>
                    </div>
                    <div>
                      <span className="muted">Packaging:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.packaging || "Standard Jute Bags (50kg)"}</div>
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <span className="muted">Delivery Mandi / Location:</span>
                      <div style={{ fontWeight: 600 }}>{selectedEnquiryModal.deliveryLocation || selectedEnquiryModal.delivery_location}</div>
                    </div>
                  </div>

                  {selectedEnquiryModal.notes && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", fontSize: "13px" }}>
                      <span className="muted">Buyer Notes / Requirements:</span>
                      <div style={{ marginTop: "4px", color: "#1F2937", whiteSpace: "pre-wrap" }}>{selectedEnquiryModal.notes}</div>
                    </div>
                  )}

                  {selectedEnquiryModal.attachmentUrl && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #E5E7EB", fontSize: "13px" }}>
                      <span className="muted">Specification Sheet / Attachment:</span>
                      <div style={{ marginTop: "4px" }}>
                        <a
                          href={selectedEnquiryModal.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#059669", fontWeight: 600, textDecoration: "underline" }}
                        >
                          📎 View Attached Document →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn ghost block"
                  onClick={() => setSelectedEnquiryModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OnboardingGuard>
  );
}
