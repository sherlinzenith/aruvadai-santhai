import { products } from "./content";

const delay = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async register(payload) {
    await delay();
    if (!payload.email || !payload.fullName) {
      return { success: false, error: "Missing required registration parameters." };
    }
    return { success: true };
  },

  async verifyEmailOtp(email, otp) {
    await delay();
    if (!otp || otp.trim().length < 4) {
      return { success: false, error: "Please enter a valid 4-digit verification code." };
    }
    return { success: true };
  },

  async signIn(identifier, password) {
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

  async saveRoles(roles) {
    await delay(50);
    return { success: true };
  },

  async saveAccountType(accountType) {
    await delay(50);
    return { success: true };
  },

  async saveDetails(type, details) {
    await delay(50);
    return { success: true };
  },

  async processPayment(payload) {
    await delay(50);
    const txn = "TXN" + Math.floor(10000000 + Math.random() * 90000000);
    const rcpt = "US-" + Math.floor(10000 + Math.random() * 90000);
    return {
      success: true,
      transactionId: txn,
      receiptNumber: rcpt,
    };
  },

  async fetchCatalog() {
    await delay(50);
    return products;
  },
};

