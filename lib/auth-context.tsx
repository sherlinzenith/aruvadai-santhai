"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "buyer" | "seller" | "both" | "admin";
export type AccountKind = "individual" | "business";

export interface Enquiry {
  id: string;
  productName: string;
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  buyerMobile: string;
  quantity: number;
  unit: string;
  targetPrice?: string;
  deliveryLocation: string;
  notes?: string;
  createdAt: string;
  status: "Sent" | "Seen" | "Responded" | "Closed";
}

export interface PaymentQueueItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  amount: number;
  txnId: string;
  gatewayRef: string;
  paymentMethod: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  refundFlag?: boolean;
}

export interface SellerQueueItem {
  id: string;
  userId: string;
  businessName: string;
  sellerType: string;
  contactPerson: string;
  email: string;
  mobile: string;
  gstStatus: "Registered" | "Unregistered";
  gstin?: string;
  pan?: string;
  fssaiNumber?: string;
  fssaiExpiry?: string;
  documents: string[];
  submittedAt: string;
  status: "Under review" | "Approved" | "Rejected";
  remarks?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entity: string;
  performedBy: string;
  details: string;
  status: "Success" | "Rejected" | "Pending";
}

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  activeMode: "buyer" | "seller";
  accountKind: AccountKind; // "individual" (common man) or "business"
  businessCategory?: string;
  businessName?: string;
  gstin?: string; // Hidden / absent for Individual
  gstStatus?: "Registered" | "Unregistered";
  pan?: string;
  fssaiNumber?: string;
  fssaiExpiry?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  purposes?: string[];
  isPaid: boolean;
  paymentReceipt?: string;
  remainingViews: number;
  viewedSellers: string[];
  sellerStatus?: "Draft" | "Submitted" | "Under review" | "Approved";
  isVerified: boolean;
  createdAt: string;
}

export const DEMO_USERS: Record<string, User> = {
  common: {
    id: "usr_common_01",
    name: "Senthil Kumar",
    email: "senthil.common@gmail.com",
    mobile: "9876543210",
    role: "buyer",
    activeMode: "buyer",
    accountKind: "individual", // Common Man: No GSTIN, skips category
    purposes: ["Personal use / Household"],
    isPaid: true,
    paymentReceipt: "AS-10291",
    remainingViews: 10,
    viewedSellers: [],
    isVerified: true,
    address: "14 Anna Nagar",
    city: "Madurai",
    state: "Tamil Nadu",
    pincode: "625020",
    createdAt: "2026-10-15T10:00:00Z",
  },
  business: {
    id: "usr_biz_02",
    name: "Priya Natarajan",
    email: "priya@annapoornafoods.com",
    mobile: "9845012345",
    role: "buyer",
    activeMode: "buyer",
    accountKind: "business",
    businessCategory: "Bakery or food business",
    businessName: "Annapoorna Bakers & Foods",
    gstStatus: "Registered",
    gstin: "33AAAAA0000A1Z5",
    purposes: ["Baking", "Food processing"],
    isPaid: true,
    paymentReceipt: "AS-10355",
    remainingViews: 8,
    viewedSellers: ["Sri Lakshmi Agro Mills", "Venkat Spice Traders"],
    isVerified: true,
    address: "Plot 42, SIDCO Industrial Estate",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641021",
    createdAt: "2026-10-18T14:30:00Z",
  },
  seller: {
    id: "usr_sel_03",
    name: "Ramesh Patel",
    email: "ramesh@patelagro.in",
    mobile: "9723045678",
    role: "seller",
    activeMode: "seller",
    accountKind: "business",
    businessCategory: "Farmer or producer",
    businessName: "Patel Organic Agro Mills",
    sellerStatus: "Approved",
    isVerified: true,
    gstStatus: "Registered",
    gstin: "24AAAAA0000A1Z5",
    fssaiNumber: "10020021000123",
    fssaiExpiry: "2028-12-31",
    isPaid: true,
    paymentReceipt: "AS-10482",
    remainingViews: 0,
    viewedSellers: [],
    address: "Survey 112, Guntur Highway",
    city: "Guntur",
    state: "Andhra Pradesh",
    pincode: "522001",
    createdAt: "2026-10-10T09:15:00Z",
  },
  both: {
    id: "usr_dual_04",
    name: "Muthu Velan",
    email: "muthu@velantraders.com",
    mobile: "9443210987",
    role: "both",
    activeMode: "buyer", // Can toggle between buyer and seller!
    accountKind: "business",
    businessCategory: "Trader or distributor",
    businessName: "Velan Agri Commodities",
    sellerStatus: "Approved",
    isVerified: true,
    gstStatus: "Registered",
    gstin: "33BBBBB1111B1Z2",
    fssaiNumber: "10021043000456",
    fssaiExpiry: "2029-06-30",
    isPaid: true,
    paymentReceipt: "AS-10900",
    remainingViews: 10,
    viewedSellers: [],
    address: "Market Road",
    city: "Erode",
    state: "Tamil Nadu",
    pincode: "638001",
    createdAt: "2026-10-12T11:00:00Z",
  },
  admin: {
    id: "usr_admin_00",
    name: "Administrator",
    email: "admin@ulavansanthai.com",
    mobile: "9000000000",
    role: "admin",
    activeMode: "buyer",
    accountKind: "business",
    isPaid: true,
    paymentReceipt: "AS-ADMIN-ROOT",
    remainingViews: 999,
    viewedSellers: [],
    isVerified: true,
    createdAt: "2026-10-01T00:00:00Z",
  },
};

