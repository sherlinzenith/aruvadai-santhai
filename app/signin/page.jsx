"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOnboarding } from "@/lib/onboarding-context";
import { api } from "@/lib/api";

const signinSchema = z.object({
  identifier: z
    .string()
    .min(3, "Enter your email address or 10-digit mobile number"),
  password: z.string().min(1, "Please enter your password"),
  rememberMe: z.boolean().optional(),
});

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const { signInUser } = useOnboarding();
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotInput, setForgotInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSigninSubmit = async (data) => {
    setAuthError("");
    setIsSubmitting(true);

    // 1. Check if the user entered Administrator credentials
    try {
      const adminRes = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.identifier, password: data.password }),
      });

      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.success && adminData.admin) {
          setIsSubmitting(false);
          // Automatic navigation: Admin credentials route directly to the Admin Portal!
          router.push("/admin");
          return;
        }
      }
    } catch (e) {
      console.warn("Admin check skipped, checking standard user...", e);
    }

    // 2. Otherwise authenticate against real Supabase database (/api/auth/signin)
    try {
      const userRes = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier, password: data.password }),
      });

      const userData = await userRes.json();
      setIsSubmitting(false);

      if (userData.success && userData.user) {
        // Load the real database user profile into session and localStorage
        signInUser(userData);

        // Smart Navigation based on real database status:
        if (userData.status === "approved") {
          // Approved user enters the dashboard directly!
          router.push("/dashboard");
        } else if (userData.status === "pending") {
          // If details are already provided, go directly to review status screen
          if (userData.details && (userData.details.address || userData.details.legalName)) {
            router.push("/onboarding/status");
          } else {
            router.push("/onboarding/account-type");
          }
        } else if (userData.status === "rejected") {
          router.push("/onboarding/status");
        } else {
          router.push("/onboarding/role");
        }
      } else {
        setAuthError(userData.error || "No account found matching these credentials.");
      }
    } catch (err) {
      setIsSubmitting(false);
      setAuthError("Failed to authenticate. Please check your network connection.");
    }
  };

  const fillQuickDemo = (roleChoice) => {
    if (roleChoice === "admin") {
      setValue("identifier", "admin@gmail.com");
      setValue("password", "Admin@123");
      return;
    }

    let email = "senthil@gmail.com";
    if (roleChoice === "business") email = "procurement@annapoorna.com";
    if (roleChoice === "seller") email = "patel@organicgrains.in";
    if (roleChoice === "both") email = "director@velanagri.com";

    setValue("identifier", email);
    setValue("password", "Pass1234");
    signInUser(email);
    router.push("/onboarding/role");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-header">
          <Link href="/" className="auth-logo" aria-label="UlavanSanthai home">
            <Image
              src="/logo.png"
              alt="UlavanSanthai"
              width={210}
              height={46}
              priority
              className="brand-logo"
            />
          </Link>
          <h2>Sign in to your account</h2>
          <p className="muted">Enter your email or mobile number to continue.</p>
        </div>

        {justRegistered && (
          <div className="alert-success" role="status">
            Registration &amp; email verification complete! Please sign in to choose your trading role.
          </div>
        )}

        {authError && <div className="alert-error" role="alert">{authError}</div>}

        <form onSubmit={handleSubmit(onSigninSubmit)} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="identifier">Email address or mobile number *</label>
            <input
              id="identifier"
              type="text"
              placeholder="e.g. name@domain.com or 9876543210"
              autoComplete="username"
              {...register("identifier")}
              aria-invalid={errors.identifier ? "true" : "false"}
            />
            {errors.identifier && <p className="err-msg" role="alert">{errors.identifier.message}</p>}
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password *</label>
              <button
                type="button"
                className="text-link"
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && <p className="err-msg" role="alert">{errors.password.message}</p>}
          </div>

          <div className="form-row between">
            <label className="checkbox-label" htmlFor="rememberMe">
              <input
                id="rememberMe"
                type="checkbox"
                {...register("rememberMe")}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn primary block lg">
            {isSubmitting ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or 1-click quick demo</span>
        </div>

        {/* 1-Click Persona Previews */}
        <div className="demo-grid-small">
          <button type="button" className="btn ghost sm" onClick={() => fillQuickDemo("common")}>
            Individual Buyer
          </button>
          <button type="button" className="btn ghost sm" onClick={() => fillQuickDemo("business")}>
            Company Buyer
          </button>
          <button type="button" className="btn ghost sm" onClick={() => fillQuickDemo("seller")}>
            Seller
          </button>
          <button type="button" className="btn ghost sm" onClick={() => fillQuickDemo("both")}>
            Dual Role (Both)
          </button>
          <button
            type="button"
            className="btn amber sm"
            style={{ gridColumn: "span 2", fontWeight: 700 }}
            onClick={() => fillQuickDemo("admin")}
          >
            🛡️ Platform Administrator (admin@gmail.com / Admin@123)
          </button>
        </div>

        <div className="auth-footer-action">
          <p>
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="highlight-link">
              Register now →
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="modal-backdrop" onClick={() => setForgotOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Reset password</h3>
            {forgotSent ? (
              <div className="modal-body">
                <p className="success-msg">
                  Reset link sent to <b>{forgotInput || "your email/mobile"}</b>.
                </p>
                <button
                  type="button"
                  className="btn primary block mt"
                  onClick={() => {
                    setForgotSent(false);
                    setForgotOpen(false);
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="modal-body">
                <p className="muted">Enter your registered email or mobile to receive a reset OTP.</p>
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder="Enter email or mobile"
                  className="modal-input"
                />
                <div className="modal-actions">
                  <button type="button" className="btn ghost sm" onClick={() => setForgotOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn primary sm" onClick={() => setForgotSent(true)}>
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="guard-loading">
          <div className="spinner" />
          <p>Loading sign in portal...</p>
        </div>
      }
    >
      <SigninContent />
    </Suspense>
  );
}
