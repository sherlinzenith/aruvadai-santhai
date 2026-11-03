import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  numeric,
} from "drizzle-orm/pg-core";

/**
 * 1. Admin Profiles Table
 * Links user_id, email, and hashed_password.
 */
export const adminProfiles = pgTable("admin_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password"),
  passwordHash: text("password_hash"),
  fullName: text("full_name").default("System Administrator"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/**
 * 2. User Profiles (Central Registration Registry)
 */
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  roles: text("roles").array().notNull(),
  accountType: text("account_type").notNull(),
  details: jsonb("details").notNull(),
  adminStatus: text("admin_status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by"),
});

/**
 * 3. Buyer Profiles
 */
export const buyerProfiles = pgTable("buyer_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  accountType: text("account_type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  companyLegalName: text("company_legal_name"),
  gstin: text("gstin"),
  businessCategory: text("business_category"),
  purposes: text("purposes").array(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  sellerViewsAllowance: integer("seller_views_allowance").default(10).notNull(),
  remainingViews: integer("remaining_views").default(10).notNull(),
  viewedSellers: text("viewed_sellers").array().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 4. Seller Profiles
 */
export const sellerProfiles = pgTable("seller_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  accountType: text("account_type").notNull(),
  businessName: text("business_name").notNull(),
  legalName: text("legal_name"),
  contactPerson: text("contact_person").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  businessCategory: text("business_category").notNull(),
  gstStatus: text("gst_status").default("Unregistered"),
  gstin: text("gstin"),
  pan: text("pan"),
  fssaiNumber: text("fssai_number"),
  fssaiExpiry: text("fssai_expiry"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  isVerified: boolean("is_verified").default(true).notNull(),
  subscriptionStatus: text("subscription_status").default("active").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 5. Payments Table
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("INR"),
  paymentMethod: text("payment_method").notNull(),
  transactionId: text("transaction_id").notNull(),
  receiptNumber: text("receipt_number").notNull(),
  status: text("status").default("pending").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 6. User Applicants Table
 * Stores how each user enters the platform, tracking their role and processing status.
 */
export const userApplicants = pgTable("user_applicants", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  role: text("role").default("seller").notNull(),
  roles: text("roles").array().default([]).notNull(),
  accountType: text("account_type").default("individual"),
  entryChannel: text("entry_channel").default("web_registration"),
  details: jsonb("details"),
  status: text("status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

