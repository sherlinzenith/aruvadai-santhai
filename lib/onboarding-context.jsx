"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { PRICING } from "./config";
import { api } from "./api";
import { useAuth } from "./auth-context";

const STORAGE_KEY = "ulavansanthai_onboarding_store_v2";

const DEFAULT_STATE = {
  user: null,
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
  remainingViews: PRICING.baseSellerViews,
};

const OnboardingContext = createContext(undefined);

export function OnboardingProvider({ children }) {
  const { user: authUser, signOut: authSignOut } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);

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

  // Load existing profile from PostgreSQL whenever the authenticated user signs in
  useEffect(() => {
    let active = true;

    async function loadDbProfile() {
      if (!authUser) {
        setState((prev) => ({
          ...DEFAULT_STATE,
          user: null,
        }));
        return;
      }

      setLoadingProfile(true);

      try {
        const res = await api.fetchProfile();
        if (!active) return;

        if (res.success && res.data) {
          const { roles, accountType, buyerProfile, details, adminStatus } = res.data;

          setState((prev) => {
            const nextState = {
              ...prev,
              user: {
                id: authUser.id,
                name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Verified Trader",
                email: authUser.email || "",
                mobile: authUser.user_metadata?.mobile || buyerProfile?.mobile || "",
              },
              roles: Array.isArray(roles) && roles.length > 0 ? roles : prev.roles,
              accountType: accountType || prev.accountType,
              adminReview: {
                status: adminStatus || prev.adminReview?.status || "pending",
              },
            };

            // Restore buyer profile details if present in database
            if (buyerProfile) {
              nextState.accountType = buyerProfile.accountType || nextState.accountType;
              nextState.remainingViews = buyerProfile.remainingViews ?? 10;
              nextState.viewedSellers = Array.isArray(buyerProfile.viewedSellers)
                ? buyerProfile.viewedSellers
                : [];

              if (buyerProfile.accountType === "individual") {
                nextState.individualDetails = {
                  name: buyerProfile.name || nextState.user.name,
                  address: buyerProfile.address,
                  city: buyerProfile.city,
                  state: buyerProfile.state,
                  pincode: buyerProfile.pincode,
                  purposeOfPurchase: Array.isArray(buyerProfile.purposes) ? buyerProfile.purposes : [],
                };
              } else {
                nextState.companyDetails = {
                  legalName: buyerProfile.companyLegalName || "",
                  gstin: buyerProfile.gstin || "",
                  contactPerson: buyerProfile.name || nextState.user.name,
                  businessCategory: buyerProfile.businessCategory || "Bakery or food business",
                  address: buyerProfile.address,
                  city: buyerProfile.city,
                  state: buyerProfile.state,
                  pincode: buyerProfile.pincode,
                  purposeOfPurchase: Array.isArray(buyerProfile.purposes) ? buyerProfile.purposes : [],
                };
              }
            } else if (details && Object.keys(details).length > 0) {
              if (nextState.accountType === "individual") {
                nextState.individualDetails = details;
              } else {
                nextState.companyDetails = details;
              }
            }

            return nextState;
          });
        }
      } catch (err) {
        console.warn("Failed to load PostgreSQL profile:", err);
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    loadDbProfile();

    return () => {
      active = false;
    };
  }, [authUser]);

  // Persist transient session wizard state to localStorage inside try/catch
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist onboarding state to localStorage:", e);
    }
  }, [state]);

  const calculatePaymentAmount = () => {
    const isBuyer = state.roles.includes("buyer");
    const isSeller = state.roles.includes("seller");
    if (isBuyer && isSeller) {
      return PRICING.buyerBaseFee + PRICING.sellerMonthlyFee;
    }
    if (isSeller) {
      return PRICING.sellerMonthlyFee;
    }
    if (isBuyer) {
      return PRICING.buyerBaseFee;
    }
    return PRICING.buyerBaseFee;
  };

  const signOutUser = async () => {
    setState(DEFAULT_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
    await authSignOut();
  };

  const setRoles = async (roles) => {
    const res = await api.saveRoles(roles);
    if (!res.success) {
      throw new Error(res.error || "Failed to save roles to database.");
    }
    setState((prev) => ({
      ...prev,
      roles,
    }));
    return res;
  };

  const setAccountType = async (accountType) => {
    const res = await api.saveAccountType(accountType);
    if (!res.success) {
      throw new Error(res.error || "Failed to save account type to database.");
    }
    setState((prev) => ({
      ...prev,
      accountType,
    }));
    return res;
  };

  const saveIndividualDetails = async (data) => {
    const res = await api.saveDetails("individual", data);
    if (!res.success) {
      throw new Error(res.error || "Failed to save individual details to database.");
    }
    setState((prev) => ({
      ...prev,
      individualDetails: data,
      companyDetails: null, // Clear opposite
    }));
    return res;
  };

  const saveCompanyDetails = async (data) => {
    const type = state.accountType || "company";
    const res = await api.saveDetails(type, data);
    if (!res.success) {
      throw new Error(res.error || "Failed to save company details to database.");
    }
    setState((prev) => ({
      ...prev,
      companyDetails: data,
      individualDetails: null, // Clear opposite
    }));
    return res;
  };

  const markPaymentCompleted = (paymentDetails) => {
    setState((prev) => ({
      ...prev,
      payment: {
        isPaid: true,
        amount: paymentDetails?.amount || calculatePaymentAmount(),
        transactionId: paymentDetails?.transactionId || `TXN-${Date.now().toString(36)}`,
        receiptNumber: paymentDetails?.receiptNumber || `US-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString(),
        ...paymentDetails,
      },
      adminReview: {
        status: "pending",
      },
    }));
    return { success: true };
  };

  const setAdminReviewStatus = (status, rejectionReason) => {
    setState((prev) => ({
      ...prev,
      adminReview: {
        status,
        rejectionReason: rejectionReason || undefined,
        reviewedAt: new Date().toISOString(),
      },
    }));
  };

  const unlockSeller = async (sellerId) => {
    try {
      const res = await api.unlockSellerContact(sellerId);
      if (res.success) {
        setState((prev) => ({
          ...prev,
          remainingViews: res.remainingViews ?? prev.remainingViews,
          viewedSellers: prev.viewedSellers.includes(sellerId)
            ? prev.viewedSellers
            : [...prev.viewedSellers, sellerId],
        }));
      }
      return res;
    } catch (e) {
      console.error("Unlock seller failed:", e);
      return { success: false, error: e.message };
    }
  };

  const addViewsEntitlement = (count = 10) => {
    setState((prev) => ({
      ...prev,
      remainingViews: prev.remainingViews + count,
    }));
  };

  const getFirstIncompletePath = () => {
    if (!state.user) return "/signin";
    if (!state.roles || state.roles.length === 0) return "/onboarding/role";
    if (!state.accountType) return "/onboarding/account-type";
    if (state.accountType === "individual" && !state.individualDetails) {
      return "/onboarding/details";
    }
    if ((state.accountType === "company" || state.accountType === "group") && !state.companyDetails) {
      return "/onboarding/details";
    }
    if (!state.payment.isPaid) return "/onboarding/payment";
    if (state.adminReview.status !== "approved") return "/onboarding/status";
    return "/dashboard";
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        loadingProfile,
        calculatePaymentAmount,
        signOutUser,
        setRoles,
        setAccountType,
        saveIndividualDetails,
        saveCompanyDetails,
        markPaymentCompleted,
        setAdminReviewStatus,
        unlockSeller,
        addViewsEntitlement,
        getFirstIncompletePath,
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
