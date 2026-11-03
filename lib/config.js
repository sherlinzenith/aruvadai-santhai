export const BRAND = {
    name: "UlavanSanthai",
    legalName: "UlavanSanthai Wholesale Agri Marketplace",
    tagline: "Farm to Market",
    supportEmail: "support@ulavansanthai.com",
    adminEmail: "admin@ulavansanthai.com",
};
export const PRICING = {
    buyerBaseFee: 365,
    sellerMonthlyFee: 365,
    buyerAddonFee: 10,
    baseSellerViews: 10,
    addonSellerViews: 10,
};
export const BUSINESS_CATEGORIES = [
    "Manufacturer",
    "Wholesaler",
    "Trader or distributor",
    "Retailer",
    "Food processor",
    "Bakery or food business",
    "Reseller",
    "Farmer or producer",
    "Other",
];
export const PURCHASE_PURPOSES = [
    "Personal use",
    "Manufacturing",
    "Food processing",
    "Baking",
    "Resale",
    "Further processing",
    "Other",
];
/**
 * Standard Indian GSTIN Regex:
 * 2 digits state code + 5 chars PAN alpha + 4 digits PAN numeric +
 * 1 char PAN alpha + 1 entity code [1-9A-Z] + 'Z' default + 1 check digit [0-9A-Z]
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