const INITIAL_PAYMENTS: PaymentQueueItem[] = [
  {
    id: "pay_101",
    userId: "usr_temp_01",
    userName: "Karthik Agri Farms",
    userEmail: "karthik@agrifarms.in",
    userRole: "seller",
    amount: 365,
    txnId: "TXN-9021841",
    gatewayRef: "UPI/2391048201/OKAXIS",
    paymentMethod: "UPI",
    date: "2026-10-30T10:15:00Z",
    status: "Pending",
  },
  {
    id: "pay_102",
    userId: "usr_temp_02",
    userName: "Thangam Flour Mills",
    userEmail: "thangam@mills.com",
    userRole: "buyer",
    amount: 365,
    txnId: "TXN-9021842",
    gatewayRef: "HDFC-NETB-4920194",
    paymentMethod: "Net Banking",
    date: "2026-10-30T10:30:00Z",
    status: "Pending",
  },
];

const INITIAL_SELLERS_QUEUE: SellerQueueItem[] = [
  {
    id: "sq_201",
    userId: "usr_temp_01",
    businessName: "Karthik Agri Farms",
    sellerType: "Farmer or producer",
    contactPerson: "Karthik Raja",
    email: "karthik@agrifarms.in",
    mobile: "9840123987",
    gstStatus: "Unregistered",
    pan: "ABCDE1234F (Agricultural Exemption)",
    fssaiNumber: "10022031000999",
    fssaiExpiry: "2029-05-31",
    documents: ["Karthik_Land_Passbook.pdf", "FSSAI_Certificate.pdf"],
    submittedAt: "2026-10-30T10:20:00Z",
    status: "Under review",
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "aud_1",
    timestamp: "2026-10-30T10:00:00Z",
    action: "ROLE_PAYMENT_SUBMITTED",
    entity: "Payment AS-10482",
    performedBy: "Ramesh Patel",
    details: "Paid ₹365 for Seller monthly subscription.",
    status: "Success",
  },
  {
    id: "aud_2",
    timestamp: "2026-10-30T10:05:00Z",
    action: "ADMIN_PAYMENT_APPROVED",
    entity: "Payment AS-10482",
    performedBy: "Admin #1",
    details: "Matched TXN-8192849 against gateway receipt. Status set to Active.",
    status: "Success",
  },
  {
    id: "aud_3",
    timestamp: "2026-10-30T10:10:00Z",
    action: "SELLER_IDENTITY_VERIFIED",
    entity: "Patel Organic Agro Mills",
    performedBy: "Admin #1",
    details: "GSTIN 24AAAAA0000A1Z5 and FSSAI 10020021000123 verified. Issued Verified Seller Badge.",
    status: "Success",
  },
];

