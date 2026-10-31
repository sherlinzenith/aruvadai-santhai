import { AccountType, PRICING, SystemRole } from "./config";
import { products, Product } from "./content";

export interface RegisterPayload {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface IndividualDetailsPayload {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  purposeOfPurchase?: string[];
}

export interface CompanyDetailsPayload {
  legalName: string;
  gstin: string;
  contactPerson: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessCategory: string;
}

export interface PaymentPayload {
  amount: number;
  method: "upi" | "card" | "netbanking";
}

export interface AdminReviewState {
  status: "pending" | "approved" | "rejected";
  reason?: string;
  reviewedAt?: string;
}

// Simulated network delay
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async register(payload: RegisterPayload): Promise<{ success: boolean; error?: string }> {
    await delay();
    if (!payload.email || !payload.fullName) {
      return { success: false, error: "Missing required registration parameters." };
    }
    return { success: true };
  },

  async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    await delay();
    if (!otp || otp.trim().length < 4) {
      return { success: false, error: "Please enter a valid 4-digit verification code." };
    }
    // Stub accepts any 4+ digit code for frictionless demoing
    return { success: true };
  },

  async signIn(identifier: string, password: string): Promise<{ success: boolean; user?: any; error?: string }> {
    await delay();
    if (!identifier || !password) {
      return { success: false, error: "Please enter your email/mobile and password." };
    }
    return {
      success: true,
      user: {
        id: "usr_" + Math.random().toString(36).substring(2, 9),
        name: identifier.includes("@") ? identifier.split("@")[0] : "Verified Trader",
        identifier,
      },
    };
  },

  async saveRoles(roles: SystemRole[]): Promise<{ success: boolean }> {
    await delay(150);
    return { success: true };
  },

  async saveAccountType(accountType: AccountType): Promise<{ success: boolean }> {
    await delay(150);
    return { success: true };
  },

  async saveDetails(
    type: AccountType,
    details: IndividualDetailsPayload | CompanyDetailsPayload
  ): Promise<{ success: boolean; error?: string }> {
    await delay(200);
    return { success: true };
  },

  async processPayment(payload: PaymentPayload): Promise<{
    success: boolean;
    transactionId: string;
    receiptNumber: string;
  }> {
    await delay(350);
    const txn = "TXN" + Math.floor(10000000 + Math.random() * 90000000);
    const rcpt = "US-" + Math.floor(10000 + Math.random() * 90000);
    return {
      success: true,
      transactionId: txn,
      receiptNumber: rcpt,
    };
  },

  async fetchCatalog(): Promise<Product[]> {
    await delay(100);
    return products;
  },
};

