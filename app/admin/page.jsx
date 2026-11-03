"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  // Auth state
  const [adminUser, setAdminUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("admin@gmail.com");
  const [loginPassword, setLoginPassword] = useState("Admin@123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Application queue state
  const [activeTab, setActiveTab] = useState("pending");
  const [allApplicants, setAllApplicants] = useState([]);
  const [applications, setApplications] = useState({
    pending: [],
    approved: [],
    rejected: [],
    counts: { pending: 0, approved: 0, rejected: 0, total: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Rejection modal state
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.admin) {
          setAdminUser(data.admin);
          fetchApplications();
        } else {
          setAdminUser(null);
        }
      }
    } catch (err) {
      console.warn("Session check error:", err);
      setAdminUser(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (data.success && data.admin) {
        setAdminUser(data.admin);
        fetchApplications();
      } else {
        setLoginError(data.error || "Invalid credentials.");
      }
    } catch (err) {
      setLoginError(err.message || "Failed to sign in.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setAdminUser(null);
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pending");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setApplications({
            pending: data.pending || [],
            approved: data.approved || [],
            rejected: data.rejected || [],
            counts: data.counts || { pending: 0, approved: 0, rejected: 0, total: 0 },
          });
        }
      }

      // Also fetch from user_applicants table
      try {
        const appRes = await fetch("/api/admin/applicants");
        if (appRes.ok) {
          const appData = await appRes.json();
          if (appData.success) {
            setAllApplicants(appData.applicants || []);
          }
        }
      } catch (err) {
        console.warn("Could not load user_applicants:", err);
      }
    } catch (e) {
      console.error("Failed to load applications:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, name) => {
    setActionUserId(userId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, adminId: adminUser?.id }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          message: `✓ ${name} approved! Record created in ${data.createdProfiles?.join(" & ") || "profiles"}.`,
          type: "success",
        });
        await fetchApplications();
      } else {
        setFeedback({ message: data.error || "Approval failed.", type: "error" });
      }
    } catch (e) {
      setFeedback({ message: e.message || "Failed to approve.", type: "error" });
    } finally {
      setActionUserId(null);
    }
  };

  const handleOpenReject = (app) => {
    setRejectModalUser(app);
    setRejectReason(
      app.accountType === "company"
        ? `GSTIN ${app.details?.gstin || "provided"} does not match registered corporate name.`
        : "Business credentials or identity details could not be verified by platform moderation."
    );
  };

  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    setActionUserId(rejectModalUser.userId);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: rejectModalUser.userId,
          reason: rejectReason,
          adminId: adminUser?.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setFeedback({
          message: `Application for ${rejectModalUser.fullName} has been rejected.`,
          type: "success",
        });
        setRejectModalUser(null);
        await fetchApplications();
      } else {
        setFeedback({ message: data.error || "Rejection failed.", type: "error" });
      }
    } catch (e) {
      setFeedback({ message: e.message || "Failed to reject.", type: "error" });
    } finally {
      setActionUserId(null);
    }
  };

  if (authChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--cream)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" />
          <p className="muted mt">Checking administrator access...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW A: ADMIN SIGN IN (If visited directly without session)
  // =========================================================
  if (!adminUser) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "grid", placeItems: "center", padding: "20px" }}>
        <div
          style={{
            maxWidth: "440px",
            width: "100%",
            background: "#fff",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 10px 30px rgba(15,61,46,0.08)",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <Link href="/" aria-label="UlavanSanthai Home">
              <Image
                src="/logo.png"
                alt="UlavanSanthai"
                width={190}
                height={42}
                priority
                className="brand-logo"
                style={{ margin: "0 auto" }}
              />
            </Link>
            <div style={{ marginTop: "16px" }}>
              <span className="badge amber" style={{ fontSize: "0.8rem", textTransform: "uppercase" }}>
                Admin Portal · admin_profiles
              </span>
            </div>
            <h2 style={{ fontSize: "1.45rem", color: "var(--g9)", marginTop: "10px" }}>
              Administrator Login
            </h2>
            <p className="muted small" style={{ marginTop: "4px" }}>
              Authenticate with your seeded admin credentials.
            </p>
          </div>

          {loginError && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fdf2f2",
                border: "1px solid #f8b4b4",
                borderRadius: "8px",
                color: "#9b1c1c",
                fontSize: "0.88rem",
                marginBottom: "16px",
                fontWeight: 600,
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--g9)", marginBottom: "6px" }}>
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@gmail.com"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  background: "var(--cream)",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 600, color: "var(--g9)", marginBottom: "6px" }}>
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--line)",
                  background: "var(--cream)",
                }}
              />
              <small className="muted" style={{ display: "block", marginTop: "4px" }}>
                Credentials from .env.local: <b>Admin@123</b>
              </small>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="btn primary block lg"
              style={{ width: "100%" }}
            >
              {loginLoading ? "Authenticating..." : "Sign In to Admin Portal →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "20px", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
            <Link href="/signin" className="muted small" style={{ textDecoration: "underline" }}>
              ← Return to Main Sign In Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW B: AUTHENTICATED ADMIN PORTAL
  // =========================================================
  const currentList =
    activeTab === "pending"
      ? applications.pending
      : activeTab === "approved"
      ? applications.approved
      : applications.rejected;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", padding: "24px 0 60px" }}>
      <div className="wrap">
        {/* Header Bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 24px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 12px rgba(15,61,46,0.06)",
            marginBottom: "28px",
            border: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/" aria-label="UlavanSanthai Home">
              <Image
                src="/logo.png"
                alt="UlavanSanthai"
                width={170}
                height={38}
                priority
                className="brand-logo"
              />
            </Link>
            <div style={{ height: "24px", width: "1px", background: "var(--line)" }} />
            <div>
              <h2 style={{ fontSize: "1.18rem", color: "var(--g9)", margin: 0 }}>
                Admin Moderation Portal
              </h2>
              <span className="muted small">admin_profiles Authentication · Automatic Profile Routing</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                background: "var(--g1)",
                color: "var(--g8)",
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="dot" />
              {adminUser.fullName || "Admin"} ({adminUser.email})
            </span>
            <button
              type="button"
              onClick={fetchApplications}
              className="btn ghost sm"
              title="Refresh queue"
            >
              ↻ Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn ghost sm"
              style={{ borderColor: "#c81e1e", color: "#c81e1e" }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Toast / Notification */}
        {feedback && (
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "12px",
              marginBottom: "20px",
              background: feedback.type === "success" ? "#e6f4ec" : "#fde8e8",
              color: feedback.type === "success" ? "#0f3d2e" : "#9b1c1c",
              border: `1px solid ${feedback.type === "success" ? "#3fa66b" : "#f05252"}`,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{feedback.message}</span>
            <button
              onClick={() => setFeedback(null)}
              style={{ background: "none", border: 0, cursor: "pointer", fontSize: "1.2rem" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            onClick={() => setActiveTab("pending")}
            style={{
              cursor: "pointer",
              background: activeTab === "pending" ? "#fffaf0" : "#fff",
              border: `2px solid ${activeTab === "pending" ? "var(--amber)" : "var(--line)"}`,
              padding: "18px 20px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Pending Review
            </span>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--amber-d)", marginTop: "4px" }}>
              {applications.counts.pending}
            </div>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Awaiting admin approval &amp; profile creation
            </p>
          </div>

          <div
            onClick={() => setActiveTab("approved")}
            style={{
              cursor: "pointer",
              background: activeTab === "approved" ? "#f2faf5" : "#fff",
              border: `2px solid ${activeTab === "approved" ? "var(--g5)" : "var(--line)"}`,
              padding: "18px 20px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Approved Accounts
            </span>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--g7)", marginTop: "4px" }}>
              {applications.counts.approved}
            </div>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Stored in buyer_profiles / seller_profiles
            </p>
          </div>

          <div
            onClick={() => setActiveTab("rejected")}
            style={{
              cursor: "pointer",
              background: activeTab === "rejected" ? "#fdf2f2" : "#fff",
              border: `2px solid ${activeTab === "rejected" ? "#e02424" : "var(--line)"}`,
              padding: "18px 20px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Rejected Applications
            </span>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#c81e1e", marginTop: "4px" }}>
              {applications.counts.rejected}
            </div>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Refund flagged &amp; reason logged
            </p>
          </div>

          <div
            onClick={() => setActiveTab("applicants")}
            style={{
              cursor: "pointer",
              background: activeTab === "applicants" ? "#eef6ff" : "#fff",
              border: `2px solid ${activeTab === "applicants" ? "#1a56db" : "var(--line)"}`,
              padding: "18px 20px",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <span className="muted small" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
              User Applicants Table
            </span>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: "#1a56db", marginTop: "4px" }}>
              {allApplicants.length}
            </div>
            <p className="muted small" style={{ margin: "4px 0 0" }}>
              Arrival role &amp; entry logs recorded
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "2px solid var(--line)",
            marginBottom: "24px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: 0,
              borderBottom: activeTab === "pending" ? "3px solid var(--amber-d)" : "3px solid transparent",
              fontWeight: 700,
              color: activeTab === "pending" ? "var(--g9)" : "var(--mut)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ⏳ Pending Applications ({applications.counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: 0,
              borderBottom: activeTab === "approved" ? "3px solid var(--g7)" : "3px solid transparent",
              fontWeight: 700,
              color: activeTab === "approved" ? "var(--g9)" : "var(--mut)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✓ Approved Users ({applications.counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: 0,
              borderBottom: activeTab === "rejected" ? "3px solid #c81e1e" : "3px solid transparent",
              fontWeight: 700,
              color: activeTab === "rejected" ? "var(--g9)" : "var(--mut)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ✕ Rejected ({applications.counts.rejected})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("applicants")}
            style={{
              padding: "12px 20px",
              background: "none",
              border: 0,
              borderBottom: activeTab === "applicants" ? "3px solid #1a56db" : "3px solid transparent",
              fontWeight: 700,
              color: activeTab === "applicants" ? "#1a56db" : "var(--mut)",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            📋 User Applicants ({allApplicants.length})
          </button>
        </div>

        {/* Applications List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="spinner" />
            <p className="muted mt">Loading applications from database...</p>
          </div>
        ) : activeTab === "applicants" ? (
          allApplicants.length === 0 ? (
            <div
              style={{
                background: "#fff",
                padding: "60px 20px",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px dashed var(--line)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>📋</div>
              <h3 style={{ color: "var(--g9)" }}>No records in user_applicants table</h3>
              <p className="muted">As new users register or apply, their role and arrival log will appear here.</p>
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                border: "1px solid var(--line)",
                overflow: "hidden",
                boxShadow: "0 4px 18px rgba(15,61,46,0.05)",
              }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, color: "var(--g9)" }}>User Applicants Registry</h3>
                  <span className="muted small">Direct records from public.user_applicants tracking entry roles &amp; status</span>
                </div>
                <span className="badge" style={{ background: "#eef6ff", color: "#1a56db", fontWeight: 700 }}>
                  {allApplicants.length} Total Registered
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.92rem" }}>
                  <thead>
                    <tr style={{ background: "var(--cream)", borderBottom: "1px solid var(--line)", color: "var(--mut)" }}>
                      <th style={{ padding: "14px 20px" }}>Applicant Name</th>
                      <th style={{ padding: "14px 20px" }}>Arrival Role</th>
                      <th style={{ padding: "14px 20px" }}>Account Type</th>
                      <th style={{ padding: "14px 20px" }}>Contact</th>
                      <th style={{ padding: "14px 20px" }}>Channel</th>
                      <th style={{ padding: "14px 20px" }}>Status</th>
                      <th style={{ padding: "14px 20px" }}>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allApplicants.map((ap) => (
                      <tr key={ap.id || ap.userId} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "14px 20px", fontWeight: 600, color: "var(--g9)" }}>
                          {ap.fullName}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            className="badge"
                            style={{
                              background:
                                ap.role === "seller"
                                  ? "#e6f4ec"
                                  : ap.role === "buyer"
                                  ? "#e9f2fa"
                                  : "#fdecc8",
                              color:
                                ap.role === "seller"
                                  ? "#0f3d2e"
                                  : ap.role === "buyer"
                                  ? "#1a56db"
                                  : "#8a5a00",
                              textTransform: "uppercase",
                              fontWeight: 700,
                            }}
                          >
                            {ap.role}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", textTransform: "capitalize" }}>
                          {ap.accountType || "Individual"}
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <div>{ap.email}</div>
                          <small className="muted">{ap.mobile}</small>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span className="pill" style={{ fontSize: "0.8rem" }}>
                            {ap.entryChannel || "web_registration"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px" }}>
                          <span
                            className="badge"
                            style={{
                              background:
                                ap.status === "approved"
                                  ? "#e6f4ec"
                                  : ap.status === "rejected"
                                  ? "#fde8e8"
                                  : "#fef08a",
                              color:
                                ap.status === "approved"
                                  ? "#0f3d2e"
                                  : ap.status === "rejected"
                                  ? "#9b1c1c"
                                  : "#854d0e",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {ap.status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 20px", color: "var(--mut)", fontSize: "0.85rem" }}>
                          {new Date(ap.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : currentList.length === 0 ? (
          <div
            style={{
              background: "#fff",
              padding: "60px 20px",
              borderRadius: "16px",
              textAlign: "center",
              border: "1px dashed var(--line)",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🎉</div>
            <h3 style={{ color: "var(--g9)" }}>No applications in this tab</h3>
            <p className="muted">
              {activeTab === "pending"
                ? "All clear! New applicant registrations will appear here for review."
                : `There are currently 0 ${activeTab} applications.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {currentList.map((app) => {
              const details = app.details || {};
              const isCompany = app.accountType === "company" || app.accountType === "group";
              const isPending = app.adminStatus === "pending";

              return (
                <article
                  key={app.id || app.userId}
                  style={{
                    background: "#fff",
                    borderRadius: "16px",
                    border: "1px solid var(--line)",
                    boxShadow: "0 4px 18px rgba(15,61,46,0.05)",
                    padding: "24px",
                    display: "grid",
                    gridTemplateColumns: "1.4fr 1fr",
                    gap: "28px",
                  }}
                >
                  {/* Left Column: Applicant & Business Details */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span
                        className="badge"
                        style={{
                          background:
                            app.roles?.includes("seller") && app.roles?.includes("buyer")
                              ? "#fdecc8"
                              : app.roles?.includes("seller")
                              ? "#e6f4ec"
                              : "#e9f2fa",
                          color:
                            app.roles?.includes("seller") && app.roles?.includes("buyer")
                              ? "#8a5a00"
                              : app.roles?.includes("seller")
                              ? "#0f3d2e"
                              : "#1a56db",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                        }}
                      >
                        {app.roles?.join(" + ") || "BUYER"}
                      </span>
                      <span className="badge" style={{ background: "var(--cream)", color: "var(--mut)" }}>
                        {app.accountType?.toUpperCase()}
                      </span>
                      <span className="muted small" style={{ marginLeft: "auto" }}>
                        Submitted: {new Date(app.submittedAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.35rem", color: "var(--g9)", margin: "4px 0" }}>
                      {app.fullName}
                    </h3>
                    <p className="muted small" style={{ marginBottom: "16px" }}>
                      ✉ {app.email} &nbsp;·&nbsp; 📞 {app.mobile}
                    </p>

                    {/* Detailed Entity Information */}
                    <div
                      style={{
                        background: "var(--cream)",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {app.roles?.includes("seller") ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Business / Farm Name:</span>
                            <strong style={{ color: "var(--g9)" }}>
                              {details.legalName || details.businessName || `${app.fullName} Farms`}
                            </strong>
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>GSTIN Status:</span>
                            {details.gstin ? (
                              <span
                                style={{
                                  fontFamily: "monospace",
                                  fontWeight: 700,
                                  background: "#fff",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid var(--line)",
                                  color: "var(--g8)",
                                }}
                              >
                                {details.gstin}
                              </span>
                            ) : (
                              <span className="badge ok" style={{ fontSize: "0.78rem" }}>
                                ✓ Individual Farmer (Exempt)
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Seller Category:</span>
                            <span>{details.businessCategory || "Farmer or Producer"}</span>
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Contact Person:</span>
                            <span>{details.contactPerson || app.fullName}</span>
                          </div>
                        </div>
                      ) : isCompany ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Company / Legal Name:</span>
                            <strong style={{ color: "var(--g9)" }}>{details.legalName || "Not provided"}</strong>
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>GSTIN:</span>
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                background: "#fff",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid var(--line)",
                                color: "var(--g8)",
                              }}
                            >
                              {details.gstin || "MISSING"}
                            </span>
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Business Category:</span>
                            <span>{details.businessCategory || "General Trade"}</span>
                          </div>
                          <div>
                            <span className="muted small" style={{ display: "block" }}>Contact Person:</span>
                            <span>{details.contactPerson || app.fullName}</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: "8px" }}>
                            <span className="muted small" style={{ display: "block" }}>Individual Buyer:</span>
                            <span className="badge ok" style={{ marginTop: "4px" }}>
                              ✓ Exempt from GSTIN
                            </span>
                          </div>
                          {details.purposeOfPurchase && (
                            <div style={{ marginTop: "8px" }}>
                              <span className="muted small" style={{ display: "block" }}>Purchase Purposes:</span>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                                {details.purposeOfPurchase.map((pur) => (
                                  <span key={pur} className="pill" style={{ fontSize: "0.78rem" }}>
                                    {pur}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed var(--line)" }}>
                        <span className="muted small" style={{ display: "block" }}>Address:</span>
                        <span style={{ fontSize: "0.9rem" }}>
                          {details.address || "Main Locality"}, {details.city || "Salem"},{" "}
                          {details.state || "Tamil Nadu"} - {details.pincode || "636001"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment & Moderation Action */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderLeft: "1px solid var(--line)",
                      paddingLeft: "24px",
                    }}
                  >
                    <div>
                      <h4 style={{ color: "var(--g8)", marginBottom: "12px" }}>
                        Application Review &amp; Verification
                      </h4>
                      <div
                        style={{
                          background: "#fdfaf3",
                          border: "1px solid #fae8c8",
                          padding: "14px",
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="muted small">Application Status:</span>
                          <span
                            className="badge"
                            style={{
                              background: isPending ? "#fef08a" : app.adminStatus === "approved" ? "#e6f4ec" : "#fde8e8",
                              color: isPending ? "#854d0e" : app.adminStatus === "approved" ? "#0f3d2e" : "#9b1c1c",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {app.adminStatus || "pending"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="muted small">Requested Role:</span>
                          <strong style={{ color: "var(--g9)", fontSize: "0.9rem", textTransform: "uppercase" }}>
                            {app.roles?.join(" + ") || "SELLER"}
                          </strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span className="muted small">Account Type:</span>
                          <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
                            {app.accountType || "Individual"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span className="muted small">Submitted At:</span>
                          <span style={{ fontSize: "0.82rem", color: "var(--mut)" }}>
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {app.rejectionReason && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px 14px",
                            background: "#fdf2f2",
                            border: "1px solid #f8b4b4",
                            borderRadius: "8px",
                            color: "#9b1c1c",
                            fontSize: "0.85rem",
                          }}
                        >
                          <strong>Rejection Reason:</strong> {app.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ marginTop: "20px" }}>
                      {isPending ? (
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            type="button"
                            disabled={actionUserId === app.userId}
                            onClick={() => handleApprove(app.userId, app.fullName)}
                            className="btn primary"
                            style={{ flex: 1, padding: "12px" }}
                          >
                            {actionUserId === app.userId ? "Creating Profile..." : "✓ Approve Application"}
                          </button>
                          <button
                            type="button"
                            disabled={actionUserId === app.userId}
                            onClick={() => handleOpenReject(app)}
                            className="btn ghost"
                            style={{
                              borderColor: "#e02424",
                              color: "#c81e1e",
                              padding: "12px 18px",
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ textAlign: "right" }}>
                          <span
                            className={`badge ${app.adminStatus === "approved" ? "ok" : "amber"}`}
                            style={{ fontSize: "0.9rem", padding: "6px 14px" }}
                          >
                            Status: {app.adminStatus.toUpperCase()}
                          </span>
                          {app.reviewedAt && (
                            <span className="block muted small mt">
                              Reviewed: {new Date(app.reviewedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal: Rejection Reason */}
        {rejectModalUser && (
          <div className="modal-backdrop" onClick={() => setRejectModalUser(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ color: "#c81e1e" }}>Reject Application</h3>
              <p className="muted small">
                Rejecting application for <b>{rejectModalUser.fullName}</b>. Please record the rejection reason.
                This reason will be displayed on the applicant's status screen.
              </p>

              <div className="form-group mt">
                <label>Reason for rejection *</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. GSTIN 33AAAAA0000A1Z5 does not match registered trade name."
                  className="modal-input"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}
                />
              </div>

              <div className="modal-actions" style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => setRejectModalUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionUserId === rejectModalUser.userId}
                  onClick={handleConfirmReject}
                  className="btn sm"
                  style={{ background: "#c81e1e", color: "#fff" }}
                >
                  {actionUserId === rejectModalUser.userId ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
