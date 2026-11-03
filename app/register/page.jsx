"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOnboarding } from "@/lib/onboarding-context";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .regex(/^[a-zA-Z\s.]+$/, "Please enter a valid name using letters"),
    email: z.string().email("Enter a valid email address (e.g. name@company.com)"),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)"),
    role: z.string().default("seller"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the Terms and Privacy Policy to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, verifyOtp } = useOnboarding();

  const [otpSent, setOtpSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredUser, setRegisteredUser] = useState(null);
  const [otpInput, setOtpInput] = useState("1234");
  const [otpError, setOtpError] = useState("");
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      role: "seller",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const selectedRole = watch("role");

  const onRegisterSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);

    try {
      // 1. Submit to API to store in public.user_applicants table in Supabase
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email.toLowerCase(),
          mobile: data.mobile,
          role: data.role || "seller",
          password: data.password,
        }),
      });

      const result = await res.json();
      setIsSubmitting(false);

      if (result.success && result.user) {
        setRegisteredUser(result.user);
        registerUser(
          {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            mobile: result.user.mobile,
          },
          data.role || "seller"
        );
        setRegisteredEmail(result.user.email);
        setOtpSent(true);
      } else {
        setServerError(result.error || "Failed to register. Please try again.");
      }
    } catch (err) {
      setIsSubmitting(false);
      setServerError("Registration request could not be completed. Please check your connection.");
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setOtpError("");

    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError("Please enter the 4-digit code sent to your email.");
      return;
    }

    try {
      const verified = await verifyOtp(otpInput.trim());
      if (verified) {
        // Proceed immediately to the onboarding next step (role / trading flow)
        router.push("/onboarding/role");
      } else {
        setOtpError("Invalid code. Please try again.");
      }
    } catch (err) {
      router.push("/onboarding/role");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        {/* Header */}
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
          <h2>{otpSent ? "Verify your email" : "Create your trading account"}</h2>
          <p className="muted">
            {otpSent
              ? `We sent a 4-digit verification code to ${registeredEmail}. Enter it below to activate your account.`
              : "Register once. Trade as a Seller, Buyer, or Both. Individual & Company accounts."}
          </p>
        </div>

        {serverError && (
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
            {serverError}
          </div>
        )}

        {/* STEP 2: Email OTP */}
        {otpSent ? (
          <form onSubmit={handleOtpVerify} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="otp">4-digit verification code</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="1234"
                className="otp-input"
                autoComplete="one-time-code"
                required
              />
              <small className="muted">
                Demo stub: Any 4-digit code (e.g. <b>1234</b>) is accepted immediately.
              </small>
              {otpError && <p className="err-msg" role="alert">{otpError}</p>}
            </div>

            <button type="submit" className="btn primary block lg">
              Verify Code &amp; Continue to Next Step →
            </button>

            <button
              type="button"
              className="btn ghost block mt sm"
              onClick={() => setOtpSent(false)}
            >
              ← Edit registration details
            </button>
          </form>
        ) : (
          /* STEP 1: Registration form */
          <form onSubmit={handleSubmit(onRegisterSubmit)} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="fullName">Full name *</label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Senthil Nathan"
                autoComplete="name"
                {...register("fullName")}
                aria-invalid={errors.fullName ? "true" : "false"}
              />
              {errors.fullName && <p className="err-msg" role="alert">{errors.fullName.message}</p>}
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="email">Email address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <p className="err-msg" role="alert">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile number *</label>
                <input
                  id="mobile"
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                  {...register("mobile")}
                  aria-invalid={errors.mobile ? "true" : "false"}
                />
                {errors.mobile && <p className="err-msg" role="alert">{errors.mobile.message}</p>}
              </div>
            </div>

            {/* Arrival Role Selection */}
            <div className="form-group">
              <label htmlFor="role">How are you joining UlavanSanthai? *</label>
              <select
                id="role"
                {...register("role")}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--line)",
                  background: "#fff",
                  fontSize: "0.95rem",
                  color: "var(--g9)",
                }}
              >
                <option value="seller">Seller / Producer (Farmer, Aggregator, FPO)</option>
                <option value="buyer">Buyer (Trader, Wholesaler, Household)</option>
                <option value="buyer_seller">Both (Buy &amp; Sell Agricultural Commodities)</option>
              </select>
              <small className="muted" style={{ display: "block", marginTop: "4px" }}>
                Stored in <b>user_applicants</b> table to process your application workflow.
              </small>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="password">Password (min 8 chars) *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Letters &amp; numbers"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && <p className="err-msg" role="alert">{errors.password.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="err-msg" role="alert">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label" htmlFor="acceptTerms">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  {...register("acceptTerms")}
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy. I understand documents and GSTIN are kept private.
                </span>
              </label>
              {errors.acceptTerms && <p className="err-msg" role="alert">{errors.acceptTerms.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn primary block lg">
              {isSubmitting ? "Creating account..." : "Register & Verify Email →"}
            </button>
          </form>
        )}

        <div className="auth-footer-action">
          <p>
            Already have an account?{" "}
            <Link href="/signin" className="highlight-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

