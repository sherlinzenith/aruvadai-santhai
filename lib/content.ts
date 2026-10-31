export const PRICE = 365;
export const ADDON_PRICE = 10;
export const BASE_VIEWS = 10;

export const paths = [
  {
    id: "common",
    label: "Common buyer",
    tag: "Personal or small purchase",
    steps: [
      "Register and verify your email",
      "Choose Buyer and your purpose of purchase",
      "Pay ₹365 and clear admin review",
      "Skip the business category",
      "Search, filter and send enquiries",
    ],
    sees: "No GSTIN, no business forms. You are treated as an Individual.",
  },
  {
    id: "business",
    label: "Business buyer",
    tag: "Bakery, processor, reseller",
    steps: [
      "Register and verify your email",
      "Choose Buyer and your purpose of purchase",
      "Pay ₹365 and clear admin review",
      "Pick a business category",
      "Add GSTIN and business details, then buy",
    ],
    sees: "GSTIN appears only after you choose a category, marked “if applicable”.",
  },
  {
    id: "seller",
    label: "Seller",
    tag: "Farmer, manufacturer, trader",
    steps: [
      "Register and verify your email",
      "Choose Seller and pay ₹365 a month",
      "Pick your business category (required)",
      "Fill the seller form with GSTIN, FSSAI and documents",
      "Admin approves, then list your products",
    ],
    sees: "Your phone and GSTIN stay private. Documents are visible only to admin.",
  },
] as const;

export const flow = [
  { t: "Register", d: "Name, email, mobile and password. Verify by link or OTP." },
  { t: "Sign in", d: "One field for email or mobile, with forgot password and remember me." },
  { t: "Choose Buyer or Seller", d: "One account, a role flag. Add the other role later." },
  { t: "Pay ₹365", d: "UPI, card or net banking. Receipt generated on success." },
  { t: "Admin reviews payment", d: "Transaction and amount matched. Rejections record a reason and refund flag." },
  { t: "Business category", d: "Optional for buyers, required for sellers. GSTIN opens up here." },
  { t: "Go live", d: "Buyers search and enquire. Sellers get approved and list products." },
];

export const categories = [
  { n: "Grains & cereals" },
  { n: "Pulses & lentils" },
  { n: "Spices & masalas" },
  { n: "Fruits & vegetables" },
  { n: "Oils & oilseeds" },
  { n: "Processed foods" },
];

export type Product = {
  name: string;
  cat: string;
  origin: string;
  grade: "A" | "B" | "C";
  moq: number;
  unit: string;
  price: string;
  avail: "Available" | "Limited";
  organic: boolean;
  seller: string;
  hue: number;
  image: string;
};

export const products: Product[] = [
  { name: "Sona Masoori Rice", cat: "Grains & cereals", origin: "Guntur, Andhra Pradesh", grade: "A", moq: 25, unit: "quintal", price: "₹44 – ₹48 / kg", avail: "Available", organic: false, seller: "Sri Lakshmi Agro Mills", hue: 42, image: "/products/rice.jpg" },
  { name: "Guntur Sannam Chilli", cat: "Spices & masalas", origin: "Guntur, Andhra Pradesh", grade: "A", moq: 5, unit: "quintal", price: "₹190 – ₹215 / kg", avail: "Limited", organic: false, seller: "Venkat Spice Traders", hue: 6, image: "/products/chilli.jpg" },
  { name: "Toor Dal (Polished)", cat: "Pulses & lentils", origin: "Latur, Maharashtra", grade: "B", moq: 10, unit: "quintal", price: "₹118 – ₹126 / kg", avail: "Available", organic: false, seller: "Marathwada Pulses Co.", hue: 48, image: "/products/toor-dal.jpg" },
  { name: "Cold-pressed Groundnut Oil", cat: "Oils & oilseeds", origin: "Salem, Tamil Nadu", grade: "A", moq: 200, unit: "litre", price: "₹185 – ₹195 / L", avail: "Available", organic: true, seller: "Kolli Hills Oil Works", hue: 36, image: "/products/groundnut-oil.jpg" },
  { name: "Banganapalli Mango", cat: "Fruits & vegetables", origin: "Kurnool, Andhra Pradesh", grade: "A", moq: 2, unit: "tonne", price: "₹62 – ₹70 / kg", avail: "Limited", organic: false, seller: "Rayalaseema Orchards", hue: 28, image: "/products/mango.jpg" },
  { name: "Whole Wheat Flour (Atta)", cat: "Processed foods", origin: "Indore, Madhya Pradesh", grade: "B", moq: 15, unit: "quintal", price: "₹32 – ₹36 / kg", avail: "Available", organic: true, seller: "Malwa Flour Mills", hue: 40, image: "/products/wheat-flour.jpg" },
];

export const faqs = [
  { q: "Why does everyone pay ₹365 before anything else?", a: "Payment comes first so every account is committed and reviewed. An admin matches your transaction before your account is unlocked. If a payment is rejected after you paid, the reason and a refund flag are recorded." },
  { q: "Can I be both a buyer and a seller?", a: "Yes. It is one account with role flags. Add the second role from your dashboard. Each role has its own payment and approval." },
  { q: "Will buyers see my phone number or GSTIN?", a: "No. Seller phone and GSTIN are never shown publicly, and your verification documents are visible only to the admin team." },
  { q: "Do I need a GSTIN?", a: "Only if you are a registered business. Common buyers never see the field. Sellers who are not GST registered share their PAN with a reason instead." },
  { q: "Can I buy directly on the platform?", a: "The first version is built around discovery and direct buyer-seller connection through enquiries. Quotations and purchase orders come in a later phase." },
];
