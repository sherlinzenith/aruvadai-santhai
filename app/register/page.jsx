"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";

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
  const { signUp, resendVerificationEmail } = useAuth();

  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [serverError, setServerError] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onRegisterSubmit = async (data) => {
    setServerError("");
    setResendStatus("");
    setIsSubmitting(true);

    const res = await signUp({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      mobile: data.mobile,
    });

    setIsSubmitting(false);

    if (res.success) {
      if (res.needsVerification) {
        setRegisteredEmail(data.email.toLowerCase());
        setVerificationPending(true);
      } else {
        // Email verification was auto-confirmed or disabled in Supabase
        router.push("/onboarding/role");
      }
    } else {
      setServerError(res.error || "Registration could not be completed. Please check your details.");
    }
  };

  const handleResend = async () => {
    if (!registeredEmail) return;
    setResendStatus("Sending verification email...");
    const res = await resendVerificationEmail(registeredEmail);
    if (res.success) {
      setResendStatus("Verification email sent! Please check your inbox.");
    } else {
      setResendStatus(res.error || "Could not resend email. Please try again shortly.");
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
          <h2>{verificationPending ? "Verify your email" : "Create your trading account"}</h2>
          <p className="muted">
            {verificationPending
              ? `A verification link has been sent to ${registeredEmail}. Please click the link to verify your email and activate your trading account.`
              : "Register once. Trade as a Buyer, Seller, or Both. Individual & Company accounts."}
          </p>
        </div>

        {serverError && (
          <div className="alert-error" role="alert">
            {serverError}
          </div>
        )}

        {/* Verification Notification Screen */}
        {verificationPending ? (
          <div className="auth-form">
            <div className="alert-success" role="status" style={{ textAlign: "left" }}>
              <p style={{ margin: "0 0 8px 0", fontWeight: "600" }}>
                Verification email dispatched
              </p>
              <p style={{ margin: 0, fontSize: "0.88rem" }}>
                We sent a secure confirmation link to <b>{registeredEmail}</b>. Once you click the link, your account will be activated and you can sign in.
              </p>
            </div>

            {resendStatus && (
              <p className="small muted" style={{ textAlign: "center", margin: "12px 0 0 0" }}>
                {resendStatus}
              </p>
            )}

            <button
              type="button"
              className="btn ghost block mt sm"
              onClick={handleResend}
            >
              Resend verification email
            </button>

            <Link href="/signin?registered=true" className="btn primary block lg mt">
              Proceed to Sign In →
            </Link>

            <button
              type="button"
              className="btn ghost block mt sm"
              onClick={() => {
                setVerificationPending(false);
                setServerError("");
              }}
            >
              ← Edit registration details
            </button>
          </div>
        ) : (
          /* Full Registration Form */
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

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="password">Password (min 8 chars) *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Letters & numbers"
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
                <input id="acceptTerms" type="checkbox" {...register("acceptTerms")} />
                <span>
                  I agree to the Terms of Service and Privacy Policy. I understand documents and GSTIN are kept private.
                </span>
              </label>
              {errors.acceptTerms && <p className="err-msg" role="alert">{errors.acceptTerms.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn primary block lg">
              {isSubmitting ? "Creating account..." : "Register with Supabase Auth →"}
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
