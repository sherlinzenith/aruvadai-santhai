import { products } from "./content";

export const api = {
  /**
   * Fetch saved onboarding progress and profile from PostgreSQL
   */
  async fetchProfile() {
    try {
      const res = await fetch("/api/onboarding", { credentials: "same-origin" });
      if (!res.ok) {
        return { success: false, status: res.status };
      }
      const data = await res.json();
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Save role selection to PostgreSQL
   */
  async saveRoles(roles) {
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_roles", payload: { roles } }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to save roles." };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Save account type to PostgreSQL
   */
  async saveAccountType(accountType) {
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_account_type", payload: { accountType } }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to save account type." };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Save buyer profile details to PostgreSQL (Drizzle)
   */
  async saveDetails(accountType, details) {
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_buyer_details", payload: { accountType, details } }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to save buyer details." };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Create Razorpay payment order
   */
  async createPaymentOrder({ purchaseType, customAmount }) {
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseType, customAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, configured: data.configured ?? true, error: data.error || "Failed to create order." };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Verify completed payment with HMAC signature
   */
  async verifyPayment({ orderId, paymentId, signature, purchaseType, receiptNumber, method }) {
    try {
      const res = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentId, signature, purchaseType, receiptNumber, method }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Payment verification failed." };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch real buyer dashboard data from PostgreSQL
   */
  async fetchBuyerDashboard() {
    try {
      const res = await fetch("/api/buyer/dashboard", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to load dashboard data." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch marketplace products with search, filters, sorting, and pagination
   */
  async fetchProducts(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      if (params.q) searchParams.set("q", params.q);
      if (params.category && params.category !== "All") searchParams.set("category", params.category);
      if (params.grade && params.grade !== "Any") searchParams.set("grade", params.grade);
      if (params.origin) searchParams.set("origin", params.origin);
      if (params.organic !== undefined && params.organic !== null) searchParams.set("organic", String(params.organic));
      if (params.availability && params.availability !== "All") searchParams.set("availability", params.availability);
      if (params.minPrice) searchParams.set("minPrice", String(params.minPrice));
      if (params.maxPrice) searchParams.set("maxPrice", String(params.maxPrice));
      if (params.sort) searchParams.set("sort", params.sort);
      if (params.page) searchParams.set("page", String(params.page));
      if (params.limit) searchParams.set("limit", String(params.limit));

      const res = await fetch(`/api/products?${searchParams.toString()}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to load products." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch single product details by ID
   */
  async fetchProductById(id) {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to load product details." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch seller profile by ID
   */
  async fetchSellerProfile(id) {
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(id)}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to load seller profile." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Submit wholesale buyer enquiry
   */
  async submitEnquiry(enquiryData) {
    try {
      const res = await fetch("/api/buyer/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enquiryData),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to submit enquiry." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Unlock seller contact details using buyer view allowance
   */
  async unlockSellerContact(sellerId) {
    try {
      const res = await fetch("/api/buyer/unlock-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error,
          message: data.message || "Failed to unlock seller contact.",
          canPurchaseAddon: data.canPurchaseAddon,
        };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch buyer access entitlement and remaining views
   */
  async fetchBuyerAccess() {
    try {
      const res = await fetch("/api/buyer/access", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to fetch access status." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch buyer's seller view history
   */
  async fetchViewHistory() {
    try {
      const res = await fetch("/api/buyer/view-history", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to fetch view history." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch private seller contact information if already unlocked
   */
  async fetchSellerContact(sellerId) {
    try {
      const res = await fetch(`/api/sellers/${encodeURIComponent(sellerId)}/contact`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error, message: data.message };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch all enquiries submitted by the authenticated buyer
   */
  async fetchBuyerEnquiries() {
    try {
      const res = await fetch("/api/buyer/enquiries", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to fetch enquiries." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Fetch single enquiry details by ID
   */
  async fetchEnquiryById(id) {
    try {
      const res = await fetch(`/api/buyer/enquiries/${encodeURIComponent(id)}`, { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to fetch enquiry details." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Update enquiry status and seller response (for seller workflow / testing)
   */
  async updateEnquiryStatus(id, { status, sellerResponse }) {
    try {
      const res = await fetch(`/api/enquiries/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, sellerResponse }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Failed to update status." };
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Catalog
   */
  async fetchCatalog() {
    return products;
  },
};
