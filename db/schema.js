import { pgTable, text, timestamp, integer, boolean, uuid, jsonb } from "drizzle-orm/pg-core";

/**
 * Buyer Profiles Table (PostgreSQL: buyer_profiles)
 * Stores validated buyer onboarding records, tax details (GSTIN), and view allowances.
 */
export const buyerProfiles = pgTable("buyer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(), // Supabase Auth user ID
  accountType: text("account_type").notNull(), // 'individual', 'company', or 'group'
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
 * User Profiles Table (PostgreSQL: user_profiles)
 * Shared user role and profile status records (coordinated with Person 2).
 */
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(), // Supabase Auth user ID
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  roles: text("roles").array().notNull(), // ['buyer'], ['seller'], or ['buyer', 'seller']
  accountType: text("account_type").notNull(),
  details: jsonb("details").notNull(),
  adminStatus: text("admin_status").default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by"),
});

/**
 * User Applicants Table (PostgreSQL: user_applicants)
 * Initial registration and funnel tracking records (coordinated with Person 2).
 */
export const userApplicants = pgTable("user_applicants", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  mobile: text("mobile").notNull(),
  role: text("role").default("buyer").notNull(),
  roles: text("roles").array().default(["buyer"]).notNull(),
  accountType: text("account_type").default("individual"),
  entryChannel: text("entry_channel").default("web_registration"),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Legacy / Shared tables preserved for backwards-compatibility
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  mobile: text("mobile").notNull(),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const onboardingProfiles = pgTable("onboarding_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  roles: jsonb("roles").$type().notNull(),
  accountType: text("account_type").$type().notNull(),
  legalName: text("legal_name"),
  gstin: text("gstin"),
  contactPerson: text("contact_person"),
  businessCategory: text("business_category"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  purposeOfPurchase: jsonb("purpose_of_purchase").$type(),
  fssaiNumber: text("fssai_number"),
  fssaiExpiry: text("fssai_expiry"),
  verifiedBadge: boolean("verified_badge").default(false).notNull(),
  remainingViews: integer("remaining_views").default(10).notNull(),
  viewedSellers: jsonb("viewed_sellers").$type().default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  method: text("method"),
  status: text("status").default("pending").notNull(),
  transactionId: text("transaction_id"),
  receiptNumber: text("receipt_number"),
  refundFlag: boolean("refund_flag").default(false),
  refundReason: text("refund_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminReviews = pgTable("admin_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  paymentId: uuid("payment_id").references(() => payments.id),
  status: text("status").$type().default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  origin: text("origin").notNull(),
  grade: text("grade").$type().default("A").notNull(),
  moq: integer("moq").notNull(),
  unit: text("unit").notNull(),
  price: text("price").notNull(),
  avail: text("avail").$type().default("Available").notNull(),
  organic: boolean("organic").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const enquiries = pgTable("enquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: text("buyer_id").notNull(),
  sellerId: text("seller_id").notNull(),
  productId: text("product_id"),
  category: text("category"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").default("quintal").notNull(),
  grade: text("grade"),
  packaging: text("packaging"),
  deliveryLocation: text("delivery_location").notNull(),
  targetPrice: text("target_price"),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  status: text("status").default("sent").notNull(), // 'sent', 'reviewed', 'accepted', 'rejected'
  sellerResponse: text("seller_response"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
