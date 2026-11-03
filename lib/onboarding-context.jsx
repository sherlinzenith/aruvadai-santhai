"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PRICING } from "./config";
import { api } from "./api";

const STORAGE_KEY = "ulavansanthai_onboarding_store_v2";

const DEFAULT_STATE = {
  user: null,
  otpVerified: false,
  roles: [],
  accountType: null,
  individualDetails: null,
  companyDetails: null,
  payment: {
    isPaid: false,
    amount: 0,
  },
  adminReview: {
    status: "pending",
  },
  viewedSellers: [],
  remainingViews: PRICING?.baseSellerViews || 10,
};

const OnboardingContext = createContext(undefined);

export function OnboardingProvider({ children }) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load stored onboarding state:", e);
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist onboarding state to localStorage:", e);
    }
  }, [state]);

  const calculatePaymentAmount = () => {
    return 0;
  };

  const registerUser = (user, role) => {
    const rolesArray =
      role === "buyer_seller" || role === "both"
        ? ["buyer", "seller"]
        : role
        ? [role]
        : ["seller"];

    setState((prev) => {
      const updated = {
        ...prev,
        user,
        roles: rolesArray,
        otpVerified: false,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  const verifyOtp = async (code) => {
    setState((prev) => {
      const updated = {
        ...prev,
        otpVerified: true,
      };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
    return true;
  };

  const signInUser = (userData) => {
    setState((prev) => {
      // If userData is an object from /api/auth/signin or a string fallback:
      const user = userData?.user || (typeof userData === "object" ? userData : {
        id: "usr_" + Math.random().toString(36).substring(2, 8),
        name: typeof userData === "string" && userData.includes("@") ? userData.split("@")[0] : "Verified Trader",
        email: typeof userData === "string" ? userData : "",
        mobile: typeof userData === "string" ? userData.replace(/\D/g, "") : "",
      });

      const roles = userData?.roles || prev.roles || ["seller"];
      const accountType = userData?.accountType || prev.accountType || "individual";
      const details = userData?.details || prev.individualDetails || prev.companyDetails || {};
      const status = userData?.status || prev.adminReview?.status || "pending";
      const reason = userData?.rejectionReason || prev.adminReview?.reason || null;

      const updated = {
        ...prev,
        user,
        roles,
        accountType,
        individualDetails: accountType === "individual" ? details : null,
        companyDetails: accountType === "company" || accountType === "group" ? details : null,
        otpVerified: true,
        adminReview: {
          status,
          reason,
          reviewedAt: new Date().toISOString(),
        },
      };

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }

      return updated;
    });
  };

  const signOutUser = () => {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
  };

  const setRoles = async (roles) => {
    await api.saveRoles(roles);
    setState((prev) => ({
      ...prev,
      roles,
    }));
  };

  const setAccountType = async (accountType) => {
    await api.saveAccountType(accountType);
    setState((prev) => ({
      ...prev,
      accountType,
    }));
  };

  const saveIndividualDetails = async (data) => {
    await api.saveDetails("individual", data);
    const currentUser = state.user;
    const resolvedUser = currentUser
      ? currentUser
      : {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          name: data.name || "New Applicant",
          email: "applicant@example.com",
          mobile: "9876543210",
        };

    setState((prev) => ({
      ...prev,
      user: prev.user || resolvedUser,
      individualDetails: data,
      companyDetails: null,
      adminReview: {
        status: "pending",
      },
    }));

    try {
      await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: resolvedUser,
          roles: state.roles.length > 0 ? state.roles : ["buyer"],
          accountType: "individual",
          details: data,
        }),
      });
    } catch (e) {
      console.warn("Failed to submit onboarding to database:", e);
    }
  };

  const saveCompanyDetails = async (data) => {
    await api.saveDetails(state.accountType || "company", data);
    const currentUser = state.user;
    const resolvedUser = currentUser
      ? currentUser
      : {
          id: "usr_" + Math.random().toString(36).substring(2, 9),
          name: data.contactPerson || data.legalName || "New Applicant",
          email: data.legalName
            ? `${data.legalName.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`
            : "company@example.com",
          mobile: "9876543210",
        };

    setState((prev) => ({
      ...prev,
      user: prev.user || resolvedUser,
      companyDetails: data,
      individualDetails: null,
      adminReview: {
        status: "pending",
      },
    }));

    try {
      await fetch("/api/onboarding/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: resolvedUser,
          roles: state.roles.length > 0 ? state.roles : ["seller"],
          accountType: state.accountType || "company",
          details: data,
        }),
      });
    } catch (e) {
      console.warn("Failed to submit onboarding to database:", e);
    }
  };

  const submitPayment = async () => {
    return true;
  };

  const setAdminStatus = (status, reason) => {
    setState((prev) => ({
      ...prev,
      adminReview: {
        status,
        reason:
          reason ||
          (status === "rejected"
            ? "GSTIN and payment mismatch with government registry."
            : undefined),
        reviewedAt: new Date().toISOString(),
      },
    }));
  };

  const unlockSeller = (sellerName) => {
    if (state.viewedSellers.includes(sellerName)) return true;
    if (state.remainingViews <= 0) return false;

    setState((prev) => ({
      ...prev,
      remainingViews: prev.remainingViews - 1,
      viewedSellers: [...prev.viewedSellers, sellerName],
    }));
    return true;
  };

  const getFirstIncompletePath = () => {
    if (!state.user || !state.otpVerified) {
      return "/signin";
    }
    if (!state.roles || state.roles.length === 0) {
      return "/onboarding/role";
    }
    if (!state.accountType) {
      return "/onboarding/account-type";
    }
    if (state.accountType === "individual" && !state.individualDetails) {
      return "/onboarding/details";
    }
    if ((state.accountType === "company" || state.accountType === "group") && !state.companyDetails) {
      return "/onboarding/details";
    }
    if (state.adminReview.status !== "approved") {
      return "/onboarding/status";
    }
    return "/dashboard";
  };

  const resetOnboarding = () => {
    setState(DEFAULT_STATE);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        registerUser,
        verifyOtp,
        signInUser,
        signOutUser,
        setRoles,
        setAccountType,
        saveIndividualDetails,
        saveCompanyDetails,
        submitPayment,
        setAdminStatus,
        unlockSeller,
        getFirstIncompletePath,
        calculatePaymentAmount,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

