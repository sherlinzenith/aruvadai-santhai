"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { AccountType, PRICING, SystemRole } from "./config";
import { CompanyDetailsPayload, IndividualDetailsPayload, api } from "./api";

export interface OnboardingUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

export interface PaymentRecord {
  isPaid: boolean;
  amount: number;
  transactionId?: string;
  receiptNumber?: string;
  paidAt?: string;
}

export interface AdminReviewRecord {
  status: "pending" | "approved" | "rejected";
  reason?: string;
  reviewedAt?: string;
}

export interface OnboardingState {
  user: OnboardingUser | null;
  otpVerified: boolean;
  roles: SystemRole[];
  accountType: AccountType | null;
  individualDetails: IndividualDetailsPayload | null;
  companyDetails: CompanyDetailsPayload | null;
  payment: PaymentRecord;
  adminReview: AdminReviewRecord;
  viewedSellers: string[];
  remainingViews: number;
}

const STORAGE_KEY = "ulavansanthai_onboarding_store_v2";

const DEFAULT_STATE: OnboardingState = {
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
  remainingViews: PRICING.baseSellerViews,
};

interface OnboardingContextType {
  state: OnboardingState;
  registerUser: (user: OnboardingUser) => void;
  verifyOtp: (code: string) => Promise<boolean>;
  signInUser: (identifier: string) => void;
  signOutUser: () => void;
  setRoles: (roles: SystemRole[]) => Promise<void>;
  setAccountType: (type: AccountType) => Promise<void>;
  saveIndividualDetails: (data: IndividualDetailsPayload) => Promise<void>;
  saveCompanyDetails: (data: CompanyDetailsPayload) => Promise<void>;
  submitPayment: (method: "upi" | "card" | "netbanking") => Promise<boolean>;
  setAdminStatus: (status: "pending" | "approved" | "rejected", reason?: string) => void;
  unlockSeller: (sellerName: string) => boolean;
  getFirstIncompletePath: () => string;
  calculatePaymentAmount: () => number;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
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

  // Save to localStorage inside try/catch
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not persist onboarding state to localStorage:", e);
    }
  }, [state]);

  const calculatePaymentAmount = (): number => {
    const isBuyer = state.roles.includes("buyer");
    const isSeller = state.roles.includes("seller");

    if (isBuyer && isSeller) {
      // Both roles pay for each role
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

  const registerUser = (user: OnboardingUser) => {
    setState((prev) => ({
      ...prev,
      user,
      otpVerified: false,
    }));
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    const res = await api.verifyEmailOtp(state.user?.email || "", code);
    if (res.success) {
      setState((prev) => ({
        ...prev,
        otpVerified: true,
      }));
      return true;
    }
    return false;
  };

  const signInUser = (identifier: string) => {
    setState((prev) => {
      // If user exists, retain their existing details, else instantiate
      const existing = prev.user;
      return {
        ...prev,
        user: existing || {
          id: "usr_" + Math.random().toString(36).substring(2, 8),
          name: identifier.includes("@") ? identifier.split("@")[0] : "Verified Trader",
          email: identifier.includes("@") ? identifier : `${identifier}@ulavansanthai.com`,
          mobile: identifier.replace(/\D/g, "") || "9876543210",
        },
        otpVerified: true,
      };
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

  const setRoles = async (roles: SystemRole[]) => {
    await api.saveRoles(roles);
    setState((prev) => ({
      ...prev,
      roles,
    }));
  };

  const setAccountType = async (accountType: AccountType) => {
    await api.saveAccountType(accountType);
    setState((prev) => ({
      ...prev,
      accountType,
    }));
  };

  const saveIndividualDetails = async (data: IndividualDetailsPayload) => {
    await api.saveDetails("individual", data);
    setState((prev) => ({
      ...prev,
      individualDetails: data,
      companyDetails: null, // Clear opposite
    }));
  };

  const saveCompanyDetails = async (data: CompanyDetailsPayload) => {
    await api.saveDetails(state.accountType || "company", data);
    setState((prev) => ({
      ...prev,
      companyDetails: data,
      individualDetails: null, // Clear opposite
    }));
  };

  const submitPayment = async (method: "upi" | "card" | "netbanking"): Promise<boolean> => {
    const amount = calculatePaymentAmount();
    const res = await api.processPayment({ amount, method });
    if (res.success) {
      setState((prev) => ({
        ...prev,
        payment: {
          isPaid: true,
          amount,
          transactionId: res.transactionId,
          receiptNumber: res.receiptNumber,
          paidAt: new Date().toISOString(),
        },
        adminReview: {
          status: "pending", // Waiting for admin to match payment and verify GSTIN
        },
      }));
      return true;
    }
    return false;
  };

  const setAdminStatus = (status: "pending" | "approved" | "rejected", reason?: string) => {
    setState((prev) => ({
      ...prev,
      adminReview: {
        status,
        reason: reason || (status === "rejected" ? "GSTIN and payment mismatch with government registry." : undefined),
        reviewedAt: new Date().toISOString(),
      },
    }));
  };

  const unlockSeller = (sellerName: string): boolean => {
    if (state.viewedSellers.includes(sellerName)) return true;
    if (state.remainingViews <= 0) return false;

    setState((prev) => ({
      ...prev,
      remainingViews: prev.remainingViews - 1,
      viewedSellers: [...prev.viewedSellers, sellerName],
    }));
    return true;
  };

  const getFirstIncompletePath = (): string => {
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
    if (!state.payment.isPaid) {
      return "/onboarding/payment";
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

