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
      "Fill your profile details",
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
      "Choose Seller role",
      "Pick your business category (required)",
      "Fill the seller form with GSTIN, FSSAI and documents",
      "Admin approves, then list your products",
    ],
    sees: "Your phone and GSTIN stay private. Documents are visible only to admin.",
  },
];

export const flow = [
  { t: "Register", d: "Name, email, mobile and password. Verify by link or OTP." },
  { t: "Sign in", d: "One field for email or mobile, with forgot password and remember me." },
  { t: "Choose Buyer or Seller", d: "One account, a role flag. Add the other role later." },
  { t: "Submit Details", d: "Individual profile or business form with GSTIN for companies." },
  { t: "Admin Review", d: "Administrator validates business credentials and activates trading access." },
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

export const products = [
  { name: "Sona Masoori Rice", cat: "Grains & cereals", origin: "Guntur, Andhra Pradesh", grade: "A", moq: 25, unit: "quintal", price: "₹44 – ₹48 / kg", avail: "Available", organic: false, seller: "Sri Lakshmi Agro Mills", hue: 42, image: "/products/rice.jpg" },
  { name: "Guntur Sannam Chilli", cat: "Spices & masalas", origin: "Guntur, Andhra Pradesh", grade: "A", moq: 5, unit: "quintal", price: "₹190 – ₹215 / kg", avail: "Limited", organic: false, seller: "Venkat Spice Traders", hue: 6, image: "/products/chilli.jpg" },
  { name: "Toor Dal (Polished)", cat: "Pulses & lentils", origin: "Latur, Maharashtra", grade: "B", moq: 10, unit: "quintal", price: "₹118 – ₹126 / kg", avail: "Available", organic: false, seller: "Marathwada Pulses Co.", hue: 48, image: "/products/toor-dal.jpg" },
  { name: "Cold-pressed Groundnut Oil", cat: "Oils & oilseeds", origin: "Salem, Tamil Nadu", grade: "A", moq: 200, unit: "litre", price: "₹185 – ₹195 / L", avail: "Available", organic: true, seller: "Kolli Hills Oil Works", hue: 36, image: "/products/groundnut-oil.jpg" },
  { name: "Banganapalli Mango", cat: "Fruits & vegetables", origin: "Kurnool, Andhra Pradesh", grade: "A", moq: 2, unit: "tonne", price: "₹62 – ₹70 / kg", avail: "Limited", organic: false, seller: "Rayalaseema Orchards", hue: 28, image: "/products/mango.jpg" },
  { name: "Whole Wheat Flour (Atta)", cat: "Processed foods", origin: "Indore, Madhya Pradesh", grade: "B", moq: 15, unit: "quintal", price: "₹32 – ₹36 / kg", avail: "Available", organic: true, seller: "Malwa Flour Mills", hue: 40, image: "/products/wheat-flour.jpg" },
];

export const faqs = [
  { q: "How does onboarding review work?", a: "Every account is reviewed by the platform moderation team. Contact information, GSTIN documents, and business classifications are verified before the trading dashboard is activated." },
  { q: "Can I be both a buyer and a seller?", a: "Yes. It is one account with role flags. You can switch between buying and selling directly from your unified dashboard." },
  { q: "Will buyers see my phone number or GSTIN?", a: "No. Seller phone and GSTIN are never shown publicly, and your verification documents are visible only to the admin team." },
  { q: "Do I need a GSTIN?", a: "Only if you are a registered business, company, or group. Individual buyers and individual farmers do not need a GSTIN." },
  { q: "Can I buy directly on the platform?", a: "The platform connects wholesale buyers and sellers directly for enquiries, price discovery, and bulk supply." },
];