interface AuthContextType {
  user: User | null;
  enquiries: Enquiry[];
  paymentQueue: PaymentQueueItem[];
  sellerQueue: SellerQueueItem[];
  auditLogs: AuditLog[];
  login: (emailOrMobile: string, password?: string) => { success: boolean; error?: string };
  loginAsDemo: (key: keyof typeof DEMO_USERS) => void;
  register: (data: Partial<User>) => User;
  updateUser: (updates: Partial<User>) => void;
  switchActiveMode: (mode: "buyer" | "seller") => void;
  activateSecondRole: (roleToAdd: "buyer" | "seller") => void;
  unlockSeller: (sellerName: string) => boolean;
  sendEnquiry: (enquiry: Omit<Enquiry, "id" | "createdAt" | "status">) => void;
  approvePayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;
  approveSellerQueue: (queueId: string) => void;
  rejectSellerQueue: (queueId: string, remarks: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "ulavan_user_session";
const ENQUIRIES_KEY = "ulavan_enquiries";
const AUDIT_KEY = "ulavan_audit_logs";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>(INITIAL_PAYMENTS);
  const [sellerQueue, setSellerQueue] = useState<SellerQueueItem[]>(INITIAL_SELLERS_QUEUE);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
      const storedEnq = localStorage.getItem(ENQUIRIES_KEY);
      if (storedEnq) {
        setEnquiries(JSON.parse(storedEnq));
      } else {
        setEnquiries([
          {
            id: "enq_1",
            productName: "Sona Masoori Rice",
            sellerName: "Sri Lakshmi Agro Mills",
            buyerName: "Annapoorna Bakers & Foods",
            buyerEmail: "priya@annapoornafoods.com",
            buyerMobile: "9845012345",
            quantity: 50,
            unit: "quintal",
            targetPrice: "₹45/kg",
            deliveryLocation: "Coimbatore, Tamil Nadu",
            notes: "Grade A batch needed with moisture test report.",
            createdAt: "2026-10-28T14:20:00Z",
            status: "Sent",
          },
          {
            id: "enq_2",
            productName: "Guntur Sannam Chilli",
            sellerName: "Venkat Spice Traders",
            buyerName: "Senthil Kumar",
            buyerEmail: "senthil.common@gmail.com",
            buyerMobile: "9876543210",
            quantity: 5,
            unit: "quintal",
            targetPrice: "₹200/kg",
            deliveryLocation: "Madurai, Tamil Nadu",
            notes: "Direct supply for regional distribution.",
            createdAt: "2026-10-29T09:45:00Z",
            status: "Seen",
          },
        ]);
      }
      const storedAudit = localStorage.getItem(AUDIT_KEY);
      if (storedAudit) {
        setAuditLogs(JSON.parse(storedAudit));
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const saveUser = (u: User | null) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // storage fallback
    }
  };

