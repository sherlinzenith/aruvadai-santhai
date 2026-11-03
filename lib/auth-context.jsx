"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export const DEMO_USERS = {
  common: {
    id: "usr_common_01",
    name: "Senthil Kumar",
    email: "senthil.common@gmail.com",
    mobile: "9876543210",
    role: "buyer",
    activeMode: "buyer",
    accountKind: "individual",
    purposes: ["Personal use / Household"],
    isPaid: true,
    paymentReceipt: "AS-10291",
    remainingViews: 10,
    viewedSellers: [],
    isVerified: true,
    address: "14 Anna Nagar",
    city: "Madurai",
    state: "Tamil Nadu",
    pincode: "625020",
    createdAt: "2026-10-15T10:00:00Z",
  },
  business: {
    id: "usr_biz_02",
    name: "Priya Natarajan",
    email: "priya@annapoornafoods.com",
    mobile: "9845012345",
    role: "buyer",
    activeMode: "buyer",
    accountKind: "business",
    businessCategory: "Bakery or food business",
    businessName: "Annapoorna Bakers & Foods",
    gstStatus: "Registered",
    gstin: "33AAAAA0000A1Z5",
    purposes: ["Baking", "Food processing"],
    isPaid: true,
    paymentReceipt: "AS-10355",
    remainingViews: 8,
    viewedSellers: ["Sri Lakshmi Agro Mills", "Venkat Spice Traders"],
    isVerified: true,
    address: "Plot 42, SIDCO Industrial Estate",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641021",
    createdAt: "2026-10-18T14:30:00Z",
  },
  seller: {
    id: "usr_sel_03",
    name: "Ramesh Patel",
    email: "ramesh@patelagro.in",
    mobile: "9723045678",
    role: "seller",
    activeMode: "seller",
    accountKind: "business",
    businessCategory: "Farmer or producer",
    businessName: "Patel Organic Agro Mills",
    sellerStatus: "Approved",
    isVerified: true,
    gstStatus: "Registered",
    gstin: "24AAAAA0000A1Z5",
    fssaiNumber: "10020021000123",
    fssaiExpiry: "2028-12-31",
    isPaid: true,
    paymentReceipt: "AS-10482",
    remainingViews: 0,
    viewedSellers: [],
    address: "Survey 112, Guntur Highway",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522001",
    createdAt: "2026-10-10T09:15:00Z",
  },
  both: {
    id: "usr_dual_04",
    name: "Muthu Velan",
    email: "muthu@velantraders.com",
    mobile: "9443210987",
    role: "both",
    activeMode: "buyer",
    accountKind: "business",
    businessCategory: "Trader or distributor",
    businessName: "Velan Agri Commodities",
    sellerStatus: "Approved",
    isVerified: true,
    gstStatus: "Registered",
    gstin: "33BBBBB1111B1Z2",
    fssaiNumber: "10021043000456",
    fssaiExpiry: "2029-06-30",
    isPaid: true,
    paymentReceipt: "AS-10900",
    remainingViews: 10,
    viewedSellers: [],
    address: "Market Road",
    city: "Erode",
    state: "Tamil Nadu",
    pincode: "638001",
    createdAt: "2026-10-12T11:00:00Z",
  },
  admin: {
    id: "usr_admin_00",
    name: "Administrator",
    email: "admin@gmail.com",
    mobile: "9000000000",
    role: "admin",
    activeMode: "buyer",
    accountKind: "business",
    isPaid: true,
    paymentReceipt: "AS-ADMIN-ROOT",
    remainingViews: 999,
    viewedSellers: [],
    isVerified: true,
    createdAt: "2026-10-01T00:00:00Z",
  },
};

const AuthContext = createContext(undefined);

const STORAGE_KEY = "ulavan_user_session";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const saveUser = (u) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // fallback
    }
  };

  const login = (emailOrMobile) => {
    const clean = emailOrMobile.trim().toLowerCase();
    for (const key of Object.keys(DEMO_USERS)) {
      const d = DEMO_USERS[key];
      if (d.email.toLowerCase() === clean || d.mobile === clean) {
        saveUser(d);
        return { success: true };
      }
    }

    if (clean.includes("@") || clean.length >= 10) {
      const newUser = {
        id: `usr_${Date.now()}`,
        name: clean.split("@")[0] || "Trader",
        email: clean.includes("@") ? clean : `${clean}@market.in`,
        mobile: clean.length === 10 ? clean : "9876543210",
        role: "buyer",
        activeMode: "buyer",
        accountKind: "individual",
        isPaid: true,
        remainingViews: 10,
        viewedSellers: [],
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      saveUser(newUser);
      return { success: true };
    }

    return { success: false, error: "Please enter a valid email or 10-digit mobile number." };
  };

  const loginAsDemo = (key) => {
    const demo = DEMO_USERS[key];
    if (demo) {
      saveUser(demo);
    }
  };

  const logout = () => {
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: mounted ? user : null,
        login,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