  const addAuditLog = (action: string, entity: string, details: string, status: "Success" | "Rejected" | "Pending") => {
    const newLog: AuditLog = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      entity,
      performedBy: user?.name || "Admin",
      details,
      status,
    };
    const updated = [newLog, ...auditLogs];
    setAuditLogs(updated);
    try {
      localStorage.setItem(AUDIT_KEY, JSON.stringify(updated));
    } catch {
      // storage fallback
    }
  };

  const login = (emailOrMobile: string) => {
    const clean = emailOrMobile.trim().toLowerCase();
    for (const key of Object.keys(DEMO_USERS)) {
      const d = DEMO_USERS[key];
      if (d.email.toLowerCase() === clean || d.mobile === clean) {
        saveUser(d);
        addAuditLog("USER_LOGIN", d.name, `Logged into role ${d.role}.`, "Success");
        return { success: true };
      }
    }

    if (clean.includes("@") || clean.length >= 10) {
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name: clean.split("@")[0] || "Trader",
        email: clean.includes("@") ? clean : `${clean}@market.in`,
        mobile: clean.length === 10 ? clean : "9876543210",
        role: "buyer",
        activeMode: "buyer",
        accountKind: "individual",
        isPaid: true,
        paymentReceipt: `AS-${Math.floor(10000 + Math.random() * 90000)}`,
        remainingViews: 10,
        viewedSellers: [],
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
      saveUser(newUser);
      addAuditLog("USER_AUTO_CREATED", newUser.name, "Individual Buyer session created.", "Success");
      return { success: true };
    }

    return { success: false, error: "Please enter a valid email or 10-digit mobile number." };
  };

  const loginAsDemo = (key: keyof typeof DEMO_USERS) => {
    const demo = DEMO_USERS[key];
    if (demo) {
      saveUser(demo);
      addAuditLog("DEMO_LOGIN", demo.name, `Logged in as ${key} persona (${demo.role}).`, "Success");
    }
  };

  const register = (data: Partial<User>) => {
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: data.name || "New User",
      email: data.email || "",
      mobile: data.mobile || "",
      role: data.role || "buyer",
      activeMode: data.role === "seller" ? "seller" : "buyer",
      accountKind: data.accountKind || "individual",
      businessCategory: data.businessCategory,
      businessName: data.businessName,
      gstin: data.gstin,
      isPaid: false,
      remainingViews: 10,
      viewedSellers: [],
      isVerified: false,
      createdAt: new Date().toISOString(),
      ...data,
    };
    saveUser(newUser);
    addAuditLog("USER_REGISTRATION", newUser.name, `Registered new account (${newUser.accountKind}).`, "Success");
    return newUser;
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    saveUser(updated);
  };

  const switchActiveMode = (mode: "buyer" | "seller") => {
    if (!user) return;
    updateUser({ activeMode: mode });
  };

  // Dual Role: Activate the other role while reusing verified company details!
  const activateSecondRole = (roleToAdd: "buyer" | "seller") => {
    if (!user) return;

    if (roleToAdd === "seller") {
      updateUser({
        role: "both",
        activeMode: "seller",
        sellerStatus: "Approved",
        isVerified: true,
        // Reuse business identity if already present
        businessCategory: user.businessCategory || "Manufacturer",
        businessName: user.businessName || `${user.name} Agro Industries`,
        gstin: user.gstin || (user.gstStatus === "Registered" ? "33AAAAA9999A1Z9" : undefined),
      });
      addAuditLog("ROLE_EXPANDED_DUAL", user.name, "Activated Seller Role. Reused company and GSTIN details. Paid ₹365/mo.", "Success");
    } else if (roleToAdd === "buyer") {
      updateUser({
        role: "both",
        activeMode: "buyer",
        remainingViews: (user.remainingViews || 0) + 10,
      });
      addAuditLog("ROLE_EXPANDED_DUAL", user.name, "Activated Buyer Role. Added 10 seller view allowance. Paid ₹365.", "Success");
    }
  };

  const unlockSeller = (sellerName: string): boolean => {
    if (!user) return false;
    if (user.viewedSellers.includes(sellerName)) return true;
    if (user.remainingViews <= 0) return false;

    updateUser({
      remainingViews: user.remainingViews - 1,
      viewedSellers: [...user.viewedSellers, sellerName],
    });
    addAuditLog("SELLER_CONTACT_UNLOCKED", sellerName, `Unlocked contact by ${user.name}. 1 view deducted.`, "Success");
    return true;
  };

  const sendEnquiry = (enqData: Omit<Enquiry, "id" | "createdAt" | "status">) => {
    const newEnq: Enquiry = {
      ...enqData,
      id: `enq_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "Sent",
    };
    const updated = [newEnq, ...enquiries];
    setEnquiries(updated);
    try {
      localStorage.setItem(ENQUIRIES_KEY, JSON.stringify(updated));
    } catch {
      // storage fallback
    }
    addAuditLog("ENQUIRY_SENT", newEnq.productName, `Sent enquiry to ${newEnq.sellerName} for ${newEnq.quantity} ${newEnq.unit}.`, "Success");
  };

  // Administrator Controls
  const approvePayment = (paymentId: string) => {
    setPaymentQueue(
      paymentQueue.map((p) => (p.id === paymentId ? { ...p, status: "Approved" } : p))
    );
    addAuditLog("ADMIN_PAYMENT_APPROVED", paymentId, "Matched transaction reference and amount. Payment cleared.", "Success");
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    setPaymentQueue(
      paymentQueue.map((p) =>
        p.id === paymentId ? { ...p, status: "Rejected", rejectionReason: reason, refundFlag: true } : p
      )
    );
    addAuditLog("ADMIN_PAYMENT_REJECTED", paymentId, `Rejected with reason: "${reason}". Initiated REFUND_PENDING flag.`, "Rejected");
  };

  const approveSellerQueue = (queueId: string) => {
    setSellerQueue(
      sellerQueue.map((s) => (s.id === queueId ? { ...s, status: "Approved" } : s))
    );
    addAuditLog("ADMIN_SELLER_APPROVED", queueId, "Documents verified. Issued Verified Seller Badge.", "Success");
  };

  const rejectSellerQueue = (queueId: string, remarks: string) => {
    setSellerQueue(
      sellerQueue.map((s) => (s.id === queueId ? { ...s, status: "Rejected", remarks } : s))
    );
    addAuditLog("ADMIN_SELLER_REJECTED", queueId, `Seller application rejected: ${remarks}`, "Rejected");
  };

  const logout = () => {
    if (user) {
      addAuditLog("USER_LOGOUT", user.name, "User logged out.", "Success");
    }
    saveUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: mounted ? user : null,
        enquiries,
        paymentQueue,
        sellerQueue,
        auditLogs,
        login,
        loginAsDemo,
        register,
        updateUser,
        switchActiveMode,
        activateSecondRole,
        unlockSeller,
        sendEnquiry,
        approvePayment,
        rejectPayment,
        approveSellerQueue,
        rejectSellerQueue,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
